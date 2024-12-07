# `panels` Directory

This directory contains all of the webview-related code that will be executed within the extension context. It can be thought of as the place where all of the "backend" code of a webview panel is contained.

Types of content that can be contained here:

Individual JavaScript / TypeScript files that contain a class which manages the state and behavior of a given webview panel. Each class is usually in charge of:

- Creating and rendering the webview panel
- Properly cleaning up and disposing of webview resources when the panel is closed
- Setting message listeners so data can be passed between the webview and extension
- Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
- Other custom logic and behavior related to webview panel management

# panels ディレクトリ
このディレクトリには、拡張機能のコンテキスト内で実行されるすべてのWebビュー関連のコードが含まれています。Webビューパネルの「バックエンド」コードがすべて含まれる場所と考えることができます。

ここに含まれる可能性があるコンテンツの種類：

特定のWebビューパネルの状態と動作を管理するクラスを含む個々のJavaScript / TypeScriptファイル。各クラスは通常、以下を担当します：

- Webビューパネルの作成とレンダリング
- パネルが閉じられたときにWebビューリソースを適切にクリーンアップし、廃棄する
- Webビューと拡張機能の間でデータを受け渡すためのメッセージリスナーを設定する
- WebビューパネルのHTML（および間接的にCSS/JavaScript）コンテンツを設定する
- Webビューパネル管理に関連するその他のカスタムロジックと動作