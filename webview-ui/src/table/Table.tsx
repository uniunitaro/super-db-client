import { useVSCodeState } from '@/hooks/useVSCodeState'
import { vscode } from '@/utilities/vscode'
import {
  commandRequest,
  getConfigRequest,
  getTableDataRequest,
  saveTableChangesRequest,
} from '@shared-types/message'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { type FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { css } from 'styled-system/css'
import { hstack } from 'styled-system/patterns/hstack'
import { Key } from 'ts-key-enum'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import TableFooter from './components/TableFooter'
import VirtualTable from './components/VirtualTable'
import type { CellInfo } from './types/cell'
import type { ClientOperation } from './types/operation'
import type { TableRowWithType } from './types/table'
import { convertClientOperationToOperation } from './utils/reduceOperations'

const Table: FC = () => {
  const useTablePanelState = useVSCodeState('tablePanel')

  const [limit, setLimit] = useTablePanelState('limit', 300)
  const [offset, setOffset] = useTablePanelState('offset', 0)

  const {
    data: tableData,
    isPending: tableDataIsPending,
    error: tableDataError,
  } = useQuery({
    queryKey: ['getTableData', limit, offset],
    queryFn: () =>
      vscode.messenger.sendRequest(getTableDataRequest, HOST_EXTENSION, {
        limit,
        offset,
      }),
  })
  useEffect(() => {
    if (!tableData) return

    if (hasSavedTableChanges.current) {
      setOperations([])
      hasSavedTableChanges.current = false
    }
  }, [tableData])

  const {
    data: config,
    isPending: configIsPending,
    error: configError,
  } = useQuery({
    queryKey: ['getConfig'],
    queryFn: () =>
      vscode.messenger.sendRequest(getConfigRequest, HOST_EXTENSION),
  })

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1) {
        return
      }
      setOffset((page - 1) * limit)
    },
    [limit, setOffset],
  )

  const [selectedCell, setSelectedCell] = useTablePanelState(
    'selectedCell',
    undefined,
  )

  // 型引数なしだとnever[]に推論される
  const [operations, setOperations] = useTablePanelState<
    ClientOperation[],
    'operations'
  >('operations', [])

  const handleCellEdit = useCallback(
    (newValue: string) => {
      if (!tableData || !selectedCell) return

      if (selectedCell.type === 'existing') {
        const targetRow = tableData.rows[selectedCell.rowIndex]
        const primaryKeys = tableData.tableMetadata.primaryKeyColumns
        const primaryKeyValues = primaryKeys.map((key) => ({
          key,
          // TODO: value unknownじゃなきゃだめなんじゃないか？
          value: String(targetRow[key]),
        }))

        setOperations([
          ...operations,
          {
            type: 'edit',
            primaryKeyValues,
            columnName: selectedCell.columnId,
            newValue,
          },
        ])
      } else if (selectedCell.type === 'inserted') {
        setOperations([
          ...operations,
          {
            type: 'editInserted',
            insertedRowUUID: selectedCell.rowUUID,
            columnName: selectedCell.columnId,
            newValue,
          },
        ])
      }
    },
    [tableData, operations, selectedCell, setOperations],
  )

  const handleRowDelete = useCallback(() => {
    if (!tableData || !selectedCell) return

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
  }, [tableData, operations, selectedCell, setOperations])

  const virtualTableTableRef = useRef<HTMLDivElement>(null)
  const handleRowInsert = useCallback(() => {
    const uuid = crypto.randomUUID()
    flushSync(() => {
      setOperations([...operations, { type: 'insert', uuid }])
    })

    virtualTableTableRef.current?.scrollIntoView(false)
  }, [operations, setOperations])

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
          console.log(targetRowIndex)
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

  const hasSavedTableChanges = useRef(false)
  const queryClient = useQueryClient()
  const { mutate: saveTableChanges } = useMutation({
    mutationKey: ['saveTableChanges'],
    mutationFn: async () =>
      vscode.messenger.sendRequest(saveTableChangesRequest, HOST_EXTENSION, {
        operations: convertClientOperationToOperation(operations),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getTableData'] })
      hasSavedTableChanges.current = true
    },
  })
  const handleSaveChanges = () => {
    saveTableChanges()
  }

  useEffect(() => {
    vscode.messenger.onRequest(commandRequest, (command) => {
      if (command === 'saveTableChanges') {
        saveTableChanges()
      }
    })
    vscode.messenger.start()
  }, [saveTableChanges])

  useHotkeys([Key.Backspace, Key.Delete], handleRowDelete, [handleRowDelete])

  return (
    <main
      className={css({
        color: 'var(--vscode-foreground)',
        display: 'grid',
        gridTemplateColumns: '1',
        gridTemplateRows: '1',
        h: '100vh',
      })}
    >
      {tableData && config && (
        <>
          <VirtualTable
            tableRef={virtualTableTableRef}
            dbColumns={tableData.tableMetadata.columns}
            dbRows={updatedRows}
            rowHeight={config.tableRowHeight}
            fontSize={config.fontSize}
            selectedCell={selectedCell}
            editedCells={editedCells}
            deletedRowIndexes={deletedRowIndexes}
            onCellSelect={setSelectedCell}
            onCellEdit={handleCellEdit}
          />
          <TableFooter
            totalCount={tableData.tableMetadata.totalRows}
            limit={limit}
            offset={offset}
            page={offset / limit + 1}
            onPageChange={handlePageChange}
            leftItems={
              <div className={hstack({ gap: '4' })}>
                <VSCodeButton
                  appearance="icon"
                  aria-label="Save changes"
                  disabled={operations.length === 0}
                  onClick={handleSaveChanges}
                >
                  <div className={`${css({ px: '3' })} codicon codicon-save`} />
                </VSCodeButton>
                <VSCodeButton
                  appearance="icon"
                  aria-label="Delete row"
                  disabled={!selectedCell}
                  onClick={handleRowDelete}
                >
                  <div
                    className={`${css({ px: '3' })} codicon codicon-trash`}
                  />
                </VSCodeButton>
                <VSCodeButton
                  appearance="icon"
                  aria-label="Insert row"
                  onClick={handleRowInsert}
                >
                  <div className={`${css({ px: '3' })} codicon codicon-add`} />
                </VSCodeButton>
              </div>
            }
          />
        </>
      )}
    </main>
  )
}

export default Table
