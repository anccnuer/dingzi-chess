(function (root, factory) {
    const isNode = typeof module !== "undefined" && module.exports;
    const api = factory(isNode ? require("./constants.js") : root.Dingzi);
    if (isNode) module.exports = api;
    else root.Dingzi.rules = api;
})(typeof window !== "undefined" ? window : globalThis, function (C) {
    const EMPTY = C.EMPTY, BLACK = C.BLACK, WHITE = C.WHITE, GRID = C.GRID;

    const DELTAS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    // 一条线上所有连续三格窗口
    const WINDOWS = [[0, 1, 2], [1, 2, 3]];

    function createBoard() {
        return [
            [BLACK, BLACK, BLACK, BLACK],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [WHITE, WHITE, WHITE, WHITE],
        ];
    }

    function cloneBoard(board) {
        return board.map(function (row) { return row.slice(); });
    }

    function inBounds(r, c) {
        return r >= 0 && r < GRID && c >= 0 && c < GRID;
    }

    function pieceAt(board, r, c) {
        return inBounds(r, c) ? board[r][c] : EMPTY;
    }

    function opponent(side) {
        if (side === BLACK) return WHITE;
        if (side === WHITE) return BLACK;
        return EMPTY;
    }

    function isSameCell(a, b) {
        return !!a && !!b && a.r === b.r && a.c === b.c;
    }

    function legalMoves(board, r, c) {
        if (pieceAt(board, r, c) === EMPTY) return [];
        return DELTAS
            .map(function (d) { return { r: r + d[0], c: c + d[1] }; })
            .filter(function (t) { return inBounds(t.r, t.c) && board[t.r][t.c] === EMPTY; });
    }

    function allLegalMoves(board, side) {
        const moves = [];
        for (let r = 0; r < GRID; r++) {
            for (let c = 0; c < GRID; c++) {
                if (board[r][c] !== side) continue;
                legalMoves(board, r, c).forEach(function (to) {
                    moves.push({ from: { r: r, c: c }, to: to });
                });
            }
        }
        return moves;
    }

    function applyMove(board, from, to) {
        const next = cloneBoard(board);
        next[to.r][to.c] = next[from.r][from.c];
        next[from.r][from.c] = EMPTY;
        return next;
    }

    /**
     * 顶吃判定：连续三格里，行棋方两子紧邻成对，另一端是对方的子，则该端点被顶走。
     * 返回被吃格在窗口中的下标（0 或 2），不构成顶吃返回 -1。
     */
    function checkLine(left, mid, right, side) {
        const enemy = opponent(side);
        if (left === side && mid === side && right === enemy) return 2;
        if (right === side && mid === side && left === enemy) return 0;
        return -1;
    }

    function rowIsFull(board, r) {
        return board[r].every(function (v) { return v !== EMPTY; });
    }

    function colIsFull(board, c) {
        for (let r = 0; r < GRID; r++) {
            if (board[r][c] === EMPTY) return false;
        }
        return true;
    }

    /**
     * 检出落点参与形成的全部顶吃。
     * 只扫描包含落点的窗口（不结算与本步移动无关的顶吃），动子自身永不作为被吃格。
     */
    function topsThrough(board, to, side) {
        const found = [];

        WINDOWS.forEach(function (win) {
            if (win.indexOf(to.c) === -1) return;
            if (rowIsFull(board, to.r)) return; // 满行免吃
            const eaten = checkLine(board[to.r][win[0]], board[to.r][win[1]], board[to.r][win[2]], side);
            if (eaten < 0 || win[eaten] === to.c) return;
            found.push({ r: to.r, c: win[eaten] });
        });

        WINDOWS.forEach(function (win) {
            if (win.indexOf(to.r) === -1) return;
            if (colIsFull(board, to.c)) return; // 满列免吃
            const eaten = checkLine(board[win[0]][to.c], board[win[1]][to.c], board[win[2]][to.c], side);
            if (eaten < 0 || win[eaten] === to.r) return;
            found.push({ r: win[eaten], c: to.c });
        });

        return dedupe(found);
    }

    function dedupe(cells) {
        const seen = {};
        return cells.filter(function (cell) {
            const key = cell.r + ":" + cell.c;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    /** 本步实际吃掉的格子。两处及以上顶吃同时成立时相互抵消，一个都不吃。 */
    function capturesFor(board, to, side) {
        const tops = topsThrough(board, to, side);
        return tops.length > 1 ? [] : tops;
    }

    /** side 下一步能吃掉的对方格子集合——即 side 的威胁，也就是对方的危险子 */
    function threats(board, side) {
        const seen = {};
        const cells = [];
        allLegalMoves(board, side).forEach(function (m) {
            capturesFor(applyMove(board, m.from, m.to), m.to, side).forEach(function (cell) {
                const key = cell.r + ":" + cell.c;
                if (seen[key]) return;
                seen[key] = true;
                cells.push(cell);
            });
        });
        return cells;
    }

    function applyCaptures(board, cells) {
        if (!cells || cells.length === 0) return board;
        const next = cloneBoard(board);
        cells.forEach(function (cell) { next[cell.r][cell.c] = EMPTY; });
        return next;
    }

    function countPieces(board) {
        const count = {};
        count[EMPTY] = 0;
        count[BLACK] = 0;
        count[WHITE] = 0;
        for (let r = 0; r < GRID; r++) {
            for (let c = 0; c < GRID; c++) count[board[r][c]]++;
        }
        return count;
    }

    /** 任一方不足 2 子即判负 */
    function gameResult(board) {
        const count = countPieces(board);
        const blackDone = count[BLACK] <= 1;
        const whiteDone = count[WHITE] <= 1;
        if (blackDone || whiteDone) {
            return {
                over: true,
                winner: blackDone && whiteDone ? EMPTY : (blackDone ? WHITE : BLACK),
            };
        }
        return { over: false, winner: EMPTY };
    }

    return {
        createBoard: createBoard,
        cloneBoard: cloneBoard,
        inBounds: inBounds,
        pieceAt: pieceAt,
        opponent: opponent,
        isSameCell: isSameCell,
        legalMoves: legalMoves,
        allLegalMoves: allLegalMoves,
        applyMove: applyMove,
        checkLine: checkLine,
        rowIsFull: rowIsFull,
        colIsFull: colIsFull,
        topsThrough: topsThrough,
        capturesFor: capturesFor,
        threats: threats,
        applyCaptures: applyCaptures,
        countPieces: countPieces,
        gameResult: gameResult,
    };
});
