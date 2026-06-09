from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

if not os.path.exists('data'):
    os.makedirs('data')

def init_db():
    conn = sqlite3.connect('data/messages.db')
    cursor = conn.cursor()
    # 加入 is_completed 欄位
    cursor.execute('''CREATE TABLE IF NOT EXISTS messages 
                      (id INTEGER PRIMARY KEY, name TEXT, purpose TEXT, 
                       timestamp DATETIME, is_completed INTEGER DEFAULT 0)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    conn = sqlite3.connect('data/messages.db')
    cursor = conn.cursor()
    # 分別撈出未完成與已完成的留言
    cursor.execute("SELECT id, name, purpose, timestamp FROM messages WHERE is_completed = 0 ORDER BY timestamp DESC")
    active_msgs = cursor.fetchall()
    cursor.execute("SELECT id, name, purpose, timestamp FROM messages WHERE is_completed = 1 ORDER BY timestamp DESC")
    done_msgs = cursor.fetchall()
    conn.close()
    return render_template('index.html', active_msgs=active_msgs, done_msgs=done_msgs)

@app.route('/send', methods=['POST'])
def send():
    name = request.form.get('student_name')
    purpose = request.form.get('purpose')
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = sqlite3.connect('data/messages.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages (name, purpose, timestamp) VALUES (?, ?, ?)", (name, purpose, now))
    conn.commit()
    conn.close()
    
    socketio.emit('new_message', {"name": name, "purpose": purpose, "timestamp": now})
    return "OK", 200

@app.route('/complete', methods=['POST'])
def complete():
    msg_id = request.form.get('id')
    conn = sqlite3.connect('data/messages.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE messages SET is_completed = 1 WHERE id = ?", (msg_id,))
    conn.commit()
    conn.close()
    socketio.emit('refresh_page') # 通知所有端點重新整理
    return "OK", 200

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
