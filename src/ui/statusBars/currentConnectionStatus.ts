import {
  type ExtensionContext,
  StatusBarAlignment,
  type StatusBarItem,
  window,
} from 'vscode'
import { getCurrentConnection } from '../../features/connections/services/dbConfig'

let _statusBarItem: StatusBarItem

export const createCurrentConnectionStatus = (context: ExtensionContext) => {
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 10)
  _statusBarItem = statusBarItem

  updateCurrentConnectionStatus(context)
  return statusBarItem
}

export const updateCurrentConnectionStatus = (context: ExtensionContext) => {
  const currentConnection = getCurrentConnection(context)

  if (currentConnection) {
    const { connectionName, host, database } = currentConnection
    _statusBarItem.text = `$(database) ${currentConnection.connectionName}`
    _statusBarItem.tooltip = `${connectionName} ${host} : ${database}`
  }

  _statusBarItem.show()
}
