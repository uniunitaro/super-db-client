import type { ColumnMetadata } from '@shared-types/sharedTypes'
import { EMPTY_TEXT, NULL_TEXT } from '../constants/constants'
import type { TableRowWithType } from './selection'

export type FindMatch = {
  rowIndex: number
  columnId: string
  columnIndex: number
}

export type FindMatchRange = {
  start: number
  end: number
}

export const getDisplayCellText = (value: unknown): string => {
  if (value === undefined) {
    return ''
  }

  if (value === null) {
    return NULL_TEXT
  }

  if (value === '') {
    return EMPTY_TEXT
  }

  const text = String(value)

  return text.includes('\n') ? `${text.split('\n')[0]}...` : text
}

export const getFindMatchRanges = ({
  text,
  query,
}: {
  text: string
  query: string
}): FindMatchRange[] => {
  if (!text || !query) {
    return []
  }

  const normalizedText = text.toLocaleLowerCase()
  const normalizedQuery = query.toLocaleLowerCase()
  const ranges: FindMatchRange[] = []
  let fromIndex = 0

  while (fromIndex < normalizedText.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, fromIndex)
    if (matchIndex === -1) {
      break
    }

    ranges.push({
      start: matchIndex,
      end: matchIndex + normalizedQuery.length,
    })
    fromIndex = matchIndex + normalizedQuery.length
  }

  return ranges
}

export const findTableMatches = ({
  findQuery,
  rows,
  columns,
}: {
  findQuery: string
  rows: TableRowWithType[]
  columns: ColumnMetadata[]
}): FindMatch[] => {
  if (!findQuery) {
    return []
  }

  const normalizedQuery = findQuery.toLocaleLowerCase()

  return rows.flatMap((row, rowIndex) =>
    columns.flatMap((column, columnIndex) => {
      const value = row.row[column.name]

      // NULL/EMPTYは表示上のプレースホルダーであり、検索対象には含めない
      if (value === null || value === '') {
        return []
      }

      const displayCellText = getDisplayCellText(value)

      return displayCellText.toLocaleLowerCase().includes(normalizedQuery)
        ? [{ rowIndex, columnId: column.name, columnIndex }]
        : []
    }),
  )
}

export const getWrappedFindMatchIndex = ({
  currentIndex,
  matchesCount,
  direction,
}: {
  currentIndex: number
  matchesCount: number
  direction: 'next' | 'previous'
}) => {
  if (matchesCount === 0) {
    return 0
  }

  if (direction === 'next') {
    return (currentIndex + 1) % matchesCount
  }

  return (currentIndex - 1 + matchesCount) % matchesCount
}

export const getFindMatchCountText = ({
  activeFindMatchIndex,
  findMatchesCount,
}: {
  activeFindMatchIndex: number
  findMatchesCount: number
}) =>
  findMatchesCount === 0
    ? '0 / 0'
    : `${activeFindMatchIndex + 1} / ${findMatchesCount}`
