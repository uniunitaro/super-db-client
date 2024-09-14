import { type ExtensionContext, commands, window } from 'vscode'
import { Messenger } from 'vscode-messenger'
import { ConnectionSettingPanel } from './panels/ConnectionSettingPanel'
import { ExplorerViewProvider } from './panels/ExplorerViewProvider'
import { TablePanel } from './panels/TablePanel'
import { showGoToTableQuickPick } from './panels/showGoToTableQuickPick'

export function activate(context: ExtensionContext) {
  const messenger = new Messenger()

  const tablePanels: TablePanel[] = []

  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand(
    'superDBClient.newConnection',
    () => {
      ConnectionSettingPanel.render(context, messenger)
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
      const newPanel = TablePanel.render(context, messenger, tableName)
      newPanel.onDidDispose(() => {
        const index = tablePanels.indexOf(newPanel)
        if (index !== -1) {
          tablePanels.splice(index, 1)
        }
      })

      tablePanels.push(newPanel)
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.goToTable', () => {
      showGoToTableQuickPick()
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.saveTableChanges', () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('saveTableChanges')
      }
    }),
  )
}
