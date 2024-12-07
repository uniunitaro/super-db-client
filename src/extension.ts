import { type ExtensionContext, commands, window } from 'vscode'
import { Messenger } from 'vscode-messenger'
import { deleteDBConfig } from './features/connections/services/dbConfig'
import { ConnectionSettingPanel } from './ui/panels/ConnectionSettingPanel'
import { TablePanel } from './ui/panels/TablePanel'
import {
  type ExplorerItem,
  ExplorerViewProvider,
} from './ui/sideBars/ExplorerViewProvider'
import { showGoToTableQuickPick } from './ui/sideBars/showGoToTableQuickPick'
import { createCurrentConnectionStatus } from './ui/statusBars/currentConnectionStatus'

export function activate(context: ExtensionContext) {
  const messenger = new Messenger()

  const tablePanels: TablePanel[] = []

  const explorerViewProvider = new ExplorerViewProvider(context)
  window.createTreeView('superDBClient.explorer', {
    treeDataProvider: explorerViewProvider,
  })

  context.subscriptions.push(createCurrentConnectionStatus(context))

  context.subscriptions.push(
    commands.registerCommand('superDBClient.newConnection', () => {
      ConnectionSettingPanel.render(context, messenger)
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(
      'superDBClient.editConnection',
      (item?: ExplorerItem) => {
        console.log(item)
        const uuid = item?.dbUUID
        if (!uuid) return

        ConnectionSettingPanel.render(context, messenger, uuid)
      },
    ),
  )

  context.subscriptions.push(
    commands.registerCommand(
      'superDBClient.deleteConnection',
      async (item?: ExplorerItem) => {
        const uuid = item?.dbUUID
        if (!uuid) return

        const answer = await window.showWarningMessage(
          'Are you sure you want to delete this database connection?',
          { modal: true },
          'Delete',
        )

        if (!answer) return

        deleteDBConfig(context, uuid)
        explorerViewProvider.refresh()
      },
    ),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.refreshDatabases', () => {
      explorerViewProvider.refresh()
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.openTable', (tableName: string) => {
      // 同じパネルが開かれている場合は新たに開かず、既存のパネルをアクティブにする
      const existingPanel = tablePanels.find(
        (panel) => panel.getTableName() === tableName,
      )
      if (existingPanel) {
        existingPanel.reveal()
        return
      }

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
      showGoToTableQuickPick(context)
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

  context.subscriptions.push(
    commands.registerCommand('superDBClient.refreshTable', () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('refreshTable')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.deleteRows', () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('deleteRows')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.setAsNull', () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('setAsNull')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand('superDBClient.setAsEmpty', () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('setAsEmpty')
      }
    }),
  )
}
