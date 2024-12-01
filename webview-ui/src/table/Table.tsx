import LinearProgress from '@/components/LinearProgress'
import { useVSCodeState } from '@/hooks/useVSCodeState'
import { vscode } from '@/utilities/vscode'
import { serializeVSCodeContext } from '@/utilities/vscodeContext'
import {
  commandRequest,
  getConfigRequest,
  getInitialDataRequest,
  getTableDataRequest,
  saveTableChangesRequest,
} from '@shared-types/message'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { type FC, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { css } from 'styled-system/css'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import TableFooter from './components/TableFooter'
import VirtualTable from './components/VirtualTable'
import { useOperations } from './hooks/useOperations'
import { useSelectionHandler } from './hooks/useSelectionHandler'
import { useShortcutKeys } from './hooks/useShortcutKeys'
import { convertClientOperationToOperation } from './utils/convertClientOperationToOperations'

const Table: FC = () => {
  const useTablePanelState = useVSCodeState('tablePanel')

  const [limit, setLimit] = useTablePanelState('limit', 300)
  const [offset, setOffset] = useTablePanelState('offset', 0)
  const [sort, setSort] = useTablePanelState('sort', null)
  const handleSortChange = useCallback(
    (columnId: string) => {
      if (sort?.orderBy === columnId) {
        if (sort.order === 'desc') {
          setSort(null)
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

  const {
    data: config,
    isPending: isConfigPending,
    error: configError,
  } = useQuery({
    queryKey: ['getConfig'],
    queryFn: () =>
      vscode.messenger.sendRequest(getConfigRequest, HOST_EXTENSION),
  })

  const {
    data: initialData,
    isPending: isInitialDataPending,
    error: initialDataError,
  } = useQuery({
    queryKey: ['getInitialData'],
    queryFn: () =>
      vscode.messenger.sendRequest(getInitialDataRequest, HOST_EXTENSION),
    // 毎回取得したいのでキャッシュしない
    staleTime: 0,
    gcTime: 0,
  })
  useEffect(() => {
    if (initialData?.shouldRefresh) {
      refetchTableData()
    }
  }, [initialData, refetchTableData])

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1) {
        return
      }
      setOffset((page - 1) * limit)
    },
    [limit, setOffset],
  )

  const {
    selectedCell,
    selectedCellRef,
    selectedCellInputRef,
    shouldNotUpdateCellRef,
    shouldShowInput,
    selectedRowIndexes,
    setSelectedCell,
    moveSelectedCell,
    toggleSelectedCellInputFocus,
    exitSelectedCellInput,
    blurSelectedCellInput,
    setShouldShowInput,
    resetMultiSelection,
  } = useSelectionHandler()

  const {
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
  } = useOperations({
    tableData,
    selectedCell,
    selectedRowIndexes,
    selectedCellInputRef,
    shouldNotUpdateCellRef,
  })

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
  useEffect(() => {
    if (!tableData) return

    if (hasSavedTableChanges.current) {
      resetOperations()
      hasSavedTableChanges.current = false
    }
  }, [tableData, resetOperations])

  const handleSaveChanges = useCallback(() => {
    blurSelectedCellInput()
    saveTableChanges()
  }, [blurSelectedCellInput, saveTableChanges])

  useEffect(() => {
    if (!tableData) return

    if (hasSavedTableChanges.current) {
      resetOperations()
      hasSavedTableChanges.current = false
    }
  }, [tableData, resetOperations])

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
        case 'setAsNull':
          handleCellEdit(null)
          break
        case 'setAsEmpty':
          handleCellEdit('')
          break
      }
    })
    vscode.messenger.start()
  }, [handleSaveChanges, refetchTableData, handleRowDelete, handleCellEdit])

  useShortcutKeys({
    deleteRow: handleRowDelete,
    moveSelectedCell: useCallback(
      ({ direction, isShiftPressed }) =>
        moveSelectedCell({
          rows: updatedRows,
          columns: tableData?.tableMetadata.columns ?? [],
          direction,
          isShiftPressed,
        }),
      [moveSelectedCell, updatedRows, tableData],
    ),
    toggleSelectedCellInputFocus,
    exitSelectedCellInput,
    resetMultiSelection,
    undoOperation,
    redoOperation,
  })

  return (
    <main
      data-vscode-context={serializeVSCodeContext({
        preventDefaultContextMenuItems: true,
      })}
    >
      {(isFetchingTableData ||
        isConfigPending ||
        isRefetchingTableData ||
        isInitialDataPending) && (
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
        <div className={css({ display: 'grid' })}>
          {tableData && config && (
            <VirtualTable
              tableRef={virtualTableTableRef}
              selectedCellRef={selectedCellRef}
              selectedCellInputRef={selectedCellInputRef}
              dbColumns={tableData.tableMetadata.columns}
              dbRows={updatedRows}
              fontSize={config.fontSize}
              selectedCell={selectedCell}
              editedCells={editedCells}
              deletedRowIndexes={deletedRowIndexes}
              selectedRowIndexes={selectedRowIndexes}
              sort={sort}
              shouldShowInput={shouldShowInput}
              onCellSelect={setSelectedCell}
              onCellEdit={handleCellEdit}
              onSortChange={handleSortChange}
              onShouldShowInputChange={setShouldShowInput}
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
