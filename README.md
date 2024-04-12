# Clay

ブラウザの閲覧履歴を木構造で表すビューアを提供することにより、「前見ていたページに戻る」を簡単に実現します（現行バージョンは不具合の多さ等により常用に耐えるものではありません😭）

新しいUI
![image](https://github.com/kenty02/clay/assets/42216299/66a42e19-e03b-4ffd-9096-04a0a14ee321)

旧UI
https://github.com/kenty02/clay/assets/42216299/cdb0e9ab-dd6e-4044-ac7e-8705abbc1b98


## 環境構築

WebStormでリポジトリをクローン

```shell
pnpm i
```

[clay-relay](https://github.com/kenty02/clay-relay)をインストール

`All` configurationで両方のデバッグ開始

- `chrome`アタッチ時にページ選択画面が出るので`Service Worker`を選ぶ（なければをRerun）
  - `chrome-rdb-proxy.exe`を導入すると自動化できる
- `start-chrome`(デバッグ用Chromeランチャー)は手動でchromeを停止すること
  - さもなくば「前回適切に終了されませんでした」と怒られ、なぜか拡張機能が削除される
  - `./packages/host/tools/`できれいに停止する方法がよく分かってない
