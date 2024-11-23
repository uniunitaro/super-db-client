import { sql } from 'kysely'
import type { KyselyDB } from '../../connections/types/connection'
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

  const columnKeyRes = await sql<{
    COLUMN_NAME: string
    CONSTRAINT_NAME: string
  }>`
    SELECT COLUMN_NAME, CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = ${schema}
    AND TABLE_NAME = ${tableName}
  `.execute(db)

  return {
    name: tableName,
    totalRows: tableRes.rows[0].TABLE_ROWS,
    columns: res.rows.map((row) => ({
      name: row.COLUMN_NAME,
      dataType: row.DATA_TYPE,
      isNullable: row.IS_NULLABLE === 'YES',
      isTextType:
        row.DATA_TYPE.includes('char') || row.DATA_TYPE.includes('text'),
      default: row.COLUMN_DEFAULT,
      extra: row.EXTRA,
      comment: row.COLUMN_COMMENT,
    })),
    columnKeys: columnKeyRes.rows.map((row) => ({
      columnName: row.COLUMN_NAME,
      constraintName: row.CONSTRAINT_NAME,
    })),
    primaryKeyColumns: columnKeyRes.rows
      .filter((row) => row.CONSTRAINT_NAME === 'PRIMARY')
      .map((row) => row.COLUMN_NAME),
  }
}
