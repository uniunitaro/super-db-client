import type { ClientOperation, SelectedCellInfo, Sort } from './table'

export type TablePanelState = {
  limit?: number
  offset?: number
  scrollX?: number
  scrollY?: number
  selectedCell?: SelectedCellInfo
  operations?: ClientOperation[]
  sort?: Sort
}
