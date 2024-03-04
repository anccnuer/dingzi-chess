let ctx;
// 当前轮到谁落子，1为黑，2为白，0为游戏结束
let current_turn = 1;
const r = 20;
const go = {
    padding: 50,
    interval: 100,
};

// 1为黑子，2为白子
let board = [
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 2, 2, 2],
];
// 鼠标点击的坐标（px）
let p = {
    x: 0,
    y: 0,
}
// 选中的棋子的坐标
let selected = {
    x: null,
    y: null,
}

window.onload = () => {
    const canvas = document.getElementById("chess-board");
    const rect = canvas.getBoundingClientRect();
    const text = document.getElementById("text");
    text.innerText = `当前轮到${(current_turn === 1) ? "黑" : "白"}方落子`;
    ctx = canvas.getContext("2d");
    let initCanvas = () => {
        parseChess();
    };
    initCanvas();
    canvas.addEventListener("click", function (evt) {
        p.x = evt.clientX - rect.left;
        p.y = evt.clientY - rect.top;
        // 处理选中特效
        if (isSlected()) {
            freshBoard(evt.target);
        }
        if (moveChess()) {
            freshBoard(evt.target);
            is_eat_chess(evt.target);
        }
    });
}

/**
 * 传入坐标，放置棋子
 * 以左上角为坐标原点
 * @param x 从0起
 * @param y
 * @param color 颜色，黑1，白0
 */
function setChess(x, y, color) {
    if (color === 1) ctx.fillStyle = "#000";
    if (color === 2) ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(
        go.padding + y * go.interval,
        go.padding + x * go.interval,
        r,
        0,
        2 * Math.PI
    );
    ctx.closePath();
    ctx.fill();
}

/**
 * 循环遍历，解析棋盘
 */
function parseChess() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 1) setChess(i, j, 1);
            if (board[i][j] === 2) setChess(i, j, 2);
        }
    }
}

function check_near_which_intersection(x) {
    for (let n = 0; n < 4; n++) {
        if (x <= r + n * go.interval + go.padding && x >= n * go.interval + go.padding - r) return n;
    }
    return false;
}
// 传入坐标，判断该坐标是否有棋子
function intersection_has_chess(x, y) {
    if (board[y][x] !== 0) {
        return true;
    }
    return false;
}

function isSlected() {
    let x = check_near_which_intersection(p.x);
    let y = check_near_which_intersection(p.y);
    if (x !== false && y !== false) {
        if (!is_your_turn(x, y)) {
            return false;
        }
        if (intersection_has_chess(x, y)) {
            selected.x = x;
            selected.y = y;
            return true;
        }
    }
    return false;
}
// 画出选中特效（小红圈）
function drawSlected() {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
        go.padding + selected.x * go.interval,
        go.padding + selected.y * go.interval,
        r + 2,
        0,
        2 * Math.PI
    );
    ctx.closePath();
    ctx.stroke();
}

// 刷新棋盘，重新绘制

function freshBoard(canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 重绘棋子
    parseChess();
    // 如果有棋子被选中，则绘制选中特效
    if (selected.x !== null && selected.y !== null) drawSlected();
    const text = document.getElementById("text");
    text.innerHTML = `当前轮到<span>${(current_turn === 1) ? "黑" : "白"}</span>方落子`;
}


// 移动棋子
function moveChess() {
    if (selected.x !== null && selected.y !== null) {
        if (!is_your_turn(selected.x, selected.y)) return false;
    }
    let target = {};//要移动到的位置坐标
    target.x = check_near_which_intersection(p.x);
    target.y = check_near_which_intersection(p.y);
    if (target.x !== false && target.y !== false) {
        if (!intersection_has_chess(target.x, target.y)) {//没有棋子则开始移动
            if (is_nearby(target)) {
                board[target.y][target.x] = board[selected.y][selected.x];
                board[selected.y][selected.x] = 0;
                selected.x = target.x;
                selected.y = target.y;
                current_turn = (current_turn === 1) ? 2 : (current_turn === 2) ? 1 : current_turn;
                return true;
            }
        }
    }
    return false;
}

// 是否只移动了一格
function is_nearby(target) {
    return (target.x === selected.x && Math.abs(target.y - selected.y) === 1) ||
        (target.y === selected.y && Math.abs(target.x - selected.x) === 1);
}

function is_your_turn(x, y) {
    if (board[y][x] !== current_turn) return false;
    else return true;
}
// 吃子规则
function is_eat_chess(canvas) {
    for (let i = 0; i < 2; i++) {
        let arr1 = board[selected.y][i],
            arr2 = board[selected.y][i + 1],
            arr3 = board[selected.y][i + 2];
        let tag = checkLine(arr1, arr2, arr3);
        if (tag !== false) {
            if (!is_four_chess("y")) {
                removeChessEat(selected.y, tag + i);
                freshBoard(canvas);
            }

        };
    }
    for (let i = 0; i < 2; i++) {
        let arr1 = board[i][selected.x],
            arr2 = board[i + 1][selected.x],
            arr3 = board[i + 2][selected.x];
        let tag = checkLine(arr1, arr2, arr3);
        if (tag !== false) {
            if (!is_four_chess("x")) {
                removeChessEat(tag + i, selected.x);
                freshBoard(canvas);
            }
        }
    }
    is_game_over();
}

function checkLine(arr1, arr2, arr3) {
    // 异色棋子是否为敌方棋子
    let can_eat = (color) => {
        if (color !== board[selected.y][selected.x]) return true;
        else return false;
    }
    if (arr1 * arr2 * arr3 !== 0) {
        // 2 和 0这两个魔数，指的是is_eat_chess循环中的i值
        if (arr1 === arr2 && arr2 !== arr3 && can_eat(arr3)) return 2;
        if (arr2 === arr3 && arr1 !== arr2 && can_eat(arr1)) return 0;
        return false;
    }
    else return false;
}

// 判断是否四个棋子在一条线上

function is_four_chess(direction) {
    let product;
    if (direction === "x") {
        product = board[0][selected.x] * board[1][selected.x] * board[2][selected.x] * board[3][selected.x];
        if (product === 0) return false;
        else return true;
    }
    if (direction === "y") {
        product = board[selected.y][0] * board[selected.y][1] * board[selected.y][2] * board[selected.y][3];
        if (product === 0) return false;
        else return true;
    }
    return false;
}

function removeChessEat(x, y) {
    board[x][y] = 0;
}

function is_game_over() {
    let white_chess = 0, black_chess = 0;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 1) white_chess++;
            if (board[i][j] === 2) black_chess++;
        }
    }
    if (white_chess === 1 || black_chess === 1) {
        current_turn = 0;
        const text = document.getElementById("text");
        text.innerText = `游戏结束，${(white_chess === 1) ? "白" : "黑"}方获胜`;
    }
}