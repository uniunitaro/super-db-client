## 重要ルール
- 最重要ルールです！コードの変更後は、必ず、絶対に、 `pnpm typecheck` と `pnpm format-and-lint:fix` と `pnpm test` を実行して、型チェックとフォーマット、リンティングのチェック、テストをしてください
- 実装する際は、既存の実装を参考にして、コードのスタイルや実装方法をできる限り同じにしてください
- neverthrowを使う場合は、できるだけandThen, asyncAndThen, map, mapErr, matchといったメソッドを使ってメソッドチェーンをするようにしてください。必要な場合のみ、isErrなどで命令的に判定してください
- 書かなくてもいい型ジェネリクスは書かないでください、特にあなたはneverthrowのokやerrなどの関数で、`ok<Foo>(foo)`のように書きがちなので、これはやめてください

## プロジェクト構成とモジュール
- `src` ディレクトリは VS Code 拡張の本体であり、コマンドロジックとKyselyベースのデータ層を包含します。
- `webview-ui` は React + Vite 製 Webview でテーブル表示と操作フォームを管理します。
- ビルド成果物は `out/`、共有ドキュメント は `docs/` にまとまっています。

## ビルド・テスト・開発コマンド
- 依存導入: `pnpm install:all` で 拡張とWebviewの両方を一括インストール。
- 拡張バンドル: `pnpm compile` は esbuild + tsc で `out/main.js` を更新。
- 開発ウォッチ: `pnpm watch` で 拡張を増分ビルド、`pnpm start:webview` で Webview を Vite Dev Server 上に起動。
- 静的解析: `pnpm lint` で ESLintとBiomeの規約を確認。
- パッケージ生成: `pnpm package` で リリース候補 の `super-db-client-*.vsix` を 作成。

## コーディングスタイルと命名規約
- React コンポーネントとクラスは PascalCase、関数とフックは camelCase、定数は UPPER_SNAKE_CASE。

## GitHub Actionsでのパッケージリリース
- `pnpm version patch` などでバージョンを更新して Git タグを作成し push すると自動でリリース処理が走る。
