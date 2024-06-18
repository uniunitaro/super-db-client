import { type ExtensionContext, window } from 'vscode'
import type { Messenger } from 'vscode-messenger'
import { DB } from '../features/connection/models/connection'
import { TablePanel } from './TablePanel'

export const showGoToTableQuickPick = async (
  context: ExtensionContext,
  messenger: Messenger,
) => {
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

  TablePanel.render(context, messenger, tableName)
}
