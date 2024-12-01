import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { EMPTY_TEXT, NULL_TEXT } from '../constants/constants'
import type { TableRowWithType } from '../types/table'

export const getColumnsWithWidth = ({
  rows,
  columns,
  fontFamily,
  fontSize,
}: {
  rows: TableRowWithType[]
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
      const value = row.row[column.name]
      const text =
        value === undefined
          ? ''
          : value === null
            ? NULL_TEXT
            : value === ''
              ? EMPTY_TEXT
              : String(value)

      return context.measureText(text).width
    })

    widths.push(context.measureText(column.name).width)

    const width = Math.max(...widths)

    return {
      ...column,
      width,
    }
  })
