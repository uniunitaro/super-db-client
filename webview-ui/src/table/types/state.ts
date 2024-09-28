import type { ClientOperation, SelectedCell, Sort } from './table'

export type TablePanelState = {
  limit?: number
  offset?: number
  scrollX?: number
  scrollY?: number
  selectedCell?: SelectedCell
  operations?: ClientOperation[]
  sort?: Sort
}
