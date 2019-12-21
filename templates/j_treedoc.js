//------------------------------------------------
// !!!!! vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv
//
// TODO(sandello): Модель документа.
//
// Документ (строку) будем моделировать как пару множеств:
//
//   D1 = { (position, symbol) } -- множество пар (позиция, символ);
//   D2 = { position } -- множество удаленных позиций.
//
// Адресация в документе будет строиться по индексам и по позициям.
//
// Индекс -- число -- в классическом понимании идентифицирует символ в строке.
// Индекс меняется от 0 до длины документа минус один.
//
// Позиция -- путь в дереве аллоцированных позиций от корня до листа.
// Позиция кодируется списком индексов потомков на пути от корня до листа.
//
// Пусть A -- арность каждого узла в дереве, например 100. Тогда:
//
//   [0] -- начало строки.
//   [100] -- конец строки (A).
//   [0,14] -- идем к "началу строки", далее к 14-му потомку.
//   [82,11] -- идем к потомку под номером 82, далее к 11-му потомку.

// === Публичный интерфейс.

// Конструктор.
//
// Инициализирует необходимые структуры данных.
// Результат работы конструктора передается далее во все функции первым аргументом.
function public_newDocument() {
    var d1 = [];
    var d2 = new Set();
    var d1s = new Set();
    return { d1, d2, d1s };
}

function to_str(a) {
    var res = "";
    for (var i = 0; i < a.length; i++) {
        res += a[i] + " ";
    }
    return res;
}

function comporator(a, b) {
    for (var i = 0; i < Math.min(a[0].length, b[0].length); i++) {
        if (a[0][i] != b[0][i]) {
            return a[0][i] - b[0][i];
        }
    }
    return a[0].length - b[0].length;
}

function nan(a) {
    for (var i = 0; i < a.length; i++) {
        if (Number.isNaN(a[i])) return true;
    }
    return false;
} 

// Вернуть содержимое документа в виде строки.
//
// Так как документ представлен как множество пар (позиция, символ) плюс множество удаленных позиций,
// то нужно проитерироваться по всем неудаленным позициям в возрастающем порядке и склеить символы.
function public_getContent(document) {
    document.d1.sort(comporator);
    var res = "";
    for (var i = 0; i < document.d1.length; i++) {
        if (!document.d2.has(to_str(document.d1[i][0]))) {
            if (nan(document.d1[i][0]) == true) debugger;
            res += document.d1[i][1];
        }
    }
    return res;
}

function pack(a) {
    var res = [];
    a.forEach(elem => {
        res.push(elem);
    });
    return res;
}

// Вернуть сериализованное состояние.
//
// Эту функцию можно реализовывать ближе к концу, когда основная функциональность будет готова.
//
// Сериализованное состояние передается далее по сети другим пользователям.
function public_serializeState(document) {
    var res = JSON.stringify([document.d1, pack(document.d2), pack(document.d1s)]);
    return res;
}

// Обновить состояние документа, подклеив полученное сериализованное состояние.
//
// Эту функцию можно реализовывать ближе к концу, когда основная функциональность будет готова.

function equ(a, b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] != b[i]) return false;
    }
    return true;
}

function fff(a, b) {
    for (var i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] != b[i]) return a[i] > b[i];
    }
    return a.length > b.length;
}

function public_mergeWithSerializedState(document, serializedState) {
    var doc = JSON.parse(serializedState);
    var d1 = doc[0];
    var d2 = doc[1];
    var d1s = doc[2];
    for (var i = 0; i < d1.length; i++) {
        if (!document.d1s.has(to_str(d1[i][0]))) {
            document.d1.push(d1[i]);
        }
    }
    d2.forEach(elem => {
        document.d2.add(elem);
    });
    d1s.forEach(elem => {
        document.d1s.add(elem);
    });

}

// Добавить один символ по индексу.
//
// Начало строки задается индексом -1.
// После конца строки вставлять нельзя.
// Для вставки в конец строки нужно передать индекс последнего символа (длина минус один).
//
// Реализацию данного метода трогать нельзя.

function public_insertAfter(document, index, symbol) {
    p = _getPositionByIndex(document, index);
    q = _getPositionByIndex(document, index + 1);
    z = _allocate(document, p, q);
    if (fff(p, q)) debugger;
    if (fff(p, z) || fff(z, q)) debugger;
    if (document.d1s.has(to_str(z))) debugger;
    _applyInsert(document, z, symbol);
    return z;
}

// Удалить символ по индексу.
//
// Реализацию данного метода трогать нельзя.
function public_remove(document, index) {
    p = _getPositionByIndex(document, index);
    _applyRemove(document, p);
    return p;
}

// Заменить символ по индексу.
//
// Реализацию данного метода трогать нельзя.
function public_replace(document, index, symbol) {
    public_remove(document, index);
    public_insertAfter(document, index - 1, symbol);
}

// === Приватный интерфейс.

// Вычислить позицию символа по его индексу.
//
// Нам важно уметь преобразовывать индексы в позиции и наоборот.
//
// Если index находится в диапазоне [0; N-1] (N -- длина строки),
// то возвращаемая позиция кодирует некоторый узел в дереве.
// Если index равен -1 -- начало строки -- то возвращаемая позиция должна быть [0].
// Если index равен N -- конец строки -- то возвращаемая позиция должна быть [100].
function _getPositionByIndex(document, index) {
    if (index == -1) return [0];
    document.d1.sort(comporator);
    var curind = 0;
    for (var i = 0; i < document.d1.length; i++) {
        if (!document.d2.has(to_str(document.d1[i][0]))) {
            if (nan(document.d1[i][0]) == true) debugger;
            if (curind == index) return document.d1[i][0];
            curind++;
        }
    }
    return [1000];
}

function _getIndexByPosition(document, position) {
    document.d1.sort(comporator);
    var curind = 0;
    for (var i = 0; i < document.d1.length; i++) {
        if (to_str(document.d1[i][0]) == to_str(position)) {
            return curind;
        }
        if (!document.d2.has(to_str(document.d1[i][0]))) {
            curind++;
        }
    }
    return document.d1.length - document.d2.size;
}



// Аллоцировать новую позицию между двумя границами.
//
// Стратегии аллокации между двумя вершинами могут быть разные.
// Важно аллоцировать не слишком "плотно" новые идентификаторы,
// чтобы обслуживать будущие аллокации без изменения структуры дерева.
//
// Можно следовать стратегии "аллоцировать ближе к левому краю".
// Для этого берем позицию begin и на самом глубоком уровне этой позиции
// пробуем сдвинуться на K направо (K ~ 10-20), чтобы оставить "буфер"
// под будущие правки.
// Если на текущем уровне есть свободные позиции в ближайших K позициях справа,
// то возвращаем крайнюю правую свободную позицию.
// Если на текущем уровне уже нет места, то создаем новый подуровень.
// Важно не забыть проверить, что _нету_ других позиций между begin и свежеаллоцированной позицией.
//
// Такая стратегия оставляет чуть-чуть места для правок между новой позицией и begin,
// и оставляет много места для правок после новой позиции.
// Таким образом, эта стратегия подходит хорошо для ситуаций, когда мы дописываем новый текст.
//
// Пример (здесь "<" значит "предшествует"; K = 10):
//   begin = [4, 52]
//   если позиции с [4, 52] до [4, 62] свободны, то
//   можно аллоцировать [4, 62], так как [4, 52] < [4, 62];
//   begin = [8, 93]
//   можно аллоцировать [8, 93, 10], так как [8, 93] < [8, 93, 10];
//
// Можно следовать стратегии "аллоцировать ближе к правому краю".
// Логика схожая, только отталкиваемся от end и шагаем влево.
// Такая стратегия будет походить для небольших правок в середине текста.
//
// Пример (здесь "<" значит "предшествует"; K = 10):
//   end = [8, 90]
//   если позиции с [8, 80] до [8, 90] свободны, то
//   можно аллоцировать [8, 80];
//   end = [8, 90]
//   если позиция [8, 89] занята,
//   то можно аллоцировать [8, 89, 90];
//
// Лучше всего -- подбрасывать монетку и выбирать случайно одну из двух стратегий выше.
// Таким образом мы будем маскировать незнание паттерна правок в документе.
function _allocate(document, begin, end) {
    var p = [];
    var ii = 0;
    for (var i = 0; i < begin.length; i++) {
        ii = i;
        if (begin[i] != end[i]) {
            if (begin[i] + 1 != end[i] && Math.random() < 0.1) {
                p.push(begin[i] + 1);
                return _allocate2(document, p);
            }
            break;
        }
        p.push(begin[i]);
    }
    if (ii == begin.length - 1 && begin[ii] == end[ii]) {
        for (var i = begin.length; i < end.length; i++) {
            if (end[i] != 0) {
                p.push(Math.min(3, Math.floor(Math.random() * end[i])));
                if (nan(p) == true) debugger;
                return _allocate2(document, p);
            }
            if (i < end.length) {
                p.push(end[i]);
            }
        }
    } else {
        p.push(begin[ii]);
        for (var i = ii + 1; i < begin.length; i++) {
            if (begin[i] != 1000) {
                p.push(begin[i] + 1 + Math.min(0, Math.floor(Math.random() * (1000 - begin[i]))))
                //p.push(begin[i] + 1);
                if (nan(p) == true) debugger;
                return _allocate2(document, p);
            }
            if (i < begin.length) {
                p.push(begin[i]);
            }
        }
    }
    p.push(Math.floor(Math.random() * 101));
    if (nan(p) == true) debugger;
    return _allocate2(document, p);
}

/*function nodee() {
    var yy = Math.floor(Math.random() * 100000);
    return {
        y: yy,
        c: 0,
        symbol: "",
        left: null,
        right: null,
     }
}

function size(t) {
    if (t == null) return 0;
    return t.c;
}

function update(t) {
    t = size(t.left) + size(t.right) + 1;
}

function merge(a, b) {
    if (a == null) return b;
    if (b == null) return a;
    if (a.y > b.y) {
        a.right = merge(a.right, b);
        update(a);
        return a;
    } else {
        b.left = merge(a, b.left);
        update(b);
        return b;
    }
}

function split(t, k) {
    if (t == null) return [null, null];
    if (size(t.left) + 1 <= k) {
        var z = split(t.right, k - size(t.left) - 1);
        t.right = z[0];
        update(t);
        return [t, z[1]];
    } else {
        var z = split(t.left, k);
        t.left = z[1];
        update(t);
        return [z[0], t];
    }
}*/

function copp(a) {
    var res = [];
    for (var i = 0; i < a.length; i++) {
        res.push(a[i]);
    }
    return res;
}

function _allocate2(document, pref) {
    if (!document.d1s.has(to_str(pref))) {
        /*var ok = false;
        for (var i = 0; i < pref.length; i++) {
            if (pref[i] != 0) {
                ok = true;
            }
        }*/
        //if (ok == false) {
        if (pref[pref.length - 1] == 0) {
            document.d1.push([pref, "ff"]);
            document.d1s.add(to_str(pref));
            document.d2.add(to_str(pref));
            pref = copp(pref);
            pref.push(Math.floor(Math.random() * 1000) + 1);
            if (nan(p) == true) debugger;
        }
        return pref;
    }
    pref.push(Math.floor(Math.random() * 1001));
    if (nan(p) == true) debugger;
    return _allocate2(document, pref);
}

// Вставить символ в указанную позицию (не индекс!).
function _applyInsert(document, position, symbol) {
    document.d1.push([position, symbol]);
    document.d1s.add(to_str(position));
}

// Удалить символ в указанной позиции.
function _applyRemove(document, position) {
    document.d2.add(to_str(position));
}

// !!!!! ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^
//------------------------------------------------
