import { type MockResponses, mockSendRequest } from '@/mocks/messenger'
import { renderWithQueryClient } from '@/utilities/renderWithQueryClient'
import { screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { messenger } from '../utilities/messenger'
import Table from './Table'

vi.mock('../utilities/messenger', () => ({
  messenger: {
    sendRequest: vi.fn(),
    onRequest: vi.fn(),
    start: vi.fn(),
  },
}))

// TanStack VirtualはgetBoundingClientRectで高さが存在しない場合に列をレンダリングしないため、getBoundingClientRectをモックする
Element.prototype.getBoundingClientRect = vi.fn().mockImplementation(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
}))

const mockedMessenger = vi.mocked(messenger)

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

    renderWithQueryClient(<Table />)

    await waitFor(async () =>
      expect(await screen.findByText('100')).toBeInTheDocument(),
    )
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

    renderWithQueryClient(<Table />)

    const [header, firstRow, secondRow] = await screen.findAllByRole('row')
    await waitFor(() => expect(firstRow).toHaveTextContent('100'))

    mockedMessenger.sendRequest.mockImplementation(
      mockSendRequest({
        getTableData: sortedGetTableData,
      }),
    )

    const idHeader = within(header).getByRole('button', { name: 'id' })
    userEvent.click(idHeader)

    await waitFor(() => {
      expect(firstRow).toHaveTextContent('101')
      expect(firstRow).toHaveTextContent('test2')
      expect(secondRow).toHaveTextContent('100')
      expect(secondRow).toHaveTextContent('test')
    })
  })
})
