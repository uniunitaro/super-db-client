import * as vscode from 'vscode'

export class ExplorerViewProvider
  implements vscode.TreeDataProvider<TableItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    TableItem | undefined | null | void
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
  > = new vscode.EventEmitter<TableItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    // biome-ignore lint/suspicious/noConfusingVoidType: This is a void type
    TableItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: TableItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  getChildren(
    element?: TableItem | undefined,
  ): vscode.ProviderResult<TableItem[]> {
    if (element) {
      return element.getChildren()
    }
    return [
      new TableItem('Item 1', vscode.TreeItemCollapsibleState.Collapsed),
      new TableItem('Item 2', vscode.TreeItemCollapsibleState.None),
    ]
  }
}

class TableItem extends vscode.TreeItem {
  children: TableItem[] | undefined

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    children?: TableItem[],
  ) {
    super(label, collapsibleState)
    this.children = children
  }

  getChildren(): TableItem[] | undefined {
    return this.children
  }
}
