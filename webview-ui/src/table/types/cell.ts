export type CellInfo =
  | {
      type: 'existing'
      rowIndex: number
      columnId: string
    }
  | {
      type: 'inserted'
      rowIndex: number
      columnId: string
      rowUUID: string
    }
