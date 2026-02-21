import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { describe, expect, test } from 'vitest'
import {
  findTableMatches,
  getDisplayCellText,
  getFindMatchCountText,
  getFindMatchRanges,
  getWrappedFindMatchIndex,
} from './find'

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

describe('table domain: find', () => {
  test('表示用テキストを整形できる', () => {
    expect(getDisplayCellText(undefined)).toBe('')
    expect(getDisplayCellText(null)).toBe('NULL')
    expect(getDisplayCellText('')).toBe('EMPTY')
    expect(getDisplayCellText('foo\nbar')).toBe('foo...')
  })

  test('検索一致セルを抽出できる', () => {
    const matches = findTableMatches({
      findQuery: 'ali',
      rows: [
        { type: 'existing', row: { id: 1, name: 'Alice' } },
        { type: 'existing', row: { id: 2, name: 'Bob' } },
      ],
      columns,
    })

    expect(matches).toEqual([
      {
        rowIndex: 0,
        columnId: 'name',
        columnIndex: 1,
      },
    ])
  })

  test('NULLとEMPTYは検索対象に含めない', () => {
    const matches = findTableMatches({
      findQuery: 'null',
      rows: [
        { type: 'existing', row: { id: 1, name: null } },
        { type: 'existing', row: { id: 2, name: '' } },
      ],
      columns,
    })

    expect(matches).toEqual([])
  })

  test('表示文字列内の一致レンジを抽出できる', () => {
    expect(
      getFindMatchRanges({
        text: 'foo bar foo',
        query: 'foo',
      }),
    ).toEqual([
      { start: 0, end: 3 },
      { start: 8, end: 11 },
    ])

    expect(
      getFindMatchRanges({
        text: 'FoO',
        query: 'foo',
      }),
    ).toEqual([{ start: 0, end: 3 }])

    expect(
      getFindMatchRanges({
        text: 'foo',
        query: '',
      }),
    ).toEqual([])
  })

  test('検索インデックスと件数表示を計算できる', () => {
    expect(
      getWrappedFindMatchIndex({
        currentIndex: 0,
        matchesCount: 3,
        direction: 'previous',
      }),
    ).toBe(2)
    expect(
      getWrappedFindMatchIndex({
        currentIndex: 2,
        matchesCount: 3,
        direction: 'next',
      }),
    ).toBe(0)

    expect(
      getFindMatchCountText({
        activeFindMatchIndex: 0,
        findMatchesCount: 0,
      }),
    ).toBe('0 / 0')
    expect(
      getFindMatchCountText({
        activeFindMatchIndex: 1,
        findMatchesCount: 3,
      }),
    ).toBe('2 / 3')
  })
})
