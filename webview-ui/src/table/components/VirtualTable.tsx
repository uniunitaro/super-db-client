import { useVSCodeState } from '@/hooks/useVSCodeState'
import { vscode } from '@/utilities/vscode'
import type { ColumnMetadata, TableRow } from '@shared-types/sharedTypes'
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { type FC, memo, useEffect, useMemo, useRef } from 'react'
import { css } from 'styled-system/css'
import { getColumnsWithWidth } from '../utils/getColumnsWithWidth'

const TABLE_ROW_PADDING_PX = 12
const ROW_MAX_WIDTH = 500

const VirtualTable: FC<{
  dbColumns: ColumnMetadata[]
  dbRows: TableRow[]
  rowHeight: number
  fontSize: number | undefined
  editedCells: { rowIndex: number; columnId: string }[]
  onCellEdit: ({
    rowIndex,
    columnId,
    newValue,
  }: { rowIndex: number; columnId: string; newValue: string }) => void
}> = memo(
  ({
    dbColumns,
    dbRows,
    rowHeight,
    fontSize: configFontSize,
    editedCells,
    onCellEdit,
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

    const columnHelper = createColumnHelper<TableRow>()

    const columns = useMemo(
      () =>
        columnsWithWidth.map((column) =>
          columnHelper.accessor(column.name, {
            size: column.width + TABLE_ROW_PADDING_PX * 2,
            maxSize: ROW_MAX_WIDTH,
          }),
        ),
      [columnHelper, columnsWithWidth],
    )

    const useTablePanelState = useVSCodeState('tablePanel')
    const [selectedCell, setSelectedCell] = useTablePanelState(
      'selectedCell',
      undefined,
    )

    const defaultColumn: Partial<ColumnDef<TableRow>> = useMemo(
      () => ({
        cell: ({ renderValue, row: { index }, column: { id }, table }) => {
          const initialValue = String(renderValue())

          const isSelected =
            selectedCell?.rowIndex === index && selectedCell?.columnId === id

          const isEdited = editedCells.some(
            (cell) => cell.rowIndex === index && cell.columnId === id,
          )

          return (
            <button
              type="button"
              className={css({
                display: 'flex',
                alignItems: 'center',
                h: '100%',
                w: '100%',
                px: `${TABLE_ROW_PADDING_PX}px`,
                '&[data-edited=true]': {
                  backgroundColor:
                    // すげえ、こんな機能あるんだな
                    'rgb(from var(--vscode-gitDecoration-modifiedResourceForeground) r g b / 30%)',
                },
              })}
              onClick={
                !isSelected
                  ? () => setSelectedCell({ rowIndex: index, columnId: id })
                  : undefined
              }
              data-edited={isEdited}
            >
              {isSelected ? (
                <input
                  defaultValue={initialValue}
                  className={css({
                    w: 'calc(100% + 8px)',
                    mx: '-4px',
                    px: '4px',
                    rounded: '2px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    outline:
                      '1px solid var(--vscode-input-border, transparent)',
                    _focus: {
                      outline: '1px solid var(--vscode-focusBorder) !important',
                    },
                  })}
                  onBlur={(e) => {
                    if (e.target.value === initialValue) return

                    onCellEdit({
                      rowIndex: index,
                      columnId: id,
                      newValue: e.target.value,
                    })
                    // @ts-expect-error clickが存在しないと怒られるが、clickがないときは何もしないので問題ないはず
                    e.relatedTarget?.click()
                  }}
                />
              ) : (
                <div
                  className={css({
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  })}
                >
                  {initialValue as string}
                </div>
              )}
            </button>
          )
        },
      }),
      [selectedCell, editedCells, onCellEdit, setSelectedCell],
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
      console.log(currentState)
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
          role="table"
          className={css({
            display: 'grid',
            fontFamily: 'var(--vscode-editor-font-family)',
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
                width: '100%',
                height: '100%',
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
                {headerGroup.headers.map((header) => {
                  return (
                    <div
                      role="columnheader"
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={css({
                        px: `${TABLE_ROW_PADDING_PX}px`,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                      })}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </div>
                  )
                })}
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
              {virtualizer.getVirtualItems().map((virtualRow, index) => {
                const row = rows[virtualRow.index]
                return (
                  <div
                    key={row.id}
                    role="row"
                    className={css({
                      display: 'flex',
                      pos: 'absolute',
                      whiteSpace: 'pre',
                      '&[data-parity=even]': {
                        bgColor: 'var(--vscode-keybindingTable-rowsBackground)',
                      },
                      '&[data-selected=true]': {
                        bgColor: 'var(--vscode-list-activeSelectionBackground)',
                        color: 'var(--vscode-list-activeSelectionForeground)',
                        outlineWidth: '1px',
                        outlineStyle: 'solid',
                        outlineColor: 'var(--vscode-list-focusOutline)',
                        outlineOffset: '-1px',
                      },
                    })}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    data-parity={virtualRow.index % 2 === 0 ? 'odd' : 'even'}
                    data-selected={selectedCell?.rowIndex === row.index}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <div
                          key={cell.id}
                          role="cell"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      )
                    })}
                  </div>
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
