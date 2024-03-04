// 思路：检查全局的棋子
// 但是能不能只检查刚动过的棋子的行与列？减少无用运算？
// 传入上一颗 动子 坐标，检查行列 ，是否有被吃掉的子（动子不会被吃，举例）
// 动子不会被吃，例子
// const chessboard = [
//     [0, 0, 0, 0],
//     [0, 2, ◉, 1],
//     [0, 0, 1, 0],
//     [0, 0, 1, 2]
// ];
// ◉处为动子，由上方到此位置，则旁边的1会被吃掉，但是，◉本身不应该被吃，因为◉是进攻方，每次吃子只能是进攻方吃防守方，送上门不会被吃
// 所以做判断的函数，需要有相应的一个标记，即棋局到了谁下，黑子还是白子，



// fix bug
function checkLine(arr1, arr2, arr3) {
    // 情况 1，1，2 || 2，2，1
    if(arr1*arr2*arr3 === 0) {
        return -1;
    }
    if((arr1 === arr2 && arr1 !== 0 && arr3 !== arr1)) {
        return 2;
    }
    // 情况 1，2，2 || 2，1，1
    if((arr2 === arr3 && arr2 !== 0 && arr2 !== arr1)) {
        return 0;
    }

    return -1;
}




function checkChessboard(chessboard) {
    // 检查每一行
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            const index = checkLine(chessboard[i][j], chessboard[i][j+1], chessboard[i][j+2]);
            if (index !== -1) {
                return [i, j + index];
            }
        }
    }

    // 检查每一列
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 4; j++) {
            const index = checkLine(chessboard[i][j], chessboard[i+1][j], chessboard[i+2][j]);
            if (index !== -1) {
                return [i + index, j];
            }
        }
    }

    return false;
}

// 测试
const chessboard = [
    [0, 0, 0, 0],
    [0, 2, 2, 1],
    [0, 0, 1, 0],
    [0, 0, 1, 2]
];
// console.log(checkLine(chessboard[3][1], chessboard[3][2], chessboard[3][3]))
console.log(checkChessboard(chessboard)); // 应该输出 [3, 2]
