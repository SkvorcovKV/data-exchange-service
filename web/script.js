
// Глобальные переменные
let selectedUserId = null;
let autoRefreshInterval = null;
let currentEventsPage = 1;

// Загрузка при открытии страницы
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadSettings();
    
    // Обработчики вкладок
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Переключаем активную вкладку
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующий контент
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Загружаем данные для вкладки
            if (tabId === 'events') {
                loadEvents();
            } else if (tabId === 'logs') {
                loadLogs();
            }
        });
    });
    
    // Двойной клик по строке таблицы
    document.getElementById('users-table-body').addEventListener('dblclick', function(e) {
        const row = e.target.closest('tr');
        if (row && row.dataset.userId) {
            editUser(parseInt(row.dataset.userId));
        }
    });
});

// ========== ПОЛЬЗОВАТЕЛИ ==========

async function loadUsers() {
    try {
        const response = await fetch('/api/web/users');
        const users = await response.json();
        
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = tbody.insertRow();
            row.dataset.userId = user.id;
            
            // Добавляем обработчик клика для выделения строки
            row.addEventListener('click', function() {
                // Убираем выделение со всех строк
                document.querySelectorAll('#users-table-body tr').forEach(r => {
                    r.classList.remove('selected');
                });
                // Выделяем текущую строку
                this.classList.add('selected');
                selectedUserId = user.id;
                
                // ВАЖНО: если панель редактирования открыта, обновляем данные в ней
                const panel = document.getElementById('user-form-panel');
                const btn = document.getElementById('edit-toggle-btn');
                
                // Проверяем, открыта ли панель (не скрыта)
                if (!panel.classList.contains('hidden')) {
                    // Обновляем данные в панели для нового выбранного пользователя
                    document.getElementById('full-name').value = user.full_name || '';
                    document.getElementById('department').value = user.department || '';
                    document.getElementById('key-input').value = user.key || '';
                    document.getElementById('user-id').value = user.id;
                    
                    // Меняем заголовок панели
                    document.getElementById('form-title').textContent = `Редактирование пользователя ID: ${user.id}`;
                    
                    // Показываем кнопки редактирования, скрываем кнопки добавления
                    document.getElementById('form-actions-add').classList.add('hidden');
                    document.getElementById('form-actions-edit').classList.remove('hidden');
                }
            });
            
            // Двойной клик для редактирования
            row.addEventListener('dblclick', function() {
                editUser(user.id);
            });
            
            if (user.id === selectedUserId) {
                row.classList.add('selected');
            }
            
            row.insertCell().textContent = user.id;
            row.insertCell().textContent = user.full_name || '';
            row.insertCell().textContent = user.key || '';
            row.insertCell().textContent = user.department || '';
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Ошибка при загрузке пользователей');
    }
}

function showAddUserForm() {
    document.getElementById('form-title').textContent = 'Добавление пользователя';
    document.getElementById('user-id').value = '';
    document.getElementById('full-name').value = '';
    document.getElementById('department').value = '';
    document.getElementById('key-input').value = '';
    
    document.getElementById('form-actions-add').classList.remove('hidden');
    document.getElementById('form-actions-edit').classList.add('hidden');
    document.getElementById('user-form-panel').classList.remove('hidden');
}

async function editUser(userId) {
    try {
        const response = await fetch('/api/web/users');
        const users = await response.json();
        const user = users.find(u => u.id === userId);
        
        if (user) {
            selectedUserId = userId;
            
            // Убираем выделение со всех строк
            document.querySelectorAll('#users-table-body tr').forEach(row => {
                row.classList.remove('selected');
                // Выделяем строку с нужным ID
                if (row.dataset.userId == userId) {
                    row.classList.add('selected');
                }
            });
            
            // Заполняем форму данными пользователя
            document.getElementById('form-title').textContent = `Редактирование пользователя ID: ${userId}`;
            document.getElementById('user-id').value = user.id;
            document.getElementById('full-name').value = user.full_name || '';
            document.getElementById('department').value = user.department || '';
            document.getElementById('key-input').value = user.key || '';
            
            // Переключаем кнопки
            document.getElementById('form-actions-add').classList.add('hidden');
            document.getElementById('form-actions-edit').classList.remove('hidden');
            
            // Показываем панель
            document.getElementById('user-form-panel').classList.remove('hidden');
            document.getElementById('edit-toggle-btn').innerHTML = '👁️ Скрыть панель редактирования';
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

function toggleEditPanel() {
    const panel = document.getElementById('user-form-panel');
    const btn = document.getElementById('edit-toggle-btn');
    
    if (panel.classList.contains('hidden')) {
        if (selectedUserId) {
            editUser(selectedUserId);
            btn.innerHTML = '👁️ Скрыть панель редактирования';
        } else {
            alert('Сначала выберите пользователя в таблице');
        }
    } else {
        hideUserForm();
        btn.innerHTML = '✏️ Показать панель редактирования';
    }
}

function hideUserForm() {
    document.getElementById('user-form-panel').classList.add('hidden');
    document.getElementById('edit-toggle-btn').innerHTML = '✏️ Показать панель редактирования';
}

async function addUser() {
    const fullName = document.getElementById('full-name').value.trim();
    const department = document.getElementById('department').value.trim();
    const keyInput = document.getElementById('key-input').value.trim();
    
    if (!fullName || !department) {
        alert('Заполните обязательные поля');
        return;
    }
    
    try {
        const response = await fetch('/api/web/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                department: department,
                key_input: keyInput
            })
        });
        
        if (response.ok) {
            hideUserForm();
            loadUsers();
        } else {
            const error = await response.json();
            alert('Ошибка при добавлении: ' + (error.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Ошибка при добавлении пользователя');
    }
}

async function updateUser() {
    const userId = document.getElementById('user-id').value;
    const fullName = document.getElementById('full-name').value.trim();
    const department = document.getElementById('department').value.trim();
    const keyInput = document.getElementById('key-input').value.trim();
    
    if (!fullName || !department) {
        alert('Заполните обязательные поля');
        return;
    }
    
    try {
        const response = await fetch(`/api/web/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                department: department,
                key_input: keyInput
            })
        });
        
        if (response.ok) {
            hideUserForm();
            loadUsers();
        } else {
            const error = await response.json();
            alert('Ошибка при обновлении: ' + (error.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Ошибка при обновлении пользователя');
    }
}

async function deleteUser() {
    const userId = document.getElementById('user-id').value;
    const fullName = document.getElementById('full-name').value;
    
    if (!confirm(`Вы уверены, что хотите удалить пользователя "${fullName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/web/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            hideUserForm();
            selectedUserId = null;
            loadUsers();
        } else {
            const error = await response.json();
            alert('Ошибка при удалении: ' + (error.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка при удалении пользователя');
    }
}

// ========== СОБЫТИЯ ==========

async function loadEvents(page = 1) {
    try {
        const response = await fetch(`/api/web/events?page=${page}&per_page=50`);
        const data = await response.json();
        
        const tbody = document.getElementById('events-table-body');
        tbody.innerHTML = '';
        
        data.events.forEach(event => {
            const row = tbody.insertRow();
            
            // УБЕРИТЕ создание formattedDate через new Date()
            // const date = new Date(event.timestamp * 1000);
            // const formattedDate = date.toLocaleString('ru-RU');
            
            row.insertCell().textContent = event.id;
            row.insertCell().textContent = event.event_type_name || (event.event_type === 1 ? 'Проход' : 'Неизвестный ключ');
            row.insertCell().textContent = event.employee_id || '';
            row.insertCell().textContent = event.key_hex || '';
            row.insertCell().textContent = event.access_point_name || '';
            row.insertCell().textContent = event.direction_name || '';
            // ИСПОЛЬЗУЙТЕ ТОЛЬКО event.formatted_time
            row.insertCell().textContent = event.formatted_time;
        });
        
        // Пагинация
        updatePagination(data);
        currentEventsPage = page;
        
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function updatePagination(data) {
    const pagination = document.getElementById('events-pagination');
    pagination.innerHTML = '';
    
    if (data.total_pages <= 1) return;
    
    for (let i = 1; i <= data.total_pages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === data.page) {
            btn.classList.add('active');
        }
        btn.onclick = () => loadEvents(i);
        pagination.appendChild(btn);
    }
}

function toggleAutoRefresh() {
    const checkbox = document.getElementById('auto-refresh');
    
    if (checkbox.checked) {
        autoRefreshInterval = setInterval(() => {
            loadEvents(currentEventsPage);
        }, 20000);
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }
}

// ========== НАСТРОЙКИ ==========

async function loadSettings() {
    try {
        const response = await fetch('/api/web/settings');
        const settings = await response.json();
        
        document.getElementById('settings-login').value = settings.login || '';
        document.getElementById('settings-port').value = settings.web_port || 7556;
        document.getElementById('settings-debug-log').checked = settings.debug_log || false;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    const settings = {
        login: document.getElementById('settings-login').value,
        web_port: parseInt(document.getElementById('settings-port').value),
        debug_log: document.getElementById('settings-debug-log').checked
    };
    
    try {
        const response = await fetch('/api/web/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Настройки сохранены');
        } else {
            alert('Ошибка при сохранении настроек');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Ошибка при сохранении настроек');
    }
}

// ========== ЖУРНАЛ ==========

async function loadLogs() {
    try {
        const response = await fetch('/api/web/logs?lines=200');
        const data = await response.json();
        
        const logsContent = document.getElementById('logs-content');
        logsContent.textContent = data.logs.join('\n');
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('logs-content').textContent = 'Ошибка при загрузке логов';
    }
}

// ========== ЭКСПОРТ/ИМПОРТ ==========

async function exportUsers() {
    try {
        const response = await fetch('/api/web/users/export');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users_export_${new Date().toISOString().slice(0,19)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            alert('Экспорт пользователей выполнен успешно');
        } else {
            const error = await response.json();
            alert('Ошибка при экспорте: ' + (error.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error exporting users:', error);
        alert('Ошибка при экспорте пользователей');
    }
}

function showImportDialog() {
    const dialog = document.getElementById('import-dialog');
    dialog.classList.add('show');
    document.getElementById('import-file').value = '';
}

function closeImportDialog() {
    const dialog = document.getElementById('import-dialog');
    dialog.classList.remove('show');
}

async function importUsers() {
    const fileInput = document.getElementById('import-file');
    const importMode = document.getElementById('import-mode').value;
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Выберите файл для импорта');
        return;
    }
    
    const file = fileInput.files[0];
    if (!file.name.endsWith('.json')) {
        alert('Пожалуйста, выберите JSON файл');
        return;
    }
    
    try {
        // Читаем файл как ArrayBuffer для точного контроля кодировки
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Проверяем наличие BOM (Byte Order Mark) для UTF-8
        let content;
        if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
            // UTF-8 with BOM - читаем как UTF-8
            const decoder = new TextDecoder('utf-8');
            content = decoder.decode(uint8Array);
            console.log('File encoding: UTF-8 with BOM');
        } else {
            // Пробуем UTF-8, если есть кракозябры - конвертируем из Windows-1251
            let utf8Decoder = new TextDecoder('utf-8');
            let testContent = utf8Decoder.decode(uint8Array);
            
            // Проверяем, есть ли признаки неправильной кодировки
            // (символы � или отсутствие русских букв там, где они ожидаются)
            if (testContent.includes('�') || 
                (testContent.includes('Рџ') && testContent.includes('Рё'))) {
                // Пробуем Windows-1251
                const win1251Decoder = new TextDecoder('windows-1251');
                content = win1251Decoder.decode(uint8Array);
                console.log('File encoding: Windows-1251 (converted to UTF-8)');
            } else {
                content = testContent;
                console.log('File encoding: UTF-8 without BOM');
            }
        }
        
        const jsonData = JSON.parse(content);
        
        if (!jsonData.d || !Array.isArray(jsonData.d)) {
            throw new Error('Неверный формат файла. Ожидается {"d": [...]}');
        }
        
        const response = await fetch(`/api/web/users/import?mode=${importMode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        
        if (response.ok) {
            const result = await response.json();
            closeImportDialog();
            loadUsers();
            alert(`Импорт завершен:\nДобавлено: ${result.stats.added}\nОбновлено: ${result.stats.updated}\nПропущено: ${result.stats.skipped}`);
        } else {
            const error = await response.json();
            alert('Ошибка при импорте: ' + (error.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error importing users:', error);
        alert('Ошибка при импорте: ' + error.message);
    }
}