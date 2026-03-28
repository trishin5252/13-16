// ===== ЭЛЕМЕНТЫ DOM =====
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');
const notesCount = document.getElementById('notes-count');
const connectionStatus = document.getElementById('connection-status');
const swState = document.getElementById('sw-state');
const clearCacheBtn = document.getElementById('clear-cache-btn');

// ===== ЗАГРУЗКА ЗАМЕТОК ИЗ LOCALSTORAGE =====
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    if (notes.length === 0) {
        list.innerHTML = '<li class="empty-message">Заметок пока нет. Добавьте первую!</li>';
        notesCount.textContent = '0';
    } else {
        list.innerHTML = notes.map((note, index) => `
            <li>
                <span class="note-text">${escapeHtml(note)}</span>
                <button class="delete-btn" onclick="deleteNote(${index})">Удалить</button>
            </li>
        `).join('');
        notesCount.textContent = notes.length;
    }
}

// ===== ЭКРАНИРОВАНИЕ HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ДОБАВЛЕНИЕ ЗАМЕТКИ =====
function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.unshift(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// ===== УДАЛЕНИЕ ЗАМЕТКИ =====
function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// ===== ОБРАБОТКА ОТПРАВКИ ФОРМЫ =====
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addNote(text);
        input.value = '';
        input.focus();
    }
});

// ===== ПРОВЕРКА СОЕДИНЕНИЯ =====
function updateConnectionStatus() {
    if (navigator.onLine) {
        connectionStatus.textContent = 'Онлайн';
        connectionStatus.className = 'status online';
    } else {
        connectionStatus.textContent = 'Офлайн (работаем из кэша)';
        connectionStatus.className = 'status offline';
    }
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// ===== РЕГИСТРАЦИЯ SERVICE WORKER =====
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('Service Worker зарегистрирован:', registration.scope);
            swState.textContent = `Активен (scope: ${registration.scope})`;
            swState.style.color = '#4CAF50';
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        console.log('Новая версия готова');
                    }
                });
            });
            
        } catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
            swState.textContent = `Ошибка: ${error.message}`;
            swState.style.color = '#ff4444';
        }
    } else {
        console.warn('Service Worker не поддерживается');
        swState.textContent = 'Не поддерживается браузером';
        swState.style.color = '#ff9800';
    }
}

// ===== ОЧИСТКА КЭША =====
clearCacheBtn.addEventListener('click', async () => {
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
            await caches.delete(name);
        }
        alert('Кэш очищен! Перезагрузите страницу.');
        location.reload();
    }
});

// ===== ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА =====
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    updateConnectionStatus();
    registerServiceWorker();
});

// ===== СДЕЛАТЬ ФУНКЦИЮ ДОСТУПНОЙ ГЛОБАЛЬНО =====
window.deleteNote = deleteNote;