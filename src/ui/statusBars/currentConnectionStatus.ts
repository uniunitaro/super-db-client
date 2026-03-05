import {
  type ExtensionContext,
  StatusBarAlignment,
  type StatusBarItem,
  window,
} from 'vscode'
import { COMMANDS } from '../../constants/commands'
import { getCurrentConnection } from '../../features/connections/services/dbConfig'

let _statusBarItem: StatusBarItem

export const createCurrentConnectionStatus = (context: ExtensionContext) => {
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10)
  statusBarItem.command = COMMANDS.SWITCH_CONNECTION
  statusBarItem.tooltip = 'Switch database connection'
  _statusBarItem = statusBarItem

  updateCurrentConnectionStatus(context)
  return statusBarItem
}

export const updateCurrentConnectionStatus = async (
  context: ExtensionContext,
) => {
  const currentConnectionResult = await getCurrentConnection(context)
  if (currentConnectionResult.isErr()) {
    window.showErrorMessage(currentConnectionResult.error.message)
    return
  }
  const currentConnection = currentConnectionResult.value

  if (currentConnection) {
    _statusBarItem.text = `$(database) ${currentConnection.connectionName}`
    _statusBarItem.show()
    return
  }

  _statusBarItem.text = '$(database) No connection'
  _statusBarItem.show()
}
