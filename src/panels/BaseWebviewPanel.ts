import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode'
import type { Messenger } from 'vscode-messenger'

export abstract class BaseWebviewPanel {
  protected static currentPanel: BaseWebviewPanel | undefined
  protected readonly _panel: WebviewPanel
  protected readonly _context: ExtensionContext
  protected _disposables: Disposable[] = []
  private readonly _messenger: Messenger

  protected constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    messenger: Messenger,
  ) {
    this._panel = panel
    this._context = context
    this._messenger = messenger

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
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
