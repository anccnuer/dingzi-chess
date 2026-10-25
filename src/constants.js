(function (root, factory) {
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.Dingzi = Object.assign(root.Dingzi || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
    return {
        EMPTY: 0,
        BLACK: 1,
        WHITE: 2,
        GRID: 4,

        // 画布几何：交叉点位于 padding + i * interval
        PADDING: 50,
        INTERVAL: 100,
        PIECE_RADIUS: 20,
        CANVAS_SIZE: 400,

        COLOR_NAME: { 1: "黑", 2: "白" },

        MODE: {
            PVP: "PVP",
            PVE_BLACK: "PVE_BLACK", // 人类执黑，黑先
            PVE_WHITE: "PVE_WHITE", // 人类执白
        },
    };
});
