# Webview パフォーマンス計測

`pnpm perf:webview` は、ビルド済みの Webview バンドルに対して再現可能なブラウザベンチマークを実行します。

## コマンド

```bash
pnpm perf:webview
```

このコマンドでは次を実行します。

1. `pnpm build:perf`（`mode=perf` で Webview のみをビルド）
2. `vite preview` を起動
3. Playwright ベンチマーク（`webview-ui/scripts/perf-table.ts`）を実行

## 出力

- JSON の計測結果は `webview-ui/perf-results/table-<timestamp>.json` に保存されます。
- コンソールには各イテレーションのメトリクスと median/p95 のサマリが表示されます。

## オプション引数

ベンチマークスクリプトには引数を直接渡せます。

```bash
cd webview-ui
pnpm perf:table -- --rows=100000 --columns=20 --limit=5000 --iterations=5 --pageTransitions=10
```

サポートしている引数:

- `--rows`: モックデータセットの論理行数
- `--columns`: 描画する列数
- `--limit`: テーブル取得時に渡すページサイズ
- `--iterations`: 計測の実行回数
- `--pageTransitions`: 1イテレーション内で「Next page」を連続計測する回数
- `--port`: preview サーバーのポート
