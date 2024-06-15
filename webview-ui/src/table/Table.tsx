import { vscode } from '@/utilities/vscode'
import { getConfigRequest, getTableDataRequest } from '@shared-types/message'
import { useQuery } from '@tanstack/react-query'
import { type FC, useState } from 'react'
import { css } from 'styled-system/css'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import TableFooter from './components/TableFooter'
import VirtualTable from './components/VirtualTable'

const Table: FC = () => {
  const [limit, setLimit] = useState(300)
  const [offset, setOffset] = useState(0)

  const {
    data: tableData,
    isPending: tableDataIsPending,
    error: tableDataError,
  } = useQuery({
    queryKey: ['getTableData', limit, offset],
    queryFn: () =>
      vscode.messenger.sendRequest(getTableDataRequest, HOST_EXTENSION, {
        limit,
        offset,
      }),
  })

  const {
    data: config,
    isPending: configIsPending,
    error: configError,
  } = useQuery({
    queryKey: ['getConfig'],
    queryFn: () =>
      vscode.messenger.sendRequest(getConfigRequest, HOST_EXTENSION),
  })

  const handlePageChange = (page: number) => {
    if (page < 1) {
      return
    }
    setOffset((page - 1) * limit)
  }

  return (
    <main
      className={css({
        color: 'var(--vscode-foreground)',
        display: 'grid',
        gridTemplateColumns: '1',
        gridTemplateRows: '1',
        h: '100vh',
      })}
    >
      {tableData && config && (
        <>
          <VirtualTable
            dbColumns={tableData.tableMetadata.columns}
            dbRows={tableData.rows}
            rowHeight={config.tableRowHeight}
            fontSize={config.fontSize}
          />
          <TableFooter
            totalCount={tableData.tableMetadata.totalRows}
            limit={limit}
            offset={offset}
            page={offset / limit + 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </main>
  )
}

export default Table
