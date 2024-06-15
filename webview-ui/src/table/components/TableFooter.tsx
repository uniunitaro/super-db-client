import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import type { FC } from 'react'
import { css } from 'styled-system/css'
import { hstack } from 'styled-system/patterns/hstack'

const TableFooter: FC<{
  totalCount: number
  limit: number
  offset: number
  page: number
  onPageChange: (page: number) => void
}> = ({ totalCount, limit, offset, page, onPageChange }) => {
  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'space-between',
        px: 4,
        py: 1,
      })}
    >
      <div />
      <div>
        {totalCount
          ? `${offset + 1} - ${Math.min(
              offset + limit,
              totalCount,
            )} / ${totalCount} (estimated) rows`
          : '0 rows'}
      </div>
      <div className={hstack({ gap: 4 })}>
        <VSCodeButton
          appearance="icon"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <div className={`${css({ px: 3 })} codicon codicon-chevron-left`} />
        </VSCodeButton>
        <span>{page}</span>
        <VSCodeButton
          appearance="icon"
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <div className={`${css({ px: 3 })} codicon codicon-chevron-right`} />
        </VSCodeButton>
      </div>
    </div>
  )
}

export default TableFooter
