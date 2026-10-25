(function (root, factory) {
    const isNode = typeof module !== "undefined" && module.exports;
    const api = factory(
        isNode ? require("./constants.js") : root.Dingzi,
        isNode ? require("./rules.js") : root.Dingzi.rules
    );
    if (isNode) module.exports = api;
    else root.Dingzi.state = api;
})(typeof window !== "undefined" ? window : globalThis, function (C, rules) {
    const PLAYING = "PLAYING", GAME_OVER = "GAME_OVER";

    function create(mode) {
        return {
            mode: mode,
            board: rules.createBoard(),
            turn: C.BLACK, // 黑先
            selected: null,
            status: PLAYING,
            winner: C.EMPTY,
            lastMove: null,
            moveCount: 0,
        };
    }

    /** 人类执子；双人模式返回 EMPTY 表示没有 AI */
    function humanSide(state) {
        if (state.mode === C.MODE.PVE_BLACK) return C.BLACK;
        if (state.mode === C.MODE.PVE_WHITE) return C.WHITE;
        return C.EMPTY;
    }

    function isAITurn(state) {
        return humanSide(state) !== C.EMPTY && state.turn !== humanSide(state);
    }

    /** 点击自己的子则选中，再点一次取消；点击别处保持原选中 */
    function select(state, cell) {
        if (state.status !== PLAYING) return state;
        const piece = rules.pieceAt(state.board, cell.r, cell.c);
        if (piece !== state.turn) return state;
        if (rules.isSameCell(state.selected, cell)) {
            return Object.assign({}, state, { selected: null });
        }
        return Object.assign({}, state, { selected: cell });
    }

    /** 唯一的走子入口：走子、吃子、胜负判定都在此处，人机共用 */
    function move(state, from, to) {
        if (state.status !== PLAYING || !from) return { state: state, moved: false };

        const legal = rules.legalMoves(state.board, from.r, from.c);
        if (!legal.some(function (t) { return t.r === to.r && t.c === to.c; })) {
            return { state: state, moved: false };
        }

        let board = rules.applyMove(state.board, from, to);
        const captures = rules.capturesFor(board, to, state.turn);
        board = rules.applyCaptures(board, captures);

        const result = rules.gameResult(board);
        return {
            moved: true,
            state: Object.assign({}, state, {
                board: board,
                selected: null,
                turn: result.over ? state.turn : rules.opponent(state.turn),
                status: result.over ? GAME_OVER : PLAYING,
                winner: result.winner,
                lastMove: { from: from, to: to, captures: captures },
                moveCount: state.moveCount + 1,
            }),
        };
    }

    /** 人类点击落点：以当前选中子为起点 */
    function tryMove(state, to) {
        return move(state, state.selected, to);
    }

    return {
        PLAYING: PLAYING,
        GAME_OVER: GAME_OVER,
        create: create,
        select: select,
        move: move,
        tryMove: tryMove,
        humanSide: humanSide,
        isAITurn: isAITurn,
    };
});
