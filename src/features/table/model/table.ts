import { getErrorMessage } from '../../../utilities/getErrorMessage'
import type { KyselyAnyDB } from '../../connection/types/connection'
import type { Operation, TableRow } from '../types/table'

export const getRows = async ({
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
}): Promise<TableRow[]> => {
  let query = db.selectFrom(tableName).selectAll().limit(limit).offset(offset)

  if (order && orderBy) {
    query = query.orderBy(orderBy, order)
  }

  const rows = await query.execute()
  return rows
}

export const saveChanges = async ({
  db,
  tableName,
  operations,
}: {
  db: KyselyAnyDB
  tableName: string
  operations: Operation[]
}): Promise<{ error?: string }> => {
  // TODO: トランザクション
  try {
    for (const operation of operations) {
      if (operation.type === 'edit') {
        const { primaryKeyValues, columnName, newValue } = operation

        let query = db.updateTable(tableName).set(columnName, newValue)

        for (const { key, value } of primaryKeyValues) {
          query = query.where(key, '=', value)
        }

        await query.execute()
      } else if (operation.type === 'delete') {
        const { primaryKeyValues } = operation

        let query = db.deleteFrom(tableName)

        for (const { key, value } of primaryKeyValues) {
          query = query.where(key, '=', value)
        }

        await query.execute()
      }
    }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }

  return {}
}
