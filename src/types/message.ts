import type { RequestType } from 'vscode-messenger-common'
import type { Config } from '../features/configs/types/config'
import type {
  DBConfig,
  DBConfigInput,
} from '../features/connections/types/dbConfig'
import type { TableMetadata } from '../features/tables/types/metadata'
import type {
  FilterCondition,
  Operation,
  TableRow,
} from '../features/tables/types/table'

export const getConnectionSettingInitialDataRequest: RequestType<
  undefined,
  DBConfig | undefined
> = {
  method: 'getConnectionSettingInitialData',
}

export const testDBConnectionRequest: RequestType<
  DBConfigInput,
  { error?: string }
> = {
  method: 'testDBConnection',
}

export const saveDBConfigRequest: RequestType<DBConfigInput, void> = {
  method: 'saveDBConfig',
}

export type GetTableDataRequestResponse = {
  tableMetadata: TableMetadata
  rows: TableRow[]
}
export const getTableDataRequest: RequestType<
  {
    order?: 'asc' | 'desc'
    orderBy?: string
    limit: number
    offset: number
    filters?: FilterCondition[]
  },
  GetTableDataRequestResponse
> = {
  method: 'getTableData',
}

export const getConfigRequest: RequestType<undefined, Config> = {
  method: 'getConfig',
}

export const saveTableChangesRequest: RequestType<
  { operations: Operation[] },
  void
> = {
  method: 'saveTableChanges',
}

export const getTableInitialDataRequest: RequestType<
  undefined,
  { shouldRefresh: boolean }
> = {
  method: 'getTableInitialData',
}

export type Command =
  | 'saveTableChanges'
  | 'refreshTable'
  | 'duplicateRow'
  | 'deleteRows'
  | 'setAsNull'
  | 'setAsEmpty'
export const commandRequest: RequestType<Command, void> = {
  method: 'command',
}
