import {
  VscodeButton,
  VscodeToolbarButton,
} from '@vscode-elements/react-elements'
import type { FC } from 'react'
import { css, cx } from 'styled-system/css'
import { hstack } from 'styled-system/patterns/hstack'

const TableFooter: FC<{
  isLoading: boolean
  totalCount: number
  limit: number
  offset: number
  page: number
  onPageChange: (page: number) => void
  isSaveDisabled: boolean
  onSave: () => void
  onInsert: () => void
  onRefresh: () => void
}> = ({
  isLoading,
  totalCount,
  limit,
  offset,
  page,
  onPageChange,
  isSaveDisabled,
  onSave,
  onInsert,
  onRefresh,
}) => {
  const rowCountText = totalCount
    ? `${offset + 1} - ${Math.min(offset + limit, totalCount)} / ${totalCount} (estimated) rows`
    : '0 rows'

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'space-between',
        px: 4,
        py: 1,
      })}
    >
      <div className={hstack({ gap: '2' })}>
        <VscodeToolbarButton
          aria-label="Save changes"
          disabled={isSaveDisabled}
          onClick={onSave}
        >
          <div className={cx(css({ px: '3' }), 'codicon codicon-save')} />
        </VscodeToolbarButton>
        <VscodeToolbarButton aria-label="Insert row" onClick={onInsert}>
          <div className={cx(css({ px: '3' }), 'codicon codicon-add')} />
        </VscodeToolbarButton>
        <VscodeToolbarButton aria-label="Refresh" onClick={onRefresh}>
          <div className={cx(css({ px: '3' }), 'codicon codicon-refresh')} />
        </VscodeToolbarButton>
      </div>
      <div>{isLoading ? 'Loading...' : rowCountText}</div>
      <div className={hstack({ gap: '4' })}>
        <VscodeToolbarButton
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <div
            className={cx(css({ px: '3' }), 'codicon codicon-chevron-left')}
          />
        </VscodeToolbarButton>
        <span>{page}</span>
        <VscodeToolbarButton
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <div
            className={cx(css({ px: '3' }), 'codicon codicon-chevron-right')}
          />
        </VscodeToolbarButton>
      </div>
    </div>
  )
}

export default TableFooter
