import type { ExtensionContext } from 'vscode'
import type { DBConfig } from '../features/connection/types/dbConfig'

type StoreType = {
  dbConfigs: DBConfig[]
}

export const getGlobalState = <T extends keyof StoreType>(
  context: ExtensionContext,
  key: T,
): StoreType[T] | undefined => context.globalState.get(key)

export const setGlobalState = <T extends keyof StoreType>(
  context: ExtensionContext,
  key: T,
  value: StoreType[T],
): Thenable<void> => context.globalState.update(key, value)
