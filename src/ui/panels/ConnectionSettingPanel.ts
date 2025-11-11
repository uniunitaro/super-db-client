import {
  type ExtensionContext,
  Uri,
  ViewColumn,
  type Webview,
  type WebviewPanel,
  commands,
  window,
} from 'vscode'
import type { Messenger } from 'vscode-messenger'
import { COMMANDS } from '../../constants/commands'
import { testConnection } from '../../features/connections/services/connection'
import {
  createOrUpdateDBConfig,
  getDBConfigByUUID,
} from '../../features/connections/services/dbConfig'
import {
  getConnectionSettingInitialDataRequest,
  saveDBConfigRequest,
  testDBConnectionRequest,
} from '../../types/message'
import { getWebviewContent } from '../../utilities/getWebviewContent'
import { BaseWebviewPanel } from './BaseWebviewPanel'

export class ConnectionSettingPanel extends BaseWebviewPanel {
  private _targetDBConfigUUID?: string

  private constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    messenger: Messenger,
    webviewId: string,
    targetDBConfigUUID?: string,
  ) {
    super(panel, context, messenger, webviewId)

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      context.extensionUri,
      '/connection-setting',
    )

    this._targetDBConfigUUID = targetDBConfigUUID

    this._setWebviewMessageListener(this._panel.webview, context, messenger)
  }

  public static render(
    context: ExtensionContext,
    messenger: Messenger,
    targetDBConfigUUID?: string,
  ) {
    const panel = window.createWebviewPanel(
      'newConnection',
      'New Connection',
      ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          Uri.joinPath(context.extensionUri, 'out'),
          Uri.joinPath(context.extensionUri, 'webview-ui/build'),
        ],
      },
    )

    const { webviewId } = messenger.registerWebviewPanel(panel)

    ConnectionSettingPanel.currentPanel = new ConnectionSettingPanel(
      panel,
      context,
      messenger,
      webviewId,
      targetDBConfigUUID,
    )
  }

  private _setWebviewMessageListener(
    webview: Webview,
    context: ExtensionContext,
    messenger: Messenger,
  ) {
    this._disposables.push(
      this._onRequest(getConnectionSettingInitialDataRequest, async () => {
        if (!this._targetDBConfigUUID) {
          return undefined
        }

        const dbConfig = await getDBConfigByUUID(
          context,
          this._targetDBConfigUUID,
        )
        return dbConfig
      }),
    )

    this._disposables.push(
      this._onRequest(testDBConnectionRequest, async (dbConfigInput) => {
        const result = await testConnection(dbConfigInput)
        if (result.isErr()) {
          console.log(result.error)
          window.showErrorMessage(result.error.message)
          return { error: result.error.message }
        }

        window.showInformationMessage('Connection Successful!')
      }),
    )

    this._disposables.push(
      this._onRequest(saveDBConfigRequest, async (dbConfigInput) => {
        await createOrUpdateDBConfig(context, dbConfigInput)

        window.showInformationMessage('Connection Saved!')
        commands.executeCommand(COMMANDS.REFRESH_DATABASES)
      }),
    )
  }
}
