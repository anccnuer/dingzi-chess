const test = require("node:test");
const assert = require("node:assert/strict");

const C = require("../src/constants.js");
const rules = require("../src/rules.js");
const stateMod = require("../src/state.js");
const ai = require("../src/ai.js");

const E = C.EMPTY, B = C.BLACK, W = C.WHITE;

function boardOf(rows) {
    return Object.assign({}, stateMod.create(C.MODE.PVP), { board: rows });
}

test("选中己方子并走到相邻空位", function () {
    let s = boardOf(rules.createBoard());
    s = stateMod.select(s, { r: 0, c: 1 });
    assert.deepEqual(s.selected, { r: 0, c: 1 });

    const res = stateMod.tryMove(s, { r: 1, c: 1 });
    assert.equal(res.moved, true);
    assert.equal(res.state.board[0][1], E);
    assert.equal(res.state.board[1][1], B);
    assert.equal(res.state.turn, W, "回合已翻转");
    assert.equal(res.state.selected, null, "走子后不残留选中态");
});

test("点击对方子不改变选中，点击别处不消耗回合", function () {
    let s = boardOf(rules.createBoard());
    s = stateMod.select(s, { r: 0, c: 0 });
    s = stateMod.select(s, { r: 3, c: 0 });
    assert.deepEqual(s.selected, { r: 0, c: 0 }, "对方子不可选中");

    const res = stateMod.tryMove(s, { r: 3, c: 3 });
    assert.equal(res.moved, false);
    assert.equal(res.state.turn, B);
});

test("再次点击同一子取消选中", function () {
    let s = boardOf(rules.createBoard());
    s = stateMod.select(s, { r: 0, c: 2 });
    s = stateMod.select(s, { r: 0, c: 2 });
    assert.equal(s.selected, null);
});

test("顶吃到对方只剩 1 子即终局并锁定输入", function () {
    const s0 = boardOf([
        [B, E, B, B],
        [E, B, W, E],
        [E, E, E, E],
        [W, E, E, E],
    ]);
    // 黑 (0,0)->(1,0)，与 (1,1) 成对顶吃 (1,2) 的白子，白方只剩 (3,0) 一子
    const res = stateMod.move(s0, { r: 0, c: 0 }, { r: 1, c: 0 });
    assert.equal(res.moved, true);
    assert.equal(res.state.board[1][2], E, "被顶的白子已移除");
    assert.equal(res.state.status, stateMod.GAME_OVER);
    assert.equal(res.state.winner, B);

    const locked = stateMod.move(res.state, { r: 0, c: 2 }, { r: 1, c: 2 });
    assert.equal(locked.moved, false, "终局后不再接受走子");
});

test("AI 返回的走法合法，且优先选择能吃子的一步", function () {
    const s = boardOf([
        [B, E, B, B],
        [E, B, W, E],
        [E, E, E, E],
        [W, W, W, E],
    ]);
    const move = ai.chooseMove(s, B);
    assert.ok(move, "有子可走时 AI 必须给出走法");
    const legal = rules.allLegalMoves(s.board, B);
    assert.ok(legal.some(function (m) {
        return m.from.r === move.from.r && m.from.c === move.from.c && m.to.r === move.to.r && m.to.c === move.to.c;
    }), "走法必须在合法列表内");

    const after = rules.applyMove(s.board, move.from, move.to);
    assert.equal(rules.capturesFor(after, move.to, B).length, 1, "有吃子机会时 AI 选择吃子");
});

test("threats 找出下一步能吃掉的对方子", function () {
    const risky = [
        [B, B, B, E],
        [E, B, W, E],
        [E, E, E, W],
        [W, W, W, E],
    ];
    // 白走 (2,3)->(1,3) 与 (1,2) 成对，可顶吃 (1,1) 的黑子
    const danger = rules.threats(risky, W);
    assert.ok(danger.some(function (cell) { return cell.r === 1 && cell.c === 1; }), "黑 (1,1) 处于危险");
    // 黑走 (0,0)->(1,0) 与 (1,1) 成对，可顶吃 (1,2) 的白子
    assert.ok(rules.threats(risky, B).some(function (cell) { return cell.r === 1 && cell.c === 2; }), "白 (1,2) 处于危险");

    assert.equal(rules.threats(rules.createBoard(), W).length, 0, "开局双方都够不着对方");
    assert.equal(rules.threats(rules.createBoard(), B).length, 0);
});

test("人机共用同一条走子路径，逐步推进不破坏棋盘一致性", function () {
    let s = stateMod.create(C.MODE.PVE_BLACK);
    let captures = 0;
    for (let ply = 0; ply < 60 && s.status === stateMod.PLAYING; ply++) {
        const move = ai.chooseMove(s, s.turn);
        if (!move) break;
        const before = rules.countPieces(s.board);
        const res = stateMod.move(s, move.from, move.to);
        assert.equal(res.moved, true, "AI 给出的走法必须可执行");
        s = res.state;
        const after = rules.countPieces(s.board);
        const eaten = before[B] + before[W] - after[B] - after[W];
        assert.ok(eaten <= 1, "一步至多吃一子，两处顶吃则不吃");
        captures += eaten;
        assert.equal(s.selected, null);
    }
    assert.equal(s.status, stateMod.GAME_OVER, "AI 对局应在 60 步内分出胜负");
    assert.ok(captures > 0, "AI 对局中至少发生过一次吃子");
    assert.notEqual(s.winner, E);
    assert.ok(rules.countPieces(s.board)[s.winner] >= 2);
});
