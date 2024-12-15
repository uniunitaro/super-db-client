import { Messenger } from 'vscode-messenger-webview'
import { vscode } from './vscode'

export const messenger = (() => {
  if (!vscode.vsCodeApi) {
    throw new Error('acquireVsCodeApi is not defined')
  }

  return new Messenger(vscode.vsCodeApi)
})()
