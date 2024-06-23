export type TablePanelState = {
  limit?: number
  offset?: number
  scrollX?: number
  scrollY?: number
  selectedCell?: {
    rowIndex: number
    columnId: string
  }
}
