// seedrandomの初期化
(function (global, module, define) {
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
        random.uint32 = function () {
            return random() * 0x100000000; // 2^32
        };
        random.fract53 = function () {
            return random() +
                (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
        };
        random.version = 'Alea 0.9';
        random.args = seed;
        return random;
    }
    function Mash() {
        var n = 0xefc8249d;
        var mash = function (data) {
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
    global.Math.seedrandom = function (seed) {
        global.Math.random = Alea(seed);
    };
})(this, {}, function () { });

// URLからS/Nを取得する
function getSNFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("seed") || "0000000000000000"; //パラメータが存在しない場合は0000000000000000を返す
}

// 新しいS/Nを生成する
function generateSeed() {
    let seedParts = [];
    for (let i = 0; i < 4; i++) {
        let part = Math.floor(Math.random() * Math.pow(16, 4)).toString(16).padStart(4, '0').toUpperCase();
        seedParts.push(part);
    }
    return seedParts.join('');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const specialChars = '!@#$%^&*()_+-=[]{},.;:<>?';


function ensureMinimumCharTypes(chars, minCount = 6) {
    const types = {
        upper: chars.filter(function (char) { return /[A-Z]/.test(char); }),
        lower: chars.filter(function (char) { return /[a-z]/.test(char); }),
        digit: chars.filter(function (char) { return /[0-9]/.test(char); }),
        special: chars.filter(function (char) { return /[\W_]/.test(char) && char !== '|'; })
    };
    Object.keys(types).forEach(type => {
        while (types[type].length < minCount) {
            let added = false;
            for (let i = 0; i < chars.length; i++) {
                if (!types[type].includes(chars[i])) {
                    let regex;
                    if (type === 'special') {
                        // 特殊文字の場合、specialCharsを正規表現に変換
                        regex = new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
                    } else {
                        // その他の型（大文字、小文字、数字）では単純に型をテスト
                        regex = new RegExp(`[${type[0].toUpperCase() + type.slice(1)}]`);
                    }
                    if (regex.test(chars[i])) {  // chars[i]を直接使用
                        types[type].push(chars[i]);
                        chars.push(chars.splice(i, 1)[0]);
                        added = true;
                        break;
                    }
                }
            }
            if (!added) break;
        }
    });
    return chars;
}

// テーブルを生成する
function generateTable(seed) {
    Math.seedrandom(seed);
    const numberTransformChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234'.split('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$*%'.split('');
    let resultChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('').concat(specialChars.split(''));

    let table = [];

    //数字への変換
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

    // 文字への変換
    let usedSourceChars = new Set();
    let usedResultChars = new Set();
    let charIndex2 = 0;
    for (let i = 0; i < 4; i++) {
        let row = [];
        for (let j = 0; j < 10; j++) {
            let sourceChar;
            do {
                sourceChar = chars[charIndex2 % chars.length];
                charIndex2++;
            } while (usedSourceChars.has(sourceChar));
            usedSourceChars.add(sourceChar);

            let randomChars = shuffleArray(resultChars).slice(0, 40);
            let selectedChars = ensureMinimumCharTypes(randomChars);
            let resultChar;
            do {
                resultChar = selectedChars[Math.floor(Math.random() * selectedChars.length)];
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
        // QRコードを生成
        new QRCode(qrCodeDiv, {
            text: `https://pwc-generator.vercel.app/?seed=${seed}`,
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

// 表裏を切替
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
