import type { ColumnMetadata } from '@shared-types/sharedTypes'

export type TableRowWithType =
  | {
      type: 'existing'
      row: { [x: string]: unknown }
    }
  | {
      type: 'inserted'
      uuid: string
      row: { [x: string]: unknown }
    }

export type SelectedCell =
  | {
      type: 'existing'
      rowIndex: number
      columnId: string
      columnIndex: number
    }
  | {
      type: 'inserted'
      rowIndex: number
      rowUUID: string
      columnId: string
      columnIndex: number
    }

export const createRowRangeSelection = (
  originRowIndex: number,
  nextRowIndex: number,
) =>
  [...Array(Math.abs(nextRowIndex - originRowIndex) + 1)].map(
    (_, i) => Math.min(originRowIndex, nextRowIndex) + i,
  )

export const toggleRowIndexSelection = (
  selectedRowIndexes: number[],
  nextRowIndex: number,
) => {
  if (selectedRowIndexes.includes(nextRowIndex)) {
    return selectedRowIndexes.filter((index) => index !== nextRowIndex)
  }

  return [...selectedRowIndexes, nextRowIndex]
}

export const createSelectedCell = ({
  row,
  rowIndex,
  columnId,
  columnIndex,
}: {
  row: TableRowWithType
  rowIndex: number
  columnId: string
  columnIndex: number
}): SelectedCell =>
  row.type === 'inserted'
    ? {
        type: 'inserted',
        rowIndex,
        rowUUID: row.uuid,
        columnId,
        columnIndex,
      }
    : {
        type: 'existing',
        rowIndex,
        columnId,
        columnIndex,
      }

export const resolveNextSelectedCell = ({
  selectedCell,
  rows,
  columns,
  direction,
}: {
  selectedCell: SelectedCell
  rows: TableRowWithType[]
  columns: ColumnMetadata[]
  direction: 'up' | 'down' | 'left' | 'right'
}): SelectedCell | undefined => {
  const nextRowIndex =
    direction === 'up'
      ? selectedCell.rowIndex - 1
      : direction === 'down'
        ? selectedCell.rowIndex + 1
        : selectedCell.rowIndex
  const nextColumnIndex =
    direction === 'left'
      ? selectedCell.columnIndex - 1
      : direction === 'right'
        ? selectedCell.columnIndex + 1
        : selectedCell.columnIndex

  if (nextRowIndex < 0 || nextRowIndex >= rows.length) {
    return undefined
  }

  if (nextColumnIndex < 0 || nextColumnIndex >= columns.length) {
    return undefined
  }

  const nextRow = rows[nextRowIndex]
  const nextColumn = columns[nextColumnIndex]

  if (!nextRow || !nextColumn) {
    return undefined
  }

  return createSelectedCell({
    row: nextRow,
    rowIndex: nextRowIndex,
    columnId: nextColumn.name,
    columnIndex: nextColumnIndex,
  })
}
