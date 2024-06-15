import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import ConnectionSetting from './connection-setting/ConnectionSetting'
import './index.css'
import Table from './table/Table'

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

const queryClient = new QueryClient()

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
