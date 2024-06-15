import type { RequestType } from 'vscode-messenger-common'
import type { Config } from '../features/config/types/config'
import type { DBConfigInput } from '../features/connection/types/dbConfig'
import type { TableMetadata } from '../features/table/types/metadata'
import type { TableRow } from '../features/table/types/table'

export const testDBConnectionRequest: RequestType<
  DBConfigInput,
  { error?: string }
> = {
  method: 'testDBConnection',
}

export const saveDBConfigRequest: RequestType<DBConfigInput, undefined> = {
  method: 'saveDBConfig',
}

export const getTableDataRequest: RequestType<
  {
    order?: 'asc' | 'desc'
    orderBy?: string
    limit: number
    offset: number
  },
  {
    tableMetadata: TableMetadata
    rows: TableRow[]
  }
> = {
  method: 'getTableData',
}

export const getConfigRequest: RequestType<undefined, Config> = {
  method: 'getConfig',
}