import { ResultAsync } from 'neverthrow'
import {
  type ExtensionContext,
  Uri,
  ViewColumn,
  type Webview,
  type WebviewPanel,
  window,
} from 'vscode'
import type { Messenger } from 'vscode-messenger'
import { getConfig } from '../../features/configs/services/config'
import {
  getDB,
  getSchema,
} from '../../features/connections/services/connection'
import { getTableMetadata } from '../../features/tables/services/metadata'
import { getRows, saveChanges } from '../../features/tables/services/table'
import {
  type Command,
  commandRequest,
  getConfigRequest,
  getTableDataRequest,
  getTableInitialDataRequest,
  saveTableChangesRequest,
} from '../../types/message'
import { getWebviewContent } from '../../utilities/getWebviewContent'
import { tuple } from '../../utilities/tuple'
import { BaseWebviewPanel } from './BaseWebviewPanel'

export class TablePanel extends BaseWebviewPanel {
  protected static currentPanel: TablePanel | undefined
  private readonly _tableName: string
  private _shouldRefresh = false

  private constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    messenger: Messenger,
    tableName: string,
    webviewId: string,
  ) {
    super(panel, context, messenger, webviewId)
    this._tableName = tableName

    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      context.extensionUri,
      '/table',
    )

    this._setWebviewMessageListener(this._panel.webview)
  }

  public static render(
    context: ExtensionContext,
    messenger: Messenger,
    tableName: string,
  ) {
    const panel = window.createWebviewPanel(
      `superDBClient.table-${tableName}`,
      tableName,
      ViewColumn.Active,
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

    return TablePanel.currentPanel
  }

  public onDidDispose(callback: () => void) {
    this._panel.onDidDispose(callback)
  }

  public isActive() {
    return this._panel.active
  }

  public getTableName() {
    return this._tableName
  }

  public reveal() {
    if (this._panel.visible) {
      // パネルが表示されていたらアクティブにしてテーブルを更新
      this._panel.reveal()
      this.sendCommand('refreshTable')
    } else {
      // 非表示の場合はフロント側のリスナが起動しておらずsendCommandは使えないため次回表示時にテーブルを更新
      this._panel.reveal()
      this._shouldRefresh = true
    }
  }

  public sendCommand(command: Command) {
    this._sendRequest(commandRequest, command)
  }

  private _setWebviewMessageListener(webview: Webview) {
    this._disposables.push(
      this._onRequest(
        getTableDataRequest,
        ({ order, orderBy, limit, offset }) => {
          const db = getDB()
          if (!db) {
            throw new Error('DB not found')
          }

          const tableMetadata = getTableMetadata({
            db,
            schema: getSchema(),
            tableName: this._tableName,
          })

          const rows = getRows({
            db,
            tableName: this._tableName,
            order,
            orderBy,
            limit,
            offset,
          })

          const result = ResultAsync.combine(tuple(tableMetadata, rows)).map(
            ([tableMetadata, rows]) => ({
              tableMetadata,
              rows,
            }),
          )
          return result.match(
            (result) => result,
            (error) => {
              window.showErrorMessage(error.message)
              throw error
            },
          )
        },
      ),
    )

    this._disposables.push(
      this._onRequest(getConfigRequest, async () => getConfig()),
    )

    this._disposables.push(
      this._onRequest(saveTableChangesRequest, async ({ operations }) => {
        const db = getDB()
        if (!db) {
          throw new Error('DB not found')
        }

        const result = await saveChanges({
          db,
          schema: getSchema(),
          tableName: this._tableName,
          operations,
        })
        return result.match(
          (result) => result,
          (error) => {
            window.showErrorMessage(error.message)
            throw error
          },
        )
      }),
    )

    this._disposables.push(
      this._onRequest(getTableInitialDataRequest, () => {
        const shouldRefresh = this._shouldRefresh
        this._shouldRefresh = false
        return { shouldRefresh }
      }),
    )
  }
}
