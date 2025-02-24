import type { ResultAsync } from 'neverthrow'
import { assertNever } from '../../../../utilities/assertNever'
import type { DBInfo, KyselyDB } from '../../../connections/types/connection'
import type { DatabaseError } from '../../../core/errors'
import type { TableMetadata } from '../../types/metadata'
import { getTableMetadataFromMySQL } from './mysql'
import { getTableMetadataFromSQLite } from './sqlite'

export type GetTableMetadata = (params: {
  db: KyselyDB
  dbInfo: DBInfo
  tableName: string
}) => ResultAsync<TableMetadata, DatabaseError>

export const getTableMetadata = ({
  db,
  dbInfo,
  tableName,
}: {
  db: KyselyDB
  dbInfo: DBInfo
  tableName: string
}): ResultAsync<TableMetadata, DatabaseError> => {
  switch (dbInfo.type) {
    case 'mysql':
      return getTableMetadataFromMySQL({ db, dbInfo, tableName })
    case 'sqlite':
      return getTableMetadataFromSQLite({ db, dbInfo, tableName })
    default:
      return assertNever(dbInfo.type)
  }
}
