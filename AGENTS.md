# mado-calc 開発ガイド

このファイルは、`mado-calc` リポジトリの共通開発ガイドです。  
Codex、Claude Code などの支援ツールを使う場合も、このガイドを優先してください。

## テスト戦略

### 方針
- テストフレームワークは使わず、Node.js 標準ライブラリで構成する
- Node.js とブラウザの 2 つの実行環境で確認できるようにする
- 計算ロジックと表示ロジックを分け、純粋関数を中心に検証する

### テスト対象
- 計算ロジックの正確性
- バリデーション
- エッジケース
- 警告メッセージや結果表示の条件

### テスト実行方法

#### ブラウザでのテスト
```bash
python3 -m http.server 8000
# ブラウザで http://localhost:8000/test.html を開く
```

#### Node.js でのテスト
```bash
node test.js
```

## アーキテクチャ

### ファイル構成
```text
index.html   メインアプリケーション
style.css    スタイル
script.js    計算ロジックと DOM 操作
test.html    ブラウザ用テストランナー
test.js      Node.js 用テストスイート
```

### 設計原則
計算ロジックと DOM 操作は分離する。

計算ロジック側の主な関数:
- `validateInputs()`
- `calculatePiecesPerGram()`
- `calculateRemainingPieces()`
- `calculateAdditionalPieces()`
- `calculateMaterials()`
- `calculateResults()`

DOM 操作側の主な関数:
- `calculate()`
- `displayResults()`
- `onFlavorChange()`
- `setCans()`
- `setRemainingDough()`
- `clearInputs()`

### 分離の意図
- 計算関数を単体でテストしやすくする
- UI の変更と計算ロジックの変更を分離する
- 不具合の切り分けをしやすくする

## 開発フロー

### フレーバー追加時の基本手順
1. `script.js` の `flavorData` にレシピを追加する
2. `test.js` や `test.html` に必要なテストを追加する
3. テストを実行して結果を確認する
4. `index.html` の選択肢や必要な UI を更新する
5. 変更内容に合った Conventional Commit でコミットする

### コーディング方針

#### 推奨
- 計算関数は純粋関数として保つ
- DOM の更新は表示関数に寄せる
- 新機能や表示変更には対応するテストを追加する
- モバイル表示と主要ブラウザでの見え方を確認する
- Conventional Commit を使う

#### 避けたいこと
- 計算関数の中で `document` に直接触ること
- DOM 操作関数の中に複雑な計算を埋め込むこと
- 意図しないグローバル状態の更新

## 警告メッセージ

余り生地だけで足りる、または余る場合は警告メッセージを表示する。

```javascript
if (additionalPieces <= 0) {
    // 警告メッセージを表示
}
```

- `additionalPieces > 0`: 追加生地が必要
- `additionalPieces <= 0`: 余り生地で足りる、または余る

警告表示の制御は `displayResults()` で行う。

## トラブルシューティング

### テストが失敗する場合
1. `calculateResults()` の戻り値が期待値と一致しているか確認する
2. `gramsPerPiece` の計算や丸め込みを確認する
3. フレーバーデータとテスト期待値が一致しているか確認する
4. 表示条件のテストでは `additionalPieces <= 0` を確認する

### アプリが動かない場合
1. `script.js` の読み込みエラーがないかブラウザコンソールで確認する
2. `test.html` と `test.js` の結果を確認する
3. GitHub Pages 上での問題は相対パスを確認する

## 補足

### 計算ロジックを追う順序
1. `validateInputs()`
2. `calculatePiecesPerGram()`
3. `calculateRemainingPieces()`
4. `calculateAdditionalPieces()`
5. `calculateMaterials()`
6. `calculateResults()`

### 開発環境の目安
- ブラウザ: Chrome / Firefox / Safari
- Node.js: 現行の安定版
- エディタ: 任意

## まとめ

このプロジェクトでは、シンプルさとテスト可能性を重視する。

- 計算ロジックは純粋関数として保つ
- DOM 操作は責務を絞って扱う
- 実装変更とテスト更新をセットで進める
