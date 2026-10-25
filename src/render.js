(function (root, factory) {
    root.Dingzi.render = factory(root.Dingzi);
})(window, function (C) {
    function cellToPixel(i) {
        return C.PADDING + i * C.INTERVAL;
    }

    /** 命中框：以交叉点为中心、棋子半径为半边长的正方形 */
    function nearestTrack(px) {
        for (let i = 0; i < C.GRID; i++) {
            const center = cellToPixel(i);
            if (px <= center + C.PIECE_RADIUS && px >= center - C.PIECE_RADIUS) return i;
        }
        return -1;
    }

    /** 每次点击都重新量取，避免滚动/缩放后错位 */
    function screenToCell(evt, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
        const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
        const c = nearestTrack(x);
        const r = nearestTrack(y);
        if (r < 0 || c < 0) return null;
        return { r: r, c: c };
    }

    function drawPiece(ctx, r, c, color) {
        ctx.fillStyle = color === C.BLACK ? "#000" : "#FFF";
        ctx.beginPath();
        ctx.arc(cellToPixel(c), cellToPixel(r), C.PIECE_RADIUS, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    function drawSelection(ctx, cell) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cellToPixel(cell.c), cellToPixel(cell.r), C.PIECE_RADIUS + 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }

    function render(canvas, ctx, state) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < C.GRID; r++) {
            for (let c = 0; c < C.GRID; c++) {
                if (state.board[r][c] !== C.EMPTY) drawPiece(ctx, r, c, state.board[r][c]);
            }
        }
        if (state.selected) drawSelection(ctx, state.selected);
    }

    return {
        render: render,
        screenToCell: screenToCell,
        cellToPixel: cellToPixel,
    };
});
