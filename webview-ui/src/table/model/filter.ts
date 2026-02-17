import type { FilterCondition, FilterOperator } from '@shared-types/sharedTypes'

export type EditableFilterCondition = {
  id: string
  column: string
  operator: FilterOperator
  value: string
  valueTo: string
}

const createFilterConditionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const createEmptyEditableFilterCondition =
  (): EditableFilterCondition => ({
    id: createFilterConditionId(),
    column: '',
    operator: '=',
    value: '',
    valueTo: '',
  })

export const FILTER_OPERATOR_OPTIONS: FilterOperator[] = [
  '=',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'LIKE',
  'IN',
  'BETWEEN',
  'IS NULL',
  'IS NOT NULL',
]

export const isNoValueOperator = (operator: FilterOperator) =>
  operator === 'IS NULL' || operator === 'IS NOT NULL'

export const isBetweenOperator = (operator: FilterOperator) =>
  operator === 'BETWEEN'

export const toFilterConditions = (
  filters: EditableFilterCondition[],
): FilterCondition[] => {
  const normalizedFilters: FilterCondition[] = []

  for (const filter of filters) {
    if (!filter.column) {
      continue
    }

    const value = filter.value.trim()
    const valueTo = filter.valueTo.trim()

    if (isNoValueOperator(filter.operator)) {
      normalizedFilters.push({
        column: filter.column,
        operator: filter.operator,
      })
      continue
    }

    if (isBetweenOperator(filter.operator)) {
      if (!value || !valueTo) {
        continue
      }

      normalizedFilters.push({
        column: filter.column,
        operator: filter.operator,
        value,
        valueTo,
      })
      continue
    }

    if (!value) {
      continue
    }

    normalizedFilters.push({
      column: filter.column,
      operator: filter.operator,
      value,
    })
  }

  return normalizedFilters
}
