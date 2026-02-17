import type { FilterCondition } from '@shared-types/sharedTypes'
import type { EditableFilterCondition } from '../model/filter'
import type { ClientOperation, SelectedCell, Sort } from './table'

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
