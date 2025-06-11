class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        
        // 游戏设置
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 游戏状态
        this.snake = [{ x: 10, y: 10 }];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gamePaused = false;
        
        // 自动模式
        this.autoMode = false;
        this.autoPath = [];
        
        // 视觉效果
        this.particles = [];
        this.trails = [];
        this.foodPulse = 0;
        
        // 初始化
        this.init();
    }
    
    init() {
        this.updateHighScoreDisplay();
        this.generateFood();
        this.setupEventListeners();
        this.updateButtonStates();
        this.draw();
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (!this.autoMode && this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (!this.autoMode && this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (!this.autoMode && this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (!this.autoMode && this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // 按钮控制
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('autoBtn').addEventListener('click', () => this.toggleAutoMode());
        
        // 移动端控制
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.gameRunning || this.gamePaused || this.autoMode) return;
                
                const direction = btn.dataset.direction;
                switch(direction) {
                    case 'up':
                        if (this.dy !== 1) {
                            this.dx = 0;
                            this.dy = -1;
                        }
                        break;
                    case 'down':
                        if (this.dy !== -1) {
                            this.dx = 0;
                            this.dy = 1;
                        }
                        break;
                    case 'left':
                        if (this.dx !== 1) {
                            this.dx = -1;
                            this.dy = 0;
                        }
                        break;
                    case 'right':
                        if (this.dx !== -1) {
                            this.dx = 1;
                            this.dy = 0;
                        }
                        break;
                }
            });
        });
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        
        // 设置初始方向为向右
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1;
            this.dy = 0;
        }
        
        this.updateButtonStates();
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        this.updateButtonStates();
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.autoPath = [];
        this.particles = [];
        this.trails = [];
        this.updateScore();
        this.generateFood();
        this.updateButtonStates();
        this.draw();
    }
    
    toggleAutoMode() {
        this.autoMode = !this.autoMode;
        const autoBtn = document.getElementById('autoBtn');
        
        if (this.autoMode) {
            autoBtn.textContent = '手动模式';
            autoBtn.classList.add('active');
        } else {
            autoBtn.textContent = '自动模式';
            autoBtn.classList.remove('active');
        }
        
        this.autoPath = [];
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        startBtn.disabled = this.gameRunning;
        pauseBtn.disabled = !this.gameRunning;
        pauseBtn.textContent = this.gamePaused ? '继续' : '暂停';
        resetBtn.disabled = false;
        
        // 确保按钮状态正确更新
        if (this.gameRunning) {
            startBtn.style.opacity = '0.6';
            pauseBtn.style.opacity = '1';
        } else {
            startBtn.style.opacity = '1';
            pauseBtn.style.opacity = '0.6';
        }
    }
    
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // 确保食物不在蛇身上
        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                return;
            }
        }
    }
    
    // AI 自动寻路算法
    findPath(start, target) {
        const openSet = [start];
        const closedSet = [];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(`${start.x},${start.y}`, 0);
        fScore.set(`${start.x},${start.y}`, this.heuristic(start, target));
        
        while (openSet.length > 0) {
            // 找到 fScore 最小的节点
            let current = openSet.reduce((min, node) => {
                const currentF = fScore.get(`${node.x},${node.y}`) || Infinity;
                const minF = fScore.get(`${min.x},${min.y}`) || Infinity;
                return currentF < minF ? node : min;
            });
            
            if (current.x === target.x && current.y === target.y) {
                // 重建路径
                const path = [];
                while (current) {
                    path.unshift(current);
                    current = cameFrom.get(`${current.x},${current.y}`);
                }
                return path;
            }
            
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);
            
            // 检查邻居
            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];
            
            for (let neighbor of neighbors) {
                // 检查边界
                if (neighbor.x < 0 || neighbor.x >= this.tileCount || 
                    neighbor.y < 0 || neighbor.y >= this.tileCount) {
                    continue;
                }
                
                // 检查是否撞到蛇身（除了尾巴，因为移动后尾巴会消失）
                let collision = false;
                for (let i = 0; i < this.snake.length - 1; i++) {
                    if (this.snake[i].x === neighbor.x && this.snake[i].y === neighbor.y) {
                        collision = true;
                        break;
                    }
                }
                
                if (collision || closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    continue;
                }
                
                const tentativeGScore = (gScore.get(`${current.x},${current.y}`) || 0) + 1;
                
                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(`${neighbor.x},${neighbor.y}`) || Infinity)) {
                    continue;
                }
                
                cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
                gScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore);
                fScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore + this.heuristic(neighbor, target));
            }
        }
        
        return null; // 没有找到路径
    }
    
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    // 安全移动策略（当找不到食物路径时）
    getSafeMove() {
        const head = this.snake[0];
        const moves = [
            { dx: 1, dy: 0 },   // 右
            { dx: -1, dy: 0 },  // 左
            { dx: 0, dy: 1 },   // 下
            { dx: 0, dy: -1 }   // 上
        ];
        
        // 过滤掉会导致立即死亡的移动
        const safeMoves = moves.filter(move => {
            const newX = head.x + move.dx;
            const newY = head.y + move.dy;
            
            // 检查边界
            if (newX < 0 || newX >= this.tileCount || newY < 0 || newY >= this.tileCount) {
                return false;
            }
            
            // 检查是否撞到自己
            for (let segment of this.snake) {
                if (segment.x === newX && segment.y === newY) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (safeMoves.length === 0) {
            return null; // 无路可走
        }
        
        // 优先选择能给蛇更多空间的移动
        const moveWithSpace = safeMoves.map(move => {
            const newX = head.x + move.dx;
            const newY = head.y + move.dy;
            let space = 0;
            
            // 简单的空间计算：检查周围的空格数
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const checkX = newX + dx;
                    const checkY = newY + dy;
                    
                    if (checkX >= 0 && checkX < this.tileCount && 
                        checkY >= 0 && checkY < this.tileCount) {
                        let occupied = false;
                        for (let segment of this.snake) {
                            if (segment.x === checkX && segment.y === checkY) {
                                occupied = true;
                                break;
                            }
                        }
                        if (!occupied) space++;
                    }
                }
            }
            
            return { move, space };
        });
        
        // 选择空间最大的移动
        const bestMove = moveWithSpace.reduce((best, current) => 
            current.space > best.space ? current : best
        );
        
        return bestMove.move;
    }
    
    // 自动控制逻辑
    autoControl() {
        if (!this.autoMode) return;
        
        const head = this.snake[0];
        
        // 尝试找到通往食物的路径
        const path = this.findPath(head, this.food);
        
        if (path && path.length > 1) {
            // 有路径，跟随路径
            const nextStep = path[1];
            this.dx = nextStep.x - head.x;
            this.dy = nextStep.y - head.y;
        } else {
            // 没有路径，使用安全移动策略
            const safeMove = this.getSafeMove();
            if (safeMove) {
                this.dx = safeMove.dx;
                this.dy = safeMove.dy;
            }
            // 如果没有安全移动，保持当前方向（可能会死亡）
        }
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // 自动控制
        this.autoControl();
        
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // 检查自身碰撞
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        // 添加蛇尾轨迹效果
        if (this.snake.length > 0) {
            const tail = this.snake[this.snake.length - 1];
            this.addTrail(tail.x * this.gridSize + this.gridSize / 2, 
                         tail.y * this.gridSize + this.gridSize / 2);
        }
        
        this.snake.unshift(head);
        
        // 检查食物碰撞
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            
            // 添加粒子效果
            this.addParticles(this.food.x * this.gridSize + this.gridSize / 2, 
                            this.food.y * this.gridSize + this.gridSize / 2);
            
            this.generateFood();
            
            // 添加得分动画
            this.scoreElement.parentElement.classList.add('score-animation');
            setTimeout(() => {
                this.scoreElement.parentElement.classList.remove('score-animation');
            }, 300);
        } else {
            this.snake.pop();
        }
        
        // 更新粒子和轨迹
        this.updateParticles();
        this.updateTrails();
    }
    
    // 添加粒子效果
    addParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.02
            });
        }
    }
    
    // 添加轨迹效果
    addTrail(x, y) {
        this.trails.push({
            x: x,
            y: y,
            life: 1.0,
            decay: 0.05
        });
    }
    
    // 更新粒子
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            return particle.life > 0;
        });
    }
    
    // 更新轨迹
    updateTrails() {
        this.trails = this.trails.filter(trail => {
            trail.life -= trail.decay;
            return trail.life > 0;
        });
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制轨迹效果
        this.drawTrails();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制粒子效果
        this.drawParticles();
        
        // 如果游戏暂停，显示暂停信息
        if (this.gamePaused) {
            this.drawPauseScreen();
        }
        
        // 如果是自动模式，显示AI指示
        if (this.autoMode && this.gameRunning) {
            this.drawAutoIndicator();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize + 1;
            const y = segment.y * this.gridSize + 1;
            const size = this.gridSize - 2;
            
            if (index === 0) {
                // 蛇头 - 更亮更大的效果
                const gradient = this.ctx.createRadialGradient(
                    x + size/2, y + size/2, 0,
                    x + size/2, y + size/2, size/2
                );
                gradient.addColorStop(0, '#4ecdc4');
                gradient.addColorStop(0.7, '#45b7aa');
                gradient.addColorStop(1, '#3a9b94');
                
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = '#4ecdc4';
                this.ctx.shadowBlur = 15;
                
                // 绘制圆角矩形
                this.ctx.beginPath();
                this.drawRoundRect(x, y, size, size, 6);
                this.ctx.fill();
                
                // 添加眼睛
                this.ctx.fillStyle = 'white';
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.3, y + size * 0.3, 2, 0, Math.PI * 2);
                this.ctx.arc(x + size * 0.7, y + size * 0.3, 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // 蛇身 - 渐变效果
                const alpha = 1 - (index / this.snake.length) * 0.3;
                const gradient = this.ctx.createRadialGradient(
                    x + size/2, y + size/2, 0,
                    x + size/2, y + size/2, size/2
                );
                gradient.addColorStop(0, `rgba(69, 183, 170, ${alpha})`);
                gradient.addColorStop(1, `rgba(58, 155, 148, ${alpha})`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = '#45b7aa';
                this.ctx.shadowBlur = 8;
                
                this.ctx.beginPath();
                this.drawRoundRect(x, y, size, size, 4);
                this.ctx.fill();
            }
        });
        
        this.ctx.shadowBlur = 0;
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;
        
        // 脉动效果
        this.foodPulse += 0.1;
        const pulseScale = 1 + Math.sin(this.foodPulse) * 0.2;
        
        // 创建径向渐变
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * pulseScale);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.7, '#ff5252');
        gradient.addColorStop(1, '#f44336');
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 20 * pulseScale;
        
        // 绘制圆形食物
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * pulseScale, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 添加高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.shadowColor = '#ff6b6b';
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3 * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    drawTrails() {
        this.trails.forEach(trail => {
            this.ctx.save();
            this.ctx.globalAlpha = trail.life * 0.3;
            this.ctx.fillStyle = '#4ecdc4';
            
            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, 8 * trail.life, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    drawAutoIndicator() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(156, 39, 176, 0.8)';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🤖 AI模式', 10, 25);
        this.ctx.restore();
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '16px Arial';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText('按空格键或点击继续按钮恢复游戏', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
    }
    
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.updateButtonStates();
        
        // 添加游戏结束动画
        this.canvas.classList.add('game-over');
        setTimeout(() => {
            this.canvas.classList.remove('game-over');
        }, 500);
        
        // 显示游戏结束信息
        setTimeout(() => {
            alert(`游戏结束！\n得分: ${this.score}\n最高分: ${this.highScore}`);
        }, 100);
    }
    
    // 绘制圆角矩形的辅助方法
    drawRoundRect(x, y, width, height, radius) {
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.update();
        this.draw();
        
        // 根据蛇的长度调整速度，让游戏更有挑战性
        const speed = Math.max(100, 180 - this.snake.length * 2);
        
        setTimeout(() => {
            this.gameLoop();
        }, speed);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// 防止方向键滚动页面
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});