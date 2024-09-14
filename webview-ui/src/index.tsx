import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import ConnectionSetting from './connection-setting/ConnectionSetting'
import './index.css'
import Table from './table/Table'
import { createVSCodePersister } from './utilities/queryPersister'

// biome-ignore lint/style/noNonNullAssertion: It exists
const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)

const router = createMemoryRouter(
  [
    {
      path: '/', //　使わない
      element: <div />,
    },
    {
      path: '/connection-setting',
      element: <ConnectionSetting />,
    },
    {
      path: '/table',
      element: <Table />,
    },
  ],
  {
    // @ts-expect-error It exists
    initialEntries: [rootElement.dataset.route],
    initialIndex: 0,
  },
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24時間
      // staleTimeをセットしないとPersisterのデータを古いと判断して普通にフェッチしてしまう
      staleTime: 1000 * 60 * 60, // 1時間
    },
  },
})

const persister = createVSCodePersister()

root.render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </React.StrictMode>,
)
