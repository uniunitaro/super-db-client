import type { CellInfo } from './cell'
import type { Operation } from './operation'

export type TablePanelState = {
  limit?: number
  offset?: number
  scrollX?: number
  scrollY?: number
  selectedCell?: CellInfo
  operations?: Operation[]
}
