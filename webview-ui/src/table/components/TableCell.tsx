import { getObjectKeys } from '@/utilities/getObjectKeys'
import { serializeVSCodeContext } from '@/utilities/vscodeContext'
import type { CellContext } from '@tanstack/react-table'
import {
  type FC,
  type RefObject,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react'
import { flushSync } from 'react-dom'
import { css } from 'styled-system/css'
import { EMPTY_TEXT, NULL_TEXT } from '../constants/constants'
import type { SetSelectedCell } from '../hooks/useSelectionHandler'
import type { Cell, SelectedCell, TableRowWithType } from '../types/table'

export type TableCellRef = {
  focusInput: () => void
  blurInput: () => void
  isInputFocused: () => boolean
  setInputValue: (value: string) => void
  focusSelectedCell: () => void
}

const TableCell: FC<
  CellContext<TableRowWithType, unknown> & {
    ref: RefObject<TableCellRef | null> | undefined
    selectedCell: SelectedCell | undefined
    editedCells: Cell[]
    deletedRowIndexes: number[]
    shouldShowInput: boolean
    isMultiSelected: boolean
    cellWidth: number
    isResizing: boolean
    onCellSelect: SetSelectedCell
    onCellEdit?: (newValue: string) => void
    onShouldShowInputChange: (shouldShowInput: boolean) => void
  }
> = memo(
  ({
    getValue,
    row: { index, original },
    column: { id, getIndex, columnDef },
    ref,
    selectedCell,
    editedCells,
    deletedRowIndexes,
    shouldShowInput,
    isMultiSelected,
    cellWidth,
    onCellSelect,
    onCellEdit,
    onShouldShowInputChange,
  }) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const selectedCellRef = useRef<HTMLDivElement>(null)

    const value = getValue()
    const isNull = value === null
    const isEmpty = value === ''

    const initialValue =
      value === null || value === undefined ? '' : String(value)

    // 改行が存在する場合は一行目の内容+「...」を表示
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

    useImperativeHandle(
      ref,
      () => ({
        focusInput: () => {
          inputRef.current?.focus({ preventScroll: true })
          inputRef.current?.scrollIntoView({ block: 'nearest' })
        },
        blurInput: () => {
          inputRef.current?.blur()
        },
        isInputFocused: () => inputRef.current === document.activeElement,
        setInputValue: (value: string) => {
          if (!inputRef.current) return

          inputRef.current.value = value
        },
        focusSelectedCell: () => {
          selectedCellRef.current?.focus({ preventScroll: true })
          selectedCellRef.current?.scrollIntoView({ block: 'nearest' })
        },
      }),
      [],
    )

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

    const mergedInputRef = useCallback((node: HTMLTextAreaElement | null) => {
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
    }, [])

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
          borderRightWidth: 'cellBorderWidth',
          borderRightStyle: 'solid',
          borderRightColor: 'var(--vscode-tree-tableColumnsBorder)',
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
        style={{ width: cellWidth }}
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
              w: 'full',
              h: 'full',
              px: 'tableRowPaddingX',
              py: 'tableRowPaddingY',
              rounded: '2px',
              backgroundColor: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              outline: '1px solid var(--vscode-focusBorder)',
              outlineOffset: '-1px',
              resize: 'none',
              whiteSpace: 'pre',
              _scrollbar: {
                display: 'none',
              },
              _focus: {
                outline: '1px solid var(--vscode-focusBorder) !important',
                outlineOffset: '-1px !important',
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
              w: 'full',
              h: 'full',
              px: 'tableRowPaddingX',
              py: 'tableRowPaddingY',
              rounded: '2px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              '&[data-selected=true]': {
                outline: '1px solid var(--vscode-focusBorder)',
                outlineOffset: '-1px',
                '&[data-changed=false]': {
                  bgColor: 'var(--vscode-list-activeSelectionBackground)',
                  color: 'var(--vscode-list-activeSelectionForeground)',
                },
              },
            })}
            data-selected={isSelected}
            data-changed={isEdited || isDeleted || isInserted}
          >
            {isNull || isEmpty ? (
              <span
                className={css({
                  color: nullAndEmptyColor,
                })}
              >
                {isNull ? NULL_TEXT : EMPTY_TEXT}
              </span>
            ) : (
              <span>{displayValue}</span>
            )}
          </div>
        )}
      </div>
    )
  },
  (prev, next) =>
    prev.isResizing && next.isResizing
      ? prev.cellWidth === next.cellWidth
      : getObjectKeys(prev).every((key) => Object.is(prev[key], next[key])),
)

export default TableCell
