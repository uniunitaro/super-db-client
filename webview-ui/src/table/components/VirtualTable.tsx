import { vscode } from '@/utilities/vscode'
import type { ColumnMetadata } from '@shared-types/sharedTypes'
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  type FC,
  type RefObject,
  memo,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { css } from 'styled-system/css'
import {
  ROW_MAX_WIDTH,
  TABLE_LINE_HEIGHT,
  TABLE_ROW_PADDING_X_PX,
  TABLE_ROW_PADDING_Y_PX,
} from '../constants/constants'
import type { SetSelectedCell } from '../hooks/useSelectionHandler'
import type { Cell, SelectedCell, Sort, TableRowWithType } from '../types/table'
import { getColumnsWithWidth } from '../utils/getColumnsWithWidth'
import TableRow from './TableRow'

const VirtualTable: FC<{
  tableRef: RefObject<HTMLDivElement | null>
  selectedCellRef: RefObject<HTMLDivElement | null>
  selectedCellInputRef: RefObject<HTMLInputElement | null>
  dbColumns: ColumnMetadata[]
  dbRows: TableRowWithType[]
  fontSize: number | undefined
  selectedCell: SelectedCell | undefined
  editedCells: Cell[]
  deletedRowIndexes: number[]
  selectedRowIndexes: number[]
  sort: Sort
  shouldShowInput: boolean
  onCellSelect: SetSelectedCell
  onCellEdit: (newValue: string) => void
  onSortChange: (columnId: string) => void
  onShouldShowInputChange: (shouldShowInput: boolean) => void
}> = memo(
  ({
    tableRef,
    selectedCellRef,
    selectedCellInputRef,
    dbColumns,
    dbRows,
    fontSize: configFontSize,
    selectedCell,
    editedCells,
    deletedRowIndexes,
    selectedRowIndexes,
    sort,
    shouldShowInput,
    onCellSelect,
    onCellEdit,
    onSortChange,
    onShouldShowInputChange,
  }) => {
    const fontFamily = useMemo(
      () =>
        getComputedStyle(document.body).getPropertyValue(
          '--vscode-editor-font-family',
        ),
      [],
    )
    const fontSize = useMemo(
      () =>
        configFontSize ??
        Number.parseFloat(
          getComputedStyle(document.body).getPropertyValue(
            '--vscode-editor-font-size',
          ),
        ),
      [configFontSize],
    )
    const rowHeight = fontSize * TABLE_LINE_HEIGHT + TABLE_ROW_PADDING_Y_PX * 2
    const columnsWithWidth = useMemo(
      () =>
        getColumnsWithWidth({
          rows: dbRows,
          columns: dbColumns,
          fontFamily,
          fontSize,
        }),
      [dbColumns, dbRows, fontFamily, fontSize],
    )
    const columnHelper = createColumnHelper<TableRowWithType>()

    const columns = useMemo(
      () =>
        columnsWithWidth.map((column) =>
          columnHelper.accessor(`row.${column.name}`, {
            size: column.width + TABLE_ROW_PADDING_X_PX * 2,
            maxSize: ROW_MAX_WIDTH,
            // header: column.name,
            id: column.name,
            meta: { columnMetadata: column },
          }),
        ),
      [columnHelper, columnsWithWidth],
    )

    const defaultColumn: Partial<ColumnDef<TableRowWithType>> = useMemo(
      () => ({
        header: ({ header: { getSize, column } }) => {
          const isSortedAsc =
            sort?.orderBy === column.id && sort.order === 'asc'
          const isSortedDesc =
            sort?.orderBy === column.id && sort.order === 'desc'

          return (
            <button
              type="button"
              style={{ width: getSize() }}
              className={css({
                h: 'full',
                px: 'tableRowPaddingX',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
              })}
              onClick={() => onSortChange(column.id)}
            >
              <span>{String(column.id)}</span>

              {(isSortedAsc || isSortedDesc) && (
                <div
                  aria-label={
                    isSortedAsc ? 'sorted ascending' : 'sorted descending'
                  }
                  className={`${css({ pl: '1', fontSize: '12px!' })} codicon ${isSortedAsc ? 'codicon-arrow-up' : 'codicon-arrow-down'}`}
                />
              )}
            </button>
          )
        },
      }),
      [onSortChange, sort],
    )

    const table = useReactTable({
      data: dbRows,
      columns,
      defaultColumn,
      getCoreRowModel: getCoreRowModel(),
    })

    const { rows } = table.getRowModel()

    const parentRef = useRef<HTMLDivElement>(null)
    const virtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => rowHeight,
      overscan: 10,
    })

    useEffect(() => {
      if (!parentRef.current) return

      const currentState = vscode.getState()
      if (
        currentState?.tablePanel?.scrollX !== undefined &&
        currentState?.tablePanel?.scrollY !== undefined
      ) {
        parentRef.current.scrollLeft = currentState.tablePanel.scrollX
        parentRef.current.scrollTop = currentState.tablePanel.scrollY
      }

      const listener = () => {
        const currentState = vscode.getState()
        vscode.setState({
          ...currentState,
          tablePanel: {
            ...currentState?.tablePanel,
            scrollX: parentRef.current?.scrollLeft,
            scrollY: parentRef.current?.scrollTop,
          },
        })
      }

      const currentRef = parentRef.current
      currentRef.addEventListener('scroll', listener)

      return () => {
        currentRef.removeEventListener('scroll', listener)
      }
    }, [])

    return (
      <div
        ref={parentRef}
        className={css({
          overflow: 'auto',
          '&::-webkit-scrollbar-button': { display: 'none' },
        })}
      >
        <div
          ref={tableRef}
          role="grid"
          className={css({
            display: 'grid',
            fontFamily: 'var(--vscode-editor-font-family)',
            userSelect: 'none',
          })}
          style={{ fontSize: `${fontSize}px` }}
        >
          <div
            role="rowgroup"
            className={css({
              display: 'grid',
              pos: 'sticky',
              top: 0,
              zIndex: 1,
              _before: {
                // headerBackgroundが透過色のときに透けるのを防ぐ
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 0,
                width: 'full',
                height: 'full',
                bgColor: 'var(--vscode-editor-background)',
                zIndex: -1,
              },
            })}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <div
                role="row"
                key={headerGroup.id}
                className={css({
                  display: 'flex',
                  bgColor: 'var(--vscode-keybindingTable-headerBackground)',
                })}
                style={{ height: `${rowHeight}px` }}
              >
                {headerGroup.headers.map((header) => (
                  <div role="columnheader" key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div>
            <div
              role="rowgroup"
              className={css({
                display: 'grid',
                pos: 'relative',
                contain: 'strict',
                transform: 'translate3d(0, 0, 0)',
              })}
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index]
                const isCellSelected = selectedCell?.rowIndex === row.index
                const isRowSelected = selectedRowIndexes.some(
                  (rowIndex) => rowIndex === row.index,
                )
                const isMultiSelected = selectedRowIndexes.length > 1

                return (
                  // 再レンダリング抑制のためにisCellSelectedによってpropsを渡すか切り替えている
                  <TableRow
                    key={row.id}
                    row={row}
                    virtualRow={virtualRow}
                    isCellSelected={isCellSelected}
                    selectedCellRef={selectedCellRef}
                    inputRef={selectedCellInputRef}
                    selectedCell={isCellSelected ? selectedCell : undefined}
                    editedCells={editedCells}
                    deletedRowIndexes={deletedRowIndexes}
                    isRowSelected={isRowSelected}
                    isMultiSelected={isMultiSelected}
                    shouldShowInput={isCellSelected ? shouldShowInput : false}
                    onCellSelect={onCellSelect}
                    onCellEdit={isCellSelected ? onCellEdit : undefined}
                    onShouldShowInputChange={onShouldShowInputChange}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  },
)

export default VirtualTable
