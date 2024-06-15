import type { ColumnMetadata, TableRow } from '@shared-types/sharedTypes'

export const getColumnsWithWidth = ({
  rows,
  columns,
  fontFamily,
  fontSize,
}: {
  rows: TableRow[]
  columns: ColumnMetadata[]
  fontFamily: string
  fontSize: number
}): (ColumnMetadata & { width: number })[] =>
  columns.map((column) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to get canvas context')
    }
    context.font = `${fontSize}px ${fontFamily}`

    const widths = rows.map((row) => {
      const text = String(row[column.name])
      return context.measureText(text).width
    })

    widths.push(context.measureText(column.name).width)

    const width = Math.max(...widths)

    return {
      ...column,
      width,
    }
  })
