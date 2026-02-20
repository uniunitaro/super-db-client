import { getObjectKeys } from '@/utilities/getObjectKeys'
import type { Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { type FC, type RefObject, memo } from 'react'
import { css } from 'styled-system/css'
import type { Cell } from '../domain/operations'
import type { SelectedCell, TableRowWithType } from '../domain/selection'
import type { SetSelectedCell } from '../hooks/useSelectionHandler'
import type { TableCellRef } from './TableCell'
import TableCell from './TableCell'

const TableRow: FC<{
  row: Row<TableRowWithType>
  virtualRow: VirtualItem
  columnWidths: { [key: string]: number }
  isCellSelected: boolean
  cellRef: RefObject<TableCellRef | null>
  selectedCell: SelectedCell | undefined
  editedCells: Cell[]
  deletedRowIndexes: number[]
  isRowSelected: boolean
  isMultiSelected: boolean
  shouldShowInput: boolean
  isResizing: boolean
  onCellSelect: SetSelectedCell
  onCellEdit?: (newValue: string) => void
  onShouldShowInputChange: (shouldShowInput: boolean) => void
}> = memo(
  ({
    row,
    virtualRow,
    columnWidths,
    isCellSelected,
    cellRef,
    selectedCell,
    editedCells,
    deletedRowIndexes,
    isRowSelected,
    isMultiSelected,
    shouldShowInput,
    isResizing,
    onCellSelect,
    onCellEdit,
    onShouldShowInputChange,
  }) => {
    return (
      // biome-ignore lint/a11y/useFocusableInteractive: TODO
      <div
        key={row.id}
        // biome-ignore lint/a11y/useSemanticElements: ignore
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
          },
        })}
        style={{
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        }}
        data-parity={virtualRow.index % 2 === 0 ? 'odd' : 'even'}
        // セルが選択されていても行が選択されていない場合は行を選択状態にしない
        data-selected={isRowSelected || (isCellSelected && isRowSelected)}
      >
        {row.getVisibleCells().map((cell) => {
          const isSelectedCell =
            selectedCell?.rowIndex === row.index &&
            selectedCell.columnId === cell.column.id

          const cellWidth = columnWidths[cell.column.id]
          return (
            <TableCell
              key={cell.id}
              {...cell.getContext()}
              ref={isSelectedCell ? cellRef : undefined}
              selectedCell={selectedCell}
              editedCells={editedCells}
              deletedRowIndexes={deletedRowIndexes}
              shouldShowInput={shouldShowInput}
              isMultiSelected={isMultiSelected}
              cellWidth={cellWidth}
              isResizing={isResizing}
              onCellSelect={onCellSelect}
              onCellEdit={onCellEdit}
              onShouldShowInputChange={onShouldShowInputChange}
            />
          )
        })}
      </div>
    )
  },
  (prev, next) =>
    !prev.isResizing &&
    !next.isResizing &&
    getObjectKeys(prev).every((key) => Object.is(prev[key], next[key])),
)

export default TableRow
