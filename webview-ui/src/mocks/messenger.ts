import type {
  getConfigRequest,
  getTableDataRequest,
  getTableInitialDataRequest,
} from '@shared-types/message'
import type { MessageParticipant, RequestType } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'

type ResponseType<T> = T extends RequestType<unknown, infer R> ? R : never

export type MockResponses = {
  getTableData: ResponseType<typeof getTableDataRequest>
  getConfig: ResponseType<typeof getConfigRequest>
  getTableInitialData: ResponseType<typeof getTableInitialDataRequest>
}

const defaultMockResponses: MockResponses = {
  getTableData: {
    rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    tableMetadata: {
      columns: [
        {
          name: 'id',
          dataType: 'bigint',
          default: null,
          isNullable: false,
          isBinaryType: false,
          isTextType: false,
          comment: '',
          extra: '',
        },
      ],
      columnKeys: [],
      name: 'test',
      primaryKeyColumns: ['id'],
      totalRows: 5,
    },
  },
  getConfig: {
    fontSize: 14,
  },
  getTableInitialData: {
    shouldRefresh: false,
  },
}

export const mockSendRequest = (responses: Partial<MockResponses>) => {
  const mockResponses = { ...defaultMockResponses, ...responses }

  return <P, R>(
    type: RequestType<P, R>,
    _receiver: MessageParticipant,
    _params?: P,
  ): Promise<R> => {
    const response = mockResponses[type.method as keyof MockResponses]
    if (!response) {
      return Promise.reject(new Error('Unknown request type'))
    }
    return Promise.resolve(response as R)
  }
}

export const mockMessenger = () => {
  const messenger = new Messenger()
}
