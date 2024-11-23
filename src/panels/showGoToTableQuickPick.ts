import { commands, window } from 'vscode'
import { DB } from '../features/connections/services/connection'

export const showGoToTableQuickPick = async () => {
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

  commands.executeCommand('superDBClient.openTable', tableName)
}
