import * as vscode from 'vscode'
import { COMMANDS } from '../../constants/commands'
import { VIEWS } from '../../constants/views'
import { DB } from '../../features/connections/services/connection'
import { getDBConfigs } from '../../features/connections/services/dbConfig'
import { connectDB } from '../../features/connections/usecases/connectDB'

export class ExplorerViewProvider
  implements vscode.TreeDataProvider<ExplorerItem>
{
  private _context: vscode.ExtensionContext

  private _onDidChangeTreeData: vscode.EventEmitter<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    ExplorerItem | undefined | null | void
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
  > = new vscode.EventEmitter<ExplorerItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    ExplorerItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  private treeView: vscode.TreeView<ExplorerItem>

  constructor(context: vscode.ExtensionContext) {
    this._context = context
    this.treeView = vscode.window.createTreeView(VIEWS.EXPLORER, {
      treeDataProvider: this,
    })

    this.treeView.onDidExpandElement(async (e) => {
      if (e.element.itemType === 'db' && e.element.dbUUID) {
        connectDB(this._context, e.element.dbUUID)
      }
    })
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(
    element: ExplorerItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  async getChildren(
    element?: ExplorerItem | undefined,
  ): Promise<ExplorerItem[] | null | undefined> {
    if (element?.dbUUID) {
      const db = DB.get()
      if (!db) return

      const tables = await db.introspection.getTables()
      return tables.map(
        (table) =>
          new ExplorerItem({
            itemType: 'table',
            label: table.name,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command: {
              command: COMMANDS.OPEN_TABLE,
              title: 'Open Table',
              arguments: [element.dbUUID, table.name],
            },
          }),
      )
    }

    const dbConfigs = getDBConfigs(this._context)
    return dbConfigs.map(
      (dbConfig) =>
        new ExplorerItem({
          itemType: 'db',
          label: dbConfig.connectionName,
          description: `${dbConfig.host} : ${dbConfig.database}`,
          uuid: dbConfig.uuid,
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        }),
    )
  }
}

export class ExplorerItem extends vscode.TreeItem {
  dbUUID: string | undefined
  itemType: 'db' | 'table'

  constructor({
    itemType,
    label,
    description,
    uuid,
    collapsibleState,
    command,
  }: {
    itemType: 'db' | 'table'
    label: string
    description?: string
    uuid?: string
    collapsibleState: vscode.TreeItemCollapsibleState
    command?: vscode.Command
  }) {
    super(label, collapsibleState)
    this.description = description
    this.dbUUID = uuid
    this.command = command
    this.itemType = itemType

    if (itemType === 'db') {
      this.contextValue = 'db'
    }
  }
}
