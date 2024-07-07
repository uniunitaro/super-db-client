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
