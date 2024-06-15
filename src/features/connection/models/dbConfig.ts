import { randomUUID } from 'node:crypto'
import type { ExtensionContext } from 'vscode'
import { getGlobalState, setGlobalState } from '../../../utilities/store'
import type { DBConfig, DBConfigInput } from '../types/dbConfig'

export const saveDBConfig = async (
  context: ExtensionContext,
  dbConfigInput: DBConfigInput,
) => {
  const dbConfigs = { ...dbConfigInput, uuid: randomUUID() }

  const currentDBConfigs = getGlobalState(context, 'dbConfigs')
  const updatedDBConfigs = currentDBConfigs
    ? [...currentDBConfigs, dbConfigs]
    : [dbConfigs]
  await setGlobalState(context, 'dbConfigs', updatedDBConfigs)

  console.log('DB Configurations:', getGlobalState(context, 'dbConfigs'))
}

export const getDBConfigs = (context: ExtensionContext): DBConfig[] => {
  return getGlobalState(context, 'dbConfigs') ?? []
}
