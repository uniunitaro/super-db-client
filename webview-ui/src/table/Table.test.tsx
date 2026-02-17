import { type MockResponses, mockSendRequest } from '@/mocks/messenger'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { messenger } from '../utilities/messenger'
import Table from './Table'

vi.mock('../utilities/messenger', () => ({
  messenger: {
    sendRequest: vi.fn(),
    onRequest: vi.fn(),
    start: vi.fn(),
  },
}))

const mockedMessenger = vi.mocked(messenger)

const renderTable = () => {
  const queryClient = new QueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <Table />
    </QueryClientProvider>,
  )
}

const defaultColumn = {
  name: 'id',
  dataType: 'bigint',
  default: null,
  isNullable: false,
  isBinaryType: false,
  isTextType: false,
  comment: '',
  extra: '',
}

describe('Table', () => {
  test('条件を追加するとフィルター行が増える', async () => {
    mockedMessenger.sendRequest.mockImplementation(
      mockSendRequest({
        getTableData: {
          rows: [{ id: 100 }],
          tableMetadata: {
            columns: [{ ...defaultColumn, name: 'id' }],
            columnKeys: [],
            name: 'test',
            primaryKeyColumns: ['id'],
            totalRows: 1,
          },
        },
      }),
    )

    renderTable()

    await page.getByRole('button', { name: 'Add condition' }).click()

    await expect
      .poll(() => page.getByRole('button', { name: 'Remove' }).length)
      .toBe(2)
  })

  test('テーブルデータを表示できる', async () => {
    mockedMessenger.sendRequest.mockImplementation(
      mockSendRequest({
        getTableData: {
          rows: [{ id: 100 }],
          tableMetadata: {
            columns: [{ ...defaultColumn, name: 'id' }],
            columnKeys: [],
            name: 'test',
            primaryKeyColumns: ['id'],
            totalRows: 1,
          },
        },
      }),
    )

    renderTable()

    await expect.element(page.getByText('100')).toBeInTheDocument()
  })

  test('列のヘッダーをクリックするとソートが切り替わる', async () => {
    const mockGetTableData: MockResponses['getTableData'] = {
      rows: [
        { id: 100, name: 'test' },
        { id: 101, name: 'test2' },
      ],
      tableMetadata: {
        columns: [
          { ...defaultColumn, name: 'id' },
          { ...defaultColumn, name: 'name', dataType: 'varchar' },
        ],
        columnKeys: [],
        name: 'test',
        primaryKeyColumns: ['id'],
        totalRows: 2,
      },
    }

    const sortedGetTableData = {
      ...mockGetTableData,
      rows: [
        { id: 101, name: 'test2' },
        { id: 100, name: 'test' },
      ],
    }

    mockedMessenger.sendRequest.mockImplementation(
      mockSendRequest({
        getTableData: mockGetTableData,
      }),
    )

    renderTable()

    const rows = page.getByRole('row')
    await expect.element(rows.nth(1)).toHaveTextContent('100')

    mockedMessenger.sendRequest.mockImplementation(
      mockSendRequest({
        getTableData: sortedGetTableData,
      }),
    )

    await page.getByRole('button', { name: 'id' }).click()

    await expect.element(rows.nth(1)).toHaveTextContent('101')
    await expect.element(rows.nth(1)).toHaveTextContent('test2')
    await expect.element(rows.nth(2)).toHaveTextContent('100')
    await expect.element(rows.nth(2)).toHaveTextContent('test')
  })
})
