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

function calculate() {
    const flavorId = document.getElementById('flavor').value;
    const cans = parseInt(document.getElementById('cans').value);
    const remainingGrams = parseFloat(document.getElementById('remainingDough').value) || 0;

    // バリデーション
    if (!flavorId) {
        alert('フレーバーを選択してください');
        return;
    }
    if (!cans || cans < 1) {
        alert('缶数は1以上の整数を入力してください');
        return;
    }

    const flavor = flavorData[flavorId];
    const baseUnit = flavor.baseUnit;

    // 1枚あたりのグラム数を計算
    const totalMaterialsPerBaseUnit = Object.values(flavor.materials).reduce((sum, g) => sum + g, 0);
    const gramsPerPiece = totalMaterialsPerBaseUnit / baseUnit.pieces;

    // 余り生地で作れる枚数
    const remainingPieces = Math.floor(remainingGrams / gramsPerPiece);

    // 缶数に対応する枚数（予備含む）
    const totalPieces = cans * flavor.piecesPerCan + flavor.reservePieces;

    // 追加すべき枚数
    const additionalPieces = totalPieces - remainingPieces;

    // 各素材のグラム数を計算
    const materialsGrams = {};
    let totalAdditionalGrams = 0;

    for (const [materialName, gramsPerBaseUnit] of Object.entries(flavor.materials)) {
        const gramsPerPieceForMaterial = gramsPerBaseUnit / baseUnit.pieces;
        const gramsNeeded = gramsPerPieceForMaterial * additionalPieces;
        materialsGrams[materialName] = gramsNeeded;
        totalAdditionalGrams += gramsNeeded;
    }

    // 結果を表示
    displayResults(
        flavorId,
        flavor.name,
        cans,
        flavor.piecesPerCan,
        flavor.reservePieces,
        remainingGrams,
        remainingPieces,
        additionalPieces,
        totalAdditionalGrams,
        materialsGrams
    );
}

function displayResults(flavorId, flavorName, cans, piecesPerCan, reservePieces,
                        remainingGrams, remainingPieces, additionalPieces,
                        totalAdditionalGrams, materialsGrams) {
    // 缶数分の枚数と予備枚数を計算
    const cansPieces = cans * piecesPerCan;
    const totalPieces = cansPieces + reservePieces;

    // 入力情報の表示
    document.getElementById('resultFlavor').textContent = flavorName;
    document.getElementById('resultCans').textContent = cans;
    document.getElementById('resultTotalPieces').textContent = `${cansPieces} + 予備${reservePieces} = ${totalPieces}`;

    // 余り生地の表示
    document.getElementById('resultRemainingGrams').textContent = remainingGrams.toFixed(1);
    document.getElementById('resultRemainingPieces').textContent = remainingPieces;

    // 追加生地の表示
    document.getElementById('resultAdditionalPieces').textContent = additionalPieces;
    document.getElementById('resultAdditionalGrams').textContent = totalAdditionalGrams.toFixed(1);

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

function clearInputs() {
    document.getElementById('cans').value = '20';
    document.getElementById('remainingDough').value = '0.0';
    document.getElementById('results').style.display = 'none';
}

// フレーバー選択時にアクセント色を変更
document.getElementById('flavor').addEventListener('change', function(e) {
    const flavorId = e.target.value;
    const colors = {
        cheese: '#f0d04d',  // Bright Catppuccin Yellow
        onion: '#d65d0b'    // Catppuccin Brown
    };
    document.documentElement.style.setProperty('--accent-color', colors[flavorId] || '#f0d04d');
});

// 初期表示時にアクセント色を設定
document.documentElement.style.setProperty('--accent-color', '#f0d04d');

// Enterキーで計算できるようにする
document.getElementById('remainingDough').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculate();
    }
});
