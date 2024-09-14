import { type Row, flexRender } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { type FC, memo } from 'react'
import { css } from 'styled-system/css'
import type { TableRowWithType } from '../types/table'

/**
 * @param unUsedSelectedColumnId メモ化していても別の列を選択したときに再描画されるようにするために選択中の列のIDを渡す
 */
const TableRow: FC<{
  row: Row<TableRowWithType>
  virtualRow: VirtualItem
  isSelected: boolean
  unusedSelectedColumnId: string | undefined
}> = memo(({ row, virtualRow, isSelected }) => {
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
      data-selected={isSelected}
    >
      {row.getVisibleCells().map((cell) => (
        <div key={cell.id} role="cell">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
      ))}
    </div>
  )
})

export default TableRow
