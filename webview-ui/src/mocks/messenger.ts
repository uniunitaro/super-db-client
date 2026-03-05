import {
  getConfigRequest,
  getTableDataRequest,
  getTableInitialDataRequest,
} from '@shared-types/message'
import type { MessageParticipant, RequestType } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'

type ResponseType<T> = T extends RequestType<unknown, infer R> ? R : never
type ParamsType<T> = T extends RequestType<infer P, unknown> ? P : never
type Awaitable<T> = T | Promise<T>

const mockRequests = {
  getTableData: getTableDataRequest,
  getConfig: getConfigRequest,
  getTableInitialData: getTableInitialDataRequest,
} as const

type MockRequestMap = typeof mockRequests

export type MockResponses = {
  [K in keyof MockRequestMap]: ResponseType<MockRequestMap[K]>
}

type MockResponseResolver<K extends keyof MockRequestMap> =
  | Awaitable<MockResponses[K]>
  | ((params: ParamsType<MockRequestMap[K]>) => Awaitable<MockResponses[K]>)

type MockResponseResolvers = {
  [K in keyof MockRequestMap]: MockResponseResolver<K>
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

const resolveMockResponse = <P, R>(
  response: Awaitable<R> | ((params: P) => Awaitable<R>),
  params: P,
): Awaitable<R> => (response instanceof Function ? response(params) : response)

const createRequestMethodKeyMap = <
  T extends Record<string, RequestType<unknown, unknown>>,
>(
  requests: T,
) =>
  Object.fromEntries(
    Object.entries(requests).map(([key, request]) => [request.method, key]),
  ) as Record<string, keyof T>

export const mockSendRequest = (responses: Partial<MockResponseResolvers>) => {
  const mockResponses: MockResponseResolvers = {
    ...defaultMockResponses,
    ...responses,
  }
  const requestMethodKeyMap = createRequestMethodKeyMap(mockRequests)

  return <P, R>(
    type: RequestType<P, R>,
    _receiver: MessageParticipant,
    params?: P,
  ): Promise<R> => {
    const requestKey = requestMethodKeyMap[type.method]
    if (!requestKey) {
      return Promise.reject(new Error('Unknown request type'))
    }

    return Promise.resolve(
      resolveMockResponse(
        mockResponses[requestKey] as MockResponseResolver<typeof requestKey>,
        params as ParamsType<MockRequestMap[typeof requestKey]>,
      ) as Awaitable<R>,
    )
  }
}

export const mockMessenger = () => {
  const messenger = new Messenger()
}
