import { readEventTargetValue } from '@/utilities/readEventTarget'
import type { GetTableDataRequestResponse } from '@shared-types/message'
import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { TableFindBarRef } from '../components/TableFindBar'
import { EMPTY_TEXT, NULL_TEXT } from '../constants/constants'
import type { TableRowWithType } from '../types/table'
import type { SetSelectedCell } from './useSelectionHandler'

type FindMatch = {
  rowIndex: number
  columnId: string
  columnIndex: number
}

type FindTarget = {
  rowIndex: number
  requestId: number
}

const getDisplayCellText = (value: unknown): string => {
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

export const useTableFind = ({
  findBarRef,
  tableData,
  rows,
  setSelectedCell,
  setShouldShowInput,
}: {
  findBarRef: RefObject<TableFindBarRef | null>
  tableData: GetTableDataRequestResponse | undefined
  rows: TableRowWithType[]
  setSelectedCell: SetSelectedCell
  setShouldShowInput: (shouldShowInput: boolean) => void
}) => {
  const [isFindOpen, setIsFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [activeFindMatchIndex, setActiveFindMatchIndex] = useState(0)
  const [findTarget, setFindTarget] = useState<FindTarget | undefined>(
    undefined,
  )

  const previousFindQueryRef = useRef(findQuery)

  const findMatches = useMemo<FindMatch[]>(() => {
    if (!findQuery || !tableData) {
      return []
    }

    const normalizedQuery = findQuery.toLocaleLowerCase()

    return rows.flatMap((row, rowIndex) =>
      tableData.tableMetadata.columns.flatMap((column, columnIndex) => {
        const displayCellText = getDisplayCellText(row.row[column.name])

        return displayCellText.toLocaleLowerCase().includes(normalizedQuery)
          ? [{ rowIndex, columnId: column.name, columnIndex }]
          : []
      }),
    )
  }, [findQuery, rows, tableData])

  const focusFindInput = useCallback(() => {
    requestAnimationFrame(() => {
      findBarRef.current?.focusInput()
    })
  }, [findBarRef])

  const moveToFindMatch = useCallback(
    (match: FindMatch) => {
      const targetRow = rows[match.rowIndex]
      if (!targetRow) {
        return
      }

      setShouldShowInput(false)

      setSelectedCell({
        cell:
          targetRow.type === 'existing'
            ? {
                type: 'existing',
                rowIndex: match.rowIndex,
                columnId: match.columnId,
                columnIndex: match.columnIndex,
              }
            : {
                type: 'inserted',
                rowIndex: match.rowIndex,
                rowUUID: targetRow.uuid,
                columnId: match.columnId,
                columnIndex: match.columnIndex,
              },
        isShiftPressed: false,
        isCtrlPressed: false,
      })

      setFindTarget((currentFindTarget) => ({
        rowIndex: match.rowIndex,
        requestId: (currentFindTarget?.requestId ?? 0) + 1,
      }))
    },
    [rows, setSelectedCell, setShouldShowInput],
  )

  const handleOpenFind = useCallback(() => {
    setIsFindOpen(true)
    focusFindInput()

    const firstMatch = findMatches[0]
    if (firstMatch) {
      setActiveFindMatchIndex(0)
      moveToFindMatch(firstMatch)
    }
  }, [findMatches, focusFindInput, moveToFindMatch])

  const handleCloseFind = useCallback(() => {
    setIsFindOpen(false)
  }, [])

  const handleMoveFindPrevious = useCallback(() => {
    if (findMatches.length === 0) {
      return
    }

    const nextMatchIndex =
      (activeFindMatchIndex - 1 + findMatches.length) % findMatches.length

    setActiveFindMatchIndex(nextMatchIndex)
    moveToFindMatch(findMatches[nextMatchIndex])
  }, [activeFindMatchIndex, findMatches, moveToFindMatch])

  const handleMoveFindNext = useCallback(() => {
    if (findMatches.length === 0) {
      return
    }

    const nextMatchIndex = (activeFindMatchIndex + 1) % findMatches.length

    setActiveFindMatchIndex(nextMatchIndex)
    moveToFindMatch(findMatches[nextMatchIndex])
  }, [activeFindMatchIndex, findMatches, moveToFindMatch])

  const handleFindInputKeyDown = useCallback(
    (event: KeyboardEvent<Element>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleCloseFind()
        return
      }

      if (event.key !== 'Enter') {
        return
      }

      event.preventDefault()

      if (event.shiftKey) {
        handleMoveFindPrevious()
        return
      }

      handleMoveFindNext()
    },
    [handleCloseFind, handleMoveFindNext, handleMoveFindPrevious],
  )

  const handleFindQueryInput = useCallback((event: Event) => {
    setFindQuery(readEventTargetValue(event))
  }, [])

  useEffect(() => {
    const previousFindQuery = previousFindQueryRef.current
    previousFindQueryRef.current = findQuery

    if (previousFindQuery === findQuery || !isFindOpen) {
      return
    }

    const firstMatch = findMatches[0]

    setActiveFindMatchIndex(0)

    if (firstMatch) {
      moveToFindMatch(firstMatch)
    }
  }, [findMatches, findQuery, isFindOpen, moveToFindMatch])

  useEffect(() => {
    if (!isFindOpen || findMatches.length === 0) {
      if (activeFindMatchIndex !== 0) {
        setActiveFindMatchIndex(0)
      }

      return
    }

    if (activeFindMatchIndex >= findMatches.length) {
      const nextMatchIndex = findMatches.length - 1

      setActiveFindMatchIndex(nextMatchIndex)
      moveToFindMatch(findMatches[nextMatchIndex])
    }
  }, [activeFindMatchIndex, findMatches, isFindOpen, moveToFindMatch])

  const findMatchesCount = findMatches.length
  const findMatchCountText =
    findMatchesCount === 0
      ? '0 / 0'
      : `${activeFindMatchIndex + 1} / ${findMatchesCount}`

  return {
    isFindOpen,
    findQuery,
    findTarget,
    findMatchesCount,
    findMatchCountText,
    handleOpenFind,
    handleCloseFind,
    handleMoveFindPrevious,
    handleMoveFindNext,
    handleFindInputKeyDown,
    handleFindQueryInput,
  }
}
