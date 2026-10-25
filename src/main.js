(function (root) {
    const D = root.Dingzi;
    const AI_DELAY = 400;

    window.addEventListener("DOMContentLoaded", function () {
        const canvas = document.getElementById("chess-board");
        const ctx = canvas.getContext("2d");
        const text = document.getElementById("text");
        const modeSelect = document.getElementById("mode");
        const restartBtn = document.getElementById("restart");

        let state = null;
        let aiTimer = null;

        function sideLabel(side) {
            return "<span>" + D.COLOR_NAME[side] + "</span>方";
        }

        function statusText() {
            if (state.status === D.state.GAME_OVER) {
                return "游戏结束，" + sideLabel(state.winner) + "获胜";
            }
            const who = state.mode === D.MODE.PVP ? "" : (D.state.isAITurn(state) ? "（电脑）" : "（你）");
            return "当前轮到" + sideLabel(state.turn) + "落子" + who;
        }

        function draw() {
            D.render.render(canvas, ctx, state);
            text.innerHTML = statusText();
        }

        function scheduleAI() {
            if (state.status !== D.state.PLAYING || !D.state.isAITurn(state)) return;
            clearTimeout(aiTimer);
            aiTimer = setTimeout(stepAI, AI_DELAY);
        }

        function stepAI() {
            aiTimer = null;
            if (state.status !== D.state.PLAYING || !D.state.isAITurn(state)) return;
            const move = D.ai.chooseMove(state, state.turn);
            if (!move) {
                text.innerHTML = sideLabel(state.turn) + "无合法走法";
                return;
            }
            const result = D.state.move(state, move.from, move.to);
            if (!result.moved) return;
            state = result.state;
            draw();
            scheduleAI();
        }

        canvas.addEventListener("click", function (evt) {
            if (state.status !== D.state.PLAYING || D.state.isAITurn(state)) return;
            const cell = D.render.screenToCell(evt, canvas);
            if (!cell) return;

            const result = D.state.tryMove(state, cell);
            if (result.moved) {
                state = result.state;
                draw();
                scheduleAI();
                return;
            }
            const next = D.state.select(state, cell);
            if (next !== state) {
                state = next;
                draw();
            }
        });

        function reset() {
            clearTimeout(aiTimer);
            aiTimer = null;
            state = D.state.create(modeSelect.value);
            draw();
            scheduleAI();
        }

        modeSelect.addEventListener("change", reset);
        restartBtn.addEventListener("click", reset);
        reset();
    });
})(window);
