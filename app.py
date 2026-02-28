import sqlite3
import json
import configparser
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
import sys
import traceback

# Пишем лог ДО любых других импортов
debug_log_path = os.path.join(os.path.dirname(sys.executable), 'startup_debug.log')
debug_file = None

try:
    # Открываем файл сразу
    debug_file = open(debug_log_path, 'w', encoding='utf-8')
    debug_file.write("=== STARTUP DEBUG LOG ===\n")
    debug_file.write(f"Time: {__import__('datetime').datetime.now()}\n")
    debug_file.write(f"Executable: {sys.executable}\n")
    debug_file.write(f"Current directory: {os.getcwd()}\n")
    debug_file.write(f"Python version: {sys.version}\n")
    debug_file.write("-" * 50 + "\n")
    debug_file.flush()
    
    # Теперь пробуем импортировать модули один за другим
    debug_file.write("1. Trying import sqlite3...\n")
    debug_file.flush()
    import sqlite3
    debug_file.write("   ✓ sqlite3 imported\n")
    debug_file.flush()
    
    debug_file.write("2. Trying import json...\n")
    debug_file.flush()
    import json
    debug_file.write("   ✓ json imported\n")
    debug_file.flush()
    
    debug_file.write("3. Trying import configparser...\n")
    debug_file.flush()
    import configparser
    debug_file.write("   ✓ configparser imported\n")
    debug_file.flush()
    
    debug_file.write("4. Trying import os...\n")
    debug_file.flush()
    import os
    debug_file.write("   ✓ os imported\n")
    debug_file.flush()
    
    debug_file.write("5. Trying import logging...\n")
    debug_file.flush()
    import logging
    debug_file.write("   ✓ logging imported\n")
    debug_file.flush()
    
    debug_file.write("6. Trying from logging.handlers import RotatingFileHandler...\n")
    debug_file.flush()
    from logging.handlers import RotatingFileHandler
    debug_file.write("   ✓ RotatingFileHandler imported\n")
    debug_file.flush()
    
    debug_file.write("7. Trying from datetime import datetime...\n")
    debug_file.flush()
    from datetime import datetime
    debug_file.write("   ✓ datetime imported\n")
    debug_file.flush()
    
    debug_file.write("8. Trying from flask import Flask...\n")
    debug_file.flush()
    from flask import Flask, request, jsonify, send_from_directory
    debug_file.write("   ✓ flask imported\n")
    debug_file.flush()
    
    debug_file.write("9. Trying from flask_cors import CORS...\n")
    debug_file.flush()
    from flask_cors import CORS
    debug_file.write("   ✓ flask_cors imported\n")
    debug_file.flush()
    
    debug_file.write("\n=== ALL IMPORTS SUCCESSFUL ===\n")
    debug_file.flush()
    
except Exception as e:
    if debug_file:
        debug_file.write(f"\n!!! ERROR at import: {str(e)}\n")
        debug_file.write(traceback.format_exc())
        debug_file.flush()
        debug_file.close()
    
    # Также пишем в отдельный файл на всякий случай
    with open('fatal_import_error.log', 'w', encoding='utf-8') as f:
        f.write(f"Fatal import error: {str(e)}\n")
        f.write(traceback.format_exc())
    
    # Выводим в консоль (если она есть)
    print(f"FATAL IMPORT ERROR: {e}", file=sys.stderr)
    sys.exit(1)

finally:
    if debug_file:
        debug_file.close()

# --- Определяем базовые пути ---
# Получаем путь к папке, где находится сам скрипт app.py.
# Это важно, чтобы мы всегда знали, где искать файлы, даже если программу
# запустят из другого места.
EXE_DIR = os.path.dirname(sys.executable)
# Путь к папке с веб-интерфейсом
WEB_DIR = os.path.join(EXE_DIR, 'web')  # если web-папка рядом с exe
# Путь к файлу базы данных
DB_PATH = os.path.join(EXE_DIR, 'database.db')
# Путь к файлу конфигурации
CONFIG_PATH = os.path.join(EXE_DIR, 'config.ini')

print(f"Базовая директория: {EXE_DIR}")

def init_database():
    """Создает таблицы в БД, если их нет."""
    conn = sqlite3.connect(DB_PATH)
    conn.text_factory = str  # Добавьте эту строку!
    cursor = conn.cursor()

    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            department TEXT NOT NULL,
            key TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Таблица событий (проходов)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            event_type INTEGER,
            access_point_id INTEGER,
            access_point_name TEXT,
            employee_id TEXT,
            timestamp INTEGER,
            direction INTEGER,
            key_hex TEXT,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Таблица настроек (ключ-значение)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("База данных инициализирована.")

def init_config():
    """Создает файл конфигурации со значениями по умолчанию, если его нет."""
    # Ищем config.ini в той же папке, где лежит exe
    exe_dir = os.path.dirname(sys.executable)
    config_path = os.path.join(exe_dir, 'config.ini')
    
    if not os.path.exists(config_path):
        config = configparser.ConfigParser()
        config['SERVER'] = {
            'login': 'scud123',
            'web_port': '7556',  # ВАЖНО: меняем на 7556 по умолчанию
            'debug_log': 'False'
        }
        with open(config_path, 'w') as configfile:
            config.write(configfile)
        print(f"Файл конфигурации создан: {config_path}")
    else:
        print(f"Файл конфигурации найден: {config_path}")

def get_config():
    """Читает и возвращает конфигурацию как словарь."""
    exe_dir = os.path.dirname(sys.executable)
    config_path = os.path.join(exe_dir, 'config.ini')
    config = configparser.ConfigParser()
    config.read(config_path)
    return config['SERVER']

def save_config(new_config):
    """Сохраняет новую конфигурацию."""
    config = configparser.ConfigParser()
    config['SERVER'] = new_config
    # Исправьте здесь:
    exe_dir = os.path.dirname(sys.executable)
    config_path = os.path.join(exe_dir, 'config.ini')
    with open(config_path, 'w') as configfile:
        config.write(configfile)


# Вспомогательная функция для конвертации ключей
def convert_keys_to_hex(key_input):
    if not key_input:
        return ""
    
    keys = key_input.split(';')
    hex_keys = []
    
    for key in keys:
        key = key.strip()
        if not key:
            continue
            
        # Если ключ уже в HEX формате (содержит буквы A-F)
        if any(c in 'ABCDEFabcdef' for c in key):
            hex_keys.append(key.upper())
            app.logger.debug(f"Key {key} is already in HEX format")
        else:
            # Пробуем конвертировать из DEC в HEX
            try:
                dec_value = int(key)
                hex_value = format(dec_value, 'X').upper()
                hex_keys.append(hex_value)
                app.logger.debug(f"Converted DEC {key} to HEX {hex_value}")
            except ValueError:
                # Если не число, оставляем как есть (вероятно, уже HEX с буквами)
                hex_keys.append(key)
                app.logger.debug(f"Key {key} kept as is")
    
    return ';'.join(hex_keys)

def setup_logging(app):
    """Настраивает логирование в файл."""
    log_file = os.path.join(EXE_DIR, 'service.log')
    
    # Создаем обработчик с явным указанием UTF-8
    handler = RotatingFileHandler(
        log_file, 
        maxBytes=1024*1024, 
        backupCount=3,
        encoding='utf-8'  # Явно указываем UTF-8
    )
    
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
    print(f"Логирование настроено. Файл лога: {log_file}")    

def create_app():
    """Создает и настраивает Flask приложение"""
    # Сначала читаем конфиг
    init_config()
    config = get_config()
    web_port = int(config.get('web_port', 7556))
    debug_log_enabled = config.get('debug_log', 'False').lower() == 'true'
    
    # Создаем Flask приложение
    app = Flask(__name__, static_folder=None, template_folder=None)
    CORS(app)
    
    # Настраиваем логирование
    setup_logging(app)
    if debug_log_enabled:
        app.logger.setLevel(logging.DEBUG)
        app.logger.debug("Режим отладки (расширенный лог) включен.")
    
    # ========== ВНУТРИ create_app() ОПРЕДЕЛЯЕМ ВСЕ МАРШРУТЫ ==========
    
    @app.route('/auth', methods=['POST'])
    def auth():
        """Эндпоинт для аутентификации программы 'Обмен данными'."""
        data = request.get_json()
        app.logger.debug(f"Auth request: {data}")
        
        if not data:
            app.logger.warning("Auth failed: No data provided")
            return '', 400
        
        received_login = data.get('l')
        expected_login = get_config().get('login')
        
        if received_login == expected_login:
            app.logger.info(f"Auth successful for login: {received_login}")
            return '', 200
        else:
            app.logger.warning(f"Auth failed for login: {received_login}")
            return '', 401

    @app.route('/api/exchange/users', methods=['POST'])
    def get_users_for_scud():
        """Эндпоинт для выгрузки пользователей в программу 'Обмен данными'."""
        data = request.get_json()
        app.logger.info(f"=== DEBUG: get_users_for_scud called ===")
        app.logger.info(f"Received data: {data}")
        
        if not data:
            app.logger.warning("Auth failed: No data provided")
            return '', 400
        
        received_login = data.get('l')
        expected_login = get_config().get('login')
        
        app.logger.info(f"Received login: {received_login}, Expected login: {expected_login}")
        
        if received_login != expected_login:
            app.logger.warning(f"Unauthorized users request attempt with login: {received_login}")
            return '', 401
        
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) as count FROM users')
            count = cursor.fetchone()[0]
            app.logger.info(f"Total users in database: {count}")
            
            cursor.execute('SELECT id, full_name, department, key FROM users')
            users = cursor.fetchall()
            
            app.logger.info(f"Fetched {len(users)} users from database")
            
            if users:
                first_user = dict(users[0])
                app.logger.info(f"First user data: {first_user}")
            
            conn.close()
            
            result = {"d": []}
            for user in users:
                user_dict = dict(user)
                app.logger.debug(f"Processing user: {user_dict}")
                
                user_data = {
                    "i": str(user_dict['id']),
                    "t": str(user_dict['id']),
                    "n": user_dict['full_name'],
                    "k": user_dict['key'] if user_dict['key'] else "",
                    "c": user_dict['department']
                }
                result["d"].append(user_data)
            
            app.logger.info(f"Returning {len(result['d'])} users")
            app.logger.debug(f"Full response: {result}")
            
            response = app.response_class(
                response=json.dumps(result, ensure_ascii=False),
                status=200,
                mimetype='application/json; charset=utf-8'
            )
            return response
            
        except Exception as e:
            app.logger.error(f"Error in get_users_for_scud: {e}")
            return jsonify({"d": []}), 500

    @app.route('/api/exchange/last_event_id', methods=['POST'])
    def get_last_event_id():
        """Эндпоинт для получения ID последнего события."""
        data = request.get_json()
        if not data:
            return '', 400
        
        received_login = data.get('l')
        expected_login = get_config().get('login')
        
        if received_login != expected_login:
            app.logger.warning(f"Unauthorized last_event_id request attempt with login: {received_login}")
            return '', 401
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT MAX(id) as last_id FROM events')
        result = cursor.fetchone()
        conn.close()
        
        last_id = result[0] if result[0] else 0
        app.logger.info(f"Last event ID requested, returning: {last_id}")
        
        return jsonify({"i": str(last_id)})

    @app.route('/api/exchange/events', methods=['POST'])
    def receive_events():
        """Эндпоинт для приема событий проходов."""
        data = request.get_json()
        if not data:
            return '', 400
        
        received_login = data.get('l')
        expected_login = get_config().get('login')
        
        if received_login != expected_login:
            app.logger.warning(f"Unauthorized events receive attempt with login: {received_login}")
            return '', 401
        
        events = data.get('d', [])
        if not events:
            app.logger.info("No events to process")
            return jsonify({"i": "0"})
        
        app.logger.info(f"Received {len(events)} events from SCUD")
        
        conn = sqlite3.connect(DB_PATH)
        conn.text_factory = lambda x: str(x, 'utf-8', 'replace')
        cursor = conn.cursor()
        
        last_id = 0
        
        for event in events:
            try:
                event_id = event.get('i')
                event_type = event.get('type')
                access_point_id = event.get('ap')
                access_point_name = event.get('ntd', '')
                if isinstance(access_point_name, str):
                    access_point_name = access_point_name.strip()
                
                employee_id = str(event.get('e', ''))
                timestamp = event.get('t')
                direction = event.get('d')
                key_hex = event.get('keyHex', '')
                
                if not all([event_id, event_type, timestamp]):
                    app.logger.warning(f"Skipping event with missing required fields: {event}")
                    continue
                
                cursor.execute('''
                    INSERT OR REPLACE INTO events 
                    (id, event_type, access_point_id, access_point_name, employee_id, 
                     timestamp, direction, key_hex)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (event_id, event_type, access_point_id, access_point_name, 
                      employee_id, timestamp, direction, key_hex))
                
                last_id = max(last_id, event_id)
                app.logger.info(f"Saved event {event_id} with point: {access_point_name}")
                
            except Exception as e:
                app.logger.error(f"Error saving event {event}: {e}")
                continue
        
        conn.commit()
        conn.close()
        app.logger.info(f"Successfully saved events, last ID: {last_id}")
        
        return jsonify({"i": str(last_id)})

    # ========== API ДЛЯ ВЕБ-КЛИЕНТА ==========

    @app.route('/api/web/users', methods=['GET'])
    def get_users_web():
        """Получить всех пользователей для веб-интерфейса"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.text_factory = str
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT id, full_name, department, key, created_at, updated_at FROM users ORDER BY id')
            users = cursor.fetchall()
            conn.close()
            
            result = [dict(user) for user in users]
            
            response = jsonify(result)
            response.headers.add('Content-Type', 'application/json; charset=utf-8')
            return response
        
        except Exception as e:
            app.logger.error(f"Error in get_users_web: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/web/users', methods=['POST'])
    def create_user():
        """Создать нового пользователя"""
        try:
            data = request.get_json()
            app.logger.info(f"Creating user with data: {data}")
            
            if not data.get('full_name') or not data.get('department'):
                return jsonify({"error": "full_name and department are required"}), 400
            
            full_name = data['full_name']
            department = data['department']
            key_input = data.get('key_input', '')
            
            key_hex = convert_keys_to_hex(key_input)
            
            conn = sqlite3.connect(DB_PATH)
            conn.text_factory = str
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO users (full_name, department, key, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ''', (full_name, department, key_hex))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            app.logger.info(f"User created with ID: {user_id}")
            
            response = jsonify({
                "id": user_id,
                "full_name": full_name,
                "department": department,
                "key": key_hex
            })
            response.headers.add('Content-Type', 'application/json; charset=utf-8')
            return response, 201
            
        except Exception as e:
            app.logger.error(f"Error in create_user: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/web/users/<int:user_id>', methods=['PUT'])
    def update_user(user_id):
        """Обновить существующего пользователя"""
        try:
            data = request.get_json()
            app.logger.info(f"Updating user {user_id} with data: {data}")
            
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
            if not cursor.fetchone():
                conn.close()
                return jsonify({"error": "User not found"}), 404
            
            full_name = data.get('full_name')
            department = data.get('department')
            key_input = data.get('key_input', '')
            key_hex = convert_keys_to_hex(key_input)
            
            cursor.execute('''
                UPDATE users 
                SET full_name = ?, department = ?, key = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (full_name, department, key_hex, user_id))
            
            conn.commit()
            conn.close()
            
            app.logger.info(f"User {user_id} updated")
            
            return jsonify({
                "id": user_id,
                "full_name": full_name,
                "department": department,
                "key": key_hex
            })
            
        except Exception as e:
            app.logger.error(f"Error in update_user: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/web/users/<int:user_id>', methods=['DELETE'])
    def delete_user(user_id):
        """Удалить пользователя"""
        try:
            app.logger.info(f"Deleting user {user_id}")
            
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute('SELECT full_name FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            if not user:
                conn.close()
                return jsonify({"error": "User not found"}), 404
            
            cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
            conn.commit()
            conn.close()
            
            app.logger.info(f"User {user_id} deleted")
            
            return '', 204
            
        except Exception as e:
            app.logger.error(f"Error in delete_user: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/web/events', methods=['GET'])
    def get_events():
        """Получить события с пагинацией"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            offset = (page - 1) * per_page
            
            conn = sqlite3.connect(DB_PATH)
            conn.text_factory = lambda x: str(x, 'utf-8', 'replace')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) as count FROM events')
            total = cursor.fetchone()[0]
            
            cursor.execute('''
                SELECT id, event_type, access_point_id, access_point_name, 
                       employee_id, timestamp, direction, key_hex, received_at
                FROM events 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            ''', (per_page, offset))
            
            events = cursor.fetchall()
            conn.close()
            
            result = []
            for event in events:
                event_dict = dict(event)
                event_dict['event_type_name'] = 'Проход' if event_dict['event_type'] == 1 else 'Неизвестный ключ'
                direction_map = {1: 'Выход', 2: 'Вход'}
                event_dict['direction_name'] = direction_map.get(event_dict['direction'], 'Неизвестно')
                result.append(event_dict)
            
            return jsonify({
                "events": result,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            })
            
        except Exception as e:
            app.logger.error(f"Error in get_events: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/web/settings', methods=['GET'])
    def get_settings():
        """Получить настройки сервера"""
        try:
            config = get_config()
            return jsonify({
                "login": config.get('login'),
                "web_port": config.get('web_port'),
                "debug_log": config.get('debug_log', 'False').lower() == 'true'
            })
        except Exception as e:
            app.logger.error(f"Error in get_settings: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/web/settings', methods=['PUT'])
    def update_settings():
        """Обновить настройки сервера"""
        try:
            data = request.get_json()
            app.logger.info(f"Updating settings with: {data}")
            
            current_config = dict(get_config())
            
            if 'login' in data:
                current_config['login'] = data['login']
            if 'web_port' in data:
                current_config['web_port'] = str(data['web_port'])
            if 'debug_log' in data:
                current_config['debug_log'] = str(data['debug_log'])
            
            save_config(current_config)
            
            return jsonify({
                "message": "Settings updated. Restart the service to apply port change.",
                "settings": current_config
            })
            
        except Exception as e:
            app.logger.error(f"Error in update_settings: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/web/logs', methods=['GET'])
    def get_logs():
        """Получить последние строки из лог-файла"""
        try:
            lines = request.args.get('lines', 100, type=int)
            log_file = os.path.join(EXE_DIR, 'service.log')
            
            if not os.path.exists(log_file):
                return jsonify({"logs": ["Лог-файл еще не создан"]})
            
            with open(log_file, 'rb') as f:
                content = f.read()
                text = content.decode('utf-8', errors='replace')
                all_lines = text.splitlines()
                last_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            
            return jsonify({"logs": last_lines})
            
        except Exception as e:
            app.logger.error(f"Error in get_logs: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/')
    def serve_index():
        """Раздает главную страницу"""
        try:
            app.logger.info(f"Serving index.html from {WEB_DIR}")
            return send_from_directory(WEB_DIR, 'index.html')
        except Exception as e:
            app.logger.error(f"Error serving index.html: {e}")
            return f"Ошибка: файл index.html не найден в папке {WEB_DIR}", 404

    @app.route('/<path:filename>')
    def serve_static(filename):
        """Раздает статические файлы (css, js, jpg)"""
        try:
            app.logger.info(f"Serving static file: {filename}")
            return send_from_directory(WEB_DIR, filename)
        except Exception as e:
            app.logger.error(f"Error serving {filename}: {e}")
            return f"Файл {filename} не найден", 404

    # ========== ВОЗВРАЩАЕМ СОЗДАННОЕ ПРИЛОЖЕНИЕ ==========
    return app, web_port

# ========== ЗАПУСК ПРИЛОЖЕНИЯ ==========

if __name__ == '__main__':
    print("="*50)
    print("Запуск Сервиса обмена данными (Data Exchange Service)")
    print("="*50)
    
    # Инициализируем БД
    init_database()
    
    # Создаем приложение
    app, web_port = create_app()
    
    app.logger.info("Сервис запускается...")
    print(f"\nСервис запущен. Веб-интерфейс доступен по адресу: http://localhost:{web_port}")
    print("Для остановки закройте это окно или нажмите Ctrl+C\n")
    
    try:
        app.run(host='0.0.0.0', port=web_port, debug=False)
    except OSError as e:
        if "10013" in str(e) or "access" in str(e).lower():
            print(f"❌ Ошибка доступа к порту {web_port}. Попробуйте:")
            print("   1. Запустить от имени администратора")
            print("   2. Изменить порт в config.ini на другой")
            print("   3. Проверить, не занят ли порт другой программой")
        else:
            print(f"❌ Ошибка запуска: {e}")