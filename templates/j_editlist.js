//------------------------------------------------
// !!!!! vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv
//
// TODO(sandello): Правки по Левенштейну.
//
// Необходимо реализовать алгоритм расчета расстояния Левенштейна
// между строками left и right и вернуть "список правок",
// как получить из левой строки -- правую.
//
// На входе -- две строки.
// На выходе -- массив правок вида:
// [
//   ["I", 0, "a"], // вставка
//   ["D", 3],      // удаление
//   ["X", 4, "b"], // замена
// ]
//
// Пример:
//   * editList("cat", "cats") = [ ["I", 3, "s"] ]
//   * editList("cat", "cuts") = [ ["X", 1, "u"], ["I", 3, "s"] ]
//   * editList("cat", "at")   = [ ["D", 0 ] ]
//   * editList("", "hi")      = [ ["I", 0, "h"], ["I", 1, "i"] ]
//
// Подсказки:
//   1. Для ассоциативной структуры данных с численными ключами можно использовать JS-объекты:
//        var a = {}; a[5] = 0;
//      При этом элементы, к которым не было обращений -- не инициализированы.
//        var a = {}; a[8] === undefined;
//      Проверка наличия ключа может быть устроена так:
//        var a = {}; if (a[8] === undefined) { /* нет ключа */ } else { /* есть ключ */ }
//   2. Для ассоциативной структуры с произвольным ключами можно использовать Map.
//      https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Map

function resCmp(a, b) {
    if (a.type == "D" && b.type == "I") return -1;
    if (a.type == "I" && b.type == "D") return 1;
    if (a.type == b.type && a.type == "I") return a.pos - b.pos;
    return b.pos - a.pos;
}

function editList(left, right) {
    var inf = 1e9;
    var dp = [];
    var p = [];
    for (var i = 0; i <= left.length; i++) {
        dp.push([]);
        p.push([]);
        for (var j = 0; j <= right.length; j++) {
            dp[i].push(inf);
            p[i].push([0, 0, { type: "", pos: 0, symbol: "" }]);
        }
    }
    dp[0][0] = 0;
    p[0][0] = [-1, -1, { type: "", pos: 0, symbol: "" }];
    for (var i = 1; i <= left.length; i++) {
        dp[i][0] = dp[i - 1][0] + 1;
        p[i][0] = [i - 1, 0, { type: "D", pos: i - 1, symbol: left[i - 1] }];
    }
    for (var i = 1; i <= right.length; i++) {
        dp[0][i] = dp[0][i - 1] + 1;
        p[0][i] = [0, i - 1, { type: "I", pos: i - 1, symbol: right[i - 1] }];
    }
    for (var i = 1; i <= left.length; i++) {
        for (var j = 1; j <= right.length; j++) {
            if (dp[i][j] > dp[i - 1][j] + 1) {
                dp[i][j] = dp[i - 1][j] + 1;
                p[i][j] = [i - 1, j, { type: "D", pos: i - 1, symbol: left[i - 1] }];
            }
            if (dp[i][j] > dp[i][j - 1] + 1) {
                dp[i][j] = dp[i][j - 1] + 1;
                p[i][j] = [i, j - 1, { type: "I", pos: j - 1, symbol: right[j - 1] }];
            }
            if (left[i - 1] == right[j - 1]) {
                if (dp[i][j] > dp[i - 1][j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                    p[i][j] = [i - 1, j - 1, { type: "A", pos: i - 1, symbol: right[j - 1] }];
                }
            }
        }
    }
    var res = [];
    var x = left.length;
    var y = right.length;
    while (x != 0 || y != 0) {
        if (p[x][y][2].type != "A") {
            res.push(p[x][y][2]);
        }
        var buf = x;
        x = p[x][y][0];
        y = p[buf][y][1];
    }
    res.reverse();
    res.sort(resCmp);
    return res;
}

// !!!!! ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^
//------------------------------------------------
