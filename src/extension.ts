import { commands, window, type ExtensionContext } from 'vscode'
import { ExplorerViewProvider } from './panels/ExplorerViewProvider'
import { HelloWorldPanel } from './panels/HelloWorldPanel'

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand(
    'hello-world.showHelloWorld',
    () => {
      HelloWorldPanel.render(context.extensionUri)
    },
  )

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand)

  const explorerViewProvider = new ExplorerViewProvider()
  window.createTreeView('super-db-client-explorer', {
    treeDataProvider: explorerViewProvider,
  })
}
