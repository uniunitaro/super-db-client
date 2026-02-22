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

const routeQuery = new URLSearchParams(window.location.search).get('route')
const initialRoute = rootElement.dataset.route ?? routeQuery ?? '/'

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
    initialEntries: [initialRoute],
    initialIndex: 0,
  },
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24時間
      staleTime: 1000 * 60 * 60, // 1時間
    },
  },
})

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
