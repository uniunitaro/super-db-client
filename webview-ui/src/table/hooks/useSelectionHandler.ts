import { useVSCodeState } from '@/hooks/useVSCodeState'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { TableCellRef } from '../components/TableCell'
import type { SelectedCell, TableRowWithType } from '../types/table'

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
        // 基準となる行から現在の行までの行を選択する
        const newSelectedRowIndexes = [
          ...Array(Math.abs(nextRowIndex - originRowIndexRef.current) + 1),
        ].map((_, i) => Math.min(originRowIndexRef.current, nextRowIndex) + i)

        setSelectedRowIndexes(newSelectedRowIndexes)
      } else if (isCtrlPressed) {
        // Ctrlが押されている場合は基準行を更新
        originRowIndexRef.current = nextRowIndex

        setSelectedRowIndexes((prev) => {
          if (prev.includes(nextRowIndex)) {
            // 既に選択されている行を選択解除
            return prev.filter((index) => index !== nextRowIndex)
          }

          return [...prev, nextRowIndex]
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

      const isInputFocused = cellRef.current?.isInputFocused()
      if (isInputFocused) {
        cellRef.current?.blurInput()
        // blur時にinputが非表示になるが、移動先のセルでinputを表示したいのでtrueにする
        setShouldShowInput(true)
      }

      flushSync(() => {
        const newCell =
          nextRow.type === 'inserted'
            ? ({
                type: 'inserted',
                rowIndex: nextRowIndex,
                rowUUID: nextRow.uuid,
                columnId: nextColumn.name,
                columnIndex: nextColumnIndex,
              } as const)
            : ({
                type: 'existing',
                rowIndex: nextRowIndex,
                columnId: nextColumn.name,
                columnIndex: nextColumnIndex,
              } as const)

        setSelectedCell(newCell)

        handleMultiSelect({
          nextRowIndex,
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
