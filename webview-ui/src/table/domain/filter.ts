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
): FilterCondition[] =>
  filters.flatMap((filter): FilterCondition[] => {
    if (!filter.column) {
      return []
    }

    const value = filter.value.trim()
    const valueTo = filter.valueTo.trim()

    if (isNoValueOperator(filter.operator)) {
      return [{ column: filter.column, operator: filter.operator }]
    }

    if (isBetweenOperator(filter.operator)) {
      if (!value || !valueTo) {
        return []
      }

      return [
        {
          column: filter.column,
          operator: filter.operator,
          value,
          valueTo,
        },
      ]
    }

    if (!value) {
      return []
    }

    return [{ column: filter.column, operator: filter.operator, value }]
  })
