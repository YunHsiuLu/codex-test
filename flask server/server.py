from flask import Flask, jsonify, make_response, render_template, request, send_from_directory
from flask_socketio import SocketIO
import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_PATH = os.path.join(DATA_DIR, 'messages.db')

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

os.makedirs(DATA_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS messages 
                      (id INTEGER PRIMARY KEY, name TEXT, purpose TEXT, 
                       timestamp DATETIME, is_completed INTEGER DEFAULT 0,
                       client_message_id TEXT)''')
    columns = {row[1] for row in cursor.execute("PRAGMA table_info(messages)")}
    if 'client_message_id' not in columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN client_message_id TEXT")
    cursor.execute('''CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_client_message_id
                      ON messages(client_message_id)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # 分別撈出未完成與已完成的留言
    cursor.execute("SELECT id, name, purpose, timestamp FROM messages WHERE is_completed = 0 ORDER BY timestamp DESC")
    active_msgs = cursor.fetchall()
    cursor.execute("SELECT id, name, purpose, timestamp FROM messages WHERE is_completed = 1 ORDER BY timestamp DESC")
    done_msgs = cursor.fetchall()
    conn.close()
    return render_template(
        'index.html',
        active_msgs=active_msgs,
        done_msgs=done_msgs,
        active_count=len(active_msgs),
    )

@app.route('/health')
def health():
    return jsonify(status='ok')

@app.route('/service-worker.js')
def service_worker():
    response = make_response(send_from_directory(app.static_folder, 'service-worker.js'))
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/send', methods=['POST'])
def send():
    payload = request.get_json(silent=True) or request.form
    name = payload.get('student_name', '').strip()
    purpose = payload.get('purpose', '').strip()
    client_message_id = payload.get('client_message_id', '').strip() or None
    if not name or not purpose:
        return "姓名與留言內容不可空白", 400

    if client_message_id and len(client_message_id) > 100:
        return "留言識別碼格式錯誤", 400

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if client_message_id:
        existing = cursor.execute(
            "SELECT id, timestamp FROM messages WHERE client_message_id = ?",
            (client_message_id,),
        ).fetchone()
        if existing:
            conn.close()
            return jsonify(status='already_received', id=existing[0], timestamp=existing[1])

    cursor.execute(
        "INSERT OR IGNORE INTO messages (name, purpose, timestamp, client_message_id) VALUES (?, ?, ?, ?)",
        (name, purpose, now, client_message_id),
    )
    if cursor.rowcount == 0:
        existing = cursor.execute(
            "SELECT id, timestamp FROM messages WHERE client_message_id = ?",
            (client_message_id,),
        ).fetchone()
        conn.close()
        return jsonify(status='already_received', id=existing[0], timestamp=existing[1])

    message_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    socketio.emit('new_message', {
        "id": message_id,
        "name": name,
        "purpose": purpose,
        "timestamp": now,
    })
    return jsonify(status='received', id=message_id, timestamp=now)

@app.route('/complete', methods=['POST'])
def complete():
    msg_id = request.form.get('id')
    if not msg_id or not msg_id.isdigit():
        return "留言編號錯誤", 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE messages SET is_completed = 1 WHERE id = ?", (msg_id,))
    conn.commit()
    conn.close()
    socketio.emit('refresh_page') # 通知所有端點重新整理
    return "OK", 200

if __name__ == '__main__':
    cert_file = os.environ.get('SSL_CERT_FILE')
    key_file = os.environ.get('SSL_KEY_FILE')
    ssl_context = (cert_file, key_file) if cert_file and key_file else None

    socketio.run(
        app,
        host='0.0.0.0',
        port=5001,
        debug=False,
        allow_unsafe_werkzeug=True,
        ssl_context=ssl_context,
    )
