/**
 * 网页音乐播放器 - 前端 JavaScript
 */

class MusicPlayer {
    constructor() {
        // DOM 元素
        this.audio = document.getElementById('audio-player');
        this.playBtn = document.getElementById('play-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.modeBtn = document.getElementById('mode-btn');
        this.modeIcon = document.getElementById('mode-icon');
        this.modeText = document.getElementById('mode-text');
        this.progressBar = document.getElementById('progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.durationEl = document.getElementById('duration');
        this.volumeBar = document.getElementById('volume-bar');
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.uploadProgress = document.getElementById('upload-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.uploadStatus = document.getElementById('upload-status');
        this.playlistEl = document.getElementById('playlist');
        this.clearPlaylistBtn = document.getElementById('clear-playlist');
        this.albumCover = document.getElementById('album-cover');
        this.coverWrapper = document.querySelector('.cover-wrapper');

        // 状态
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;

        // 播放模式：0=随机播放，1=列表循环，2=单曲循环
        this.playModes = [
            { icon: '🔀', text: '随机播放' },
            { icon: '🔁', text: '列表循环' },
            { icon: '🔂', text: '单曲循环' }
        ];
        this.currentMode = 0;
        this.shuffleOrder = [];

        // 初始化
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPlaylist();
        this.updateModeButton();

        // 设置默认音量
        this.audio.volume = this.volumeBar.value / 100;
    }

    bindEvents() {
        // 播放控制
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());

        // 播放模式切换
        this.modeBtn.addEventListener('click', () => this.togglePlayMode());

        // 进度条
        this.progressBar.addEventListener('input', (e) => this.seek(e));
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());

        // 音量控制
        this.volumeBar.addEventListener('input', (e) => this.changeVolume(e));

        // 上传
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 清空播放列表
        this.clearPlaylistBtn.addEventListener('click', () => this.clearPlaylist());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // 加载播放列表
    async loadPlaylist() {
        try {
            const response = await fetch('/playlist');
            this.playlist = await response.json();
            this.renderPlaylist();

            if (this.playlist.length > 0 && this.currentIndex === -1) {
                this.currentIndex = 0;
                this.loadTrack(this.currentIndex);
            }
        } catch (error) {
            console.error('加载播放列表失败:', error);
        }
    }

    // 渲染播放列表
    renderPlaylist() {
        if (this.playlist.length === 0) {
            this.playlistEl.innerHTML = '<p class="empty-playlist">播放列表为空，请上传音乐</p>';
            return;
        }

        this.playlistEl.innerHTML = this.playlist.map((track, index) => `
            <div class="track-item ${index === this.currentIndex ? 'active' : ''}"
                 data-index="${index}">
                <div class="track-item-info">
                    <div class="track-item-title">${this.escapeHtml(track.title)}</div>
                    <div class="track-item-artist">${this.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-item-duration">${this.formatDuration(track.duration)}</div>
                <button class="track-item-remove" data-index="${index}" title="移除">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // 绑定点击事件
        this.playlistEl.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.track-item-remove')) {
                    const index = parseInt(e.target.closest('.track-item-remove').dataset.index);
                    this.removeTrack(index);
                } else {
                    const index = parseInt(item.dataset.index);
                    this.playTrack(index);
                }
            });
        });
    }

    // 转义 HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 处理文件上传
    async handleFiles(files) {
        if (files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            const ext = file.name.rsplit('.', 1)[1]?.toLowerCase();
            return ext === 'mp3' || ext === 'flac';
        });

        if (validFiles.length === 0) {
            alert('只支持 MP3 和 FLAC 格式文件');
            return;
        }

        this.uploadProgress.style.display = 'block';
        let uploaded = 0;

        for (const file of validFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    uploaded++;
                    this.uploadStatus.textContent = `已上传 ${uploaded}/${validFiles.length}: ${result.track.original_name}`;
                    this.progressFill.style.width = `${(uploaded / validFiles.length) * 100}%`;

                    // 添加到播放列表
                    this.playlist.push(result.track);

                    // 如果是第一首上传的歌曲，自动加载
                    if (this.currentIndex === -1) {
                        this.currentIndex = this.playlist.length - 1;
                        this.loadTrack(this.currentIndex);
                    }
                } else {
                    console.error('上传失败:', result.error);
                }
            } catch (error) {
                console.error('上传错误:', error);
            }
        }

        this.renderPlaylist();

        setTimeout(() => {
            this.uploadProgress.style.display = 'none';
            this.progressFill.style.width = '0%';
            this.uploadStatus.textContent = '上传中...';
            this.fileInput.value = '';
        }, 2000);
    }

    // 加载歌曲
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        const track = this.playlist[index];
        this.audio.src = `/audio/${track.filename}`;

        // 更新 UI
        document.getElementById('track-title').textContent = track.title;
        document.getElementById('track-artist').textContent = track.artist;
        document.getElementById('track-album').textContent = track.album;

        // 更新封面
        if (track.cover) {
            this.albumCover.src = `/cover/${track.cover}`;
        } else {
            this.albumCover.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>🎵</text></svg>';
        }

        this.currentIndex = index;
        this.renderPlaylist();

        // 自动播放
        this.play();
    }

    // 播放歌曲
    playTrack(index) {
        this.loadTrack(index);
    }

    // 切换播放/暂停
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.currentIndex === -1 && this.playlist.length > 0) {
            this.currentIndex = 0;
            this.loadTrack(this.currentIndex);
            return;
        }

        this.audio.play().then(() => {
            this.isPlaying = true;
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
            this.coverWrapper.classList.add('playing');
        }).catch(error => {
            console.error('播放失败:', error);
        });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        this.coverWrapper.classList.remove('playing');
    }

    // 上一首
    playPrevious() {
        if (this.playlist.length === 0) return;

        if (this.currentMode === 0) {
            // 随机模式
            const randomIndex = Math.floor(Math.random() * this.playlist.length);
            this.loadTrack(randomIndex);
        } else {
            // 顺序模式
            let newIndex = this.currentIndex - 1;
            if (newIndex < 0) newIndex = this.playlist.length - 1;
            this.loadTrack(newIndex);
        }
    }

    // 下一首
    playNext() {
        if (this.playlist.length === 0) return;

        if (this.currentMode === 0) {
            // 随机模式
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * this.playlist.length);
            } while (randomIndex === this.currentIndex && this.playlist.length > 1);
            this.loadTrack(randomIndex);
        } else {
            // 顺序模式
            let newIndex = this.currentIndex + 1;
            if (newIndex >= this.playlist.length) newIndex = 0;
            this.loadTrack(newIndex);
        }
    }

    // 处理歌曲结束
    handleTrackEnd() {
        if (this.currentMode === 2) {
            // 单曲循环
            this.audio.currentTime = 0;
            this.play();
        } else {
            // 下一首
            this.playNext();
        }
    }

    // 切换播放模式
    togglePlayMode() {
        this.currentMode = (this.currentMode + 1) % this.playModes.length;
        this.updateModeButton();
    }

    updateModeButton() {
        const mode = this.playModes[this.currentMode];
        this.modeIcon.textContent = mode.icon;
        this.modeText.textContent = mode.text;
    }

    // 更新进度条
    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.value = percent;
            this.currentTimeEl.textContent = this.formatDuration(this.audio.currentTime);
        }
    }

    // 更新时长
    updateDuration() {
        this.durationEl.textContent = this.formatDuration(this.audio.duration);
    }

    // 跳转进度
    seek(e) {
        const percent = e.target.value;
        this.audio.currentTime = (percent / 100) * this.audio.duration;
    }

    // 改变音量
    changeVolume(e) {
        this.audio.volume = e.target.value / 100;
    }

    // 清空播放列表
    async clearPlaylist() {
        if (this.playlist.length === 0) return;

        if (!confirm('确定要清空播放列表吗？')) return;

        try {
            await fetch('/playlist/clear', { method: 'POST' });
            this.playlist = [];
            this.currentIndex = -1;
            this.audio.src = '';
            this.pause();

            document.getElementById('track-title').textContent = '未播放';
            document.getElementById('track-artist').textContent = '请选择歌曲播放';
            document.getElementById('track-album').textContent = '';
            this.albumCover.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>🎵</text></svg>';

            this.renderPlaylist();
        } catch (error) {
            console.error('清空播放列表失败:', error);
        }
    }

    // 移除歌曲
    async removeTrack(index) {
        const track = this.playlist[index];

        try {
            await fetch(`/playlist/remove/${track.filename}`, { method: 'POST' });
            this.playlist.splice(index, 1);

            // 调整当前索引
            if (index < this.currentIndex) {
                this.currentIndex--;
            } else if (index === this.currentIndex) {
                // 如果移除的是当前播放的歌曲
                if (this.playlist.length > 0) {
                    this.currentIndex = Math.min(this.currentIndex, this.playlist.length - 1);
                    this.loadTrack(this.currentIndex);
                } else {
                    this.currentIndex = -1;
                    this.audio.src = '';
                    this.pause();
                }
            }

            this.renderPlaylist();
        } catch (error) {
            console.error('移除歌曲失败:', error);
        }
    }

    // 键盘快捷键
    handleKeyboard(e) {
        // 忽略输入框中的按键
        if (e.target.tagName === 'INPUT') return;

        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
                break;
            case 'ArrowRight':
                this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.volumeBar.value = Math.min(100, parseInt(this.volumeBar.value) + 5);
                this.audio.volume = this.volumeBar.value / 100;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.volumeBar.value = Math.max(0, parseInt(this.volumeBar.value) - 5);
                this.audio.volume = this.volumeBar.value / 100;
                break;
        }
    }

    // 格式化时长
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// String 原型扩展 - rsplit 方法
String.prototype.rsplit = function(separator, maxsplit) {
    const arr = this.split(separator);
    if (maxsplit === undefined) return arr;
    if (arr.length <= maxsplit) return arr;
    const result = arr.slice(0, arr.length - maxsplit);
    result.push(arr.slice(arr.length - maxsplit).join(separator));
    return result;
};

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    window.player = new MusicPlayer();
});
