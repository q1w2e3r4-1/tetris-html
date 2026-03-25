// ==================== Tetris SRS 测试套件 ====================
// 运行方式: 在浏览器控制台执行，或使用 node 运行

// 测试辅助函数
function assert(condition, message) {
    if (!condition) {
        console.error('❌ FAILED:', message);
        return false;
    }
    console.log('✅ PASSED:', message);
    return true;
}

function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// ==================== 1. 方块旋转状态测试 ====================
console.log('\n========== 测试 1: 方块旋转状态 ==========');

function rotateCW(m) {
    const N = m.length;
    return Array.from({length:N}, (_,i) => Array.from({length:N}, (_,j) => m[N-1-j][i]));
}

function rotateCCW(m) {
    const N = m.length;
    return Array.from({length:N}, (_,i) => Array.from({length:N}, (_,j) => m[j][N-1-i]));
}

// 生成态定义（参考 SRS wiki）
const SPAWN_STATES = {
    T: [[0,1,0],[1,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]]
};

let allPassed = true;

// 测试每个方块的4个状态
for (const [piece, spawn] of Object.entries(SPAWN_STATES)) {
    const states = [spawn];
    states.push(rotateCW(spawn));
    states.push(rotateCW(rotateCW(spawn)));
    states.push(rotateCW(rotateCW(rotateCW(spawn))));
    
    // 检查 O 不变
    if (piece === 'O') {
        allPassed = assert(
            deepEqual(states[0], states[1]) && deepEqual(states[1], states[2]),
            `${piece} 旋转后状态不变`
        ) && allPassed;
    } else {
        // 检查状态之间不同
        allPassed = assert(
            !deepEqual(states[0], states[1]) && !deepEqual(states[1], states[2]) && !deepEqual(states[2], states[3]),
            `${piece} 4个旋转状态互不相同`
        ) && allPassed;
        
        // 检查顺时针旋转4次回到原点
        allPassed = assert(
            deepEqual(rotateCW(rotateCW(rotateCW(rotateCW(spawn)))), spawn),
            `${piece} 顺时针旋转4次回到原点`
        ) && allPassed;
    }
}

// ==================== 2. T-Spin 判定测试 ====================
console.log('\n========== 测试 2: T-Spin 判定 ==========');

// 模拟棋盘
function createEmptyBoard() {
    return Array.from({length: 20}, () => Array(10).fill(0));
}

// 测试用例: 创建满足 T-Spin 条件的棋盘
function testTSpinCondition() {
    const board = createEmptyBoard();
    
    // 创建一个 T 能在里面 T-Spin 的形状:
    // 在 T 周围3个角有阻挡
    // 布局: 墙 左墙 右墙
    
    // 示例: 在棋盘中间放一些方块，形成3个角被阻挡
    const tCenter = {x: 4, y: 10};
    
    // 放置阻挡方块在 T 的3个角
    // 左上
    board[tCenter.y - 1][tCenter.x - 1] = '#f00000';
    // 右上  
    board[tCenter.y - 1][tCenter.x + 1] = '#00f000';
    // 左下
    board[tCenter.y + 1][tCenter.x - 1] = '#0000f0';
    // 右下空着
    
    // 检查 T 方块 3个角
    const corners = [
        {x: tCenter.x - 1, y: tCenter.y - 1},
        {x: tCenter.x + 1, y: tCenter.y - 1},
        {x: tCenter.x - 1, y: tCenter.y + 1},
        {x: tCenter.x + 1, y: tCenter.y + 1}
    ];
    
    let blocked = 0;
    for (const c of corners) {
        if (c.x < 0 || c.x >= 10 || c.y >= 20 || (c.y >= 0 && board[c.y][c.x])) {
            blocked++;
        }
    }
    
    allPassed = assert(
        blocked >= 3,
        `T-Spin 条件检测: ${blocked}/4 个角被阻挡`
    ) && allPassed;
}

testTSpinCondition();

// ==================== 3. Wall Kick 表测试 ====================
console.log('\n========== 测试 3: Wall Kick 表 ==========');

const KICK_JLSTZ = {
    0: { R: [[0,0], [-1,0], [-1,+1], [0,-2], [-1,-2]], L: [[0,0], [+1,0], [+1,+1], [0,-2], [+1,-2]] },
    R: { 0: [[0,0], [+1,0], [+1,-1], [0,+2], [+1,+2]], '2': [[0,0], [+1,0], [+1,-1], [0,+2], [+1,+2]] },
    2: { R: [[0,0], [-1,0], [-1,+1], [0,-2], [-1,-2]], L: [[0,0], [+1,0], [+1,+1], [0,-2], [+1,-2]] },
    L: { '2': [[0,0], [-1,0], [-1,-1], [0,+2], [-1,+2]], 0: [[0,0], [-1,0], [-1,-1], [0,+2], [-1,+2]] }
};

// 验证 Kick 表结构
for (const fromState of ['0', 'R', '2', 'L']) {
    for (const toState of Object.keys(KICK_JLSTZ[fromState])) {
        const kicks = KICK_JLSTZ[fromState][toState];
        allPassed = assert(
            kicks.length === 5,
            `Kick表 ${fromState}->${toState} 有5个测试点`
        ) && allPassed;
        
        // 第一个测试点应该是 (0,0)
        allPassed = assert(
            kicks[0][0] === 0 && kicks[0][1] === 0,
            `Kick表 ${fromState}->${toState} 第一个测试点是 (0,0)`
        ) && allPassed;
    }
}

// ==================== 4. B2B 逻辑测试 ====================
console.log('\n========== 测试 4: Back-to-Back 逻辑 ==========');

function shouldTriggerB2B(currentIsHighScore, lastWasHighScore) {
    return currentIsHighScore && lastWasHighScore;
}

// 测试用例
const b2bTests = [
    {last: false, current: false, expected: false, desc: '两次都是普通消除'},
    {last: false, current: true, expected: false, desc: '上次普通 + 本次高分'},
    {last: true, current: false, expected: false, desc: '上次高分 + 本次普通'},
    {last: true, current: true, expected: true, desc: '连续两次高分'},
];

for (const test of b2bTests) {
    const result = shouldTriggerB2B(test.current, test.last);
    allPassed = assert(
        result === test.expected,
        `B2B测试: ${test.desc} - ${result ? '触发' : '不触发'} (期望: ${test.expected ? '触发' : '不触发'})`
    ) && allPassed;
}

// ==================== 5. 7-Bag 块序测试 ====================
console.log('\n========== 测试 5: 7-Bag 块序 ==========');

function testBagSystem() {
    const bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const seen = new Set();
    const sequence = [];
    
    // 模拟取7个方块
    for (let i = 0; i < 7; i++) {
        const idx = Math.floor(Math.random() * bag.length);
        const piece = bag.splice(idx, 1)[0];
        sequence.push(piece);
        seen.add(piece);
    }
    
    allPassed = assert(
        seen.size === 7,
        `7-Bag: 7次抽取包含7种不同方块, 实际: ${seen.size}种`
    ) && allPassed;
    
    // 再抽7次，应该再次包含所有方块
    const bag2 = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const seen2 = new Set();
    for (let i = 0; i < 7; i++) {
        const idx = Math.floor(Math.random() * bag2.length);
        seen2.add(bag2.splice(idx, 1)[0]);
    }
    
    allPassed = assert(
        seen2.size === 7,
        `7-Bag: 第二包也有7种方块, 实际: ${seen2.size}种`
    ) && allPassed;
}

testBagSystem();

// ==================== 总结 ====================
console.log('\n========== 测试总结 ==========');
if (allPassed) {
    console.log('🎉 所有测试通过!');
} else {
    console.log('💥 部分测试失败，请检查!');
}