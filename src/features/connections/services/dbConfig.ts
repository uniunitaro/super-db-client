import { randomUUID } from 'node:crypto'
import type { ExtensionContext } from 'vscode'
import { getGlobalState, setGlobalState } from '../../../utilities/store'
import type { DBConfig, DBConfigInput } from '../types/dbConfig'

export const createOrUpdateDBConfig = async (
  context: ExtensionContext,
  dbConfigInput: DBConfigInput,
) => {
  const currentDBConfigs = getGlobalState(context, 'dbConfigs') ?? []

  if (dbConfigInput.targetUUID) {
    const updatedDBConfigs = currentDBConfigs.map((config) =>
      config.uuid === dbConfigInput.targetUUID
        ? { ...dbConfigInput, uuid: dbConfigInput.targetUUID }
        : config,
    )
    await setGlobalState(context, 'dbConfigs', updatedDBConfigs)
  } else {
    const dbConfig = { ...dbConfigInput, uuid: randomUUID() }
    await setGlobalState(context, 'dbConfigs', [...currentDBConfigs, dbConfig])
  }

  console.log('DB Configurations:', getGlobalState(context, 'dbConfigs'))
}

export const getDBConfigs = (context: ExtensionContext): DBConfig[] => {
  return getGlobalState(context, 'dbConfigs') ?? []
}

export const getDBConfigByUUID = (
  context: ExtensionContext,
  uuid: string,
): DBConfig | undefined => {
  return getDBConfigs(context).find((config) => config.uuid === uuid)
}

export const deleteDBConfig = async (
  context: ExtensionContext,
  uuid: string,
) => {
  const currentDBConfigs = getGlobalState(context, 'dbConfigs') ?? []
  const updatedDBConfigs = currentDBConfigs.filter(
    (config) => config.uuid !== uuid,
  )
  await setGlobalState(context, 'dbConfigs', updatedDBConfigs)
}

export const setCurrentConnection = (
  context: ExtensionContext,
  dbUUID: string,
) => {
  context.workspaceState.update('currentDBConfigUUID', dbUUID)
}

export const getCurrentConnection = (
  context: ExtensionContext,
): DBConfig | undefined => {
  const dbConfigs = getDBConfigs(context)
  const currentDBConfigUUID = context.workspaceState.get<string>(
    'currentDBConfigUUID',
  )

  return dbConfigs.find((dbConfig) => dbConfig.uuid === currentDBConfigUUID)
}
