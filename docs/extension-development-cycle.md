# Extension development cycle

The intended development cycle of this React-based webview extension is slightly different than that of other VS Code extensions.

Due to the fact that the `webview-ui` directory holds a self-contained React application we get to take advantage of some of the perks that that enables. In particular,

- UI development and iteration cycles can happen much more quickly by using Vite
- Dependency management and project configuration is hugely simplified

## UI development cycle

Since we can take advantage of the much faster Vite dev server, it is encouraged to begin developing webview UI by running the `npm run start:webview` command and then editing the code in the `webview-ui/src` directory.

_Tip: Open the command palette and run the `Simple Browser` command and fill in `http://localhost:3000/` when prompted. This will open a simple browser environment right inside VS Code._

### Message passing
If you need to implement message passing between the webview context and extension context via the VS Code API, a helpful utility is provided in the `webview-ui/src/utilities/vscode.ts` file.

This file contains a utility wrapper around the `acquireVsCodeApi()` function, which enables message passing and state management between the webview and extension contexts.

This utility also enables webview code to be run in the Vite dev server by using native web browser features that mock the functionality enabled by acquireVsCodeApi. This means you can keep building your webview UI with the Vite dev server even when using the VS Code API.

### Move to traditional extension development
Once you're ready to start building other parts of your extension, simply shift to a development model where you run the `npm run build:webview` command as you make changes, press `F5` to compile your extension and open a new Extension Development Host window. Inside the host window, open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `Hello World (React + Vite): Show`.

## Dependency management and project configuration

As mentioned above, the `webview-ui` directory holds a self-contained and isolated React application meaning you can (for the most part) treat the development of your webview UI in the same way you would treat the development of a regular React application.

To install webview-specific dependencies simply navigate (i.e. `cd`) into the `webview-ui` directory and install any packages you need or set up any React specific configurations you want.

# 拡張機能の開発サイクル

このReactベースのwebview拡張機能の開発サイクルは、他のVS Code拡張機能とは少し異なります。

[`webview-ui`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Funiunitaro%2Fsuper-db-client%2Fwebview-ui%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/home/uniunitaro/super-db-client/webview-ui")ディレクトリが自己完結型のReactアプリケーションを保持しているため、それが可能にするいくつかの利点を活用できます。特に、

- Viteを使用することで、UIの開発と反復サイクルを大幅に高速化できます
- 依存関係の管理とプロジェクトの設定が大幅に簡素化されます

## UI開発サイクル

Viteの開発サーバーが非常に高速であるため、`npm run start:webview`コマンドを実行してから`webview-ui/src`ディレクトリ内のコードを編集することで、webview UIの開発を開始することが推奨されます。

_ヒント: コマンドパレットを開き、`Simple Browser`コマンドを実行し、プロンプトが表示されたら`http://localhost:3000/`を入力します。これにより、VS Code内にシンプルなブラウザ環境が開きます。_

### メッセージの受け渡し
webviewコンテキストと拡張機能コンテキスト間でVS Code APIを介したメッセージの受け渡しを実装する必要がある場合、[`webview-ui/src/utilities/vscode.ts`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Funiunitaro%2Fsuper-db-client%2Fwebview-ui%2Fsrc%2Futilities%2Fvscode.ts%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/home/uniunitaro/super-db-client/webview-ui/src/utilities/vscode.ts")ファイルに便利なユーティリティが提供されています。

このファイルには、`acquireVsCodeApi()`関数のラッパーであるユーティリティが含まれており、これによりwebviewと拡張機能のコンテキスト間でメッセージの受け渡しと状態管理が可能になります。

また、このユーティリティにより、webviewのコードをViteの開発サーバーで実行することができます。これは、acquireVsCodeApiによって有効にされる機能をモックするネイティブのwebブラウザ機能を使用します。つまり、VS Code APIを使用しながらも、Viteの開発サーバーでwebview UIを続けて構築することができます。

### 伝統的な拡張機能開発への移行
拡張機能の他の部分の構築を開始する準備ができたら、変更を加えるたびに`npm run build:webview`コマンドを実行し、`F5`を押して拡張機能をコンパイルし、新しいExtension Development Hostウィンドウを開く開発モデルに移行します。ホストウィンドウ内でコマンドパレット（`Ctrl+Shift+P`またはMacでは`Cmd+Shift+P`）を開き、`Hello World (React + Vite): Show`と入力します。

## 依存関係管理とプロジェクト設定

上記の通り、[`webview-ui`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Funiunitaro%2Fsuper-db-client%2Fwebview-ui%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/home/uniunitaro/super-db-client/webview-ui")ディレクトリは自己完結型で独立したReactアプリケーションを保持しています。これにより、webview UIの開発を通常のReactアプリケーションの開発とほぼ同じ方法で扱うことができます。

webview特有の依存関係をインストールするには、単に（つまり、`cd`で）[`webview-ui`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fhome%2Funiunitaro%2Fsuper-db-client%2Fwebview-ui%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/home/uniunitaro/super-db-client/webview-ui")ディレクトリに移動し、必要なパッケージをインストールしたり、必要なReact特有の設定を行ったりします。