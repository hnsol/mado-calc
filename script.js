// フレーバーごとのデータ定義
// 枚数（ユニット枚数・缶あたり枚数・予備枚数）という概念は現実の運用にはもう存在せず、
// グラム値が正である。基準は40缶（baseCans）だが、実際に仕込む缶数（cans）は可変。
// 予備（reserveMaterials）はフレーバーごとの固定グラムで、缶数によらず一定量を加える。
// materials は基準缶数ぶんのグラム（予備を含まない）。
// 値を変更するときは docs/decisions/ の決定記録を参照すること。
const flavorData = {
    cheese: {
        name: '🧀 チーズ',
        color: 'yellow',
        baseCans: 40,
        materials: {
            '米粉': 825,
            '砂糖（白）': 306.6,
            '太白ごま油': 325,
            '卵': 208.4,
            '片栗粉': 153.4,
            '塩': 30.6,
            'カシューチーズ': 400
        },
        reserveMaterials: {
            '米粉': 103.125,
            '砂糖（白）': 38.325,
            '太白ごま油': 40.625,
            '卵': 26.05,
            '片栗粉': 19.175,
            '塩': 3.825,
            'カシューチーズ': 50
        }
    },
    onion: {
        name: '🧅 玉ねぎ',
        color: 'orange',
        baseCans: 40,
        materials: {
            '米粉': 900,
            '砂糖（白）': 400,
            '太白ごま油': 460,
            '卵': 240,
            '片栗粉': 200,
            '塩': 24,
            '玉ねぎパウダー': 60,
            '酒粕': 100
        },
        reserveMaterials: {
            '米粉': 112.5,
            '砂糖（白）': 50,
            '太白ごま油': 57.5,
            '卵': 30,
            '片栗粉': 25,
            '塩': 3,
            '玉ねぎパウダー': 7.5,
            '酒粕': 12.5
        }
    },
    maitake: {
        name: '🍄‍🟫 舞茸',
        color: 'gray',
        baseCans: 40,
        materials: {
            '米粉': 945,
            '砂糖（白）': 420,
            '太白ごま油': 492,
            '卵': 252,
            '片栗粉': 210,
            '塩': 24.78,
            '舞茸パウダー': 63,
            '竹炭': 4.536
        },
        reserveMaterials: {
            '米粉': 118.125,
            '砂糖（白）': 52.5,
            '太白ごま油': 61.5,
            '卵': 31.5,
            '片栗粉': 26.25,
            '塩': 3.0975,
            '舞茸パウダー': 7.875,
            '竹炭': 0.567
        }
    },
    sansho: {
        name: '🌿 山椒',
        color: 'dark green',
        baseCans: 40,
        materials: {
            '米粉': 1170,
            '砂糖（白）': 260,
            '太白ごま油': 533,
            '卵': 390,
            '片栗粉': 156,
            '塩': 31.2,
            'よもぎ': 130,
            '山椒': 65
        },
        reserveMaterials: {
            '米粉': 146.25,
            '砂糖（白）': 32.5,
            '太白ごま油': 66.625,
            '卵': 48.75,
            '片栗粉': 19.5,
            '塩': 3.9,
            'よもぎ': 16.25,
            '山椒': 8.125
        }
    },
    miso: {
        name: '🫘 味噌',
        color: 'brown',
        baseCans: 40,
        materials: {
            '米粉': 800,
            '砂糖（白）': 150,
            '太白ごま油': 400,
            '卵': 300,
            '片栗粉': 100,
            '味噌': 120,
            '柚子胡椒': 12,
            'アーモンドパウダー': 200
        },
        reserveMaterials: {
            '米粉': 100,
            '砂糖（白）': 18.75,
            '太白ごま油': 50,
            '卵': 37.5,
            '片栗粉': 12.5,
            '味噌': 15,
            '柚子胡椒': 1.5,
            'アーモンドパウダー': 25
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

// 各素材の必要グラム数（缶数ぶん + 予備）と、余りgを差し引いた追加グラム数を計算する純粋関数
// 必要g_i(cans) = materials_i × cans / baseCans + reserveMaterials_i
// 追加合計g      = 必要合計g − 余りg
// 追加g_i        = 追加合計g × (必要g_i / 必要合計g)
function calculateMaterials(flavorId, cans, remainingGrams) {
    const flavor = flavorData[flavorId];
    const requiredGrams = {};
    let requiredTotalGrams = 0;

    for (const [materialName, gramsPerBaseCans] of Object.entries(flavor.materials)) {
        const reserveGrams = flavor.reserveMaterials[materialName] || 0;
        const grams = (gramsPerBaseCans * cans) / flavor.baseCans + reserveGrams;
        requiredGrams[materialName] = grams;
        requiredTotalGrams += grams;
    }

    const totalAdditionalGrams = requiredTotalGrams - remainingGrams;

    const materialsGrams = {};
    for (const [materialName, grams] of Object.entries(requiredGrams)) {
        materialsGrams[materialName] = totalAdditionalGrams * (grams / requiredTotalGrams);
    }

    return { materialsGrams, requiredTotalGrams, totalAdditionalGrams };
}

// 全計算を統合する純粋関数
function calculateResults(flavorId, cans, remainingGrams) {
    const flavor = flavorData[flavorId];
    const { materialsGrams, requiredTotalGrams, totalAdditionalGrams } = calculateMaterials(flavorId, cans, remainingGrams);

    return {
        flavorId,
        flavorName: flavor.name,
        cans,
        remainingGrams,
        requiredTotalGrams,
        totalAdditionalGrams,
        materialsGrams
    };
}

// DOM入力を取得して計算・表示を行う関数
function calculate() {
    const flavorId = document.getElementById('flavor').value;
    const cans = parseInt(document.getElementById('cans').value);
    const remainingGrams = parseFloat(document.getElementById('remainingDough').value) || 0;

    // バリデーション
    const validation = validateInputs(flavorId, cans, remainingGrams);
    if (!validation.valid) {
        alert(validation.error);
        return;
    }

    // 計算
    const results = calculateResults(flavorId, cans, remainingGrams);

    // 結果を表示
    displayResults(results);
}

function displayResults(results) {
    const { totalAdditionalGrams, materialsGrams } = results;

    // 警告メッセージを表示するかどうかをチェック（追加合計gが0以下なら材料リストは表示しない）
    const warningMessage = document.getElementById('warningMessage');
    const materialsSection = document.getElementById('materialsSection');
    const showWarning = totalAdditionalGrams <= 0;
    if (warningMessage) {
        warningMessage.style.display = showWarning ? 'block' : 'none';
    }
    if (materialsSection) {
        materialsSection.style.display = showWarning ? 'none' : 'block';
    }

    // 素材ごとのグラム数を表示
    const materialsDetailDiv = document.getElementById('materialsDetail');
    materialsDetailDiv.innerHTML = '';

    for (const [materialName, grams] of Object.entries(materialsGrams)) {
        const row = document.createElement('div');
        row.className = 'materials-row';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'materials-name';
        nameSpan.textContent = materialName;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'materials-value';
        const amountSpan = document.createElement('span');
        amountSpan.className = 'materials-amount';
        amountSpan.textContent = grams.toFixed(1);

        const unitSpan = document.createElement('span');
        unitSpan.className = 'materials-unit';
        unitSpan.textContent = 'g';

        valueSpan.appendChild(amountSpan);
        valueSpan.appendChild(document.createTextNode(' '));
        valueSpan.appendChild(unitSpan);

        row.appendChild(nameSpan);
        row.appendChild(valueSpan);
        materialsDetailDiv.appendChild(row);
    }

    // 合計欄を表示
    const totalDiv = document.getElementById('totalMaterials');
    const totalRow = document.createElement('div');
    totalRow.className = 'materials-row materials-row-total';

    const totalLabel = document.createElement('span');
    totalLabel.className = 'materials-name';
    totalLabel.textContent = '合計';

    const totalValue = document.createElement('span');
    totalValue.className = 'materials-value';
    const totalAmount = document.createElement('span');
    totalAmount.className = 'materials-amount';
    totalAmount.textContent = totalAdditionalGrams.toFixed(1);

    const totalUnit = document.createElement('span');
    totalUnit.className = 'materials-unit';
    totalUnit.textContent = 'g';

    totalValue.appendChild(totalAmount);
    totalValue.appendChild(document.createTextNode(' '));
    totalValue.appendChild(totalUnit);

    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    totalDiv.innerHTML = '';
    totalDiv.appendChild(totalRow);

    // 結果セクションを表示
    document.getElementById('results').style.display = 'block';
}

function setCans(value) {
    document.getElementById('cans').value = value;
    syncPresetButtons('cans');
    clearResults();
}

function setRemainingDough(value) {
    document.getElementById('remainingDough').value = value.toFixed(1);
    syncPresetButtons('remainingDough');
    clearResults();
}

function clearInputs() {
    document.getElementById('cans').value = '20';
    document.getElementById('remainingDough').value = '0.0';
    syncPresetButtons('cans');
    syncPresetButtons('remainingDough');
    document.getElementById('results').style.display = 'none';
}

function clearResults() {
    document.getElementById('results').style.display = 'none';
}

function syncPresetButtons(targetId) {
    const input = document.getElementById(targetId);
    if (!input) {
        return;
    }

    const currentValue = input.value;
    document.querySelectorAll(`.preset-btn[data-target="${targetId}"]`).forEach((button) => {
        const isActive = button.dataset.value === currentValue;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function syncFlavorSelectLabels() {
    const flavorSelect = document.getElementById('flavor');
    if (!flavorSelect) {
        return;
    }

    Array.from(flavorSelect.options).forEach((option) => {
        const flavor = flavorData[option.value];
        if (flavor) {
            option.textContent = flavor.name;
        }
    });
}

// セマンティック色名から16進数カラーコードへのマッピング
const colorMap = {
    yellow: '#df8e1d',       // Catppuccin Yellow
    orange: '#fe8019',       // Catppuccin Orange
    brown: '#d65d0b',        // Catppuccin Brown
    gray: '#6c7086',         // Catppuccin Overlay 0
    'dark green': '#40a02b'  // Catppuccin Green
};

// 材料リストの行色分け用（グレーは基本文字色と近く判別できないため差し替え）
const rowAccentMap = {
    gray: '#7287fd'  // Catppuccin Lavender
};

function onFlavorChange() {
    const flavorId = document.getElementById('flavor').value;
    const flavor = flavorData[flavorId];
    const accentColor = flavor ? colorMap[flavor.color] || '#df8e1d' : '#df8e1d';
    document.documentElement.style.setProperty('--accent-color', accentColor);
    const rowAccentColor = flavor ? (rowAccentMap[flavor.color] || accentColor) : accentColor;
    document.documentElement.style.setProperty('--row-accent-color', rowAccentColor);
    // 計算結果を消去
    document.getElementById('results').style.display = 'none';
}

// DOMContentLoaded で確実に初期化（Safari モバイル対応）
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // select の初期値を確認・設定
        const flavor = document.getElementById('flavor');
        syncFlavorSelectLabels();
        if (!flavor.value) {
            flavor.value = 'cheese';
        }

        // フレーバー選択時にアクセント色を変更して、計算結果を消去
        flavor.addEventListener('change', onFlavorChange);

        // 初期表示時にアクセント色を設定
        onFlavorChange();
        syncPresetButtons('cans');
        syncPresetButtons('remainingDough');

        // Enterキーで計算できるようにする
        document.getElementById('remainingDough').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculate();
            }
        });

        // 缶数が変更されたときに計算結果を消去
        document.getElementById('cans').addEventListener('input', function() {
            syncPresetButtons('cans');
            clearResults();
        });
        document.getElementById('cans').addEventListener('change', function() {
            syncPresetButtons('cans');
            clearResults();
        });

        // 余り生地が変更されたときに計算結果を消去
        document.getElementById('remainingDough').addEventListener('input', function() {
            syncPresetButtons('remainingDough');
            clearResults();
        });
        document.getElementById('remainingDough').addEventListener('change', function() {
            syncPresetButtons('remainingDough');
            clearResults();
        });
    });
}

// Node.js（テスト実行）環境向けエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { flavorData, validateInputs, calculateMaterials, calculateResults };
}
