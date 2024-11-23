import type { Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { type FC, type RefObject, memo } from 'react'
import { css } from 'styled-system/css'
import type { SetSelectedCell } from '../hooks/useSelectionHandler'
import type { Cell, SelectedCell, TableRowWithType } from '../types/table'
import TableCell from './TableCell'

const TableRow: FC<{
  row: Row<TableRowWithType>
  virtualRow: VirtualItem
  isCellSelected: boolean
  selectedCellRef: RefObject<HTMLDivElement | null>
  inputRef: RefObject<HTMLTextAreaElement | null>
  selectedCell: SelectedCell | undefined
  editedCells: Cell[]
  deletedRowIndexes: number[]
  isRowSelected: boolean
  isMultiSelected: boolean
  shouldShowInput: boolean
  onCellSelect: SetSelectedCell
  onCellEdit?: (newValue: string) => void
  onShouldShowInputChange: (shouldShowInput: boolean) => void
}> = memo(
  ({
    row,
    virtualRow,
    isCellSelected,
    selectedCellRef,
    inputRef,
    selectedCell,
    editedCells,
    deletedRowIndexes,
    isRowSelected,
    isMultiSelected,
    shouldShowInput,
    onCellSelect,
    onCellEdit,
    onShouldShowInputChange,
  }) => {
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
            _focusWithin: {
              outlineWidth: '1px',
              outlineStyle: 'solid',
              outlineColor: 'var(--vscode-list-focusOutline)',
              outlineOffset: '-1px',
            },
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
        {row.getVisibleCells().map((cell) => (
          <div key={cell.id}>
            <TableCell
              {...cell.getContext()}
              selectedCellRef={selectedCellRef}
              inputRef={inputRef}
              selectedCell={selectedCell}
              editedCells={editedCells}
              deletedRowIndexes={deletedRowIndexes}
              shouldShowInput={shouldShowInput}
              isMultiSelected={isMultiSelected}
              onCellSelect={onCellSelect}
              onCellEdit={onCellEdit}
              onShouldShowInputChange={onShouldShowInputChange}
            />
          </div>
        ))}
      </div>
    )
  },
)

export default TableRow
