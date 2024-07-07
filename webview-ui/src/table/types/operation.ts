type PrimaryKeyValue = { key: string; value: string }

export type ClientOperation =
  | {
      type: 'edit'
      primaryKeyValues: PrimaryKeyValue[]
      columnName: string
      newValue: string
    }
  | {
      type: 'editInserted'
      insertedRowUUID: string
      columnName: string
      newValue: string
    }
  | {
      type: 'delete'
      primaryKeyValues: PrimaryKeyValue[]
    }
  | {
      type: 'deleteInserted'
      insertedRowUUID: string
    }
  | {
      type: 'insert'
      uuid: string
    }
