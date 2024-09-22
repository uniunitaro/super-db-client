import LinearProgress from '@/components/LinearProgress'
import { useVSCodeState } from '@/hooks/useVSCodeState'
import { vscode } from '@/utilities/vscode'
import {
  commandRequest,
  getConfigRequest,
  getTableDataRequest,
  saveTableChangesRequest,
} from '@shared-types/message'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { type FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { css } from 'styled-system/css'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import TableFooter from './components/TableFooter'
import VirtualTable from './components/VirtualTable'
import { useSelectionHandler } from './hooks/useSelectionHandler'
import { useShortcutKeys } from './hooks/useShortcutKeys'
import type { CellInfo, ClientOperation, TableRowWithType } from './types/table'
import { convertClientOperationToOperation } from './utils/convertClientOperationToOperations'

const Table: FC = () => {
  const useTablePanelState = useVSCodeState('tablePanel')

  const [limit, setLimit] = useTablePanelState('limit', 300)
  const [offset, setOffset] = useTablePanelState('offset', 0)
  const [sort, setSort] = useTablePanelState('sort', undefined)
  const handleSortChange = useCallback(
    (columnId: string) => {
      if (sort?.orderBy === columnId) {
        if (sort.order === 'desc') {
          setSort(undefined)
          return
        }

        setSort({
          orderBy: columnId,
          order: 'desc',
        })
      } else {
        setSort({
          orderBy: columnId,
          order: 'asc',
        })
      }
    },
    [setSort, sort],
  )

  const {
    data: tableData,
    // placeholderDataが使われているときもロードインジケータを表示したいためisPendingではなくisFetchingを使う
    isFetching: isFetchingTableData,
    isRefetching: isRefetchingTableData,
    error: tableDataError,
    refetch: refetchTableData,
  } = useQuery({
    queryKey: ['getTableData', limit, offset, sort],
    queryFn: () =>
      vscode.messenger.sendRequest(getTableDataRequest, HOST_EXTENSION, {
        limit,
        offset,
        order: sort?.order,
        orderBy: sort?.orderBy,
      }),
    placeholderData: keepPreviousData,
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
    isPending: isConfigPending,
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

  const {
    selectedCell,
    selectedCellInputRef,
    shouldNotUpdateCellRef,
    setSelectedCell,
    moveSelectedCell,
    toggleSelectedCellInputFocus,
    exitSelectedCellInput,
    blurSelectedCellInput,
  } = useSelectionHandler({
    rows: updatedRows,
    columns: tableData?.tableMetadata.columns ?? [],
  })

  const handleCellEdit = useCallback(
    (newValue: string) => {
      if (!tableData || !selectedCell) return

      if (shouldNotUpdateCellRef.current) {
        // ESCキーなどでセルの編集をキャンセルした場合
        shouldNotUpdateCellRef.current = false

        const oldValue =
          tableData.rows[selectedCell.rowIndex][selectedCell.columnId]

        if (selectedCellInputRef.current) {
          // セルの編集をキャンセルした場合、元の値に戻す
          // FIXME: useImperativeHandleを使って隠蔽する
          selectedCellInputRef.current.value = String(oldValue)
        }

        return
      }

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
    [
      tableData,
      operations,
      selectedCell,
      setOperations,
      shouldNotUpdateCellRef,
      selectedCellInputRef,
    ],
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
  const handleSaveChanges = useCallback(() => {
    blurSelectedCellInput()
    saveTableChanges()
  }, [blurSelectedCellInput, saveTableChanges])

  useEffect(() => {
    vscode.messenger.onRequest(commandRequest, (command) => {
      switch (command) {
        case 'saveTableChanges':
          handleSaveChanges()
          break
        case 'refreshTable':
          refetchTableData()
          break
        case 'deleteRows':
          handleRowDelete()
          break
      }
    })
    vscode.messenger.start()
  }, [handleSaveChanges, refetchTableData, handleRowDelete])

  useShortcutKeys({
    deleteRow: handleRowDelete,
    moveSelectedCell,
    toggleSelectedCellInputFocus,
    exitSelectedCellInput,
  })

  return (
    <main data-vscode-context='{"preventDefaultContextMenuItems": true}'>
      {(isFetchingTableData || isConfigPending || isRefetchingTableData) && (
        <>
          {/* createPortalをフラグメントで囲わないと型エラーが発生するバグがある */}
          {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/66841#issuecomment-1750651348 */}
          {createPortal(
            <div
              className={css({ pos: 'fixed', top: 0, w: 'full', zIndex: 1 })}
            >
              <LinearProgress />
            </div>,
            document.body,
          )}
        </>
      )}
      <div
        className={css({
          color: 'var(--vscode-foreground)',
          display: 'grid',
          gridTemplateColumns: '1',
          gridTemplateRows: '1',
          h: '100vh',
        })}
      >
        <div className={css({ display: 'flex' })}>
          {tableData && config && (
            <VirtualTable
              tableRef={virtualTableTableRef}
              selectedCellInputRef={selectedCellInputRef}
              dbColumns={tableData.tableMetadata.columns}
              dbRows={updatedRows}
              rowHeight={config.tableRowHeight}
              fontSize={config.fontSize}
              selectedCell={selectedCell}
              editedCells={editedCells}
              deletedRowIndexes={deletedRowIndexes}
              sort={sort}
              onCellSelect={setSelectedCell}
              onCellEdit={handleCellEdit}
              onSortChange={handleSortChange}
            />
          )}
        </div>
        <TableFooter
          isLoading={!tableData || !config}
          totalCount={tableData?.tableMetadata.totalRows ?? 0}
          limit={limit}
          offset={offset}
          page={offset / limit + 1}
          onPageChange={handlePageChange}
          isSaveDisabled={operations.length === 0}
          onSave={handleSaveChanges}
          onInsert={handleRowInsert}
          onRefresh={refetchTableData}
        />
      </div>
    </main>
  )
}

export default Table
