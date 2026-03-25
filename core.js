// ==================== Tetris 核心逻辑 ====================
// 供 index.html 和测试使用

const TETRIS = {
    COLS: 10,
    ROWS: 20,
    BLOCK_SIZE: 30,
    
    // 旋转状态
    ROTATION_STATE: { 0: 0, R: 1, '2': 2, L: 3 },
    
    // 生成态 + 矩阵旋转函数
    getSpawnMatrix(type) {
        const spawns = {
            I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            O: [[1,1],[1,1]],
            T: [[0,1,0],[1,1,1],[0,0,0]],
            S: [[0,1,1],[1,1,0],[0,0,0]],
            Z: [[1,1,0],[0,1,1],[0,0,0]],
            J: [[1,0,0],[1,1,1],[0,0,0]],
            L: [[0,0,1],[1,1,1],[0,0,0]]
        };
        return spawns[type] || null;
    },
    
    // 矩阵顺时针旋转
    rotateCW(m) {
        if (!m) return null;
        const N = m.length;
        return Array.from({length:N}, (_,i) => 
            Array.from({length:N}, (_,j) => m[N-1-j][i])
        );
    },
    
    // 矩阵逆时针旋转
    rotateCCW(m) {
        if (!m) return null;
        const N = m.length;
        return Array.from({length:N}, (_,i) => 
            Array.from({length:N}, (_,j) => m[j][N-1-i])
        );
    },
    
    // 获取方块所有4个状态
    getStates(type) {
        const spawn = this.getSpawnMatrix(type);
        if (!spawn) return null;
        
        return [
            spawn,
            this.rotateCW(spawn),
            this.rotateCW(this.rotateCW(spawn)),
            this.rotateCCW(spawn)
        ];
    },
    
    // 颜色定义
    COLORS: {
        I: '#00f0f0',
        O: '#f0f000',
        T: '#a000f0',
        S: '#00f000',
        Z: '#f00000',
        J: '#0000f0',
        L: '#f0a000'
    },
    
    // Wall Kick 表
    KICK_JLSTZ: {
        0: { R: [[0,0], [-1,0], [-1,+1], [0,-2], [-1,-2]], L: [[0,0], [+1,0], [+1,+1], [0,-2], [+1,-2]] },
        R: { 0: [[0,0], [+1,0], [+1,-1], [0,+2], [+1,+2]], '2': [[0,0], [+1,0], [+1,-1], [0,+2], [+1,+2]] },
        2: { R: [[0,0], [-1,0], [-1,+1], [0,-2], [-1,-2]], L: [[0,0], [+1,0], [+1,+1], [0,-2], [+1,-2]] },
        L: { '2': [[0,0], [-1,0], [-1,-1], [0,+2], [-1,+2]], 0: [[0,0], [-1,0], [-1,-1], [0,+2], [-1,+2]] }
    },
    
    KICK_I: {
        0: { R: [[0,0], [-2,0], [+1,0], [-2,-1], [+1,+2]], L: [[0,0], [-1,0], [+2,0], [-1,+2], [+2,-1]] },
        R: { 0: [[0,0], [+2,0], [-1,0], [+2,+1], [-1,-2]], '2': [[0,0], [-1,0], [+2,0], [-1,+2], [+2,-1]] },
        2: { R: [[0,0], [+1,0], [-2,0], [+1,-2], [-2,+1]], L: [[0,0], [+2,0], [-1,0], [+2,+1], [-1,-2]] },
        L: { '2': [[0,0], [-2,0], [+1,0], [-2,-1], [+1,+2]], 0: [[0,0], [+1,0], [-2,0], [+1,-2], [-2,+1]] }
    },
    
    // 创建空棋盘
    createBoard() {
        return Array.from({length: this.ROWS}, () => Array(this.COLS).fill(0));
    },
    
    // T-Spin 检查
    checkTCorners(piece, board) {
        if (piece.type !== 'T') return false;
        const center = { x: piece.x + 1, y: piece.y + 1 };
        const corners = [
            { x: center.x - 1, y: center.y - 1 },
            { x: center.x + 1, y: center.y - 1 },
            { x: center.x - 1, y: center.y + 1 },
            { x: center.x + 1, y: center.y + 1 }
        ];
        let blocked = 0;
        for (const c of corners) {
            if (c.x < 0 || c.x >= this.COLS || c.y >= this.ROWS || 
                (c.y >= 0 && board[c.y][c.x])) {
                blocked++;
            }
        }
        return blocked >= 3;
    },
    
    // B2B 判断
    shouldTriggerB2B(currentIsHighScore, lastWasHighScore) {
        return currentIsHighScore && lastWasHighScore;
    },
    
    // 7-Bag 系统
    bag: [],
    refillBag() {
        this.bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        // Fisher-Yates 洗牌
        for (let i = this.bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
    },
    getNextFromBag() {
        if (this.bag.length === 0) this.refillBag();
        return this.bag.pop();
    }
};

// 导出 (Node.js 环境)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TETRIS;
}