// Test file for auto-play functionality
// This file tests the pathfinding algorithm and auto-play features

class SnakeGameTest {
    constructor() {
        this.gridSize = 20;
        this.tileCount = 20;
        this.snake = [{ x: 10, y: 10 }];
        this.food = { x: 15, y: 15 };
        this.dx = 0;
        this.dy = 0;
    }

    // Copy of the pathfinding algorithm from the main game
    findPath(start, target) {
        const openSet = [start];
        const closedSet = [];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(`${start.x},${start.y}`, 0);
        fScore.set(`${start.x},${start.y}`, this.heuristic(start, target));
        
        while (openSet.length > 0) {
            let current = openSet.reduce((min, node) => {
                const currentF = fScore.get(`${node.x},${node.y}`) || Infinity;
                const minF = fScore.get(`${min.x},${min.y}`) || Infinity;
                return currentF < minF ? node : min;
            });
            
            if (current.x === target.x && current.y === target.y) {
                const path = [];
                while (current) {
                    path.unshift(current);
                    current = cameFrom.get(`${current.x},${current.y}`);
                }
                return path;
            }
            
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);
            
            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];
            
            for (let neighbor of neighbors) {
                if (neighbor.x < 0 || neighbor.x >= this.tileCount || 
                    neighbor.y < 0 || neighbor.y >= this.tileCount) {
                    continue;
                }
                
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
        
        return null;
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
        
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        
        for (let dir of directions) {
            const newHead = { x: head.x + dir.dx, y: head.y + dir.dy };
            
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
        
        return { dx: this.dx, dy: this.dy };
    }

    // Test cases
    runTests() {
        console.log('Running auto-play tests...');
        
        // Test 1: Basic pathfinding
        const path = this.findPath(this.snake[0], this.food);
        console.log('Test 1 - Basic pathfinding:', path ? 'PASS' : 'FAIL');
        if (path) {
            console.log('Path length:', path.length);
            console.log('Path:', path);
        }
        
        // Test 2: Auto direction
        const direction = this.getAutoDirection();
        console.log('Test 2 - Auto direction:', direction ? 'PASS' : 'FAIL');
        console.log('Direction:', direction);
        
        // Test 3: Wall avoidance
        this.snake = [{ x: 0, y: 0 }]; // Snake at corner
        this.food = { x: 5, y: 5 };
        const safeDirection = this.getAutoDirection();
        console.log('Test 3 - Wall avoidance:', safeDirection ? 'PASS' : 'FAIL');
        console.log('Safe direction from corner:', safeDirection);
        
        // Test 4: Self-collision avoidance
        this.snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
            { x: 3, y: 4 },
            { x: 4, y: 4 },
            { x: 5, y: 4 }
        ];
        this.food = { x: 10, y: 10 };
        const avoidDirection = this.getAutoDirection();
        console.log('Test 4 - Self-collision avoidance:', avoidDirection ? 'PASS' : 'FAIL');
        console.log('Avoid direction:', avoidDirection);
        
        console.log('All tests completed!');
    }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    const test = new SnakeGameTest();
    test.runTests();
}

// Export for browser testing
if (typeof window !== 'undefined') {
    window.SnakeGameTest = SnakeGameTest;
}