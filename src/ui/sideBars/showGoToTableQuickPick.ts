import { type ExtensionContext, commands, window } from 'vscode'
import { COMMANDS } from '../../constants/commands'
import { getCurrentConnection } from '../../features/connections/services/dbConfig'
import { connectDB } from '../../features/connections/usecases/connectDB'
import { getTables } from '../../features/tables/services/table'

export const showGoToTableQuickPick = async (context: ExtensionContext) => {
  const currentConnectionResult = await getCurrentConnection(context)
  if (currentConnectionResult.isErr()) {
    window.showErrorMessage(currentConnectionResult.error.message)
    return
  }

  const currentConnection = currentConnectionResult.value
  if (!currentConnection) {
    window.showWarningMessage('No DB connection found')
    return
  }

  const tablesResult = await connectDB(context, currentConnection.uuid)
    .andThen(getTables)
    .map((tables) => tables.map((table) => table.name))

  if (tablesResult.isErr()) {
    window.showErrorMessage(tablesResult.error.message)
    return
  }

  const tableName = await window.showQuickPick(tablesResult.value, {
    placeHolder: 'Go to table',
  })
  if (!tableName) return

  commands.executeCommand(
    COMMANDS.OPEN_TABLE,
    currentConnection.uuid,
    tableName,
  )
}
