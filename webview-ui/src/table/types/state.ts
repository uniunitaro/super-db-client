import type { CellInfo } from './cell'
import type { ClientOperation } from './operation'
import type { Sort } from './sort'

export type TablePanelState = {
  limit?: number
  offset?: number
  scrollX?: number
  scrollY?: number
  selectedCell?: CellInfo
  operations?: ClientOperation[]
  sort?: Sort
}
