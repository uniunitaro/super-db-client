import {
  type Command,
  type Event,
  EventEmitter,
  type ExtensionContext,
  type TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  type TreeView,
  window,
} from 'vscode'
import { COMMANDS } from '../../constants/commands'
import { VIEWS } from '../../constants/views'
import { getDB } from '../../features/connections/services/connection'
import { getDBConfigs } from '../../features/connections/services/dbConfig'
import { connectDB } from '../../features/connections/usecases/connectDB'
import { getTables } from '../../features/tables/services/table'

export class ExplorerViewProvider implements TreeDataProvider<ExplorerItem> {
  private _context: ExtensionContext

  private _onDidChangeTreeData: EventEmitter<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    ExplorerItem | undefined | null | void
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
  > = new EventEmitter<ExplorerItem | undefined | null | void>()
  readonly onDidChangeTreeData: Event<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    ExplorerItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  private treeView: TreeView<ExplorerItem>

  constructor(context: ExtensionContext) {
    this._context = context
    this.treeView = window.createTreeView(VIEWS.EXPLORER, {
      treeDataProvider: this,
    })

    this.treeView.onDidExpandElement(async (e) => {
      if (e.element.itemType === 'db' && e.element.dbUUID) {
        const result = connectDB(this._context, e.element.dbUUID)
        if (result.isErr()) {
          window.showErrorMessage(result.error.message)
        }
      }
    })
  }

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: ExplorerItem): TreeItem | Thenable<TreeItem> {
    return element
  }

  async getChildren(
    element?: ExplorerItem | undefined,
  ): Promise<ExplorerItem[] | null | undefined> {
    if (element?.dbUUID) {
      const db = getDB()
      if (!db) return

      const tables = await getTables(db)
      if (tables.isErr()) {
        window.showErrorMessage(tables.error.message)
        return []
      }

      return tables.value.map(
        (table) =>
          new ExplorerItem({
            itemType: 'table',
            label: table.name,
            collapsibleState: TreeItemCollapsibleState.None,
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
          // description: `${dbConfig.host} : ${dbConfig.database}`,
          uuid: dbConfig.uuid,
          collapsibleState: TreeItemCollapsibleState.Collapsed,
        }),
    )
  }
}

export class ExplorerItem extends TreeItem {
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
    collapsibleState: TreeItemCollapsibleState
    command?: Command
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
