import { randomUUID } from 'node:crypto'
import { type ResultAsync, errAsync, okAsync } from 'neverthrow'
import type { ExtensionContext } from 'vscode'
import {
  getGlobalState,
  getSecretState,
  getWorkspaceState,
  setGlobalState,
  setSecretState,
  setWorkspaceState,
} from '../../../utilities/store'
import {
  type StoreError,
  type ValidationError,
  toValidationError,
} from '../../core/errors'
import type { DBConfig, DBConfigInput } from '../types/dbConfig'
import { normalizeDBConfig, parsePersistedDBConfigs } from './dbConfigSchema'

const SECRET_DB_CONFIGS_KEY = 'dbConfigs'

const loadDBConfigsFromSecret = (
  context: ExtensionContext,
): ResultAsync<DBConfig[], ValidationError | StoreError> => {
  return getSecretState(context, SECRET_DB_CONFIGS_KEY).andThen(
    (secretDBConfigs) => {
      if (secretDBConfigs !== undefined) {
        return parsePersistedDBConfigs(secretDBConfigs).asyncAndThen(
          (configs) => okAsync(configs),
        )
      }

      const legacyDBConfigs = getGlobalState(context, 'dbConfigs')
      if (Array.isArray(legacyDBConfigs) && legacyDBConfigs.length > 0) {
        const normalizedLegacyResult = parsePersistedDBConfigs(legacyDBConfigs)
        if (normalizedLegacyResult.isErr()) {
          return errAsync(normalizedLegacyResult.error)
        }
        const normalizedLegacy = normalizedLegacyResult.value

        return persistDBConfigsToSecret(context, normalizedLegacy)
          .andThen(() => setGlobalState(context, 'dbConfigs', undefined))
          .map(() => normalizedLegacy)
      }

      return okAsync([])
    },
  )
}

const persistDBConfigsToSecret = (
  context: ExtensionContext,
  dbConfigs: DBConfig[],
): ResultAsync<void, ValidationError> =>
  setSecretState(context, SECRET_DB_CONFIGS_KEY, dbConfigs).mapErr(
    toValidationError,
  )

export const createOrUpdateDBConfig = (
  context: ExtensionContext,
  dbConfigInput: DBConfigInput,
): ResultAsync<void, ValidationError | StoreError> => {
  const { targetUUID, ...configWithoutTarget } = dbConfigInput

  return loadDBConfigsFromSecret(context)
    .andThen((currentDBConfigs) => {
      if (targetUUID) {
        return normalizeDBConfig({
          ...configWithoutTarget,
          uuid: targetUUID,
        }).asyncAndThen((normalizedConfig) => {
          const updatedDBConfigs = currentDBConfigs.map((config) =>
            config.uuid === targetUUID ? normalizedConfig : config,
          )
          return persistDBConfigsToSecret(context, updatedDBConfigs)
        })
      }

      return normalizeDBConfig({
        ...configWithoutTarget,
        uuid: randomUUID(),
      }).asyncAndThen((normalizedConfig) =>
        persistDBConfigsToSecret(context, [
          ...currentDBConfigs,
          normalizedConfig,
        ]),
      )
    })
    .andThen(() =>
      loadDBConfigsFromSecret(context).map((dbConfigs) => {
        console.log('DB Configurations:', dbConfigs)
      }),
    )
}

export const getDBConfigs = (
  context: ExtensionContext,
): ResultAsync<DBConfig[], ValidationError | StoreError> =>
  loadDBConfigsFromSecret(context)

export const getDBConfigByUUID = (
  context: ExtensionContext,
  uuid: string,
): ResultAsync<DBConfig | undefined, ValidationError | StoreError> =>
  getDBConfigs(context).map((dbConfigs) =>
    dbConfigs.find((config) => config.uuid === uuid),
  )

export const deleteDBConfig = (
  context: ExtensionContext,
  uuid: string,
): ResultAsync<void, ValidationError | StoreError> =>
  loadDBConfigsFromSecret(context).andThen((currentDBConfigs) => {
    const updatedDBConfigs = currentDBConfigs.filter(
      (config) => config.uuid !== uuid,
    )
    return persistDBConfigsToSecret(context, updatedDBConfigs)
  })

export const setCurrentConnection = (
  context: ExtensionContext,
  dbUUID: string,
): ResultAsync<void, StoreError> =>
  setWorkspaceState(context, 'currentDBConfigUUID', dbUUID)

export const getCurrentConnection = (
  context: ExtensionContext,
): ResultAsync<DBConfig | undefined, ValidationError | StoreError> => {
  const currentDBConfigUUID = getWorkspaceState(context, 'currentDBConfigUUID')
  if (!currentDBConfigUUID) {
    return okAsync(undefined)
  }

  return getDBConfigByUUID(context, currentDBConfigUUID)
}
