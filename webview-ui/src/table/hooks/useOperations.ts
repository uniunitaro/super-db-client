import { useVSCodeState } from '@/hooks/useVSCodeState'
import { assertNever } from '@/utilities/assertNever'
import type { GetTableDataRequestResponse } from '@shared-types/message'
import { type RefObject, useCallback, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { TableCellRef } from '../components/TableCell'
import type {
  Cell,
  ClientOperation,
  SelectedCell,
  TableRowWithType,
} from '../types/table'

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
    const newRows: TableRowWithType[] = tableData
      ? structuredClone(tableData.rows).map((row) => ({
          type: 'existing',
          row,
        }))
      : []
    for (const operation of operations) {
      if (operation.type === 'insert') {
        newRows.push({ type: 'inserted', uuid: operation.uuid, row: {} })
      }
      if (operation.type === 'edit') {
        const targetRow = newRows.find(
          (row) =>
            row.type === 'existing' &&
            operation.primaryKeyValues.every(
              (primaryKey) =>
                String(row.row[primaryKey.key]) === primaryKey.value,
            ),
        )
        if (targetRow) {
          targetRow.row[operation.columnName] = operation.newValue
        }
      }
      if (operation.type === 'editInserted') {
        const targetRow = newRows.find(
          (row) =>
            row.type === 'inserted' && operation.insertedRowUUID === row.uuid,
        )
        if (targetRow) {
          targetRow.row[operation.columnName] = operation.newValue
        }
      }
      if (operation.type === 'deleteInserted') {
        const targetRowIndex = newRows.findIndex(
          (row) =>
            row.type === 'inserted' && operation.insertedRowUUID === row.uuid,
        )
        if (targetRowIndex !== -1) {
          newRows.splice(targetRowIndex, 1)
        }
      }
    }
    return newRows
  }, [operations, tableData])

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

      const targetColumn = tableData.tableMetadata.columns.find(
        (column) => column.name === selectedCell.columnId,
      )

      const adjustedNewValue =
        newValue === '' && !targetColumn?.isTextType ? null : newValue

      if (selectedCell.type === 'existing') {
        const targetRow = tableData.rows[selectedCell.rowIndex]
        const primaryKeys = tableData.tableMetadata.primaryKeyColumns
        const primaryKeyValues = primaryKeys.map((key) => ({
          key,
          value: String(targetRow[key]),
        }))

        addOperations([
          {
            type: 'edit',
            primaryKeyValues,
            columnName: selectedCell.columnId,
            newValue: adjustedNewValue,
          },
        ])
      } else if (selectedCell.type === 'inserted') {
        addOperations([
          {
            type: 'editInserted',
            insertedRowUUID: selectedCell.rowUUID,
            columnName: selectedCell.columnId,
            newValue: adjustedNewValue,
          },
        ])
      }
    },
    [tableData, selectedCell, addOperations, shouldNotUpdateCellRef, cellRef],
  )

  const handleRowDelete = useCallback(() => {
    if (!tableData) return

    const deleteOperations = selectedRowIndexes.map((rowIndex) => {
      const selectedRow = updatedRows[rowIndex]

      if (selectedRow.type === 'existing') {
        const primaryKeys = tableData.tableMetadata.primaryKeyColumns
        const primaryKeyValues = primaryKeys.map((key) => ({
          key,
          value: String(selectedRow.row[key]),
        }))

        return { type: 'delete', primaryKeyValues } as const
      }
      if (selectedRow.type === 'inserted') {
        return {
          type: 'deleteInserted',
          insertedRowUUID: selectedRow.uuid,
        } as const
      }

      return assertNever(selectedRow)
    })

    // TODO: これだとundo時に一個ずつしか戻せない、、ぐええ
    addOperations(deleteOperations)
  }, [tableData, addOperations, selectedRowIndexes, updatedRows])

  const virtualTableTableRef = useRef<HTMLDivElement>(null)
  const handleRowInsert = useCallback(() => {
    const uuid = crypto.randomUUID()
    flushSync(() => {
      addOperations([{ type: 'insert', uuid }])
    })

    virtualTableTableRef.current?.scrollIntoView(false)
  }, [addOperations])

  const editedCells: Cell[] = useMemo(() => {
    if (!tableData) return []

    return operations
      .filter(
        (operation) =>
          operation.type === 'edit' || operation.type === 'editInserted',
      )
      .flatMap((operation) => {
        if (operation.type === 'edit') {
          const targetRowIndex = tableData.rows.findIndex((row) =>
            operation.primaryKeyValues.every(
              (primaryKey) => String(row[primaryKey.key]) === primaryKey.value,
            ),
          )
          if (targetRowIndex === -1) return []

          return {
            type: 'existing',
            rowIndex: targetRowIndex,
            columnId: operation.columnName,
          }
        }
        if (operation.type === 'editInserted') {
          const targetRowIndex = updatedRows.findIndex(
            (row) =>
              row.type === 'inserted' && operation.insertedRowUUID === row.uuid,
          )
          if (targetRowIndex === -1) return []

          return {
            type: 'inserted',
            rowIndex: targetRowIndex,
            columnId: operation.columnName,
            rowUUID: operation.insertedRowUUID,
          }
        }

        return assertNever(operation)
      })
  }, [operations, tableData, updatedRows])

  const deletedRowIndexes: number[] = useMemo(() => {
    if (!tableData) return []

    return operations
      .filter((operation) => operation.type === 'delete')
      .map((operation) => {
        const targetRowIndex = tableData.rows.findIndex((row) =>
          operation.primaryKeyValues.every(
            (primaryKey) => String(row[primaryKey.key]) === primaryKey.value,
          ),
        )
        return targetRowIndex
      })
  }, [operations, tableData])

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
    virtualTableTableRef,
    handleCellEdit,
    handleRowDelete,
    handleRowInsert,
    resetOperations,
    undoOperation,
    redoOperation,
  }
}
