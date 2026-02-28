
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
            
            const date = new Date(event.timestamp * 1000);
            const formattedDate = date.toLocaleString('ru-RU');
            
            row.insertCell().textContent = event.id;
            row.insertCell().textContent = event.event_type_name || (event.event_type === 1 ? 'Проход' : 'Неизвестный ключ');
            row.insertCell().textContent = event.employee_id || '';
            row.insertCell().textContent = event.key_hex || '';
            row.insertCell().textContent = event.access_point_name || '';
            row.insertCell().textContent = event.direction_name || '';
            row.insertCell().textContent = formattedDate;
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