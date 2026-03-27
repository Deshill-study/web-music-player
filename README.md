# Web Music Player 网页音乐播放器

<div align="center">

🎵 基于 Python Flask 的轻量级网页音乐播放器

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

支持 MP3 / FLAC 格式 · 在线播放 · 播放列表管理

</div>

---

## 📖 项目简介

这是一个基于 Python Flask 框架开发的网页音乐播放器。用户可以上传本地的 MP3 或 FLAC 格式音频文件，在浏览器中直接播放，支持播放列表管理、多种播放模式切换等功能。

## ✨ 功能特性

### 核心功能
- 📤 **音频上传** - 支持 MP3 和 FLAC 格式，可批量上传
- ▶️ **播放控制** - 播放/暂停、上一首/下一首、进度条拖动
- 📋 **播放列表** - 显示所有上传歌曲，点击即播
- 🗑️ **歌曲管理** - 支持删除单首歌曲、清空播放列表

### 播放模式
| 模式 | 图标 | 说明 |
|------|------|------|
| 随机播放 | 🔀 | 随机选择下一首歌曲 |
| 列表循环 | 🔁 | 按顺序播放，播完从头开始 |
| 单曲循环 | 🔂 | 重复播放当前歌曲 |

### 其他特性
- 📀 **元数据读取** - 自动提取歌曲标题、艺术家、专辑信息
- 🖼️ **封面显示** - 支持显示内嵌专辑封面
- ⏱️ **进度显示** - 实时播放进度和总时长
- 🔊 **音量调节** - 在线音量控制
- ⌨️ **键盘快捷键** - 便捷的键盘操作

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.8+ | 后端语言 |
| Flask | 2.3+ | Web 框架 |
| mutagen | 1.46+ | 音频元数据处理 |
| HTML5 Audio | - | 前端音频播放 |
| CSS3 | - | 渐变背景、动画效果 |
| JavaScript | ES6+ | 前端交互逻辑 |

## 🚀 快速开始

### 环境要求

- Python 3.8 或更高版本
- pip 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd 网页音乐播放器
   ```

2. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

3. **启动服务**
   ```bash
   python app.py
   ```

4. **访问播放器**

   打开浏览器访问：http://localhost:5000

## 📖 使用说明

### 上传音乐
1. 点击页面下方的上传区域
2. 选择 MP3 或 FLAC 格式文件（支持多选）
3. 或者直接将文件拖拽到上传区域

### 播放控制
- 点击播放列表中的歌曲开始播放
- 使用播放控制按钮切换歌曲
- 拖动进度条跳转到指定位置

### 键盘快捷键

| 按键 | 功能 |
|------|------|
| `空格` | 播放/暂停 |
| `←` | 快退 5 秒 |
| `→` | 快进 5 秒 |
| `↑` | 增加音量 |
| `↓` | 减小音量 |

## 📁 项目结构

```
网页音乐播放器/
├── app.py                  # Flask 后端主程序
├── requirements.txt        # Python 依赖列表
├── README.md              # 项目说明文档
├── static/
│   ├── audio/             # 上传音频存储目录（运行后自动创建）
│   ├── css/
│   │   └── style.css      # 页面样式
│   ├── js/
│   │   └── player.js      # 前端播放器逻辑
│   └── images/            # 图片资源目录
└── templates/
    └── index.html         # 主页面模板
```

## ⚙️ 配置说明

在 `app.py` 中可以修改以下配置：

```python
# 上传文件大小限制（默认 50MB）
MAX_CONTENT_LENGTH = 50 * 1024 * 1024

# 允许的文件格式
ALLOWED_EXTENSIONS = {'mp3', 'flac'}

# 服务器端口
app.run(host='0.0.0.0', port=5000)
```

## 🔧 常见问题

### 1. 依赖安装失败
```bash
# 尝试升级 pip
pip install --upgrade pip
# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 2. 端口被占用
修改 `app.py` 中的端口号：
```python
app.run(debug=True, host='0.0.0.0', port=8080)
```

### 3. 中文路径问题
项目支持中文路径，但建议服务器环境使用 UTF-8 编码。

## 📝 注意事项

- 上传的文件临时存储在 `static/audio/` 目录
- 播放列表数据存储在内存中，服务器重启后清空
- 默认单文件最大 50MB
- 生产环境部署建议使用 Gunicorn 等 WSGI 服务器

## 🔮 未来计划

- [ ] 用户登录和播放列表持久化
- [ ] 歌词显示功能
- [ ] 均衡器和音效设置
- [ ] 歌单分类和搜索功能
- [ ] 响应式移动端优化
- [ ] 支持更多音频格式（WAV、AAC 等）

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">

**Made with ❤️ by You**

如果这个项目对你有帮助，请给一个 ⭐️ Star 支持！

</div>
