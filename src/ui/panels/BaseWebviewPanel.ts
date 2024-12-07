import {
  type Disposable,
  type ExtensionContext,
  Uri,
  type WebviewPanel,
} from 'vscode'
import type { Messenger } from 'vscode-messenger'
import type { RequestHandler, RequestType } from 'vscode-messenger-common'

export abstract class BaseWebviewPanel {
  protected static currentPanel: BaseWebviewPanel | undefined
  protected readonly _panel: WebviewPanel
  protected readonly _context: ExtensionContext
  protected _disposables: Disposable[] = []
  protected readonly _messenger: Messenger
  protected readonly _webviewId: string

  protected constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    messenger: Messenger,
    webviewId: string,
  ) {
    this._panel = panel
    this._context = context
    this._messenger = messenger

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._panel.iconPath = {
      light: Uri.joinPath(context.extensionUri, 'assets/database-light.svg'),
      dark: Uri.joinPath(context.extensionUri, 'assets/database-dark.svg'),
    }

    this._webviewId = webviewId
  }

  protected _onRequest<P, R>(
    type: RequestType<P, R>,
    handler: RequestHandler<P, R>,
  ) {
    return this._messenger.onRequest(type, handler, {
      sender: { type: 'webview', webviewId: this._webviewId },
    })
  }

  protected _sendRequest<P, R>(type: RequestType<P, R>, params?: P) {
    return this._messenger.sendRequest(
      type,
      { type: 'webview', webviewId: this._webviewId },
      params,
    )
  }

  public dispose() {
    ;(this.constructor as typeof BaseWebviewPanel).currentPanel = undefined

    this._panel.dispose()

    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }
}
