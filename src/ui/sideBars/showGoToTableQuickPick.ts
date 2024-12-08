import { type ExtensionContext, commands, window } from 'vscode'
import { COMMANDS } from '../../constants/commands'
import { DB } from '../../features/connections/services/connection'
import { getCurrentConnection } from '../../features/connections/services/dbConfig'

export const showGoToTableQuickPick = async (context: ExtensionContext) => {
  const currentConnection = getCurrentConnection(context)
  if (!currentConnection) {
    window.showWarningMessage('No DB connection found')
    return
  }

  DB.connect(context, currentConnection.uuid)
  const db = DB.get()
  if (!db) {
    window.showWarningMessage('No DB connection found')
    return
  }

  const tables = (await db.introspection.getTables()).map((table) => table.name)

  const tableName = await window.showQuickPick(tables, {
    placeHolder: 'Go to table',
  })
  if (!tableName) return

  commands.executeCommand(COMMANDS.OPEN_TABLE, tableName)
}
