"""
网页音乐播放器 - Web Music Player
基于 Flask 的音频播放应用，支持 MP3 和 FLAC 格式
"""

import os
import uuid
import json
from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
from werkzeug.utils import secure_filename
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.id3 import ID3
from mutagen.easyid3 import EasyID3

app = Flask(__name__)

# 配置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'audio')
ALLOWED_EXTENSIONS = {'mp3', 'flac'}
MAX_CONTENT_LENGTH = 200 * 1024 * 1024  # 50MB 限制

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 播放列表存储（内存中，重启后清空）
playlist = []


def load_existing_audio():
    """启动时加载已存在的音频文件到播放列表"""
    if not os.path.exists(UPLOAD_FOLDER):
        return
    
    print(f"\n📂 扫描音频文件夹：{UPLOAD_FOLDER}")
    count = 0
    
    # 扫描所有支持的音频文件
    for filename in os.listdir(UPLOAD_FOLDER):
        if filename.lower().endswith(('.mp3', '.flac')) and not filename.startswith('cover_'):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            try:
                # 获取元数据
                metadata = get_audio_metadata(filepath)
                metadata['filename'] = filename
                metadata['original_name'] = filename
                
                # 添加到播放列表
                playlist.append(metadata)
                count += 1
                print(f"  ✅ 加载：{metadata['title']}")
            except Exception as e:
                print(f"  ❌ 加载失败 {filename}: {e}")
    
    print(f"✅ 共加载 {count} 首歌曲\n")


def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_filename(filename):
    """
    从文件名中解析艺术家和歌名
    支持的格式：艺术家 - 歌名，艺术家_歌名
    如果无法解析，直接使用文件名作为歌名
    """
    # 移除扩展名
    name = os.path.splitext(filename)[0]

    # 尝试用常见的分隔符解析
    separators = [' - ', ' — ', '_', ' ']

    for sep in separators:
        if sep in name:
            parts = name.split(sep, 1)
            if len(parts) == 2:
                artist = parts[0].strip()
                title = parts[1].strip()
                if artist and title:
                    return {'artist': artist, 'title': title}

    # 无法解析时直接使用文件名作为歌名
    return {'artist': '未知艺术家', 'title': name}


def get_audio_metadata(filepath):
    """获取音频文件的元数据"""
    filename = os.path.basename(filepath)

    # 先尝试从文件名解析
    parsed_info = parse_filename(filename)

    metadata = {
        'title': parsed_info['title'] if parsed_info else os.path.splitext(filename)[0],
        'artist': parsed_info['artist'] if parsed_info else '未知艺术家',
        'album': '未知专辑',
        'duration': 0,
        'cover': None
    }

    try:
        if filename.lower().endswith('.mp3'):
            # 尝试读取 ID3 标签
            try:
                audio = EasyID3(filepath)
                metadata['title'] = audio.get('title', [metadata['title']])[0]
                metadata['artist'] = audio.get('artist', [metadata['artist']])[0]
                metadata['album'] = audio.get('album', [metadata['album']])[0]
            except:
                pass

            # 获取时长
            try:
                mp3_audio = MP3(filepath)
                metadata['duration'] = mp3_audio.info.length
            except:
                pass

            # 尝试获取封面
            try:
                id3 = ID3(filepath)
                if 'APIC:' in id3:
                    cover_data = id3['APIC:'].data
                    # 将封面保存为临时文件
                    cover_filename = f"cover_{uuid.uuid4().hex[:8]}.jpg"
                    cover_path = os.path.join(UPLOAD_FOLDER, cover_filename)
                    with open(cover_path, 'wb') as f:
                        f.write(cover_data)
                    metadata['cover'] = cover_filename
            except:
                pass

        elif filename.lower().endswith('.flac'):
            # 读取 FLAC 标签
            try:
                flac_audio = FLAC(filepath)
                metadata['title'] = flac_audio.get('title', [metadata['title']])[0]
                metadata['artist'] = flac_audio.get('artist', [metadata['artist']])[0]
                metadata['album'] = flac_audio.get('album', [metadata['album']])[0]
                metadata['duration'] = flac_audio.info.length

                # 尝试获取封面
                if flac_audio.pictures:
                    picture = flac_audio.pictures[0]
                    ext = 'jpg' if picture.mime == 'image/jpeg' else 'png'
                    cover_filename = f"cover_{uuid.uuid4().hex[:8]}.{ext}"
                    cover_path = os.path.join(UPLOAD_FOLDER, cover_filename)
                    with open(cover_path, 'wb') as f:
                        f.write(picture.data)
                    metadata['cover'] = cover_filename
            except:
                pass

    except Exception as e:
        print(f"读取元数据失败：{e}")

    return metadata


@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    """处理文件上传"""
    if 'file' not in request.files:
        return jsonify({'error': '没有选择文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': '只支持 MP3 和 FLAC 格式'}), 400

    try:
        # 使用原始文件名（安全处理）
        filename = secure_filename(file.filename)
        # 如果文件名只有扩展名（无元数据的情况），使用完整原始文件名
        if not filename or filename == file.filename.rsplit('.', 1)[1].lower():
            filename = file.filename
        
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        # 保存文件
        file.save(filepath)

        # 获取元数据
        metadata = get_audio_metadata(filepath)
        metadata['filename'] = filename
        metadata['original_name'] = file.filename

        # 添加到播放列表
        playlist.append(metadata)

        return jsonify({
            'success': True,
            'message': f'上传成功：{filename}',
            'track': metadata
        })

    except Exception as e:
        return jsonify({'error': f'上传失败：{str(e)}'}), 500


@app.route('/playlist')
def get_playlist():
    """获取当前播放列表"""
    return jsonify(playlist)


@app.route('/playlist/clear', methods=['POST'])
def clear_playlist():
    """清空播放列表"""
    playlist.clear()
    return jsonify({'success': True, 'message': '播放列表已清空'})


@app.route('/playlist/remove/<filename>', methods=['POST'])
def remove_track(filename):
    """从播放列表移除歌曲"""
    global playlist
    playlist = [track for track in playlist if track['filename'] != filename]
    return jsonify({'success': True})


@app.route('/audio/<filename>')
def serve_audio(filename):
    """提供音频文件"""
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/cover/<filename>')
def serve_cover(filename):
    """提供封面图片"""
    return send_from_directory(UPLOAD_FOLDER, filename)


def format_duration(seconds):
    """格式化时长为 MM:SS"""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes}:{secs:02d}"


if __name__ == '__main__':
    # 启动时加载已存在的音频文件
    load_existing_audio()
    
    print("=" * 50)
    print("🎵 网页音乐播放器启动")
    print("=" * 50)
    print(f"访问地址：http://localhost:5000")
    print(f"上传目录：{UPLOAD_FOLDER}")
    print(f"播放列表：{len(playlist)} 首歌曲")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
