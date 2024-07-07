import type { CellInfo } from './cell'
import type { ClientOperation } from './operation'

export type TablePanelState = {
  limit?: number
  offset?: number
  scrollX?: number
  scrollY?: number
  selectedCell?: CellInfo
  operations?: ClientOperation[]
}
