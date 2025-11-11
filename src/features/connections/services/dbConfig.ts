import { randomUUID } from 'node:crypto'
import type { ExtensionContext } from 'vscode'
import {
  getGlobalState,
  getSecretState,
  getWorkspaceState,
  setGlobalState,
  setSecretState,
  setWorkspaceState,
} from '../../../utilities/store'
import type { DBConfig, DBConfigInput } from '../types/dbConfig'

const SECRET_DB_CONFIGS_KEY = 'dbConfigs'

const loadDBConfigsFromSecret = async (
  context: ExtensionContext,
): Promise<DBConfig[]> => {
  const secretDBConfigs = await getSecretState(context, SECRET_DB_CONFIGS_KEY)
  if (secretDBConfigs !== undefined) {
    return secretDBConfigs
  }

  const legacyDBConfigs = getGlobalState(context, 'dbConfigs') ?? []
  if (legacyDBConfigs.length > 0) {
    await setSecretState(context, SECRET_DB_CONFIGS_KEY, legacyDBConfigs)
    await setGlobalState(context, 'dbConfigs', undefined)
  }

  return legacyDBConfigs
}

const persistDBConfigsToSecret = (
  context: ExtensionContext,
  dbConfigs: DBConfig[],
) => setSecretState(context, SECRET_DB_CONFIGS_KEY, dbConfigs)

export const createOrUpdateDBConfig = async (
  context: ExtensionContext,
  dbConfigInput: DBConfigInput,
) => {
  const currentDBConfigs = await loadDBConfigsFromSecret(context)

  if (dbConfigInput.targetUUID) {
    const updatedDBConfigs = currentDBConfigs.map((config) =>
      config.uuid === dbConfigInput.targetUUID
        ? { ...dbConfigInput, uuid: dbConfigInput.targetUUID }
        : config,
    )
    await persistDBConfigsToSecret(context, updatedDBConfigs)
  } else {
    const dbConfig = { ...dbConfigInput, uuid: randomUUID() }
    await persistDBConfigsToSecret(context, [...currentDBConfigs, dbConfig])
  }

  console.log('DB Configurations:', await loadDBConfigsFromSecret(context))
}

export const getDBConfigs = (context: ExtensionContext): Promise<DBConfig[]> =>
  loadDBConfigsFromSecret(context)

export const getDBConfigByUUID = async (
  context: ExtensionContext,
  uuid: string,
): Promise<DBConfig | undefined> => {
  const dbConfigs = await getDBConfigs(context)
  return dbConfigs.find((config) => config.uuid === uuid)
}

export const deleteDBConfig = async (
  context: ExtensionContext,
  uuid: string,
) => {
  const currentDBConfigs = await loadDBConfigsFromSecret(context)
  const updatedDBConfigs = currentDBConfigs.filter(
    (config) => config.uuid !== uuid,
  )
  await persistDBConfigsToSecret(context, updatedDBConfigs)
}

export const setCurrentConnection = (
  context: ExtensionContext,
  dbUUID: string,
) => {
  setWorkspaceState(context, 'currentDBConfigUUID', dbUUID)
}

export const getCurrentConnection = async (
  context: ExtensionContext,
): Promise<DBConfig | undefined> => {
  const dbConfigs = await getDBConfigs(context)
  const currentDBConfigUUID = getWorkspaceState(context, 'currentDBConfigUUID')

  return dbConfigs.find((dbConfig) => dbConfig.uuid === currentDBConfigUUID)
}
