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

const renderTable = ({ width }: { width?: number } = {}) => {
  const queryClient = new QueryClient()

  return render(
    <div style={width ? { width: `${width}px` } : undefined}>
      <QueryClientProvider client={queryClient}>
        <Table />
      </QueryClientProvider>
    </div>,
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

  test('画面幅600pxでは横スクロールが発生しない', async () => {
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

    const { container } = await renderTable({ width: 600 })

    await expect
      .poll(() => page.getByRole('button', { name: 'Add condition' }).length)
      .toBe(1)

    const viewport = container.firstElementChild

    expect(viewport).not.toBeNull()

    await expect
      .poll(() => {
        if (!viewport) {
          return false
        }

        return viewport.scrollWidth <= viewport.clientWidth
      })
      .toBe(true)
  })

  test('コマンドで検索バーを開き、件数表示と前後移動ができる', async () => {
    let commandHandler: ((command: string) => void) | undefined

    mockedMessenger.onRequest.mockImplementation((...args: unknown[]) => {
      const [request, handler] = args as [{ method?: string }, unknown]

      if (request.method === 'command') {
        commandHandler = handler as (command: string) => void
      }

      return messenger
    })

    mockedMessenger.sendRequest.mockImplementation(
      mockSendRequest({
        getTableData: {
          rows: [
            { id: 1, name: 'foo' },
            { id: 2, name: 'bar foo' },
            { id: 3, name: 'baz' },
          ],
          tableMetadata: {
            columns: [
              { ...defaultColumn, name: 'id' },
              { ...defaultColumn, name: 'name', dataType: 'varchar' },
            ],
            columnKeys: [],
            name: 'test',
            primaryKeyColumns: ['id'],
            totalRows: 3,
          },
        },
      }),
    )

    renderTable()

    await expect.element(page.getByText('bar foo')).toBeInTheDocument()
    await expect.poll(() => typeof commandHandler).toBe('function')

    commandHandler?.('openFind')

    const findInput = page.getByPlaceholder('Find')
    await expect.element(findInput).toBeInTheDocument()

    await findInput.fill('foo')
    await expect.element(page.getByText('1 / 2')).toBeInTheDocument()

    await page.getByLabelText('Next match').click()
    await expect.element(page.getByText('2 / 2')).toBeInTheDocument()

    await page.getByLabelText('Next match').click()
    await expect.element(page.getByText('1 / 2')).toBeInTheDocument()

    await page.getByLabelText('Previous match').click()
    await expect.element(page.getByText('2 / 2')).toBeInTheDocument()

    await page.getByLabelText('Close find').click()
    await expect.element(findInput).not.toBeInTheDocument()
  })

  test('コマンドで初回に検索バーを開いたときFind入力欄へフォーカスされる', async () => {
    let commandHandler: ((command: string) => void) | undefined

    mockedMessenger.onRequest.mockImplementation((...args: unknown[]) => {
      const [request, handler] = args as [{ method?: string }, unknown]

      if (request.method === 'command') {
        commandHandler = handler as (command: string) => void
      }

      return messenger
    })

    mockedMessenger.sendRequest.mockImplementation(
      mockSendRequest({
        getTableData: {
          rows: [
            { id: 1, name: 'foo' },
            { id: 2, name: 'bar foo' },
            { id: 3, name: 'baz' },
          ],
          tableMetadata: {
            columns: [
              { ...defaultColumn, name: 'id' },
              { ...defaultColumn, name: 'name', dataType: 'varchar' },
            ],
            columnKeys: [],
            name: 'test',
            primaryKeyColumns: ['id'],
            totalRows: 3,
          },
        },
      }),
    )

    renderTable()

    await expect.element(page.getByText('bar foo')).toBeInTheDocument()
    await expect.poll(() => typeof commandHandler).toBe('function')

    commandHandler?.('openFind')

    const findInput = page.getByPlaceholder('Find')
    await expect.element(findInput).toBeInTheDocument()
    const findInputElement = await findInput.element()

    await expect
      .poll(() => {
        const activeElement = document.activeElement
        if (!activeElement) {
          return false
        }

        return (
          activeElement === findInputElement ||
          activeElement.tagName.toLowerCase() === 'vscode-textfield'
        )
      })
      .toBe(true)
  })
})
