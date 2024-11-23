import { serializeVSCodeContext } from '@/utilities/vscodeContext'
import type { CellContext } from '@tanstack/react-table'
import { type FC, type RefObject, memo, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { css } from 'styled-system/css'
import type { SetSelectedCell } from '../hooks/useSelectionHandler'
import type { Cell, SelectedCell, TableRowWithType } from '../types/table'

const TableCell: FC<
  CellContext<TableRowWithType, unknown> & {
    selectedCellRef: RefObject<HTMLDivElement | null>
    inputRef: RefObject<HTMLTextAreaElement | null>
    selectedCell: SelectedCell | undefined
    editedCells: Cell[]
    deletedRowIndexes: number[]
    shouldShowInput: boolean
    isMultiSelected: boolean
    onCellSelect: SetSelectedCell
    onCellEdit?: (newValue: string) => void
    onShouldShowInputChange: (shouldShowInput: boolean) => void
  }
> = memo(
  ({
    getValue,
    row: { index, original },
    column: { id, getSize, getIndex, columnDef },
    selectedCellRef,
    inputRef,
    selectedCell,
    editedCells,
    deletedRowIndexes,
    shouldShowInput,
    isMultiSelected,
    onCellSelect,
    onCellEdit,
    onShouldShowInputChange,
  }) => {
    const value = getValue()
    const isNull = value === null
    const isEmpty = value === ''

    const initialValue =
      value === null || value === undefined ? '' : String(value)

    // 開業が存在する場合は一行目の内容+「...」を表示
    const displayValue = initialValue.includes('\n')
      ? `${initialValue.split('\n')[0]}...`
      : initialValue

    const isSelected =
      selectedCell?.rowIndex === index && selectedCell?.columnId === id
    const isEdited = editedCells.some(
      (cell) => cell.rowIndex === index && cell.columnId === id,
    )
    const isDeleted = deletedRowIndexes.includes(index)
    const isInserted = original.type === 'inserted'

    const canSetAsNull = !!columnDef.meta?.columnMetadata.isNullable && !isNull
    const canSetAsEmpty =
      !!columnDef.meta?.columnMetadata.isTextType && !isEmpty

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSelected) {
        flushSync(() => {
          onShouldShowInputChange(true)
        })

        inputRef.current?.focus()
      } else {
        e.currentTarget.focus()

        onCellSelect({
          cell:
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
          isShiftPressed: e.shiftKey,
          isCtrlPressed: e.ctrlKey,
        })
      }
    }

    const mergedInputRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        inputRef.current = node

        const listener = (e: InputEvent) => {
          if (e.inputType === 'insertLineBreak') {
            e.preventDefault()
          }
        }

        node?.addEventListener('beforeinput', listener)

        return () => {
          node?.removeEventListener('beforeinput', listener)
        }
      },
      [inputRef],
    )

    const nullAndEmptyColor =
      'color-mix(in srgb, transparent, currentColor 60%)'

    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: テーブル側でキーボード操作を実装しているため
      <div
        ref={isSelected ? selectedCellRef : null}
        role="gridcell"
        className={css({
          display: 'flex',
          alignItems: 'center',
          h: 'full',
          px: 'tableRowPaddingX',
          py: 'tableRowPaddingY',
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
          _focus: {
            outline: 'none',
          },
        })}
        style={{ width: getSize() }}
        tabIndex={isSelected ? 0 : -1}
        onClick={handleClick}
        // isSelectedのときにクリックしてしまうとinputの表示と競合してメニューがバグるので非選択のときだけセルを選択する
        // 複数選択時は右クリック時にセルを選択してしまうと選択が解除されてしまうのでセルを選択しない
        onContextMenu={(e) => !isSelected && !isMultiSelected && handleClick(e)}
        data-edited={isEdited}
        data-deleted={isDeleted}
        data-inserted={isInserted}
        data-vscode-context={serializeVSCodeContext({
          webviewSection: 'row',
          canSetAsNull,
          canSetAsEmpty,
          preventDefaultContextMenuItems: true,
        })}
      >
        {isSelected && shouldShowInput ? (
          <textarea
            ref={mergedInputRef}
            defaultValue={initialValue}
            // TODO: いまはplaceholderで表示しているが後々改修が必要そう
            placeholder={isNull ? 'NULL' : isEmpty ? 'EMPTY' : ''}
            className={css({
              w: 'calc(100% + 8px)',
              h: 'full',
              mx: '-4px',
              px: '4px',
              rounded: '2px',
              backgroundColor: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              outline: '1px solid var(--vscode-input-border, transparent)',
              resize: 'none',
              whiteSpace: 'pre',
              _scrollbar: {
                display: 'none',
              },
              _focus: {
                outline: '1px solid var(--vscode-focusBorder) !important',
              },
              _placeholder: {
                color: nullAndEmptyColor,
              },
            })}
            tabIndex={-1}
            onBlur={(e) => {
              onShouldShowInputChange(false)
              if (e.target.value !== initialValue) {
                onCellEdit?.(e.target.value)
              }
            }}
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <div
            className={css({
              w: 'calc(100% + 8px)',
              h: 'full',
              mx: '-4px',
              px: '4px',
              rounded: '2px',
              '&[data-selected=true]': {
                backgroundColor: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                outline: '1px solid var(--vscode-input-border, transparent)',
              },
            })}
            data-selected={isSelected}
          >
            <div
              className={css({
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              })}
            >
              {isNull || isEmpty ? (
                <span
                  className={css({
                    color: nullAndEmptyColor,
                  })}
                >
                  {isNull ? 'NULL' : 'EMPTY'}
                </span>
              ) : (
                <span>{displayValue}</span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  },
)

export default TableCell
