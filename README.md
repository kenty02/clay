# Clay Host

## trpcクライアント向け型生成

```shell
pnpm run gen-types
mv server.d.ts /mnt/c/Users/kenty/dev/clay-viewer-electron/src/ # change dir name
```

## patchesに関して

Windowsで`pnpm dev`がうまく動作しないのでpnpmでrollupにパッチを当てている[参考](https://github.com/crxjs/chrome-extension-tools/issues/538)

なのでこれのバージョンが上がったらパッチも更新する必要がある

`@crxjs/vite-plugin`の直接の依存関係である方の`rollup`のバージョンであることに注意(`pnpm why rollup`)
