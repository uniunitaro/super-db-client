export const COMMANDS = {
  NEW_CONNECTION: 'superDBClient.newConnection',
  EDIT_CONNECTION: 'superDBClient.editConnection',
  DELETE_CONNECTION: 'superDBClient.deleteConnection',
  REFRESH_DATABASES: 'superDBClient.refreshDatabases',
  OPEN_TABLE: 'superDBClient.openTable',
  GO_TO_TABLE: 'superDBClient.goToTable',
  SAVE_TABLE_CHANGES: 'superDBClient.saveTableChanges',
  REFRESH_TABLE: 'superDBClient.refreshTable',
  DELETE_ROWS: 'superDBClient.deleteRows',
  SET_AS_NULL: 'superDBClient.setAsNull',
  SET_AS_EMPTY: 'superDBClient.setAsEmpty',
} as const
