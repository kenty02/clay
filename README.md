# Clay

## 環境構築

WebStormでリポジトリをクローン

```shell
pnpm i
```

clay-relayをインストール

`All` configurationで両方のデバッグ開始

- `chrome`アタッチ時にページ選択画面が出るので`Service Worker`を選ぶ（なければをRerun）
  - `chrome-rdb-proxy.exe`を導入すると自動化できる
- `start-chrome`(デバッグ用Chromeランチャー)は手動でchromeを停止すること
  - さもなくば「前回適切に終了されませんでした」と怒られ、なぜか拡張機能が削除される
  - `./packages/host/tools/`できれいに停止する方法がよく分かってない
