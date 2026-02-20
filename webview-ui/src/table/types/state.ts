import type { FilterCondition } from '@shared-types/sharedTypes'
import type { EditableFilterCondition } from '../domain/filter'
import type { ClientOperation } from '../domain/operations'
import type { SelectedCell } from '../domain/selection'
import type { Sort } from '../domain/sort'

export type TablePanelState = {
  limit?: number
  offset?: number
  scrollX?: number
  scrollY?: number
  selectedCell?: SelectedCell
  selectedRowIndexes?: number[]
  operations?: ClientOperation[]
  redoStack?: ClientOperation[]
  sort?: Sort
  filters?: EditableFilterCondition[]
  appliedFilters?: FilterCondition[]
}
