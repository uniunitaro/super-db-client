import { useVSCodeState } from '@/hooks/useVSCodeState'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { TableRowWithType } from '../types/table'

/**
 * テーブルのセル、行の選択状態を管理
 */
export const useSelectionHandler = ({
  rows,
  columns,
}: { rows: TableRowWithType[]; columns: ColumnMetadata[] }) => {
  const useTablePanelState = useVSCodeState('tablePanel')

  const [selectedCell, setSelectedCell] = useTablePanelState('selectedCell', {
    type: 'existing',
    rowIndex: 0,
    columnId: 'id',
    columnIndex: 0,
  })

  const selectedCellInputRef = useRef<HTMLInputElement>(null)

  const moveSelectedCell = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!selectedCell) return

      const { rowIndex, columnIndex } = selectedCell

      const nextRowIndex =
        direction === 'up'
          ? rowIndex - 1
          : direction === 'down'
            ? rowIndex + 1
            : rowIndex
      const nextColumnIndex =
        direction === 'left'
          ? columnIndex - 1
          : direction === 'right'
            ? columnIndex + 1
            : columnIndex

      if (nextRowIndex < 0 || nextRowIndex >= rows.length) return
      if (nextColumnIndex < 0 || nextColumnIndex >= columns.length) return

      const nextRow = rows[nextRowIndex]
      const nextColumn = columns[nextColumnIndex]

      const isInputFocused =
        selectedCellInputRef.current === document.activeElement
      if (isInputFocused) {
        selectedCellInputRef.current?.blur()
      }

      flushSync(() => {
        setSelectedCell(
          nextRow.type === 'inserted'
            ? {
                type: 'inserted',
                rowIndex: nextRowIndex,
                rowUUID: nextRow.uuid,
                columnId: nextColumn.name,
                columnIndex: nextColumnIndex,
              }
            : {
                type: 'existing',
                rowIndex: nextRowIndex,
                columnId: nextColumn.name,
                columnIndex: nextColumnIndex,
              },
        )
      })

      if (isInputFocused) {
        selectedCellInputRef.current?.focus()
      }
    },
    [selectedCell, rows, columns, setSelectedCell],
  )

  const focusSelectedCellInput = useCallback(() => {
    selectedCellInputRef.current?.focus()
  }, [])

  const shouldNotUpdateCellRef = useRef(false)
  const exitSelectedCellInput = useCallback(() => {
    shouldNotUpdateCellRef.current = true
    selectedCellInputRef.current?.blur()
  }, [])

  const toggleSelectedCellInputFocus = useCallback(() => {
    if (selectedCellInputRef.current === document.activeElement) {
      selectedCellInputRef.current?.blur()
    } else {
      selectedCellInputRef.current?.focus()
    }
  }, [])

  return {
    selectedCell,
    selectedCellInputRef,
    shouldNotUpdateCellRef,
    setSelectedCell,
    moveSelectedCell,
    focusSelectedCellInput,
    exitSelectedCellInput,
    toggleSelectedCellInputFocus,
  }
}
