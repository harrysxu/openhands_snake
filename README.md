# 贪吃蛇游戏 🐍

一个使用HTML5 Canvas、CSS3和JavaScript开发的现代化贪吃蛇游戏。

## 功能特点

- 🎮 流畅的游戏体验
- 📱 响应式设计，支持移动端
- 🎨 现代化的UI设计和动画效果
- 💾 本地最高分记录
- ⌨️ 支持键盘和触摸控制
- 🎯 暂停/继续功能

## 游戏控制

### 键盘控制
- 方向键 或 WASD：控制蛇的移动方向
- 空格键：暂停/继续游戏

### 移动端控制
- 使用屏幕上的方向按钮控制蛇的移动

## 如何运行

### 方法1：直接打开HTML文件
直接在浏览器中打开 `index.html` 文件即可开始游戏。

### 方法2：使用Python服务器
```bash
# 运行内置的Python服务器
python3 server.py

# 或指定端口
python3 server.py 8080
```

然后在浏览器中访问 `http://localhost:12000`（或指定的端口）。

### 方法3：使用其他HTTP服务器
```bash
# 使用Python内置服务器
python3 -m http.server 8000

# 使用Node.js的http-server
npx http-server

# 使用PHP内置服务器
php -S localhost:8000
```

## 游戏规则

1. 控制蛇吃掉红色的食物
2. 每吃一个食物，蛇会变长，得分增加10分
3. 避免撞到墙壁或蛇的身体
4. 游戏结束时会显示当前得分和最高分

## 技术栈

- **HTML5**: 游戏结构和Canvas元素
- **CSS3**: 现代化样式设计和动画效果
- **JavaScript**: 游戏逻辑和交互控制
- **Canvas API**: 游戏图形渲染

## 文件结构

```
openhands_snake/
├── index.html      # 主HTML文件
├── style.css       # 样式文件
├── script.js       # 游戏逻辑
├── server.py       # 简单HTTP服务器
└── README.md       # 项目说明
```

## 浏览器兼容性

支持所有现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 开发说明

游戏使用面向对象的JavaScript编程，主要包含以下类和功能：

- `SnakeGame`: 主游戏类，包含所有游戏逻辑
- 碰撞检测系统
- 食物生成算法
- 本地存储最高分
- 响应式设计适配

## 贡献

欢迎提交Issue和Pull Request来改进这个游戏！

## 许可证

MIT License