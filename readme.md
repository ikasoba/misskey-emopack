# misskey emopack

misskey向けにカスタム絵文字をzipにまとめます。

- emopack pack [filename]
  カスタム絵文字を filename (デフォルトで`meta.csv`) で指定したCSVファイルをもとにzipにします。

## meta.csvの内容

最初の行は列と対応するプロパティ名にしてください。

```csv
name, file, category, aliases[, license]
```

aliasesは空白で区切られた文字列を入れてください。