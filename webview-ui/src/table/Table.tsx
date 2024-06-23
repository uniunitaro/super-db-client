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
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { css } from 'styled-system/css'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import TableFooter from './components/TableFooter'
import VirtualTable from './components/VirtualTable'
import type { Operation } from './types/operation'
import { reduceOperations } from './utils/reduceOperations'

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

  const [operations, setOperations] = useState<Operation[]>([])

  const handleCellEdit = useCallback(
    ({
      rowIndex,
      columnId,
      newValue,
    }: { rowIndex: number; columnId: string; newValue: string }) => {
      if (!tableData) return

      const targetRow = tableData.rows[rowIndex]
      const primaryKeys = tableData.tableMetadata.primaryKeyColumns
      const primaryKeyValues = primaryKeys.map((key) => ({
        key,
        // TODO: value unknownじゃなきゃだめなんじゃないか？
        value: String(targetRow[key]),
      }))

      setOperations([
        ...operations,
        { type: 'edit', primaryKeyValues, columnName: columnId, newValue },
      ])
    },
    [tableData, operations],
  )

  // tableData.rowsとoperationsから、変更後のデータを作成する
  const updatedRows = useMemo(() => {
    const newRows = tableData ? structuredClone(tableData.rows) : []
    for (const operation of operations) {
      if (operation.type === 'edit') {
        const targetRow = newRows.find((row) =>
          operation.primaryKeyValues.every(
            (primaryKey) => String(row[primaryKey.key]) === primaryKey.value,
          ),
        )
        if (targetRow) {
          targetRow[operation.columnName] = operation.newValue
        }
      }
    }
    return newRows
  }, [operations, tableData])

  const editedCells: { rowIndex: number; columnId: string }[] = useMemo(() => {
    if (!tableData) return []

    const editedCells: { rowIndex: number; columnId: string }[] = []
    for (const operation of operations) {
      if (operation.type === 'edit') {
        const targetRow = tableData.rows.find((row, index) =>
          operation.primaryKeyValues.every(
            (primaryKey) => String(row[primaryKey.key]) === primaryKey.value,
          ),
        )
        if (targetRow) {
          editedCells.push({
            rowIndex: tableData.rows.indexOf(targetRow),
            columnId: operation.columnName,
          })
        }
      }
    }
    return editedCells
  }, [operations, tableData])

  const hasSavedTableChanges = useRef(false)
  const queryClient = useQueryClient()
  const { mutate: saveTableChanges } = useMutation({
    mutationKey: ['saveTableChanges'],
    mutationFn: async () =>
      vscode.messenger.sendRequest(saveTableChangesRequest, HOST_EXTENSION, {
        operations: reduceOperations(operations),
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
            dbColumns={tableData.tableMetadata.columns}
            dbRows={updatedRows}
            rowHeight={config.tableRowHeight}
            fontSize={config.fontSize}
            editedCells={editedCells}
            onCellEdit={handleCellEdit}
          />
          <TableFooter
            totalCount={tableData.tableMetadata.totalRows}
            limit={limit}
            offset={offset}
            page={offset / limit + 1}
            onPageChange={handlePageChange}
            leftItems={
              <VSCodeButton
                appearance="icon"
                aria-label="Save changes"
                disabled={operations.length === 0}
                onClick={handleSaveChanges}
              >
                <div className={`${css({ px: 3 })} codicon codicon-save`} />
              </VSCodeButton>
            }
          />
        </>
      )}
    </main>
  )
}

export default Table
