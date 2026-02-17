export type TableRow = { [x: string]: unknown }

export const FILTER_OPERATORS = [
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
] as const

export type FilterOperator = (typeof FILTER_OPERATORS)[number]

export type FilterCondition = {
  column: string
  operator: FilterOperator
  value?: string
  valueTo?: string
}

type PrimaryKeyValue = { key: string; value: string }

export type Operation =
  | {
      type: 'edit'
      primaryKeyValues: PrimaryKeyValue[]
      columnName: string
      newValue: string | null
    }
  | {
      type: 'delete'
      primaryKeyValues: PrimaryKeyValue[]
    }
  | {
      type: 'insert'
      row: TableRow
    }
