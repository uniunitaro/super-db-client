import { useVSCodeState } from '@/hooks/useVSCodeState'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { TableCellRef } from '../components/TableCell'
import {
  createRowRangeSelection,
  resolveNextSelectedCell,
  toggleRowIndexSelection,
} from '../domain/selection'
import type { SelectedCell, TableRowWithType } from '../domain/selection'

export type SetSelectedCell = (params: {
  cell: SelectedCell
  isShiftPressed: boolean
  isCtrlPressed: boolean
  shouldKeepMultiSelection?: boolean
}) => void

/**
 * テーブルのセル、行の選択状態を管理
 */
export const useSelectionHandler = () => {
  const useTablePanelState = useVSCodeState('tablePanel')

  const [selectedCell, setSelectedCell] = useTablePanelState('selectedCell', {
    type: 'existing',
    rowIndex: 0,
    // FIXME: id固定にしてるの直す
    columnId: 'id',
    columnIndex: 0,
  })

  const [selectedRowIndexes, setSelectedRowIndexes] = useTablePanelState(
    'selectedRowIndexes',
    [selectedCell.rowIndex],
  )
  // 複数選択の場合の基準となる行
  const originRowIndexRef = useRef(selectedCell.rowIndex)

  const handleMultiSelect = useCallback(
    ({
      nextRowIndex,
      isShiftPressed,
      isCtrlPressed,
    }: {
      nextRowIndex: number
      isShiftPressed: boolean
      isCtrlPressed: boolean
    }) => {
      if (isShiftPressed) {
        setSelectedRowIndexes(
          createRowRangeSelection(originRowIndexRef.current, nextRowIndex),
        )
      } else if (isCtrlPressed) {
        // Ctrlが押されている場合は基準行を更新
        originRowIndexRef.current = nextRowIndex

        setSelectedRowIndexes((prev) => {
          return toggleRowIndexSelection(prev, nextRowIndex)
        })
      } else {
        // Shift, Ctrlが押されていない場合は基準行を更新
        originRowIndexRef.current = nextRowIndex

        setSelectedRowIndexes([nextRowIndex])
      }
    },
    [setSelectedRowIndexes],
  )

  const resetMultiSelection = useCallback(() => {
    setSelectedRowIndexes([selectedCell.rowIndex])
    originRowIndexRef.current = selectedCell.rowIndex
  }, [selectedCell, setSelectedRowIndexes])

  const setSelectedCellAndRows = useCallback<SetSelectedCell>(
    ({ cell, isShiftPressed, isCtrlPressed }) => {
      setSelectedCell(cell)
      handleMultiSelect({
        nextRowIndex: cell.rowIndex,
        isShiftPressed,
        isCtrlPressed,
      })
    },
    [setSelectedCell, handleMultiSelect],
  )

  const cellRef = useRef<TableCellRef>(null)

  const [shouldShowInput, setShouldShowInput] = useState(false)

  const moveSelectedCell = useCallback(
    ({
      rows,
      columns,
      direction,
      isShiftPressed,
    }: {
      rows: TableRowWithType[]
      columns: ColumnMetadata[]
      direction: 'up' | 'down' | 'left' | 'right'
      isShiftPressed: boolean
    }) => {
      if (!selectedCell) return

      const newCell = resolveNextSelectedCell({
        selectedCell,
        rows,
        columns,
        direction,
      })
      if (!newCell) return

      const isInputFocused = cellRef.current?.isInputFocused()
      if (isInputFocused) {
        cellRef.current?.blurInput()
        // blur時にinputが非表示になるが、移動先のセルでinputを表示したいのでtrueにする
        setShouldShowInput(true)
      }

      flushSync(() => {
        setSelectedCell(newCell)

        handleMultiSelect({
          nextRowIndex: newCell.rowIndex,
          isShiftPressed,
          isCtrlPressed: false,
        })
      })

      if (isInputFocused) {
        cellRef.current?.focusInput()
      } else {
        cellRef.current?.focusSelectedCell()
      }
    },
    [selectedCell, setSelectedCell, handleMultiSelect],
  )

  const focusSelectedCellInput = useCallback(() => {
    flushSync(() => {
      setShouldShowInput(true)
    })
    cellRef.current?.focusInput()
  }, [])

  const blurSelectedCellInput = useCallback(() => {
    cellRef.current?.blurInput()
    cellRef.current?.focusSelectedCell()
  }, [])

  const shouldNotUpdateCellRef = useRef(false)
  const exitSelectedCellInput = useCallback(() => {
    shouldNotUpdateCellRef.current = true
    blurSelectedCellInput()
  }, [blurSelectedCellInput])

  const toggleSelectedCellInputFocus = useCallback(() => {
    if (cellRef.current?.isInputFocused()) {
      blurSelectedCellInput()
    } else {
      focusSelectedCellInput()
    }
  }, [blurSelectedCellInput, focusSelectedCellInput])

  return {
    selectedCell,
    cellRef,
    shouldNotUpdateCellRef,
    shouldShowInput,
    selectedRowIndexes,
    setSelectedCell: setSelectedCellAndRows,
    moveSelectedCell,
    focusSelectedCellInput,
    blurSelectedCellInput,
    exitSelectedCellInput,
    toggleSelectedCellInputFocus,
    setShouldShowInput,
    resetMultiSelection,
  }
}
