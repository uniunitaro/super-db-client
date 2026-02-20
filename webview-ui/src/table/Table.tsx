import { useVSCodeState } from '@/hooks/useVSCodeState'
import { assertNever } from '@/utilities/assertNever'
import { messenger } from '@/utilities/messenger'
import { serializeVSCodeContext } from '@/utilities/vscodeContext'
import {
  commandRequest,
  getConfigRequest,
  getTableDataRequest,
  getTableInitialDataRequest,
  saveTableChangesRequest,
} from '@shared-types/message'
import type { FilterCondition } from '@shared-types/sharedTypes'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { VscodeProgressBar } from '@vscode-elements/react-elements'
import { type FC, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { css } from 'styled-system/css'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import TableFilterBar from './components/TableFilterBar'
import TableFindWidget, {
  type TableFindWidgetRef,
} from './components/TableFindWidget'
import TableFooter from './components/TableFooter'
import VirtualizedTable from './components/VirtualizedTable'
import {
  type EditableFilterCondition,
  createEmptyEditableFilterCondition,
  toFilterConditions,
} from './domain/filter'
import { toOperations } from './domain/operations'
import { useOperations } from './hooks/useOperations'
import { useSelectionHandler } from './hooks/useSelectionHandler'
import { useShortcutKeys } from './hooks/useShortcutKeys'
import { useTableFind } from './hooks/useTableFind'

const Table: FC = () => {
  const useTablePanelState = useVSCodeState('tablePanel')

  const [limit, setLimit] = useTablePanelState('limit', 300)
  const [offset, setOffset] = useTablePanelState('offset', 0)
  const [sort, setSort] = useTablePanelState('sort', null)
  const [filters, setFilters] = useTablePanelState('filters', [
    createEmptyEditableFilterCondition(),
  ])
  const [appliedFilters, setAppliedFilters] = useTablePanelState(
    'appliedFilters',
    [] as FilterCondition[],
  )
  const handleApplyFilters = useCallback(
    (nextFilters?: EditableFilterCondition[]) => {
      setAppliedFilters(toFilterConditions(nextFilters ?? filters))
      setOffset(0)
    },
    [filters, setAppliedFilters, setOffset],
  )

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
    queryKey: ['getTableData', limit, offset, sort, appliedFilters],
    queryFn: () =>
      messenger.sendRequest(getTableDataRequest, HOST_EXTENSION, {
        limit,
        offset,
        order: sort?.order,
        orderBy: sort?.orderBy,
        filters: appliedFilters,
      }),
    placeholderData: keepPreviousData,
  })

  const {
    data: config,
    isPending: isConfigPending,
    error: configError,
  } = useQuery({
    queryKey: ['getConfig'],
    queryFn: () => messenger.sendRequest(getConfigRequest, HOST_EXTENSION),
  })

  const {
    data: initialData,
    isPending: isInitialDataPending,
    error: initialDataError,
  } = useQuery({
    queryKey: ['getTableInitialData'],
    queryFn: () =>
      messenger.sendRequest(getTableInitialDataRequest, HOST_EXTENSION),
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
    cellRef,
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

  const focusSelectedCell = useCallback(() => {
    cellRef.current?.focusSelectedCell()
  }, [cellRef])

  const findBarRef = useRef<TableFindWidgetRef>(null)

  const {
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
  } = useOperations({
    tableData,
    selectedCell,
    selectedRowIndexes,
    cellRef,
    shouldNotUpdateCellRef,
  })

  const {
    isFindOpen,
    findQuery,
    findTarget,
    findMatchesCount,
    findMatchCountText,
    handleOpenFind,
    handleCloseFind,
    handleMoveFindPrevious,
    handleMoveFindNext,
    handleFindInputKeyDown,
    handleFindQueryInput,
  } = useTableFind({
    findBarRef,
    tableData,
    rows: updatedRows,
    setSelectedCell,
    setShouldShowInput,
    focusSelectedCell,
  })

  const hasSavedTableChanges = useRef(false)
  const queryClient = useQueryClient()
  const { mutate: saveTableChanges } = useMutation({
    mutationKey: ['saveTableChanges'],
    mutationFn: async () =>
      messenger.sendRequest(saveTableChangesRequest, HOST_EXTENSION, {
        operations: toOperations(operations),
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
    messenger.onRequest(commandRequest, (command) => {
      switch (command) {
        case 'saveTableChanges':
          handleSaveChanges()
          break
        case 'refreshTable':
          refetchTableData()
          break
        case 'openFind':
          handleOpenFind()
          break
        case 'duplicateRow':
          handleRowDuplicate()
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
        default:
          assertNever(command)
      }
    })
    messenger.start()
  }, [
    handleSaveChanges,
    refetchTableData,
    handleOpenFind,
    handleRowDuplicate,
    handleRowDelete,
    handleCellEdit,
  ])

  const { tableHotkeysRef } = useShortcutKeys({
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
              <VscodeProgressBar />
            </div>,
            document.body,
          )}
        </>
      )}
      <div
        className={css({
          color: 'var(--vscode-foreground)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          h: '100vh',
          pos: 'relative',
        })}
      >
        <TableFilterBar
          columns={tableData?.tableMetadata.columns ?? []}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
        />

        <div className={css({ display: 'grid', minH: 0 })}>
          {tableData && config && (
            <VirtualizedTable
              tableRef={virtualizedTableTableRef}
              cellRef={cellRef}
              dbColumns={tableData.tableMetadata.columns}
              dbRows={updatedRows}
              fontSize={config.fontSize}
              selectedCell={selectedCell}
              editedCells={editedCells}
              deletedRowIndexes={deletedRowIndexes}
              selectedRowIndexes={selectedRowIndexes}
              sort={sort}
              shouldShowInput={shouldShowInput}
              findTarget={findTarget}
              hotkeysRef={tableHotkeysRef}
              onCellSelect={setSelectedCell}
              onCellEdit={handleCellEdit}
              onSortChange={handleSortChange}
              onShouldShowInputChange={setShouldShowInput}
            />
          )}
        </div>

        <TableFindWidget
          ref={findBarRef}
          isOpen={isFindOpen}
          findQuery={findQuery}
          findMatchCountText={findMatchCountText}
          hasMatch={findMatchesCount > 0}
          onFindInput={handleFindQueryInput}
          onFindInputKeyDown={handleFindInputKeyDown}
          onMoveFindPrevious={handleMoveFindPrevious}
          onMoveFindNext={handleMoveFindNext}
          onCloseFind={handleCloseFind}
        />

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
