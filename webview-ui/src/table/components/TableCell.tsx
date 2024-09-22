import type { CellContext } from '@tanstack/react-table'
import { type FC, type RefObject, memo } from 'react'
import { css } from 'styled-system/css'
import type {
  CellInfo,
  SelectedCellInfo,
  TableRowWithType,
} from '../types/table'

const TableCell: FC<
  CellContext<TableRowWithType, unknown> & {
    inputRef: RefObject<HTMLInputElement | null>
    selectedCell: SelectedCellInfo | undefined
    editedCells: CellInfo[]
    deletedRowIndexes: number[]
    onCellSelect: (cell: SelectedCellInfo) => void
    onCellEdit: (newValue: string) => void
  }
> = memo(
  ({
    renderValue,
    row: { index, original },
    column: { id, getSize, getIndex },
    inputRef,
    selectedCell,
    editedCells,
    deletedRowIndexes,
    onCellSelect,
    onCellEdit,
  }) => {
    const initialValue = String(renderValue())

    const isSelected =
      selectedCell?.rowIndex === index && selectedCell?.columnId === id
    const isEdited = editedCells.some(
      (cell) => cell.rowIndex === index && cell.columnId === id,
    )
    const isDeleted = deletedRowIndexes.includes(index)
    const isInserted = original.type === 'inserted'

    const handleClick = () => {
      if (!isSelected) {
        onCellSelect(
          original.type === 'existing'
            ? {
                type: 'existing',
                rowIndex: index,
                columnId: id,
                columnIndex: getIndex(),
              }
            : {
                type: 'inserted',
                rowIndex: index,
                rowUUID: original.uuid,
                columnId: id,
                columnIndex: getIndex(),
              },
        )
      }
    }

    return (
      <button
        type="button"
        className={css({
          display: 'flex',
          alignItems: 'center',
          h: 'full',
          px: 'tableRowPadding',
          '&[data-edited=true]': {
            backgroundColor:
              // すげえ、こんな機能あるんだな
              'rgb(from var(--vscode-gitDecoration-modifiedResourceForeground) r g b / 30%)',
          },
          '&[data-deleted=true]': {
            backgroundColor:
              'rgb(from var(--vscode-gitDecoration-deletedResourceForeground) r g b / 30%)',
          },
          '&[data-inserted=true]': {
            backgroundColor:
              'rgb(from var(--vscode-gitDecoration-addedResourceForeground) r g b / 30%)',
          },
        })}
        style={{ width: getSize() }}
        onClick={handleClick}
        onContextMenu={(e) => {
          handleClick()
        }}
        data-edited={isEdited}
        data-deleted={isDeleted}
        data-inserted={isInserted}
        data-vscode-context='{"webviewSection": "row", "preventDefaultContextMenuItems": true}'
      >
        {isSelected ? (
          <input
            ref={inputRef}
            defaultValue={initialValue}
            className={css({
              w: 'calc(100% + 8px)',
              mx: '-4px',
              px: '4px',
              rounded: '2px',
              backgroundColor: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              outline: '1px solid var(--vscode-input-border, transparent)',
              _focus: {
                outline: '1px solid var(--vscode-focusBorder) !important',
              },
            })}
            onBlur={(e) => {
              if (e.target.value === initialValue) return

              onCellEdit(e.target.value)
              // @ts-expect-error clickが存在しないと怒られるが、clickがないときは何もしないので問題ないはず
              e.relatedTarget?.click()
            }}
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <div
            className={css({
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            })}
          >
            {initialValue}
          </div>
        )}
      </button>
    )
  },
)

export default TableCell
