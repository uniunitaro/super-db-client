import { type ExtensionContext, commands, window } from 'vscode'
import { Messenger } from 'vscode-messenger'
import { COMMANDS } from './constants/commands'
import { deleteDBConfig } from './features/connections/services/dbConfig'
import { connectDB } from './features/connections/usecases/connectDB'
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

  context.subscriptions.push(createCurrentConnectionStatus(context))

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.NEW_CONNECTION, () => {
      ConnectionSettingPanel.render(context, messenger)
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(
      COMMANDS.EDIT_CONNECTION,
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
      COMMANDS.DELETE_CONNECTION,
      async (item?: ExplorerItem) => {
        const uuid = item?.dbUUID
        if (!uuid) return

        const answer = await window.showWarningMessage(
          'Are you sure you want to delete this database connection?',
          { modal: true },
          'Delete',
        )

        if (!answer) return

        const result = await deleteDBConfig(context, uuid)
        if (result.isErr()) {
          window.showErrorMessage(result.error.message)
          return
        }
        explorerViewProvider.refresh()
      },
    ),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.REFRESH_DATABASES, () => {
      explorerViewProvider.refresh()
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(
      COMMANDS.OPEN_TABLE,
      async (dbUUID: string, tableName: string) => {
        const result = await connectDB(context, dbUUID)
        if (result.isErr()) {
          window.showErrorMessage(result.error.message)
          return
        }

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
      },
    ),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.GO_TO_TABLE, () => {
      showGoToTableQuickPick(context)
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.SAVE_TABLE_CHANGES, () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('saveTableChanges')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.REFRESH_TABLE, () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('refreshTable')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.FIND_IN_TABLE, () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('openFind')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.DUPLICATE_ROW, () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('duplicateRow')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.DELETE_ROWS, () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('deleteRows')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.SET_AS_NULL, () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('setAsNull')
      }
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(COMMANDS.SET_AS_EMPTY, () => {
      const activePanel = tablePanels.find((panel) => panel.isActive())
      if (activePanel) {
        activePanel.sendCommand('setAsEmpty')
      }
    }),
  )
}
