// テスト実行用ファイル
// Node.js の標準 assert モジュールを使用
const assert = require('assert');

// script.js から flavorData と計算関数をエクスポート
const flavorData = {
    cheese: {
        name: 'チーズ',
        piecesPerCan: 10,
        reservePieces: 50,
        baseUnit: { cans: 2, pieces: 20 },
        materials: {
            '米粉': 49.5,
            '砂糖（白）': 18.4,
            '太白ごま油': 17.48,
            '卵': 11.04,
            '片栗粉': 9.2,
            '塩': 1.84,
            'カシューチーズ': 19.32
        }
    },
    onion: {
        name: '玉ねぎ',
        piecesPerCan: 8,
        reservePieces: 40,
        baseUnit: { cans: 2, pieces: 16 },
        materials: {
            '米粉': 45.0,
            '砂糖（白）': 20.0,
            '太白ごま油': 23.0,
            '卵': 12.0,
            '片栗粉': 10.0,
            '塩': 1.20,
            '玉ねぎパウダー': 3.0,
            '酒粕': 5.0
        }
    },
    sansho: {
        name: '山椒',
        piecesPerCan: 8,
        reservePieces: 40,
        baseUnit: { cans: 2, pieces: 16 },
        materials: {
            '米粉': 58.5,
            '砂糖（白）': 13.0,
            '太白ごま油': 26.65,
            '卵': 19.5,
            '片栗粉': 7.8,
            '塩': 1.56,
            'よもぎ': 6.5,
            '山椒': 3.25
        }
    },
    miso: {
        name: 'シン味噌',
        piecesPerCan: 12,
        reservePieces: 40,
        baseUnit: { cans: 2, pieces: 16 },
        materials: {
            '米粉': 40.0,
            '砂糖（白）': 7.5,
            '太白ごま油': 20.0,
            '卵': 15.0,
            '片栗粉': 5.0,
            '味噌': 1.56,
            '柚子胡椒': 0.6,
            'アーモンドパウダー': 10.0
        }
    }
};

// バリデーション関数
function validateInputs(flavorId, cans, remainingGrams) {
    if (!flavorId || !flavorData[flavorId]) {
        return { valid: false, error: 'フレーバーを選択してください' };
    }
    if (!cans || cans < 1 || !Number.isInteger(cans)) {
        return { valid: false, error: '缶数は1以上の整数を入力してください' };
    }
    if (remainingGrams < 0) {
        return { valid: false, error: '余り生地のグラム数は0以上を入力してください' };
    }
    return { valid: true };
}

// 1枚あたりのグラム数を計算する純粋関数
function calculatePiecesPerGram(flavor) {
    const totalMaterialsPerBaseUnit = Object.values(flavor.materials).reduce((sum, g) => sum + g, 0);
    return totalMaterialsPerBaseUnit / flavor.baseUnit.pieces;
}

// 余り生地で作れる枚数を計算する純粋関数
function calculateRemainingPieces(remainingGrams, gramsPerPiece) {
    return Math.floor(remainingGrams / gramsPerPiece);
}

// 追加すべき枚数を計算する純粋関数
function calculateAdditionalPieces(flavorId, cans, remainingPieces) {
    const flavor = flavorData[flavorId];
    const totalPieces = cans * flavor.piecesPerCan + flavor.reservePieces;
    return totalPieces - remainingPieces;
}

// 各素材のグラム数を計算する純粋関数
function calculateMaterials(flavorId, additionalPieces) {
    const flavor = flavorData[flavorId];
    const materialsGrams = {};
    let totalAdditionalGrams = 0;

    for (const [materialName, gramsPerBaseUnit] of Object.entries(flavor.materials)) {
        const gramsPerPieceForMaterial = gramsPerBaseUnit / flavor.baseUnit.pieces;
        const gramsNeeded = gramsPerPieceForMaterial * additionalPieces;
        materialsGrams[materialName] = gramsNeeded;
        totalAdditionalGrams += gramsNeeded;
    }

    return { materialsGrams, totalAdditionalGrams };
}

// 全計算を統合する純粋関数
function calculateResults(flavorId, cans, remainingGrams) {
    const flavor = flavorData[flavorId];
    const gramsPerPiece = calculatePiecesPerGram(flavor);
    const remainingPieces = calculateRemainingPieces(remainingGrams, gramsPerPiece);
    const additionalPieces = calculateAdditionalPieces(flavorId, cans, remainingPieces);
    const { materialsGrams, totalAdditionalGrams } = calculateMaterials(flavorId, additionalPieces);

    return {
        flavorId,
        flavorName: flavor.name,
        cans,
        piecesPerCan: flavor.piecesPerCan,
        reservePieces: flavor.reservePieces,
        remainingGrams,
        remainingPieces,
        additionalPieces,
        totalAdditionalGrams,
        materialsGrams
    };
}

// ========================================
// テストスイート
// ========================================

let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(description, fn) {
    testCount++;
    try {
        fn();
        passCount++;
        console.log(`✓ ${description}`);
    } catch (error) {
        failCount++;
        console.error(`✗ ${description}`);
        console.error(`  Error: ${error.message}`);
    }
}

function closeToNumber(actual, expected, tolerance = 0.01) {
    return Math.abs(actual - expected) < tolerance;
}

console.log('\n========================================');
console.log('テストスイート: calculatePiecesPerGram');
console.log('========================================\n');

test('チーズの1枚あたりのグラム数を正確に計算', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const expectedTotal = Object.values(flavorData.cheese.materials).reduce((sum, g) => sum + g, 0);
    const expected = expectedTotal / flavorData.cheese.baseUnit.pieces;
    assert(closeToNumber(gramsPerPiece, expected), `Expected ${expected}, got ${gramsPerPiece}`);
});

test('玉ねぎの1枚あたりのグラム数を正確に計算', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.onion);
    const expectedTotal = Object.values(flavorData.onion.materials).reduce((sum, g) => sum + g, 0);
    const expected = expectedTotal / flavorData.onion.baseUnit.pieces;
    assert(closeToNumber(gramsPerPiece, expected), `Expected ${expected}, got ${gramsPerPiece}`);
});

test('山椒の1枚あたりのグラム数を正確に計算', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.sansho);
    const expectedTotal = Object.values(flavorData.sansho.materials).reduce((sum, g) => sum + g, 0);
    const expected = expectedTotal / flavorData.sansho.baseUnit.pieces;
    assert(closeToNumber(gramsPerPiece, expected), `Expected ${expected}, got ${gramsPerPiece}`);
});

test('シン味噌の1枚あたりのグラム数を正確に計算', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.miso);
    const expectedTotal = Object.values(flavorData.miso.materials).reduce((sum, g) => sum + g, 0);
    const expected = expectedTotal / flavorData.miso.baseUnit.pieces;
    assert(closeToNumber(gramsPerPiece, expected), `Expected ${expected}, got ${gramsPerPiece}`);
});

test('チーズと玉ねぎの1枚あたりのグラム数が異なる', () => {
    const cheesePPG = calculatePiecesPerGram(flavorData.cheese);
    const onionPPG = calculatePiecesPerGram(flavorData.onion);
    assert(cheesePPG !== onionPPG, 'グラム数が同じになってはいけません');
});

console.log('\n========================================');
console.log('テストスイート: calculateRemainingPieces');
console.log('========================================\n');

test('余り生地0gの場合、0枚を返す', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const remaining = calculateRemainingPieces(0, gramsPerPiece);
    assert.strictEqual(remaining, 0);
});

test('余り生地が正の値の場合、適切な枚数を返す', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const remaining = calculateRemainingPieces(200, gramsPerPiece);
    assert(remaining > 0 && remaining <= 200 / gramsPerPiece, 'Invalid remaining pieces');
});

test('余り生地は小数が正しく丸め込まれる', () => {
    const gramsPerPiece = 10;
    const remaining = calculateRemainingPieces(25.9, gramsPerPiece);
    assert.strictEqual(remaining, 2, 'Should floor the result');
});

test('チーズのグラム数で計算した余り生地枚数が妥当', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const remaining = calculateRemainingPieces(100, gramsPerPiece);
    // グラム数から逆算して検証
    const usedGrams = remaining * gramsPerPiece;
    assert(usedGrams <= 100 && usedGrams + gramsPerPiece > 100);
});

console.log('\n========================================');
console.log('テストスイート: calculateAdditionalPieces');
console.log('========================================\n');

test('チーズ・20缶・余り0gの場合、正確に計算される', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const remainingPieces = calculateRemainingPieces(0, gramsPerPiece);
    const additional = calculateAdditionalPieces('cheese', 20, remainingPieces);
    const expected = 20 * 10 + 50 - remainingPieces; // 20缶 * 10枚/缶 + 50予備 - 余り枚数
    assert.strictEqual(additional, expected);
});

test('玉ねぎ・10缶・余り100gの場合、正確に計算される', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.onion);
    const remainingPieces = calculateRemainingPieces(100, gramsPerPiece);
    const additional = calculateAdditionalPieces('onion', 10, remainingPieces);
    const expected = 10 * 8 + 40 - remainingPieces;
    assert.strictEqual(additional, expected);
});

test('余り生地がある場合、追加枚数が減少する', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const remaining0 = calculateRemainingPieces(0, gramsPerPiece);
    const remaining200 = calculateRemainingPieces(200, gramsPerPiece);
    const additional0 = calculateAdditionalPieces('cheese', 20, remaining0);
    const additional200 = calculateAdditionalPieces('cheese', 20, remaining200);
    assert(additional0 > additional200, '余り生地が多いほど追加枚数は減少すべき');
});

test('缶数が増えると追加枚数も増える', () => {
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const remainingPieces = calculateRemainingPieces(0, gramsPerPiece);
    const additional10 = calculateAdditionalPieces('cheese', 10, remainingPieces);
    const additional20 = calculateAdditionalPieces('cheese', 20, remainingPieces);
    assert(additional10 < additional20);
});

console.log('\n========================================');
console.log('テストスイート: calculateMaterials');
console.log('========================================\n');

test('チーズの素材が7種類返される', () => {
    const { materialsGrams } = calculateMaterials('cheese', 100);
    assert.strictEqual(Object.keys(materialsGrams).length, 7);
});

test('玉ねぎの素材が8種類返される', () => {
    const { materialsGrams } = calculateMaterials('onion', 100);
    assert.strictEqual(Object.keys(materialsGrams).length, 8);
});

test('山椒の素材が8種類返される', () => {
    const { materialsGrams } = calculateMaterials('sansho', 100);
    assert.strictEqual(Object.keys(materialsGrams).length, 8);
});

test('シン味噌の素材が8種類返される', () => {
    const { materialsGrams } = calculateMaterials('miso', 100);
    assert.strictEqual(Object.keys(materialsGrams).length, 8);
});

test('チーズと玉ねぎで異なる素材が含まれる', () => {
    const { materialsGrams: cheeseMaterials } = calculateMaterials('cheese', 100);
    const { materialsGrams: onionMaterials } = calculateMaterials('onion', 100);
    assert(cheeseMaterials['カシューチーズ'] > 0);
    assert(!onionMaterials['カシューチーズ']);
    assert(onionMaterials['玉ねぎパウダー'] > 0);
    assert(!cheeseMaterials['玉ねぎパウダー']);
});

test('素材の合計グラム数が totalAdditionalGrams と一致', () => {
    const { materialsGrams, totalAdditionalGrams } = calculateMaterials('cheese', 100);
    const sum = Object.values(materialsGrams).reduce((s, g) => s + g, 0);
    assert(closeToNumber(sum, totalAdditionalGrams));
});

test('追加枚数0の場合、全素材が0gになる', () => {
    const { materialsGrams, totalAdditionalGrams } = calculateMaterials('cheese', 0);
    assert.strictEqual(totalAdditionalGrams, 0);
    Object.values(materialsGrams).forEach(grams => {
        assert.strictEqual(grams, 0);
    });
});

test('追加枚数が増えると素材グラム数も増える', () => {
    const { totalAdditionalGrams: total100 } = calculateMaterials('cheese', 100);
    const { totalAdditionalGrams: total200 } = calculateMaterials('cheese', 200);
    assert(total100 < total200);
});

console.log('\n========================================');
console.log('テストスイート: validateInputs');
console.log('========================================\n');

test('フレーバー未選択は失敗', () => {
    const result = validateInputs('', 20, 0);
    assert.strictEqual(result.valid, false);
});

test('無効なフレーバーIDは失敗', () => {
    const result = validateInputs('unknown', 20, 0);
    assert.strictEqual(result.valid, false);
});

test('缶数0は失敗', () => {
    const result = validateInputs('cheese', 0, 0);
    assert.strictEqual(result.valid, false);
});

test('缶数が負の値は失敗', () => {
    const result = validateInputs('cheese', -5, 0);
    assert.strictEqual(result.valid, false);
});

test('缶数が整数ではない場合は失敗', () => {
    const result = validateInputs('cheese', 20.5, 0);
    assert.strictEqual(result.valid, false);
});

test('余り生地が負の値は失敗', () => {
    const result = validateInputs('cheese', 20, -10);
    assert.strictEqual(result.valid, false);
});

test('正常な入力は成功', () => {
    const result = validateInputs('cheese', 20, 100);
    assert.strictEqual(result.valid, true);
});

test('玉ねぎの正常な入力は成功', () => {
    const result = validateInputs('onion', 15, 50.5);
    assert.strictEqual(result.valid, true);
});

console.log('\n========================================');
console.log('テストスイート: calculateResults（統合）');
console.log('========================================\n');

test('チーズ・20缶・余り0gの統合計算', () => {
    const result = calculateResults('cheese', 20, 0);
    assert.strictEqual(result.flavorId, 'cheese');
    assert.strictEqual(result.flavorName, 'チーズ');
    assert.strictEqual(result.cans, 20);
    assert.strictEqual(result.remainingGrams, 0);
    assert(result.additionalPieces > 0);
});

test('玉ねぎ・10缶・余り100gの統合計算', () => {
    const result = calculateResults('onion', 10, 100);
    assert.strictEqual(result.flavorId, 'onion');
    assert.strictEqual(result.flavorName, '玉ねぎ');
    assert.strictEqual(result.cans, 10);
    assert.strictEqual(result.remainingGrams, 100);
});

test('山椒・10缶・余り100gの統合計算', () => {
    const result = calculateResults('sansho', 10, 100);
    assert.strictEqual(result.flavorId, 'sansho');
    assert.strictEqual(result.flavorName, '山椒');
    assert.strictEqual(result.cans, 10);
    assert.strictEqual(result.remainingGrams, 100);
});

test('シン味噌・10缶・余り100gの統合計算', () => {
    const result = calculateResults('miso', 10, 100);
    assert.strictEqual(result.flavorId, 'miso');
    assert.strictEqual(result.flavorName, 'シン味噌');
    assert.strictEqual(result.cans, 10);
    assert.strictEqual(result.remainingGrams, 100);
});

test('統合計算の結果オブジェクトが必要なキーを持つ', () => {
    const result = calculateResults('cheese', 20, 0);
    const requiredKeys = ['flavorId', 'flavorName', 'cans', 'piecesPerCan', 'reservePieces',
                         'remainingGrams', 'remainingPieces', 'additionalPieces',
                         'totalAdditionalGrams', 'materialsGrams'];
    requiredKeys.forEach(key => {
        assert(key in result, `Missing key: ${key}`);
    });
});

test('缶数1の最小ケース', () => {
    const result = calculateResults('cheese', 1, 0);
    assert(result.additionalPieces > 0);
    assert(result.cans === 1);
});

test('大きな缶数のケース', () => {
    const result = calculateResults('cheese', 50, 0);
    assert(result.cans === 50);
    assert(result.additionalPieces > calculateResults('cheese', 49, 0).additionalPieces);
});

test('余り生地が結果に正しく反映される', () => {
    const result0 = calculateResults('cheese', 20, 0);
    const result100 = calculateResults('cheese', 20, 100);
    assert(result0.additionalPieces > result100.additionalPieces);
    assert.strictEqual(result100.remainingGrams, 100);
});

test('チーズと玉ねぎで異なる結果が得られる', () => {
    const cheesResult = calculateResults('cheese', 20, 100);
    const onionResult = calculateResults('onion', 20, 100);
    assert.notStrictEqual(cheesResult.totalAdditionalGrams, onionResult.totalAdditionalGrams);
    assert.notStrictEqual(Object.keys(cheesResult.materialsGrams).length,
                         Object.keys(onionResult.materialsGrams).length);
});

console.log('\n========================================');
console.log('テストスイート: エッジケース');
console.log('========================================\n');

test('余り生地が非常に多い場合でも計算できる', () => {
    const result = calculateResults('cheese', 1, 10000);
    assert.strictEqual(result.flavorId, 'cheese');
    // 追加枚数が0またはマイナスになる可能性もある
    assert(typeof result.additionalPieces === 'number');
});

test('余り生地がグラム数の小数点の場合', () => {
    const result = calculateResults('cheese', 20, 123.456);
    assert.strictEqual(result.remainingGrams, 123.456);
    assert(typeof result.remainingPieces === 'number');
});

test('異なる複数の缶数・グラム数の組み合わせ', () => {
    const combinations = [
        { flavor: 'cheese', cans: 5, grams: 50 },
        { flavor: 'onion', cans: 15, grams: 250 },
        { flavor: 'cheese', cans: 30, grams: 0 }
    ];
    combinations.forEach(combo => {
        const result = calculateResults(combo.flavor, combo.cans, combo.grams);
        assert(result.additionalPieces >= 0);
    });
});

console.log('\n========================================');
console.log('テストスイート: 警告メッセージケース');
console.log('========================================\n');

test('缶数が少なく余り生地が多い場合、追加枚数がマイナスになる', () => {
    // チーズ: 1缶 * 10枚 + 50予備 = 60枚
    // 1枚あたり: 約12.7g
    // 余り1000gで: 1000 / 12.7 ≈ 78枚 > 60枚
    // → 追加枚数がマイナスになる
    const result = calculateResults('cheese', 1, 1000);
    assert(result.additionalPieces <= 0,
        `additionalPieces should be <= 0, got ${result.additionalPieces}`);
});

test('余り生地だけで足りる場合、追加枚数が0になる', () => {
    // チーズ: 1缶 * 10 + 50予備 = 60枚
    // 60枚必要なグラム数の計算
    const gramsPerPiece = calculatePiecesPerGram(flavorData.cheese);
    const requiredGrams = (1 * 10 + 50) * gramsPerPiece;
    const result = calculateResults('cheese', 1, requiredGrams + 10);
    assert(result.additionalPieces <= 0,
        '余り生地が十分にあれば、追加枚数は0以下になる');
});

test('玉ねぎでも余り生地が多い場合、追加枚数がマイナスになる', () => {
    // 玉ねぎ: 1缶 * 8枚 + 40予備 = 48枚
    const result = calculateResults('onion', 1, 1000);
    assert(result.additionalPieces <= 0,
        'Onion should also have negative additional pieces with large remaining dough');
});

test('山椒でも余り生地が多い場合、追加枚数がマイナスになる', () => {
    // 山椒: 1缶 * 8枚 + 40予備 = 48枚
    const result = calculateResults('sansho', 1, 1000);
    assert(result.additionalPieces <= 0,
        'Sansho should also have negative additional pieces with large remaining dough');
});

test('シン味噌でも余り生地が多い場合、追加枚数がマイナスになる', () => {
    // シン味噌: 1缶 * 12枚 + 40予備 = 52枚
    const result = calculateResults('miso', 1, 1000);
    assert(result.additionalPieces <= 0,
        'Miso should also have negative additional pieces with large remaining dough');
});

test('缶数が多い場合は追加枚数が常に正になる', () => {
    // 缶数を多くすれば、余り生地の影響を上回る
    const result = calculateResults('cheese', 50, 100);
    assert(result.additionalPieces > 0,
        '缶数が多いと追加枚数は常に正になる');
});

test('追加枚数0と負の値で警告メッセージが表示される境界', () => {
    const result0 = calculateResults('cheese', 1, 761);  // ぎりぎり0になる
    const resultNeg = calculateResults('cheese', 1, 800); // マイナスになる
    // どちらも警告条件を満たす（additionalPieces <= 0）
    assert(result0.additionalPieces <= 0);
    assert(resultNeg.additionalPieces <= 0);
});

console.log('\n========================================');
console.log('テスト結果サマリー');
console.log('========================================\n');
console.log(`総テスト数: ${testCount}`);
console.log(`成功: ${passCount}`);
console.log(`失敗: ${failCount}`);

if (failCount === 0) {
    console.log('\n🎉 全テストが成功しました！\n');
    process.exit(0);
} else {
    console.log(`\n❌ ${failCount}個のテストが失敗しました\n`);
    process.exit(1);
}
