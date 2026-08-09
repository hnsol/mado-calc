// テスト実行用ファイル
// Node.js の標準 assert モジュールを使用
const assert = require('assert');

// script.js から flavorData と計算関数を読み込む（二重管理を防ぐため）
const { flavorData, validateInputs, calculateMaterials, calculateResults } = require('./script.js');

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

function closeToNumber(actual, expected, tolerance = 1e-6) {
    return Math.abs(actual - expected) < tolerance;
}

// 期待される必要グラム数（materials_i × cans/baseCans + reserveMaterials_i）を算出するヘルパー
function expectedRequiredGrams(flavorId, cans) {
    const flavor = flavorData[flavorId];
    const requiredGrams = {};
    let requiredTotalGrams = 0;
    for (const [materialName, baseGrams] of Object.entries(flavor.materials)) {
        const reserveGrams = flavor.reserveMaterials[materialName] || 0;
        const grams = (baseGrams * cans) / flavor.baseCans + reserveGrams;
        requiredGrams[materialName] = grams;
        requiredTotalGrams += grams;
    }
    return { requiredGrams, requiredTotalGrams };
}

console.log('\n========================================');
console.log('テストスイート: ゴールデンテスト（移行等価性・余り0）');
console.log('========================================\n');

test('チーズ・20缶・余り0gの各素材グラム数が期待値と一致', () => {
    const result = calculateResults('cheese', 20, 0);
    const expected = {
        '米粉': 515.625,
        '砂糖（白）': 191.625,
        '太白ごま油': 203.125,
        '卵': 130.25,
        '片栗粉': 95.875,
        '塩': 19.125,
        'カシューチーズ': 250
    };
    for (const [materialName, expectedGrams] of Object.entries(expected)) {
        assert(
            closeToNumber(result.materialsGrams[materialName], expectedGrams),
            `${materialName}: expected ${expectedGrams}, got ${result.materialsGrams[materialName]}`
        );
    }
    assert(closeToNumber(result.totalAdditionalGrams, 1405.625),
        `Expected total 1405.625, got ${result.totalAdditionalGrams}`);
});

test('チーズ・40缶・余り0gの各素材グラム数が materials_i + reserveMaterials_i と一致', () => {
    const result = calculateResults('cheese', 40, 0);
    const flavor = flavorData.cheese;
    for (const [materialName, baseGrams] of Object.entries(flavor.materials)) {
        const expectedGrams = baseGrams + flavor.reserveMaterials[materialName];
        assert(
            closeToNumber(result.materialsGrams[materialName], expectedGrams),
            `${materialName}: expected ${expectedGrams}, got ${result.materialsGrams[materialName]}`
        );
    }
    assert(closeToNumber(result.materialsGrams['米粉'], 928.125),
        `米粉: expected 928.125, got ${result.materialsGrams['米粉']}`);
    assert(closeToNumber(result.totalAdditionalGrams, 2530.125),
        `Expected total 2530.125, got ${result.totalAdditionalGrams}`);
});

['cheese', 'onion', 'maitake', 'sansho', 'miso'].forEach((flavorId) => {
    [40, 20, 7].forEach((cans) => {
        test(`${flavorId}・${cans}缶・余り0gの計算が materials_i×cans/40 + reserveMaterials_i と一致`, () => {
            const result = calculateResults(flavorId, cans, 0);
            const { requiredGrams, requiredTotalGrams } = expectedRequiredGrams(flavorId, cans);
            for (const [materialName, expectedGrams] of Object.entries(requiredGrams)) {
                assert(
                    closeToNumber(result.materialsGrams[materialName], expectedGrams),
                    `${flavorId}/${cans}缶/${materialName}: expected ${expectedGrams}, got ${result.materialsGrams[materialName]}`
                );
            }
            assert(closeToNumber(result.totalAdditionalGrams, requiredTotalGrams),
                `${flavorId}/${cans}缶: expected total ${requiredTotalGrams}, got ${result.totalAdditionalGrams}`);
        });
    });
});

console.log('\n========================================');
console.log('テストスイート: 余り差し引き（比率按分）');
console.log('========================================\n');

test('余り生地がある場合、追加合計gは必要合計gから余りgを引いた値になる', () => {
    const { requiredTotalGrams } = expectedRequiredGrams('cheese', 20);
    const remainingGrams = 100;
    const result = calculateResults('cheese', 20, remainingGrams);
    assert(closeToNumber(result.totalAdditionalGrams, requiredTotalGrams - remainingGrams),
        `Expected ${requiredTotalGrams - remainingGrams}, got ${result.totalAdditionalGrams}`);
});

test('余り生地がある場合、各素材が比率按分され、合計が totalAdditionalGrams に一致', () => {
    const result = calculateResults('onion', 15, 200);
    const { requiredGrams, requiredTotalGrams } = expectedRequiredGrams('onion', 15);
    for (const [materialName, grams] of Object.entries(requiredGrams)) {
        const expectedGrams = result.totalAdditionalGrams * (grams / requiredTotalGrams);
        assert(
            closeToNumber(result.materialsGrams[materialName], expectedGrams),
            `${materialName}: expected ${expectedGrams}, got ${result.materialsGrams[materialName]}`
        );
    }
    const sum = Object.values(result.materialsGrams).reduce((s, g) => s + g, 0);
    assert(closeToNumber(sum, result.totalAdditionalGrams),
        `Sum of materialsGrams (${sum}) should equal totalAdditionalGrams (${result.totalAdditionalGrams})`);
});

console.log('\n========================================');
console.log('テストスイート: 境界（余り ≥ 必要合計）');
console.log('========================================\n');

test('余り生地が必要合計gと同じ場合、追加合計gが0になる', () => {
    const { requiredTotalGrams } = expectedRequiredGrams('cheese', 1);
    const result = calculateResults('cheese', 1, requiredTotalGrams);
    assert(result.totalAdditionalGrams <= 0,
        `additionalGrams should be <= 0, got ${result.totalAdditionalGrams}`);
});

test('余り生地が必要合計gを超える場合、追加合計gがマイナスになる', () => {
    const { requiredTotalGrams } = expectedRequiredGrams('cheese', 1);
    const result = calculateResults('cheese', 1, requiredTotalGrams + 100);
    assert(result.totalAdditionalGrams < 0,
        `additionalGrams should be < 0, got ${result.totalAdditionalGrams}`);
});

['onion', 'maitake', 'sansho', 'miso'].forEach((flavorId) => {
    test(`${flavorId}でも余り生地が多い場合、追加合計gがマイナスになる`, () => {
        const result = calculateResults(flavorId, 1, 10000);
        assert(result.totalAdditionalGrams <= 0,
            `${flavorId} should have additionalGrams <= 0, got ${result.totalAdditionalGrams}`);
    });
});

test('缶数が多い場合は追加合計gが常に正になる', () => {
    const result = calculateResults('cheese', 50, 100);
    assert(result.totalAdditionalGrams > 0,
        '缶数が多いと追加合計gは常に正になる');
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
    assert.strictEqual(result.flavorName, '🧀 チーズ');
    assert.strictEqual(result.cans, 20);
    assert.strictEqual(result.remainingGrams, 0);
    assert(result.totalAdditionalGrams > 0);
});

test('玉ねぎ・10缶・余り100gの統合計算', () => {
    const result = calculateResults('onion', 10, 100);
    assert.strictEqual(result.flavorId, 'onion');
    assert.strictEqual(result.flavorName, '🧅 玉ねぎ');
    assert.strictEqual(result.cans, 10);
    assert.strictEqual(result.remainingGrams, 100);
});

test('山椒・10缶・余り100gの統合計算', () => {
    const result = calculateResults('sansho', 10, 100);
    assert.strictEqual(result.flavorId, 'sansho');
    assert.strictEqual(result.flavorName, '🌿 山椒');
    assert.strictEqual(result.cans, 10);
    assert.strictEqual(result.remainingGrams, 100);
});

test('味噌・10缶・余り100gの統合計算', () => {
    const result = calculateResults('miso', 10, 100);
    assert.strictEqual(result.flavorId, 'miso');
    assert.strictEqual(result.flavorName, '🫘 味噌');
    assert.strictEqual(result.cans, 10);
    assert.strictEqual(result.remainingGrams, 100);
});

test('統合計算の結果オブジェクトが必要なキーを持つ', () => {
    const result = calculateResults('cheese', 20, 0);
    const requiredKeys = ['flavorId', 'flavorName', 'cans', 'remainingGrams',
                         'requiredTotalGrams', 'totalAdditionalGrams', 'materialsGrams'];
    requiredKeys.forEach(key => {
        assert(key in result, `Missing key: ${key}`);
    });
});

test('缶数1の最小ケース', () => {
    const result = calculateResults('cheese', 1, 0);
    assert(result.totalAdditionalGrams > 0);
    assert(result.cans === 1);
});

test('大きな缶数のケース', () => {
    const result = calculateResults('cheese', 50, 0);
    assert(result.cans === 50);
    assert(result.totalAdditionalGrams > calculateResults('cheese', 49, 0).totalAdditionalGrams);
});

test('余り生地が結果に正しく反映される', () => {
    const result0 = calculateResults('cheese', 20, 0);
    const result100 = calculateResults('cheese', 20, 100);
    assert(result0.totalAdditionalGrams > result100.totalAdditionalGrams);
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
console.log('テストスイート: calculateMaterials');
console.log('========================================\n');

test('チーズの素材が7種類返される', () => {
    const { materialsGrams } = calculateMaterials('cheese', 20, 0);
    assert.strictEqual(Object.keys(materialsGrams).length, 7);
});

test('玉ねぎの素材が8種類返される', () => {
    const { materialsGrams } = calculateMaterials('onion', 20, 0);
    assert.strictEqual(Object.keys(materialsGrams).length, 8);
});

test('山椒の素材が8種類返される', () => {
    const { materialsGrams } = calculateMaterials('sansho', 20, 0);
    assert.strictEqual(Object.keys(materialsGrams).length, 8);
});

test('味噌の素材が8種類返される', () => {
    const { materialsGrams } = calculateMaterials('miso', 20, 0);
    assert.strictEqual(Object.keys(materialsGrams).length, 8);
});

test('チーズと玉ねぎで異なる素材が含まれる', () => {
    const { materialsGrams: cheeseMaterials } = calculateMaterials('cheese', 20, 0);
    const { materialsGrams: onionMaterials } = calculateMaterials('onion', 20, 0);
    assert(cheeseMaterials['カシューチーズ'] > 0);
    assert(!onionMaterials['カシューチーズ']);
    assert(onionMaterials['玉ねぎパウダー'] > 0);
    assert(!cheeseMaterials['玉ねぎパウダー']);
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
