import type { RequestType } from 'vscode-messenger-common'
import type { Config } from '../features/config/types/config'
import type { DBConfigInput } from '../features/connection/types/dbConfig'
import type { TableMetadata } from '../features/table/types/metadata'
import type { Operation, TableRow } from '../features/table/types/table'

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

export const getInitialDataRequest: RequestType<
  undefined,
  { shouldRefresh: boolean }
> = {
  method: 'getInitialData',
}

export type Command =
  | 'saveTableChanges'
  | 'refreshTable'
  | 'deleteRows'
  | 'setAsNull'
  | 'setAsEmpty'
export const commandRequest: RequestType<Command, void> = {
  method: 'command',
}
