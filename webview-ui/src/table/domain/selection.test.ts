import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { describe, expect, test } from 'vitest'
import {
  createRowRangeSelection,
  createSelectedCell,
  resolveNextSelectedCell,
  toggleRowIndexSelection,
} from './selection'

const columns: ColumnMetadata[] = [
  {
    name: 'id',
    dataType: 'bigint',
    default: null,
    isNullable: false,
    isBinaryType: false,
    isTextType: false,
    comment: '',
    extra: '',
  },
  {
    name: 'name',
    dataType: 'varchar',
    default: null,
    isNullable: true,
    isBinaryType: false,
    isTextType: true,
    comment: '',
    extra: '',
  },
]

describe('table domain: selection', () => {
  test('複数選択の行インデックスを計算できる', () => {
    expect(createRowRangeSelection(2, 5)).toEqual([2, 3, 4, 5])
    expect(toggleRowIndexSelection([1, 2], 2)).toEqual([1])
    expect(toggleRowIndexSelection([1, 2], 3)).toEqual([1, 2, 3])
  })

  test('矢印移動先のセルを計算できる', () => {
    const rows = [
      { type: 'existing', row: { id: 1, name: 'Alice' } },
      { type: 'inserted', uuid: 'row-1', row: { id: 2, name: 'Bob' } },
    ] as const

    const nextCell = resolveNextSelectedCell({
      selectedCell: {
        type: 'existing',
        rowIndex: 0,
        columnId: 'id',
        columnIndex: 0,
      },
      rows: [...rows],
      columns,
      direction: 'down',
    })

    expect(nextCell).toEqual({
      type: 'inserted',
      rowIndex: 1,
      rowUUID: 'row-1',
      columnId: 'id',
      columnIndex: 0,
    })

    expect(
      resolveNextSelectedCell({
        selectedCell: {
          type: 'existing',
          rowIndex: 0,
          columnId: 'id',
          columnIndex: 0,
        },
        rows: [...rows],
        columns,
        direction: 'up',
      }),
    ).toBeUndefined()
  })

  test('行情報から選択セルを生成できる', () => {
    expect(
      createSelectedCell({
        row: { type: 'existing', row: { id: 1 } },
        rowIndex: 0,
        columnId: 'id',
        columnIndex: 0,
      }),
    ).toEqual({
      type: 'existing',
      rowIndex: 0,
      columnId: 'id',
      columnIndex: 0,
    })
  })
})
