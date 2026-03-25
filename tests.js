// ==================== Tetris 测试套件 ====================
// 运行: node tests.js

const TETRIS = require('./core.js');

function assert(condition, message) {
    if (!condition) {
        console.error('❌ FAILED:', message);
        return false;
    }
    console.log('✅ PASSED:', message);
    return true;
}

let allPassed = true;

// ========== 测试 1: 方块旋转状态 ==========
console.log('\n========== 测试 1: 方块旋转状态 ==========');

const pieces = ['T', 'J', 'L', 'S', 'Z', 'I', 'O'];
for (const piece of pieces) {
    const states = TETRIS.getStates(piece);
    
    if (piece === 'O') {
        // O 旋转后不变
        allPassed = assert(
            JSON.stringify(states[0]) === JSON.stringify(states[1]) &&
            JSON.stringify(states[1]) === JSON.stringify(states[2]),
            `${piece} 旋转后状态不变`
        ) && allPassed;
    } else {
        // 其他4个状态互不相同
        const allDifferent = 
            JSON.stringify(states[0]) !== JSON.stringify(states[1]) &&
            JSON.stringify(states[1]) !== JSON.stringify(states[2]) &&
            JSON.stringify(states[2]) !== JSON.stringify(states[3]);
        allPassed = assert(allDifferent, `${piece} 4个状态互不相同`) && allPassed;
        
        // 顺时针4次回到原点
        const back = TETRIS.rotateCW(TETRIS.rotateCW(TETRIS.rotateCW(TETRIS.rotateCW(states[0]))));
        allPassed = assert(
            JSON.stringify(back) === JSON.stringify(states[0]),
            `${piece} 顺时针4次回到原点`
        ) && allPassed;
    }
}

// ========== 测试 2: T-Spin 判定 ==========
console.log('\n========== 测试 2: T-Spin 判定 ==========');

// 创建能触发 T-Spin 的棋盘
// piece 在 (4, 10)，T 中心在 (5, 11)
// 角位置: (4,10), (6,10), (4,12), (6,12)
const board = TETRIS.createBoard();
// 阻挡左上、右上、左下
board[10][4] = '#f00000';  // 左上
board[10][6] = '#00f000';  // 右上
board[12][4] = '#0000f0';  // 左下

const mockPiece = { type: 'T', x: 4, y: 10 };
const result = TETRIS.checkTCorners(mockPiece, board);
allPassed = assert(result === true, `T-Spin 3角阻挡检测: ${result}`) && allPassed;

// 不满足条件的情况
const board2 = TETRIS.createBoard();
const result2 = TETRIS.checkTCorners(mockPiece, board2);
allPassed = assert(result2 === false, `T-Spin 无阻挡检测: ${result2}`) && allPassed;

// ========== 测试 3: Wall Kick 表 ==========
console.log('\n========== 测试 3: Wall Kick 表 ==========');

for (const fromState of ['0', 'R', '2', 'L']) {
    for (const toState of Object.keys(TETRIS.KICK_JLSTZ[fromState])) {
        const kicks = TETRIS.KICK_JLSTZ[fromState][toState];
        allPassed = assert(kicks.length === 5, `Kick表 ${fromState}->${toState} 有5个点`) && allPassed;
        allPassed = assert(kicks[0][0] === 0 && kicks[0][1] === 0, `Kick表 ${fromState}->${toState} 第一点是(0,0)`) && allPassed;
    }
}

// I 方块
for (const fromState of ['0', 'R', '2', 'L']) {
    for (const toState of Object.keys(TETRIS.KICK_I[fromState])) {
        const kicks = TETRIS.KICK_I[fromState][toState];
        allPassed = assert(kicks.length === 5, `Kick I ${fromState}->${toState} 有5个点`) && allPassed;
    }
}

// ========== 测试 4: B2B 逻辑 ==========
console.log('\n========== 测试 4: Back-to-Back ==========');

const b2bTests = [
    [false, false, false],
    [false, true, false],
    [true, false, false],
    [true, true, true]
];

for (const [last, current, expected] of b2bTests) {
    const result = TETRIS.shouldTriggerB2B(current, last);
    const desc = last && current ? '连续高分' : (!last && !current ? '都是普通' : last ? '上次高分' : '上次普通');
    allPassed = assert(result === expected, `B2B: ${desc} → ${result}`) && allPassed;
}

// ========== 测试 5: 7-Bag ==========
console.log('\n========== 测试 5: 7-Bag ==========');

// 重置 bag
TETRIS.bag = [];
TETRIS.refillBag();

const seen = new Set();
for (let i = 0; i < 7; i++) {
    seen.add(TETRIS.getNextFromBag());
}
allPassed = assert(seen.size === 7, `7-Bag: 第一包${seen.size}种`) && allPassed;

// 第二包
const seen2 = new Set();
for (let i = 0; i < 7; i++) {
    seen2.add(TETRIS.getNextFromBag());
}
allPassed = assert(seen2.size === 7, `7-Bag: 第二包${seen2.size}种`) && allPassed;

// ========== 总结 ==========
console.log('\n========== 测试总结 ==========');
console.log(allPassed ? '🎉 所有测试通过!' : '💥 有测试失败!');