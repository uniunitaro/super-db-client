import {
  type ExtensionContext,
  Uri,
  ViewColumn,
  type Webview,
  type WebviewPanel,
  window,
} from 'vscode'
import type { Messenger } from 'vscode-messenger'
import { getConfig } from '../features/config/models/config'
import { DB } from '../features/connection/models/connection'
import { getTableMetadata } from '../features/table/model/metadata'
import { getRows } from '../features/table/model/table'
import { getConfigRequest, getTableDataRequest } from '../types/message'
import { getWebviewContent } from '../utilities/getWebviewContent'
import { BaseWebviewPanel } from './BaseWebviewPanel'

export class TablePanel extends BaseWebviewPanel {
  private constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    messenger: Messenger,
    tableName: string,
    webviewId: string,
  ) {
    super(panel, context, messenger)

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      context.extensionUri,
      '/table',
    )

    this._setWebviewMessageListener(
      this._panel.webview,
      context,
      messenger,
      tableName,
      webviewId,
    )
  }

  public static render(
    context: ExtensionContext,
    messenger: Messenger,
    tableName: string,
  ) {
    const panel = window.createWebviewPanel(
      `table-${tableName}`,
      tableName,
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
    TablePanel.currentPanel = new TablePanel(
      panel,
      context,
      messenger,
      tableName,
      webviewId,
    )
  }

  private _setWebviewMessageListener(
    webview: Webview,
    context: ExtensionContext,
    messenger: Messenger,
    tableName: string,
    webviewId: string,
  ) {
    this._disposables.push(
      messenger.onRequest(
        getTableDataRequest,
        async ({ order, orderBy, limit, offset }) => {
          const db = DB.get()
          if (!db) {
            throw new Error('DB not found')
          }

          const tableMetadata = await getTableMetadata({
            db,
            schema: DB.database,
            tableName,
          })
          console.log('tableMetadata', tableMetadata)

          const rows = await getRows({
            db,
            tableName,
            order,
            orderBy,
            limit,
            offset,
          })
          console.log('rows', rows)

          return {
            tableMetadata,
            rows,
          }
        },
        { sender: { type: 'webview', webviewId } },
      ),
    )

    this._disposables.push(
      messenger.onRequest(getConfigRequest, async () => getConfig(), {
        sender: { type: 'webview', webviewId },
      }),
    )
  }
}
