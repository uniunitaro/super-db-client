import {
  type ExtensionContext,
  Uri,
  ViewColumn,
  type Webview,
  type WebviewPanel,
  window,
} from 'vscode'
import type { Messenger } from 'vscode-messenger'
import { testConnection } from '../features/connection/models/connection'
import { saveDBConfig } from '../features/connection/models/dbConfig'
import { saveDBConfigRequest, testDBConnectionRequest } from '../types/message'
import { getWebviewContent } from '../utilities/getWebviewContent'
import { BaseWebviewPanel } from './BaseWebviewPanel'

export class ConnectionSettingPanel extends BaseWebviewPanel {
  private constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    messenger: Messenger,
  ) {
    super(panel, context, messenger)

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      context.extensionUri,
      '/connection-setting',
    )

    this._setWebviewMessageListener(this._panel.webview, context, messenger)
  }

  public static render(context: ExtensionContext, messenger: Messenger) {
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

    ConnectionSettingPanel.currentPanel = new ConnectionSettingPanel(
      panel,
      context,
      messenger,
    )

    messenger.registerWebviewPanel(panel)
  }

  private _setWebviewMessageListener(
    webview: Webview,
    context: ExtensionContext,
    messenger: Messenger,
  ) {
    this._disposables.push(
      messenger.onRequest(testDBConnectionRequest, async (dbConfigInput) => {
        const { error } = await testConnection(dbConfigInput)
        if (error) {
          window.showErrorMessage(error)
          return { error }
        }

        window.showInformationMessage('Connection Successful!')
      }),
    )

    this._disposables.push(
      messenger.onRequest(saveDBConfigRequest, (dbConfigInput) => {
        saveDBConfig(context, dbConfigInput)

        window.showInformationMessage('Connection Saved!')
      }),
    )
  }
}
