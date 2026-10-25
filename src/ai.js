(function (root, factory) {
    const isNode = typeof module !== "undefined" && module.exports;
    const api = factory(
        isNode ? require("./constants.js") : root.Dingzi,
        isNode ? require("./rules.js") : root.Dingzi.rules
    );
    if (isNode) module.exports = api;
    else root.Dingzi.ai = api;
})(typeof window !== "undefined" ? window : globalThis, function (C, rules) {
    const CAPTURE_VALUE = 1000;
    const THREAT_VALUE = 200;
    const DANGER_VALUE = 300;

    /**
     * 本步吃到 +1000；走完之后手里攥着的威胁 +200/个；
     * 让对方下一步能吃到的子 -300/个。威胁项是 AI 肯主动成顶、而不是一味龟缩的原因。
     */
    function scoreMove(board, move, side) {
        const after = rules.applyMove(board, move.from, move.to);
        const mine = rules.capturesFor(after, move.to, side).length;
        const myThreats = rules.threats(after, side).length;
        const danger = rules.threats(after, rules.opponent(side)).length;
        return mine * CAPTURE_VALUE + myThreats * THREAT_VALUE - danger * DANGER_VALUE;
    }

    /** 贪心一层，按棋盘扫描顺序确定性 tie-break */
    function chooseMove(state, side) {
        const board = state.board;
        let best = null;
        rules.allLegalMoves(board, side).forEach(function (move) {
            const score = scoreMove(board, move, side);
            if (best === null || score > best.score) best = { move: move, score: score };
        });
        return best ? best.move : null;
    }

    return {
        chooseMove: chooseMove,
        scoreMove: scoreMove,
    };
});
