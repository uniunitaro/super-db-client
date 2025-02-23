import { sql } from 'kysely'
import { ResultAsync } from 'neverthrow'
import { tuple } from '../../../utilities/tuple'
import type { KyselyDB } from '../../connections/types/connection'
import { type DatabaseError, toDatabaseError } from '../../core/errors'
import type { TableMetadata } from '../types/metadata'

export const getTableMetadata = ({
  db,
  schema,
  tableName,
}: {
  db: KyselyDB
  schema: string
  tableName: string
}): ResultAsync<TableMetadata, DatabaseError> => {
  const metadataRes = ResultAsync.fromPromise(
    sql<{
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
  `.execute(db),
    toDatabaseError,
  )

  const tableRowCountRes = ResultAsync.fromPromise(
    sql<{ TABLE_ROWS: number }>`
    SELECT TABLE_ROWS
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ${schema}
    AND TABLE_NAME = ${tableName}
  `.execute(db),
    toDatabaseError,
  )
  // TODO: 総行数が閾値以下ならcountで取得する

  const columnKeyRes = ResultAsync.fromPromise(
    sql<{
      COLUMN_NAME: string
      CONSTRAINT_NAME: string
    }>`
    SELECT COLUMN_NAME, CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = ${schema}
    AND TABLE_NAME = ${tableName}
  `.execute(db),
    toDatabaseError,
  )

  const res = ResultAsync.combine(
    tuple(metadataRes, tableRowCountRes, columnKeyRes),
  )

  return res.map(([metadata, tableRowCount, columnKey]) => ({
    name: tableName,
    totalRows: tableRowCount.rows[0].TABLE_ROWS,
    columns: metadata.rows.map((row) => ({
      name: row.COLUMN_NAME,
      dataType: row.DATA_TYPE,
      isNullable: row.IS_NULLABLE === 'YES',
      isTextType:
        row.DATA_TYPE.includes('char') || row.DATA_TYPE.includes('text'),
      isBinaryType: row.DATA_TYPE.includes('blob'),
      default: row.COLUMN_DEFAULT,
      extra: row.EXTRA,
      comment: row.COLUMN_COMMENT,
    })),
    columnKeys: columnKey.rows.map((row) => ({
      columnName: row.COLUMN_NAME,
      constraintName: row.CONSTRAINT_NAME,
    })),
    primaryKeyColumns: columnKey.rows
      .filter((row) => row.CONSTRAINT_NAME === 'PRIMARY')
      .map((row) => row.COLUMN_NAME),
  }))
}
