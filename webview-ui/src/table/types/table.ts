export type TableRowWithType =
  | {
      type: 'existing'
      row: { [x: string]: unknown }
    }
  | {
      type: 'inserted'
      uuid: string
      row: { [x: string]: unknown }
    }

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

export type Sort =
  | {
      order: 'asc' | 'desc'
      orderBy: string
    }
  | undefined

export type CellInfo =
  | {
      type: 'existing'
      rowIndex: number
      columnId: string
    }
  | {
      type: 'inserted'
      rowIndex: number
      rowUUID: string
      columnId: string
    }

export type SelectedCellInfo =
  | {
      type: 'existing'
      rowIndex: number
      columnId: string
      columnIndex: number
    }
  | {
      type: 'inserted'
      rowIndex: number
      rowUUID: string
      columnId: string
      columnIndex: number
    }
