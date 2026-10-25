const test = require("node:test");
const assert = require("node:assert/strict");

const C = require("../src/constants.js");
const rules = require("../src/rules.js");

const E = C.EMPTY, B = C.BLACK, W = C.WHITE;

test("checkLine 真值表（顶吃：己方两子紧邻，端点为对方）", function () {
    assert.equal(rules.checkLine(B, B, W, B), 2, "黑黑白 → 吃右端");
    assert.equal(rules.checkLine(W, B, B, B), 0, "白黑黑 → 吃左端");
    assert.equal(rules.checkLine(W, W, B, B), -1, "成对的是对方，不吃己方");
    assert.equal(rules.checkLine(B, B, B, B), -1, "三格同色，无子可吃");
    assert.equal(rules.checkLine(B, B, E, B), -1, "端点为空，不吃");
    assert.equal(rules.checkLine(B, W, B, B), -1, "夹形不是顶吃");
    assert.equal(rules.checkLine(B, E, W, B), -1, "两子不相邻，不吃");
});

test("legalMoves 只能走到相邻空格", function () {
    const board = [
        [B, B, B, B],
        [E, E, E, E],
        [E, E, E, E],
        [W, W, W, W],
    ];
    assert.deepEqual(rules.legalMoves(board, 0, 1), [{ r: 1, c: 1 }]);
    assert.deepEqual(rules.legalMoves(board, 1, 1), [], "空格没有可走法");
    assert.deepEqual(rules.legalMoves(board, 0, 0), [{ r: 1, c: 0 }], "边角只有一个方向");
    const blocked = [
        [E, W, E, E],
        [W, B, W, E],
        [E, W, E, E],
        [E, E, E, E],
    ];
    assert.deepEqual(rules.legalMoves(blocked, 1, 1), [], "四面被堵则无路可走");
});

test("applyMove 不改动原棋盘", function () {
    const board = rules.createBoard();
    const next = rules.applyMove(board, { r: 0, c: 0 }, { r: 1, c: 0 });
    assert.equal(board[0][0], B);
    assert.equal(board[1][0], E);
    assert.equal(next[0][0], E);
    assert.equal(next[1][0], B);
});

test("行方向的顶吃被结算", function () {
    const board = [
        [E, E, E, E],
        [B, B, W, E],
        [E, E, E, E],
        [E, E, E, E],
    ];
    // 黑子落在 (1,1)，与 (1,0) 成对顶吃 (1,2) 的白子
    assert.deepEqual(rules.capturesFor(board, { r: 1, c: 1 }, B), [{ r: 1, c: 2 }]);
});

test("列方向的顶吃被结算", function () {
    const board = [
        [E, E, E, E],
        [E, B, E, E],
        [E, B, E, E],
        [E, W, E, E],
    ];
    // 黑子落在 (2,1)，与 (1,1) 成对顶吃 (3,1) 的白子
    assert.deepEqual(rules.capturesFor(board, { r: 2, c: 1 }, B), [{ r: 3, c: 1 }]);
});

test("与本步移动无关的顶吃不结算", function () {
    const board = [
        [E, E, E, E],
        [B, B, W, E],
        [E, E, B, E],
        [E, E, E, E],
    ];
    // 第 1 行那组 [黑黑白] 与本步落点 (2,2) 无关
    assert.deepEqual(rules.topsThrough(board, { r: 2, c: 2 }, B), []);
    assert.deepEqual(rules.capturesFor(board, { r: 2, c: 2 }, B), []);
});

test("满行/满列免吃", function () {
    const fullRow = [
        [E, E, E, E],
        [E, E, E, E],
        [B, B, W, B],
        [E, E, E, E],
    ];
    assert.equal(rules.rowIsFull(fullRow, 2), true);
    assert.deepEqual(rules.capturesFor(fullRow, { r: 2, c: 1 }, B), [], "整行满则不吃");

    const openRow = [
        [E, E, E, E],
        [E, E, E, E],
        [B, B, W, E],
        [E, E, E, E],
    ];
    assert.deepEqual(rules.capturesFor(openRow, { r: 2, c: 1 }, B), [{ r: 2, c: 2 }], "同一形状留空则可吃");

    const fullCol = [
        [B, E, E, E],
        [B, E, E, E],
        [W, E, E, E],
        [B, E, E, E],
    ];
    assert.equal(rules.colIsFull(fullCol, 0), true);
    assert.deepEqual(rules.capturesFor(fullCol, { r: 1, c: 0 }, B), [], "整列满则不吃");
});

test("两处顶吃同时成立则相互抵消，一个都不吃", function () {
    const board = [
        [E, E, W, E],
        [E, E, B, E],
        [E, B, B, W],
        [E, E, E, E],
    ];
    const to = { r: 2, c: 2 };
    assert.equal(rules.topsThrough(board, to, B).length, 2, "确实检出两处顶吃");
    assert.deepEqual(rules.capturesFor(board, to, B), [], "两处顶吃一子不吃");
});

test("countPieces 与 gameResult", function () {
    assert.deepEqual(rules.countPieces(rules.createBoard()), { 0: 8, 1: 4, 2: 4 });

    const oneBlack = [
        [B, E, E, E],
        [E, E, E, E],
        [E, E, E, E],
        [W, W, W, W],
    ];
    assert.deepEqual(rules.gameResult(oneBlack), { over: true, winner: W }, "黑只剩 1 子，白胜");

    const noWhite = [
        [B, B, B, B],
        [E, E, E, E],
        [E, E, E, E],
        [E, E, E, E],
    ];
    assert.deepEqual(rules.gameResult(noWhite), { over: true, winner: B }, "白被吃光也判黑胜");

    assert.deepEqual(rules.gameResult(rules.createBoard()), { over: false, winner: E });
});
