import type { Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { type FC, type RefObject, memo } from 'react'
import { css } from 'styled-system/css'
import type {
  CellInfo,
  SelectedCellInfo,
  TableRowWithType,
} from '../types/table'
import TableCell from './TableCell'

const TableRow: FC<{
  row: Row<TableRowWithType>
  virtualRow: VirtualItem
  isSelected: boolean
  selectedCellRef: RefObject<HTMLDivElement | null>
  inputRef: RefObject<HTMLInputElement | null>
  selectedCell: SelectedCellInfo | undefined
  editedCells: CellInfo[]
  deletedRowIndexes: number[]
  shouldShowInput: boolean
  onCellSelect: (cell: SelectedCellInfo) => void
  onCellEdit?: (newValue: string) => void
  onShouldShowInputChange: (shouldShowInput: boolean) => void
}> = memo(
  ({
    row,
    virtualRow,
    isSelected,
    selectedCellRef,
    inputRef,
    selectedCell,
    editedCells,
    deletedRowIndexes,
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
        data-selected={isSelected}
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
