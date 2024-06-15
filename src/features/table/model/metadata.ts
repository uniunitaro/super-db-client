import { sql } from 'kysely'
import type { KyselyDB } from '../../connection/types/connection'
import type { TableMetadata } from '../types/metadata'

export const getTableMetadata = async ({
  db,
  schema,
  tableName,
}: {
  db: KyselyDB
  schema: string
  tableName: string
}): Promise<TableMetadata> => {
  const res = await sql<{
    COLUMN_NAME: string
    DATA_TYPE: string
    IS_NULLABLE: string
    COLUMN_DEFAULT: string | null
    EXTRA: string
    COLUMN_COMMENT: string
  }>`
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ${schema}
    AND TABLE_NAME = ${tableName}
    ORDER BY ORDINAL_POSITION
  `.execute(db)

  const tableRes = await sql<{ TABLE_ROWS: number }>`
    SELECT TABLE_ROWS
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ${schema}
    AND TABLE_NAME = ${tableName}
  `.execute(db)

  // TODO: 総行数が閾値以下ならcountで取得する

  return {
    name: tableName,
    totalRows: tableRes.rows[0].TABLE_ROWS,
    columns: res.rows.map((row) => ({
      name: row.COLUMN_NAME,
      dataType: row.DATA_TYPE,
      isNullable: row.IS_NULLABLE === 'YES',
      default: row.COLUMN_DEFAULT,
      extra: row.EXTRA,
      comment: row.COLUMN_COMMENT,
    })),
  }
}
