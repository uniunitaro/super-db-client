type PrimaryKeyValue = { key: string; value: string }

export type Operation =
  | {
      type: 'edit'
      primaryKeyValues: PrimaryKeyValue[]
      columnName: string
      newValue: string
    }
  | {
      type: 'delete'
      primaryKeyValues: PrimaryKeyValue[]
    }
