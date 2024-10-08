import * as vscode from 'vscode'
import { DB } from '../features/connection/models/connection'
import { getDBConfigs } from '../features/connection/models/dbConfig'

export class ExplorerViewProvider
  implements vscode.TreeDataProvider<ExplorerItem>
{
  private _context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this._context = context
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    ExplorerItem | undefined | null | void
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
  > = new vscode.EventEmitter<ExplorerItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    ExplorerItem | undefined | null | void
  > = this._onDidChangeTreeData.event

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
      DB.connect(this._context, element.dbUUID)

      const db = DB.get()
      if (!db) return

      const tables = await db.introspection.getTables()
      return tables.map(
        (table) =>
          new ExplorerItem({
            label: table.name,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command: {
              command: 'superDBClient.openTable',
              title: 'Open Table',
              arguments: [table.name],
            },
          }),
      )
    }

    const dbConfigs = getDBConfigs(this._context)
    return dbConfigs.map(
      (dbConfig) =>
        new ExplorerItem({
          label: dbConfig.connectionName,
          description: `${dbConfig.host}:${dbConfig.database}`,
          uuid: dbConfig.uuid,
          collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        }),
    )
  }
}

class ExplorerItem extends vscode.TreeItem {
  dbUUID: string | undefined

  constructor({
    label,
    description,
    uuid,
    collapsibleState,
    command,
  }: {
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
  }
}
