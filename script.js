// seedrandomの初期化
(function(global, module, define) {
    function Alea(seed) {
        var s0 = 0, s1 = 0, s2 = 0, c = 1;
        var mash = Mash();
        s0 = mash(' ');
        s1 = mash(' ');
        s2 = mash(' ');
        c = 1;
        if (seed) {
            s0 -= mash(seed);
            if (s0 < 0) s0 += 1;
            s1 -= mash(seed);
            if (s1 < 0) s1 += 1;
            s2 -= mash(seed);
            if (s2 < 0) s2 += 1;
        }
        function random() {
            var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
            s0 = s1;
            s1 = s2;
            return s2 = t - (c = t | 0);
        }
        random.uint32 = function() {
            return random() * 0x100000000; // 2^32
        };
        random.fract53 = function() {
            return random() + 
                (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
        };
        random.version = 'Alea 0.9';
        random.args = seed;
        return random;
    }
    function Mash() {
        var n = 0xefc8249d;
        var mash = function(data) {
            data = data.toString();
            for (var i = 0; i < data.length; i++) {
                n += data.charCodeAt(i);
                var h = 0.02519603282416938 * n;
                n = h >>> 0;
                h -= n;
                h *= n;
                n = h >>> 0;
                h -= n;
                n += h * 0x100000000; // 2^32
            }
            return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
        };
        return mash;
    }
    global.seedrandom = Alea;
    global.Math.seedrandom = function(seed) {
        global.Math.random = Alea(seed);
    };
})(this, {}, function() {});

// URLからS/N（seed）を取得する
function getSNFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("seed") || ""; // "seed" パラメータが存在しない場合は空文字を返す
}

// 新しいシードを生成する
function generateSeed() {
    let seedParts = [];
    for (let i = 0; i < 4; i++) {
        let part = Math.floor(Math.random() * Math.pow(16, 4)).toString(16).padStart(4, '0').toUpperCase();
        seedParts.push(part);
    }
    return seedParts.join('');
}

// テーブルを生成する
function generateTable(seed) {
    Math.seedrandom(seed);
    const numberTransformChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234'.split('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$*%'.split('');
    const resultChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:,.<>?'.split('');

    let table = [];
    let usedNumbers = new Set();
    let topLeftIndex = 0;
    let bottomRightIndex = 15;

    for (let i = 0; i < 5; i++) {
        let row = [];
        for (let j = 0; j < 3; j++) {
            let topLeft = numberTransformChars[topLeftIndex++];
            let bottomRight = numberTransformChars[bottomRightIndex++];
            bottomRightIndex %= numberTransformChars.length;

            let randomChar;
            do {
                randomChar = Math.floor(Math.random() * 10).toString();
            } while (usedNumbers.has(randomChar) && usedNumbers.size < 10);
            usedNumbers.add(randomChar);

            row.push({ topLeft, bottomRight, main: randomChar });
        }
        table.push(row);
    }

    let usedSourceChars = new Set();
    let usedResultChars = new Set();

    for (let i = 0; i < 4; i++) {
        let row = [];
        for (let j = 0; j < 10; j++) {
            let sourceChar;
            do {
                sourceChar = chars[Math.floor(Math.random() * chars.length)];
            } while (usedSourceChars.has(sourceChar));
            usedSourceChars.add(sourceChar);

            let resultChar;
            do {
                resultChar = resultChars[Math.floor(Math.random() * resultChars.length)];
            } while (usedResultChars.has(resultChar));
            usedResultChars.add(resultChar);

            row.push({ topLeft: sourceChar, main: resultChar });
        }
        table.push(row);
    }
    return table;
}

// カードを生成する
function generateCard() {
    const seed = document.getElementById("seedInput").value || generateSeed();
    document.getElementById("seedInput").value = seed;
    document.getElementById("displaySeed").textContent = seed;
    document.getElementById("backSerialNumber").textContent = seed;

    Math.seedrandom(seed);
    const table = generateTable(seed);

    let numberTableHTML = '';
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            numberTableHTML += `<div>
                <span class="top-left">${table[i][j].topLeft}</span>
                <span class="bottom-right">${table[i][j].bottomRight}</span>
                <span class="main-char">${table[i][j].main}</span>
            </div>`;
        }
    }
    document.querySelector('.number-table').innerHTML = numberTableHTML;

    let characterTableHTML = '';
    for (let i = 5; i < 9; i++) {
        for (let j = 0; j < 10; j++) {
            characterTableHTML += `<div>
                <span class="top-left">${table[i][j].topLeft}</span>
                <span class="main-char">${table[i][j].main}</span>
            </div>`;
        }
    }
    document.getElementById('passcard').innerHTML = characterTableHTML;

    const qrCodeDiv = document.querySelector('.qr-code');
    qrCodeDiv.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrCodeDiv, {
            text: seed,
            width: 80,
            height: 80,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // URLを更新
    const url = new URL(window.location);
    url.searchParams.set("seed", seed);
    window.history.replaceState({}, '', url);
}

// 新しいカードを生成する
function generateNewCard() {
    document.getElementById('seedInput').value = '';
    generateCard();
}

// カードをひっくり返す
function flipCard() {
    const front = document.querySelector('.front');
    const back = document.querySelector('.back');
    if (front.style.transform === 'rotateY(180deg)') {
        front.style.transform = 'rotateY(0deg)';
        back.style.transform = 'rotateY(180deg)';
    } else {
        front.style.transform = 'rotateY(180deg)';
        back.style.transform = 'rotateY(0deg)';
    }
}

// ページ読み込み時にURLのS/Nを使用してカードを生成
document.addEventListener("DOMContentLoaded", () => {
    const snFromURL = getSNFromURL();
    if (snFromURL) {
        document.getElementById("seedInput").value = snFromURL;
        generateCard();
    }
});
