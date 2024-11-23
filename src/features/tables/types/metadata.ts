export type ColumnMetadata = {
  name: string
  dataType: string
  isNullable: boolean
  isTextType: boolean
  default: string | null
  extra: string
  comment: string
  // TODO: foreignKeyほしい
}

export type ColumnKey = {
  columnName: string
  constraintName: string
}

export type TableMetadata = {
  name: string
  totalRows: number
  columns: ColumnMetadata[]
  columnKeys: ColumnKey[]
  primaryKeyColumns: string[]
}
