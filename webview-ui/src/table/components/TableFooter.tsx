import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import type { FC } from 'react'
import { css } from 'styled-system/css'
import { hstack } from 'styled-system/patterns/hstack'

const TableFooter: FC<{
  isLoading: boolean
  totalCount: number
  limit: number
  offset: number
  page: number
  onPageChange: (page: number) => void
  isSaveDisabled: boolean
  isDeleteDisabled: boolean
  onSave: () => void
  onDelete: () => void
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
  isDeleteDisabled,
  onSave,
  onDelete,
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
        <VSCodeButton
          appearance="icon"
          aria-label="Save changes"
          disabled={isSaveDisabled}
          onClick={onSave}
        >
          <div className={`${css({ px: '3' })} codicon codicon-save`} />
        </VSCodeButton>
        <VSCodeButton
          appearance="icon"
          aria-label="Delete row"
          disabled={isDeleteDisabled}
          onClick={onDelete}
        >
          <div className={`${css({ px: '3' })} codicon codicon-trash`} />
        </VSCodeButton>
        <VSCodeButton
          appearance="icon"
          aria-label="Insert row"
          onClick={onInsert}
        >
          <div className={`${css({ px: '3' })} codicon codicon-add`} />
        </VSCodeButton>
        <VSCodeButton
          appearance="icon"
          aria-label="Refresh"
          onClick={onRefresh}
        >
          <div className={`${css({ px: '3' })} codicon codicon-refresh`} />
        </VSCodeButton>
      </div>
      <div>{isLoading ? 'Loading...' : rowCountText}</div>
      <div className={hstack({ gap: '4' })}>
        <VSCodeButton
          appearance="icon"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <div className={`${css({ px: '3' })} codicon codicon-chevron-left`} />
        </VSCodeButton>
        <span>{page}</span>
        <VSCodeButton
          appearance="icon"
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <div
            className={`${css({ px: '3' })} codicon codicon-chevron-right`}
          />
        </VSCodeButton>
      </div>
    </div>
  )
}

export default TableFooter
