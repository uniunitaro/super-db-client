import type { TableMetadata } from 'kysely'
import { ResultAsync } from 'neverthrow'
import type { DBInfo, KyselyAnyDB } from '../../connections/types/connection'
import type { DatabaseError } from '../../core/errors'
import { toDatabaseError } from '../../core/errors'
import type { Operation, TableRow } from '../types/table'
import { getTableMetadata } from './metadata'

export const getRows = ({
  db,
  tableName,
  order,
  orderBy,
  limit,
  offset,
}: {
  db: KyselyAnyDB
  tableName: string
  order?: 'asc' | 'desc'
  orderBy?: string
  limit: number
  offset: number
}): ResultAsync<TableRow[], DatabaseError> => {
  let query = db.selectFrom(tableName).selectAll().limit(limit).offset(offset)

  if (order && orderBy) {
    query = query.orderBy(orderBy, order)
  }

  return ResultAsync.fromPromise(query.execute(), toDatabaseError).map(
    (rows) => {
      // blob型のデータをhex文字列に変換
      return rows.map((row) => {
        for (const key in row) {
          if (row[key] instanceof Uint8Array) {
            row[key] = Buffer.from(row[key]).toString('hex')
          }
        }

        return row
      })
    },
  )
}

export const saveChanges = ({
  db,
  dbInfo,
  tableName,
  operations,
}: {
  db: KyselyAnyDB
  dbInfo: DBInfo
  tableName: string
  operations: Operation[]
}): ResultAsync<void, DatabaseError> => {
  return getTableMetadata({ db, dbInfo, tableName }).andThen(({ columns }) =>
    ResultAsync.fromPromise(
      db.transaction().execute(async (tx) => {
        for (const operation of operations) {
          if (operation.type === 'edit') {
            const { primaryKeyValues, columnName, newValue } = operation
            if (!primaryKeyValues.length) {
              throw new Error('Tables without primary keys cannot be edited')
            }

            const column = columns.find((column) => column.name === columnName)
            if (!column) {
              throw new Error(`Column ${columnName} not found`)
            }

            // hex文字列をblob型のデータに変換
            const valueForUpdate =
              newValue && column.isBinaryType
                ? Buffer.from(newValue, 'hex')
                : newValue

            let query = tx
              .updateTable(tableName)
              .set(columnName, valueForUpdate)

            for (const { key, value } of primaryKeyValues) {
              query = query.where(key, '=', value)
            }

            await query.execute()
          } else if (operation.type === 'delete') {
            const { primaryKeyValues } = operation
            if (!primaryKeyValues.length) {
              throw new Error('Tables without primary keys cannot be deleted')
            }

            let query = tx.deleteFrom(tableName)

            for (const { key, value } of primaryKeyValues) {
              query = query.where(key, '=', value)
            }

            await query.execute()
          } else if (operation.type === 'insert') {
            const { row } = operation

            await tx.insertInto(tableName).values(row).execute()
          }
        }
      }),
      toDatabaseError,
    ),
  )
}

export const getTables = (
  db: KyselyAnyDB,
): ResultAsync<TableMetadata[], DatabaseError> =>
  ResultAsync.fromPromise(db.introspection.getTables(), toDatabaseError)
