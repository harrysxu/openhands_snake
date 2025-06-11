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
        this.autoPlay = false;
        this.particles = [];
        
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
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.dx !== -1) {
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
        document.getElementById('autoBtn').addEventListener('click', () => this.toggleAutoPlay());
        
        // 移动端控制
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.gameRunning || this.gamePaused) return;
                
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
    
    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        this.updateButtonStates();
        
        if (this.autoPlay && !this.gameRunning) {
            this.startGame();
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.autoPlay = false;
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.particles = [];
        this.updateScore();
        this.generateFood();
        this.updateButtonStates();
        this.draw();
    }
    
    updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const autoBtn = document.getElementById('autoBtn');
        
        startBtn.disabled = this.gameRunning;
        pauseBtn.disabled = !this.gameRunning || this.autoPlay;
        pauseBtn.textContent = this.gamePaused ? '继续' : '暂停';
        resetBtn.disabled = false;
        autoBtn.textContent = this.autoPlay ? '关闭自动' : '自动模式';
        
        // 确保按钮状态正确更新
        if (this.gameRunning) {
            startBtn.style.opacity = '0.6';
            pauseBtn.style.opacity = this.autoPlay ? '0.6' : '1';
        } else {
            startBtn.style.opacity = '1';
            pauseBtn.style.opacity = '0.6';
        }
        
        autoBtn.style.opacity = this.autoPlay ? '1' : '0.8';
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
    
    // A*寻路算法
    findPath(start, target) {
        const openSet = [start];
        const closedSet = [];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(`${start.x},${start.y}`, 0);
        fScore.set(`${start.x},${start.y}`, this.heuristic(start, target));
        
        while (openSet.length > 0) {
            // 找到fScore最小的节点
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
    
    getAutoDirection() {
        const head = this.snake[0];
        const path = this.findPath(head, this.food);
        
        if (path && path.length > 1) {
            const nextStep = path[1];
            const dx = nextStep.x - head.x;
            const dy = nextStep.y - head.y;
            return { dx, dy };
        }
        
        // 如果没有找到路径，尝试避开障碍物
        const directions = [
            { dx: 1, dy: 0 },   // 右
            { dx: -1, dy: 0 },  // 左
            { dx: 0, dy: 1 },   // 下
            { dx: 0, dy: -1 }   // 上
        ];
        
        for (let dir of directions) {
            const newHead = { x: head.x + dir.dx, y: head.y + dir.dy };
            
            // 检查是否安全
            if (newHead.x >= 0 && newHead.x < this.tileCount && 
                newHead.y >= 0 && newHead.y < this.tileCount) {
                
                let safe = true;
                for (let segment of this.snake) {
                    if (segment.x === newHead.x && segment.y === newHead.y) {
                        safe = false;
                        break;
                    }
                }
                
                if (safe) {
                    return dir;
                }
            }
        }
        
        // 如果所有方向都不安全，保持当前方向
        return { dx: this.dx, dy: this.dy };
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // 自动模式下使用AI控制
        if (this.autoPlay) {
            const autoDir = this.getAutoDirection();
            this.dx = autoDir.dx;
            this.dy = autoDir.dy;
        }
        
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
        
        this.snake.unshift(head);
        
        // 检查食物碰撞
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.createParticles(this.food.x, this.food.y);
            this.generateFood();
            
            // 添加得分动画
            this.scoreElement.parentElement.classList.add('score-animation');
            setTimeout(() => {
                this.scoreElement.parentElement.classList.remove('score-animation');
            }, 300);
        } else {
            this.snake.pop();
        }
    }
    
    createParticles(x, y) {
        const centerX = x * this.gridSize + this.gridSize / 2;
        const centerY = y * this.gridSize + this.gridSize / 2;
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                decay: 0.02,
                color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)`
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
        
        // 更新和绘制粒子效果
        this.updateParticles();
        this.drawParticles();
        
        // 如果游戏暂停，显示暂停信息
        if (this.gamePaused) {
            this.drawPauseScreen();
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
                // 蛇头 - 渐变效果
                const gradient = this.ctx.createRadialGradient(
                    x + size/2, y + size/2, 0,
                    x + size/2, y + size/2, size/2
                );
                gradient.addColorStop(0, '#4ecdc4');
                gradient.addColorStop(1, '#26a69a');
                
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = '#4ecdc4';
                this.ctx.shadowBlur = 15;
                
                // 绘制圆角矩形
                this.ctx.beginPath();
                this.drawRoundRect(x, y, size, size, 8);
                this.ctx.fill();
                
                // 绘制眼睛
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.3, y + size * 0.3, 2, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.7, y + size * 0.3, 2, 0, 2 * Math.PI);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.3, y + size * 0.3, 1, 0, 2 * Math.PI);
                this.ctx.arc(x + size * 0.7, y + size * 0.3, 1, 0, 2 * Math.PI);
                this.ctx.fill();
            } else {
                // 蛇身 - 渐变效果
                const alpha = 1 - (index / this.snake.length) * 0.3;
                const gradient = this.ctx.createRadialGradient(
                    x + size/2, y + size/2, 0,
                    x + size/2, y + size/2, size/2
                );
                gradient.addColorStop(0, `rgba(69, 183, 170, ${alpha})`);
                gradient.addColorStop(1, `rgba(38, 166, 154, ${alpha})`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = '#45b7aa';
                this.ctx.shadowBlur = 8;
                
                this.ctx.beginPath();
                this.drawRoundRect(x, y, size, size, 6);
                this.ctx.fill();
            }
        });
        
        this.ctx.shadowBlur = 0;
    }
    
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
    
    drawFood() {
        const centerX = this.food.x * this.gridSize + this.gridSize / 2;
        const centerY = this.food.y * this.gridSize + this.gridSize / 2;
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 0.2 + 1;
        const radius = (this.gridSize / 2 - 2) * pulse;
        
        // 创建径向渐变
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.7, '#ff5252');
        gradient.addColorStop(1, '#d32f2f');
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 20 * pulse;
        
        // 绘制脉动的圆形食物
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 绘制内部高光
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 2, centerY - 2, radius * 0.3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按空格键或点击继续按钮恢复游戏', this.canvas.width / 2, this.canvas.height / 2 + 40);
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
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.update();
        this.draw();
        
        setTimeout(() => {
            this.gameLoop();
        }, 150); // 控制游戏速度
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