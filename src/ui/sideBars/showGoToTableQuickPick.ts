import { type ExtensionContext, commands, window } from 'vscode'
import { COMMANDS } from '../../constants/commands'
import { getCurrentConnection } from '../../features/connections/services/dbConfig'
import { connectDB } from '../../features/connections/usecases/connectDB'
import { getTables } from '../../features/tables/services/table'

export const showGoToTableQuickPick = async (context: ExtensionContext) => {
  const currentConnection = getCurrentConnection(context)
  if (!currentConnection) {
    window.showWarningMessage('No DB connection found')
    return
  }

  const tables = await connectDB(context, currentConnection.uuid)
    .asyncAndThen(getTables)
    .map((tables) => tables.map((table) => table.name))

  if (tables.isErr()) {
    window.showErrorMessage(tables.error.message)
    return
  }

  const tableName = await window.showQuickPick(tables.value, {
    placeHolder: 'Go to table',
  })
  if (!tableName) return

  commands.executeCommand(
    COMMANDS.OPEN_TABLE,
    currentConnection.uuid,
    tableName,
  )
}
