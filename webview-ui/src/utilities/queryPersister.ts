import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client'
import { vscode } from './vscode'

export const createVSCodePersister = (): Persister => {
  return {
    persistClient: async (client: PersistedClient) => {
      vscode.setState({ ...vscode.getState(), persistedClient: { client } })
    },
    restoreClient: async () => {
      return vscode.getState()?.persistedClient?.client
    },
    removeClient: async () => {
      vscode.setState({ ...vscode.getState(), persistedClient: undefined })
    },
  }
}
