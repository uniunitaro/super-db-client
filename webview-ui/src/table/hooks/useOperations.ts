import { useVSCodeState } from '@/hooks/useVSCodeState'
import type { GetTableDataRequestResponse } from '@shared-types/message'
import { type RefObject, useCallback, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import type {
  CellInfo,
  ClientOperation,
  SelectedCellInfo,
  TableRowWithType,
} from '../types/table'

export const useOperations = ({
  tableData,
  selectedCell,
  shouldNotUpdateCellRef,
  selectedCellInputRef,
}: {
  tableData: GetTableDataRequestResponse | undefined
  selectedCell: SelectedCellInfo
  shouldNotUpdateCellRef: RefObject<boolean>
  selectedCellInputRef: RefObject<HTMLInputElement | null>
}) => {
  const useTablePanelState = useVSCodeState('tablePanel')
  // 型引数なしだとnever[]に推論される
  const [operations, setOperations] = useTablePanelState<
    ClientOperation[],
    'operations'
  >('operations', [])

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

        if (selectedCellInputRef.current) {
          selectedCellInputRef.current.value = String(oldValue)
        }

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

        setOperations([
          ...operations,
          {
            type: 'edit',
            primaryKeyValues,
            columnName: selectedCell.columnId,
            newValue: adjustedNewValue,
          },
        ])
      } else if (selectedCell.type === 'inserted') {
        setOperations([
          ...operations,
          {
            type: 'editInserted',
            insertedRowUUID: selectedCell.rowUUID,
            columnName: selectedCell.columnId,
            newValue: adjustedNewValue,
          },
        ])
      }
    },
    [
      tableData,
      selectedCell,
      operations,
      setOperations,
      shouldNotUpdateCellRef,
      selectedCellInputRef,
    ],
  )

  const handleRowDelete = useCallback(() => {
    if (!tableData) return

    if (selectedCell.type === 'existing') {
      const targetRow = tableData.rows[selectedCell.rowIndex]
      const primaryKeys = tableData.tableMetadata.primaryKeyColumns
      const primaryKeyValues = primaryKeys.map((key) => ({
        key,
        value: String(targetRow[key]),
      }))

      setOperations([...operations, { type: 'delete', primaryKeyValues }])
    } else if (selectedCell.type === 'inserted') {
      setOperations([
        ...operations,
        { type: 'deleteInserted', insertedRowUUID: selectedCell.rowUUID },
      ])
    }
  }, [tableData, operations, setOperations, selectedCell])

  const virtualTableTableRef = useRef<HTMLDivElement>(null)
  const handleRowInsert = useCallback(() => {
    const uuid = crypto.randomUUID()
    flushSync(() => {
      setOperations([...operations, { type: 'insert', uuid }])
    })

    virtualTableTableRef.current?.scrollIntoView(false)
  }, [operations, setOperations])

  const editedCells: CellInfo[] = useMemo(() => {
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

        return []
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

  return {
    operations,
    updatedRows,
    editedCells,
    deletedRowIndexes,
    virtualTableTableRef,
    setOperations,
    handleCellEdit,
    handleRowDelete,
    handleRowInsert,
  }
}
