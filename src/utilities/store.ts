import type { ExtensionContext } from 'vscode'
import type { DBConfig } from '../features/connections/types/dbConfig'

type GlobalStoreType = {
  dbConfigs: DBConfig[] // deprecated
}

type WorkspaceStoreType = {
  currentDBConfigUUID: string
}

type SecretStoreType = {
  dbConfigs: DBConfig[]
}

export const getGlobalState = <T extends keyof GlobalStoreType>(
  context: ExtensionContext,
  key: T,
): GlobalStoreType[T] | undefined => context.globalState.get(key)

export const setGlobalState = <T extends keyof GlobalStoreType>(
  context: ExtensionContext,
  key: T,
  value: GlobalStoreType[T] | undefined,
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

export const getSecretState = async <T extends keyof SecretStoreType>(
  context: ExtensionContext,
  key: T,
): Promise<SecretStoreType[T] | undefined> => {
  const serialized = await context.secrets.get(key)
  if (!serialized) {
    return undefined
  }

  try {
    return JSON.parse(serialized) as SecretStoreType[T]
  } catch (error) {
    console.error(`Failed to parse secret state for key: ${key}`, error)
    return undefined
  }
}

export const setSecretState = <T extends keyof SecretStoreType>(
  context: ExtensionContext,
  key: T,
  value: SecretStoreType[T],
): Thenable<void> => context.secrets.store(key, JSON.stringify(value))
