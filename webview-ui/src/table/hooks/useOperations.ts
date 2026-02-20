import { useVSCodeState } from '@/hooks/useVSCodeState'
import type { GetTableDataRequestResponse } from '@shared-types/message'
import { type RefObject, useCallback, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { TableCellRef } from '../components/TableCell'
import {
  type Cell,
  type ClientOperation,
  createDeleteOperations,
  createDuplicateOperations,
  createEditOperation,
  getDeletedRowIndexesByOperations,
  getEditedCellsByOperations,
  getUpdatedRowsByOperations,
} from '../domain/operations'
import type { SelectedCell, TableRowWithType } from '../domain/selection'

export const useOperations = ({
  tableData,
  selectedCell,
  selectedRowIndexes,
  shouldNotUpdateCellRef,
  cellRef,
}: {
  tableData: GetTableDataRequestResponse | undefined
  selectedCell: SelectedCell
  selectedRowIndexes: number[]
  shouldNotUpdateCellRef: RefObject<boolean>
  cellRef: RefObject<TableCellRef | null>
}) => {
  const useTablePanelState = useVSCodeState('tablePanel')
  // 型引数なしだとnever[]に推論される
  const [operations, setOperations] = useTablePanelState('operations', [])
  const [redoStack, setRedoStack] = useTablePanelState('redoStack', [])

  const addOperations = useCallback(
    (newOperations: ClientOperation[]) => {
      setOperations([...operations, ...newOperations])
      setRedoStack([])
    },
    [operations, setOperations, setRedoStack],
  )

  // tableData.rowsとoperationsから、変更後のデータを作成する
  const updatedRows: TableRowWithType[] = useMemo(() => {
    return getUpdatedRowsByOperations({
      tableDataRows: tableData?.rows,
      operations,
    })
  }, [operations, tableData?.rows])

  const handleCellEdit = useCallback(
    (newValue: string | null) => {
      if (!tableData) return

      if (shouldNotUpdateCellRef.current) {
        shouldNotUpdateCellRef.current = false

        const oldValue =
          tableData.rows[selectedCell.rowIndex][selectedCell.columnId]

        cellRef?.current?.setInputValue(String(oldValue))

        return
      }

      const operation = createEditOperation({
        tableData,
        selectedCell,
        newValue,
      })

      if (operation) {
        addOperations([operation])
      }
    },
    [tableData, selectedCell, addOperations, shouldNotUpdateCellRef, cellRef],
  )

  const handleRowDelete = useCallback(() => {
    if (!tableData) return

    const deleteOperations = createDeleteOperations({
      tableData,
      selectedRowIndexes,
      updatedRows,
    })

    // TODO: これだとundo時に一個ずつしか戻せない、、ぐええ
    addOperations(deleteOperations)
  }, [tableData, addOperations, selectedRowIndexes, updatedRows])

  const virtualizedTableTableRef = useRef<HTMLDivElement>(null)
  const handleRowInsert = useCallback(() => {
    const uuid = crypto.randomUUID()
    flushSync(() => {
      addOperations([{ type: 'insert', uuid }])
    })

    virtualizedTableTableRef.current?.scrollIntoView(false)
  }, [addOperations])

  const handleRowDuplicate = useCallback(() => {
    if (!tableData) return

    const operationsToAdd = createDuplicateOperations({
      tableData,
      selectedRowIndexes,
      updatedRows,
    })

    if (!operationsToAdd.length) return

    flushSync(() => {
      addOperations(operationsToAdd)
    })

    virtualizedTableTableRef.current?.scrollIntoView(false)
  }, [tableData, selectedRowIndexes, updatedRows, addOperations])

  const editedCells: Cell[] = useMemo(() => {
    return getEditedCellsByOperations({
      operations,
      tableDataRows: tableData?.rows,
      updatedRows,
    })
  }, [operations, tableData?.rows, updatedRows])

  const deletedRowIndexes: number[] = useMemo(() => {
    return getDeletedRowIndexesByOperations({
      operations,
      tableDataRows: tableData?.rows,
    })
  }, [operations, tableData?.rows])

  const resetOperations = useCallback(() => {
    setOperations([])
    setRedoStack([])
  }, [setOperations, setRedoStack])

  const undoOperation = useCallback(() => {
    const removedOperation = operations[operations.length - 1]
    if (removedOperation) {
      setOperations(operations.slice(0, -1))
      setRedoStack([...redoStack, removedOperation])
    }
  }, [operations, redoStack, setOperations, setRedoStack])

  const redoOperation = useCallback(() => {
    const operationToRedo = redoStack[redoStack.length - 1]
    if (operationToRedo) {
      setOperations([...operations, operationToRedo])
      setRedoStack(redoStack.slice(0, -1))
    }
  }, [operations, redoStack, setOperations, setRedoStack])

  return {
    operations,
    updatedRows,
    editedCells,
    deletedRowIndexes,
    virtualizedTableTableRef,
    handleCellEdit,
    handleRowDelete,
    handleRowInsert,
    handleRowDuplicate,
    resetOperations,
    undoOperation,
    redoOperation,
  }
}
