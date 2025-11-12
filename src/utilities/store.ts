import { Result, ResultAsync, ok } from 'neverthrow'
import type { ExtensionContext } from 'vscode'
import type { DBConfig } from '../features/connections/types/dbConfig'
import { type StoreError, toStoreError } from '../features/core/errors'

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
): ResultAsync<void, StoreError> =>
  ResultAsync.fromPromise(context.globalState.update(key, value), toStoreError)

export const getWorkspaceState = <T extends keyof WorkspaceStoreType>(
  context: ExtensionContext,
  key: T,
): WorkspaceStoreType[T] | undefined => context.workspaceState.get(key)

export const setWorkspaceState = <T extends keyof WorkspaceStoreType>(
  context: ExtensionContext,
  key: T,
  value: WorkspaceStoreType[T],
): ResultAsync<void, StoreError> =>
  ResultAsync.fromPromise(
    context.workspaceState.update(key, value),
    toStoreError,
  )

export const getSecretState = <T extends keyof SecretStoreType>(
  context: ExtensionContext,
  key: T,
): ResultAsync<SecretStoreType[T] | undefined, StoreError> =>
  ResultAsync.fromPromise(context.secrets.get(key), toStoreError).andThen(
    (serialized) => {
      if (!serialized) {
        return ok(undefined)
      }

      return Result.fromThrowable(
        () => JSON.parse(serialized) as SecretStoreType[T],
        toStoreError,
      )()
    },
  )

export const setSecretState = <T extends keyof SecretStoreType>(
  context: ExtensionContext,
  key: T,
  value: SecretStoreType[T],
): ResultAsync<void, StoreError> =>
  Result.fromThrowable(
    () => JSON.stringify(value),
    toStoreError,
  )().asyncAndThen((serialized) =>
    ResultAsync.fromPromise(
      context.secrets.store(key, serialized),
      toStoreError,
    ),
  )
