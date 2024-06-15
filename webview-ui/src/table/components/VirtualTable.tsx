import type { ColumnMetadata, TableRow } from '@shared-types/sharedTypes'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { type FC, useMemo, useRef } from 'react'
import { css } from 'styled-system/css'
import { getColumnsWithWidth } from '../utils/getColumnsWithWidth'

const TABLE_ROW_PADDING_PX = 12
const ROW_MAX_WIDTH = 500

const VirtualTable: FC<{
  dbColumns: ColumnMetadata[]
  dbRows: TableRow[]
  rowHeight: number
  fontSize: number | undefined
}> = ({ dbColumns, dbRows, rowHeight, fontSize: configFontSize }) => {
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

  const table = useReactTable({
    data: dbRows,
    columns,
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
                  })}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  data-parity={virtualRow.index % 2 === 0 ? 'odd' : 'even'}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <div
                        key={cell.id}
                        role="cell"
                        style={{ width: cell.column.getSize() }}
                        className={css({
                          px: `${TABLE_ROW_PADDING_PX}px`,
                          display: 'flex',
                          alignItems: 'center',
                        })}
                      >
                        <div
                          className={css({
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          })}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
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
}

export default VirtualTable
