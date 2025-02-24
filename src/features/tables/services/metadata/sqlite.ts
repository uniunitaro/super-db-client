import { sql } from 'kysely'
import { ResultAsync } from 'neverthrow'
import type { GetTableMetadata } from '.'
import { tuple } from '../../../../utilities/tuple'
import { toDatabaseError } from '../../../core/errors'

export const getTableMetadataFromSQLite: GetTableMetadata = ({
  db,
  tableName,
}) => {
  // sqliteではテーブル名のバインドはできないっぽいので、sql.litを使う
  const metadataRes = ResultAsync.fromPromise(
    sql<{
      name: string
      type: string
      notnull: number
      dflt_value: string | null
      pk: number
    }>`
      PRAGMA table_info(${sql.lit(tableName)})
    `.execute(db),
    toDatabaseError,
  )

  const tableRowCountRes = ResultAsync.fromPromise(
    sql<{ count: number }>`
      SELECT COUNT(*) as count
      FROM ${sql.lit(tableName)}
    `.execute(db),
    toDatabaseError,
  )

  const res = ResultAsync.combine(tuple(metadataRes, tableRowCountRes))

  return res.map(([metadata, tableRowCount]) => {
    const primaryKeyColumns = metadata.rows
      .filter((row) => row.pk > 0)
      .map((row) => row.name)

    return {
      name: tableName,
      totalRows: tableRowCount.rows[0].count,
      columns: metadata.rows.map((row) => ({
        name: row.name,
        dataType: row.type,
        isNullable: row.notnull === 0,
        isTextType: row.type.includes('TEXT') || row.type.includes('CHAR'),
        isBinaryType: row.type.includes('BLOB'),
        default: row.dflt_value,
        extra: '',
        comment: '',
      })),
      columnKeys: primaryKeyColumns.map((columnName) => ({
        columnName,
        constraintName: 'PRIMARY',
      })),
      primaryKeyColumns,
    }
  })
}
