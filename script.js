// フレーバーごとのデータ定義
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
    const { flavorId, flavorName, cans, piecesPerCan, reservePieces,
            remainingGrams, remainingPieces, additionalPieces,
            totalAdditionalGrams, materialsGrams } = results;

    // 缶数分の枚数と予備枚数を計算
    const cansPieces = cans * piecesPerCan;
    const totalPieces = cansPieces + reservePieces;

    // 警告メッセージを表示するかどうかをチェック
    const warningMessage = document.getElementById('warningMessage');
    if (warningMessage) {
        if (additionalPieces <= 0) {
            warningMessage.style.display = 'block';
        } else {
            warningMessage.style.display = 'none';
        }
    }

    // 入力情報の表示
    document.getElementById('resultFlavor').textContent = flavorName;
    document.getElementById('resultCans').textContent = cans;
    document.getElementById('resultTotalPieces').textContent = `${cansPieces} + 予備${reservePieces} = ${totalPieces}`;

    // 余り生地の表示
    document.getElementById('resultRemainingGrams').textContent = remainingGrams.toFixed(1);
    document.getElementById('resultRemainingPieces').textContent = remainingPieces;

    // 追加生地の表示
    document.getElementById('resultAdditionalPieces').textContent = additionalPieces;

    // 素材ごとのグラム数を表示
    const materialsDetailDiv = document.getElementById('materialsDetail');
    materialsDetailDiv.innerHTML = '';

    for (const [materialName, grams] of Object.entries(materialsGrams)) {
        const p = document.createElement('p');
        p.textContent = `${materialName}: ${grams.toFixed(1)} g`;
        materialsDetailDiv.appendChild(p);
    }

    // 合計欄を表示
    const totalDiv = document.getElementById('totalMaterials');
    const totalP = document.createElement('p');
    totalP.textContent = `合計: ${totalAdditionalGrams.toFixed(1)} g`;
    totalDiv.innerHTML = '';
    totalDiv.appendChild(totalP);

    // 結果セクションを表示
    document.getElementById('results').style.display = 'block';
}

function setCans(value) {
    document.getElementById('cans').value = value;
}

function setRemainingDough(value) {
    document.getElementById('remainingDough').value = value;
}

function clearInputs() {
    document.getElementById('cans').value = '20';
    document.getElementById('remainingDough').value = '0.0';
    document.getElementById('results').style.display = 'none';
}

function onFlavorChange() {
    const flavorId = document.getElementById('flavor').value;
    const colors = {
        cheese: '#df8e1d',  // Catppuccin Yellow
        onion: '#d65d0b'    // Catppuccin Brown
    };
    document.documentElement.style.setProperty('--accent-color', colors[flavorId] || '#df8e1d');
    // 計算結果を消去
    document.getElementById('results').style.display = 'none';
}

// フレーバー選択時にアクセント色を変更して、計算結果を消去（addEventListener併用でSafari対応）
document.getElementById('flavor').addEventListener('change', onFlavorChange);

// 初期表示時にアクセント色を設定
document.documentElement.style.setProperty('--accent-color', '#df8e1d');

// Enterキーで計算できるようにする
document.getElementById('remainingDough').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculate();
    }
});
