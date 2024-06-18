import { type ExtensionContext, commands, window } from 'vscode'
import { Messenger } from 'vscode-messenger'
import { ExplorerViewProvider } from './panels/ExplorerViewProvider'
import { HelloWorldPanel } from './panels/HelloWorldPanel'
import { TablePanel } from './panels/TablePanel'
import { showGoToTableQuickPick } from './panels/showGoToTableQuickPick'

export function activate(context: ExtensionContext) {
  const messenger = new Messenger()

  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand(
    'superDBClient.newConnection',
    () => {
      HelloWorldPanel.render(context, messenger)
    },
  )

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand)

  const explorerViewProvider = new ExplorerViewProvider(context)
  window.createTreeView('superDBClient.explorer', {
    treeDataProvider: explorerViewProvider,
  })

  context.subscriptions.push(
    commands.registerCommand('superDBClient.refreshEntry', () => {
      explorerViewProvider.refresh()
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.openTable', (tableName: string) => {
      TablePanel.render(context, messenger, tableName)
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.goToTable', () => {
      showGoToTableQuickPick(context, messenger)
    }),
  )
}
