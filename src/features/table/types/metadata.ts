export type ColumnMetadata = {
  name: string
  dataType: string
  isNullable: boolean
  default: string | null
  extra: string
  comment: string
  // TODO: foreignKeyほしい
}

export type TableMetadata = {
  name: string
  totalRows: number
  columns: ColumnMetadata[]
}
