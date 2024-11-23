export type TableRow = { [x: string]: unknown }

type PrimaryKeyValue = { key: string; value: string }

export type Operation =
  | {
      type: 'edit'
      primaryKeyValues: PrimaryKeyValue[]
      columnName: string
      newValue: string | null
    }
  | {
      type: 'delete'
      primaryKeyValues: PrimaryKeyValue[]
    }
  | {
      type: 'insert'
      row: TableRow
    }
