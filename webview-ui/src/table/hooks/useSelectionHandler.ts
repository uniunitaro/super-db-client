import { useVSCodeState } from '@/hooks/useVSCodeState'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { useCallback, useRef, useState } from 'react'
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

  const selectedCellRef = useRef<HTMLDivElement>(null)
  const selectedCellInputRef = useRef<HTMLInputElement>(null)

  const [shouldShowInput, setShouldShowInput] = useState(false)

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
        // blur時にinputが非表示になるが、移動先のセルでinputを表示したいのでtrueにする
        setShouldShowInput(true)
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
      } else {
        selectedCellRef.current?.focus()
      }
    },
    [selectedCell, rows, columns, setSelectedCell],
  )

  const focusSelectedCellInput = useCallback(() => {
    flushSync(() => {
      setShouldShowInput(true)
    })
    selectedCellInputRef.current?.focus()
  }, [])

  const blurSelectedCellInput = useCallback(() => {
    selectedCellInputRef.current?.blur()
    selectedCellRef.current?.focus()
  }, [])

  const shouldNotUpdateCellRef = useRef(false)
  const exitSelectedCellInput = useCallback(() => {
    shouldNotUpdateCellRef.current = true
    blurSelectedCellInput()
  }, [blurSelectedCellInput])

  const toggleSelectedCellInputFocus = useCallback(() => {
    if (selectedCellInputRef.current === document.activeElement) {
      blurSelectedCellInput()
    } else {
      focusSelectedCellInput()
    }
  }, [blurSelectedCellInput, focusSelectedCellInput])

  return {
    selectedCell,
    selectedCellRef,
    selectedCellInputRef,
    shouldNotUpdateCellRef,
    shouldShowInput,
    setSelectedCell,
    moveSelectedCell,
    focusSelectedCellInput,
    blurSelectedCellInput,
    exitSelectedCellInput,
    toggleSelectedCellInputFocus,
    setShouldShowInput,
  }
}
