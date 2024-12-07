import type { ExtensionContext } from 'vscode'
import type { DBConfig } from '../features/connections/types/dbConfig'

type GlobalStoreType = {
  dbConfigs: DBConfig[]
}

type WorkspaceStoreType = {
  currentDBConfigUUID: string
}

export const getGlobalState = <T extends keyof GlobalStoreType>(
  context: ExtensionContext,
  key: T,
): GlobalStoreType[T] | undefined => context.globalState.get(key)

export const setGlobalState = <T extends keyof GlobalStoreType>(
  context: ExtensionContext,
  key: T,
  value: GlobalStoreType[T],
): Thenable<void> => context.globalState.update(key, value)

export const getWorkspaceState = <T extends keyof WorkspaceStoreType>(
  context: ExtensionContext,
  key: T,
): WorkspaceStoreType[T] | undefined => context.workspaceState.get(key)

export const setWorkspaceState = <T extends keyof WorkspaceStoreType>(
  context: ExtensionContext,
  key: T,
  value: WorkspaceStoreType[T],
): Thenable<void> => context.workspaceState.update(key, value)
