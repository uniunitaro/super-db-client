import { type ExtensionContext, window } from 'vscode'
import {
  getCurrentConnection,
  getDBConfigs,
} from '../../features/connections/services/dbConfig'
import { connectDB } from '../../features/connections/usecases/connectDB'

export const showSwitchConnectionQuickPick = async (
  context: ExtensionContext,
): Promise<boolean> => {
  const dbConfigsResult = await getDBConfigs(context)
  if (dbConfigsResult.isErr()) {
    window.showErrorMessage(dbConfigsResult.error.message)
    return false
  }

  const dbConfigs = dbConfigsResult.value
  if (dbConfigs.length === 0) {
    window.showWarningMessage('No DB connection found')
    return false
  }

  const currentConnectionResult = await getCurrentConnection(context)
  if (currentConnectionResult.isErr()) {
    window.showErrorMessage(currentConnectionResult.error.message)
    return false
  }
  const currentConnection = currentConnectionResult.value

  const selectedConnection = await window.showQuickPick(
    dbConfigs.map((dbConfig) => ({
      label: dbConfig.connectionName,
      description:
        dbConfig.uuid === currentConnection?.uuid ? 'Current connection' : '',
      dbUUID: dbConfig.uuid,
    })),
    {
      placeHolder: 'Switch database connection',
      matchOnDescription: true,
    },
  )
  if (!selectedConnection) return false

  if (selectedConnection.dbUUID === currentConnection?.uuid) {
    return false
  }

  const connectResult = await connectDB(context, selectedConnection.dbUUID)
  if (connectResult.isErr()) {
    window.showErrorMessage(connectResult.error.message)
    return false
  }

  return true
}
