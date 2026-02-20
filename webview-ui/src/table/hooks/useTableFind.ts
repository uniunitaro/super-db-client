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
import { flushSync } from 'react-dom'
import type { TableFindWidgetRef } from '../components/TableFindWidget'
import {
  type FindMatch,
  findTableMatches,
  getFindMatchCountText,
  getWrappedFindMatchIndex,
} from '../domain/find'
import { createSelectedCell } from '../domain/selection'
import type { TableRowWithType } from '../domain/selection'
import type { SetSelectedCell } from './useSelectionHandler'

type FindTarget = {
  rowIndex: number
  requestId: number
}

export const useTableFind = ({
  findBarRef,
  tableData,
  rows,
  setSelectedCell,
  setShouldShowInput,
  focusSelectedCell,
}: {
  findBarRef: RefObject<TableFindWidgetRef | null>
  tableData: GetTableDataRequestResponse | undefined
  rows: TableRowWithType[]
  setSelectedCell: SetSelectedCell
  setShouldShowInput: (shouldShowInput: boolean) => void
  focusSelectedCell: () => void
}) => {
  const [isFindOpen, setIsFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [activeFindMatchIndex, setActiveFindMatchIndex] = useState(0)
  const [findTarget, setFindTarget] = useState<FindTarget | undefined>(
    undefined,
  )

  const previousFindQueryRef = useRef(findQuery)

  const findMatches = useMemo<FindMatch[]>(() => {
    if (!tableData) {
      return []
    }

    return findTableMatches({
      findQuery,
      rows,
      columns: tableData.tableMetadata.columns,
    })
  }, [findQuery, rows, tableData])

  const focusFindInput = useCallback(() => {
    findBarRef.current?.focusInput()
  }, [findBarRef])

  const moveToFindMatch = useCallback(
    (match: FindMatch) => {
      const targetRow = rows[match.rowIndex]
      if (!targetRow) {
        return
      }

      setShouldShowInput(false)

      setSelectedCell({
        cell: createSelectedCell({
          row: targetRow,
          rowIndex: match.rowIndex,
          columnId: match.columnId,
          columnIndex: match.columnIndex,
        }),
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
    flushSync(() => {
      setIsFindOpen(true)
    })
    focusFindInput()

    const firstMatch = findMatches[0]
    if (firstMatch) {
      setActiveFindMatchIndex(0)
      moveToFindMatch(firstMatch)
    }
  }, [findMatches, focusFindInput, moveToFindMatch])

  const handleCloseFind = useCallback(() => {
    flushSync(() => {
      setIsFindOpen(false)
    })

    focusSelectedCell()
  }, [focusSelectedCell])

  const handleMoveFindPrevious = useCallback(() => {
    if (findMatches.length === 0) {
      return
    }

    const nextMatchIndex = getWrappedFindMatchIndex({
      currentIndex: activeFindMatchIndex,
      matchesCount: findMatches.length,
      direction: 'previous',
    })

    setActiveFindMatchIndex(nextMatchIndex)
    moveToFindMatch(findMatches[nextMatchIndex])
  }, [activeFindMatchIndex, findMatches, moveToFindMatch])

  const handleMoveFindNext = useCallback(() => {
    if (findMatches.length === 0) {
      return
    }

    const nextMatchIndex = getWrappedFindMatchIndex({
      currentIndex: activeFindMatchIndex,
      matchesCount: findMatches.length,
      direction: 'next',
    })

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
  const findMatchCountText = getFindMatchCountText({
    activeFindMatchIndex,
    findMatchesCount,
  })

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
