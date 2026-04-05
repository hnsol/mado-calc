# mado-calc 開発ガイド

計算ツール「mado-calc」の開発に関するドキュメントです。

## テスト戦略

### 方針
- **フレームワークなし** - シンプル重視で Node.js 標準ライブラリのみを使用
- **2つの実行環境に対応**
  - **test.js** - Node.js 環境（CI/CD や開発マシンで実行）
  - **test.html** - ブラウザ環境（`http://localhost:8000/test.html` で実行）

### テスト対象
- 計算ロジック（各計算関数の正確性）
- バリデーション（入力値の検証）
- エッジケース（負の値、0、大きな値など）
- 警告メッセージの表示条件

### テスト実行方法

#### ブラウザでのテスト（推奨）
```bash
python3 -m http.server 8000
# ブラウザで http://localhost:8000/test.html を開く
```
美しいUI付きのテスト結果が表示されます。全テストが PASS することを確認してください。

#### Node.js でのテスト（オプション）
```bash
node test.js
```

## アーキテクチャ

### ファイル構成
```
index.html          ← メインアプリケーション
style.css           ← スタイル（Catppuccin カラースキーム）
script.js           ← ロジック（計算 + DOM操作）
test.html           ← テスト実行画面
test.js             ← テストスイート
```

### 設計原則: 計算ロジックとDOM操作の分離

**計算ロジック**（純粋関数）- 副作用なし：
```javascript
- validateInputs()           - 入力値の検証
- calculatePiecesPerGram()   - 1枚あたりのグラム数を計算
- calculateRemainingPieces() - 余り生地から作れる枚数
- calculateAdditionalPieces()- 追加すべき枚数
- calculateMaterials()       - 各素材のグラム数
- calculateResults()         - 全計算を統合
```

**DOM操作**（副作用あり）：
```javascript
- calculate()        - ユーザー入力を取得 → validateInputs() → calculateResults() → displayResults()
- displayResults()   - DOM に結果を反映
- onFlavorChange()   - フレーバー選択時の色変更
- setCans()          - プリセットボタン処理
- setRemainingDough()- プリセットボタン処理
- clearInputs()      - リセット処理
```

### なぜ分離するのか？
- **テスト可能性**: 計算関数は純粋なので、DOM の存在なしでテストできる
- **再利用性**: 計算関数は他のプロジェクトやUI での再利用が容易
- **保守性**: 計算ロジックの変更が UI に影響を与えない
- **デバッグ性**: エラーの原因が計算か DOM 操作かすぐに特定できる

## 開発フロー

### フレーバー追加時の手順

#### 1. レシピデータの定義
script.js の `flavorData` オブジェクトに新規フレーバーを追加：
```javascript
flavorData.{newFlavorName} = {
    name: 'フレーバー日本語名',
    piecesPerCan: 10,         // 1缶あたりの枚数
    reservePieces: 50,        // 予備枚数
    baseUnit: { cans: 2, pieces: 20 },  // 基本ユニット
    materials: {
        '米粉': 49.5,
        '砂糖（白）': 18.4,
        // ... 他の素材
    }
}
```

#### 2. テストを先に書く（TDD 推奨）
test.js に新フレーバーのテストケースを追加：
```javascript
test('calculateResults', '新フレーバー名でテスト', () => {
    const result = calculateResults('newFlavorName', 20, 100);
    assert.strictEqual(result.flavorName, 'フレーバー日本語名');
    // その他のアサーション
});
```

#### 3. テストを実行
ブラウザで `test.html` を開き、新しいテストが PASS することを確認。

#### 4. UI に反映
index.html の `<select id="flavor">` にオプションを追加：
```html
<option value="newFlavorName">フレーバー日本語名</option>
```

#### 5. コミット
```bash
git add script.js index.html test.html test.js
git commit -m "feat: add new flavor 'フレーバー名'"
```

### コーディング方針

#### DO - すべき事

✅ **計算関数は純粋関数を保つ**
- 入力値のみを使用
- DOM にアクセスしない
- グローバル変数を変更しない
- 副作用がない

✅ **DOM操作は displayResults() に集約**
- 結果表示はここだけで実施
- フォーム制御は calculate() で実施

✅ **テストを先に書く**
- 新機能追加時は test.js に先にテストケースを書く
- すべてのコードパスをテストでカバーする

✅ **Conventional Commit を使用**
```
feat:  新機能追加（フレーバー追加など）
fix:   バグ修正
refactor: リファクタリング
test:  テスト追加・修正
docs:  ドキュメント更新
```

✅ **全デバイスでの動作保証**
- **モバイル対応が必須** - iPhone / Android で正常に動作すること
- **ブラウザ互換性を確認** - 特に Safari / Chrome での動作確認が重要
- **レスポンシブデザイン** - 画面サイズに応じた UI の調整
- 新機能追加時は必ず複数デバイス・複数ブラウザでテストする

#### DON'T - すべきでない事

❌ **計算関数で document にアクセス**
```javascript
// 悪い例
function calculate() {
    const flavorId = document.getElementById('flavor').value;  // ❌ DOM アクセス
    // ...
}

// 良い例
function calculateResults(flavorId, cans, remainingGrams) {  // ✅ パラメータのみ
    // ...
}
```

❌ **DOM操作関数で複雑な計算**
```javascript
// 悪い例
function displayResults(results) {
    // 複雑な計算ロジック...  ❌
    const calculated = results.total * someFormula;
    // ...
}

// 良い例
function displayResults(results) {
    // 結果表示のみ  ✅
    document.getElementById('total').textContent = results.totalAdditionalGrams.toFixed(1);
}
```

❌ **グローバル状態の変更**
```javascript
// 悪い例
let cachedFlavorData;  // ❌ グローバル変数
function calculateResults(...) {
    cachedFlavorData = flavorData;  // ❌ グローバル状態を変更
}

// 良い例
function calculateResults(...) {
    // パラメータと戻り値だけを使用
}
```

## 警告メッセージ設計

### 概要
ユーザーが入力した缶数と余り生地で、「余り生地だけで十分、またはそれ以上の場合」に警告メッセージを表示します。

### 表示条件
```javascript
if (additionalPieces <= 0) {
    // 警告メッセージを表示
}
```

- `additionalPieces > 0`: 追加生地が必要 → 警告なし
- `additionalPieces <= 0`: 余り生地で足りる/余る → **警告を表示**

### 実装場所
`displayResults()` 関数内：
```javascript
const warningMessage = document.getElementById('warningMessage');
if (warningMessage) {
    if (additionalPieces <= 0) {
        warningMessage.style.display = 'block';
    } else {
        warningMessage.style.display = 'none';
    }
}
```

### ユースケース
- **additionalPieces = -66**: 余り生地が十分すぎる → 「注意：余り生地が多すぎるようです」
- **additionalPieces = 0**: 余り生地でちょうどいい → 「注意：余り生地が多すぎるようです」
- **additionalPieces = 250**: 追加生地が必要 → 警告なし

## トラブルシューティング

### テストが FAIL する場合

1. **計算ロジックを確認**
   - `calculateResults()` の戻り値が期待値と一致しているか確認
   - `gramsPerPiece` の計算が正確か（小数点以下の丸め込みに注意）

2. **新フレーバーのテストの場合**
   - フレーバーデータ（缶数、予備、素材）が正確か確認
   - test.js の期待値が現在のレシピと一致しているか確認

3. **警告メッセージテストの場合**
   - `additionalPieces <= 0` の条件を確認
   - test.html で期待値を再度計算してみる

### アプリが動かない場合

1. **script.js が正しく読み込まれているか確認**
   - ブラウザコンソール（F12）でエラーを確認
   - flavorData が定義されているか確認

2. **test.html で全テストが PASS しているか確認**
   - test.html を開いて、エラーメッセージを確認
   - 計算ロジックに問題がないか確認

3. **GitHub Pages での動作確認**
   - ローカルでは動くが Pages では動かない場合、ファイルパスを確認
   - 相対パスが正確か確認

## 参考資料

### テスト構成
- **test.js** - Node.js 用テストスイート（約400行、25+ テストケース）
- **test.html** - ブラウザ用テストランナー（美しいUI付き）

### 計算ロジックの詳細
計算の詳細な説明は以下の順序で理解できます：
1. `validateInputs()` - どのように入力値を検証するか
2. `calculatePiecesPerGram()` - 基本ユニットから1枚あたりのグラム数を算出する仕組み
3. `calculateRemainingPieces()` - 余り生地から作れる枚数を計算する方法
4. `calculateAdditionalPieces()` - 必要な追加枚数を逆算する方法
5. `calculateMaterials()` - 各素材のグラム数を計算する方法
6. `calculateResults()` - これらをすべて統合する方法

### 開発環境
- ブラウザ: Chrome / Firefox / Safari（モダンブラウザなら対応）
- エディタ: VS Code（拡張機能: Live Server で localhost サーバーが便利）
- Node.js: 最新版（テスト実行時のみ使用）

## まとめ

このプロジェクトは、**シンプルさとテスト可能性のバランス**を取ることを目指しています。

- 計算ロジックは純粋関数 → テストしやすい、再利用しやすい
- DOM操作は集約 → 変更の影響を最小化
- テストフレームワークなし → セットアップが簡単

新しい機能を追加する際も、この原則に従うことで、長期的に保守しやすいコードベースを保つことができます。
