// Конфигурация API
const API_BASE = 'http://localhost:8000';

// Функция для безопасных fetch запросов
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Загрузка приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('Документ загружен');
    loadInitialData();
    
    // Устанавливаем сегодняшнюю дату по умолчанию
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('writeoff-date').value = today;
    document.getElementById('tmc-date').value = today;
    
    // Добавляем обработчики для кнопок навигации
    document.querySelectorAll('nav button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.textContent.trim();
            switch(tabName) {
                case 'Списание ТМЦ':
                    showTab('writeoff');
                    loadWriteoffs(); // Загружаем список списаний
                    break;
                case 'Статистика':
                    showTab('stats');
                    break;
                case 'Справочник ТМЦ':
                    showTab('tmc');
                    loadAllTMC(); // Загружаем все ТМЦ
                    break;
            }
        });
    });
});

// Функции для работы с вкладками
function showTab(tabName) {
    console.log('Переключение на вкладку:', tabName);
    
    // Скрываем все вкладки
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Показываем выбранную вкладку
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Загружаем данные для вкладки
    switch(tabName) {
        case 'writeoff':
            loadCategories();
            loadWriteoffs(); // Загружаем список списаний
            break;
        case 'stats':
            loadDestinations();
            break;
        case 'tmc':
            loadAllTMC(); // Загружаем все ТМЦ
            break;
    }
}

async function loadInitialData() {
    console.log('Загрузка初始数据');
    await loadCategories();
    await loadDestinations();
}

async function loadCategories() {
    try {
        console.log('Загрузка категорий...');
        const data = await safeFetch(`${API_BASE}/categories`);
        const select = document.getElementById('category-select');
        
        select.innerHTML = '<option value="">Выберите категорию</option>';
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        console.log('Категории загружены:', data.categories);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        showMessage('writeoff-message', 'Ошибка загрузки категорий', 'error');
    }
}

async function loadNames() {
    const category = document.getElementById('category-select').value;
    if (!category) {
        document.getElementById('name-select').innerHTML = '<option value="">Выберите наименование</option>';
        return;
    }

    try {
        console.log('Загрузка наименований для категории:', category);
        const data = await safeFetch(`${API_BASE}/names/${category}`);
        const select = document.getElementById('name-select');
        
        select.innerHTML = '<option value="">Выберите наименование</option>';
        data.names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        
        console.log('Наименования загружены:', data.names);
    } catch (error) {
        console.error('Ошибка загрузки наименований:', error);
        showMessage('writeoff-message', 'Ошибка загрузки наименований', 'error');
    }
}

async function loadAllTMC() {
    try {
        console.log('Загрузка всех ТМЦ...');
        const data = await safeFetch(`${API_BASE}/tmc/all`);
        const container = document.getElementById('tmc-list');
        
        if (data.items.length === 0) {
            container.innerHTML = '<p class="no-data">Нет данных в справочнике</p>';
            return;
        }
        
        let html = `
            <div class="table-header">
                <div>Категория</div>
                <div>Наименование</div>
                <div>Дата поступления</div>
                <div>Цена</div>
                <div>Количество</div>
                <div>Сумма</div>
            </div>
        `;
        
        data.items.forEach(item => {
            html += `
                <div class="table-row">
                    <div>${item.category}</div>
                    <div>${item.name}</div>
                    <div>${item.receipt_date}</div>
                    <div>${item.price} руб.</div>
                    <div>${item.quantity} шт.</div>
                    <div>${item.amount} руб.</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('ТМЦ загружены:', data.items.length, 'шт.');
    } catch (error) {
        console.error('Ошибка загрузки ТМЦ:', error);
        document.getElementById('tmc-list').innerHTML = '<p class="error-message">Ошибка загрузки данных</p>';
    }
}

async function loadWriteoffs() {
    try {
        console.log('Загрузка всех списаний...');
        const data = await safeFetch(`${API_BASE}/writeoffs/all`);
        const container = document.getElementById('writeoffs-list');
        
        if (data.writeoffs.length === 0) {
            container.innerHTML = '<p class="no-data">Нет данных о списаниях</p>';
            return;
        }
        
        let html = `
            <div class="table-header">
                <div>Дата</div>
                <div>Категория</div>
                <div>Наименование</div>
                <div>Количество</div>
                <div>Сумма</div>
                <div>Куда</div>
                <div>Основание</div>
            </div>
        `;
        
        data.writeoffs.forEach(writeoff => {
            html += `
                <div class="table-row">
                    <div>${writeoff.writeoff_date}</div>
                    <div>${writeoff.category}</div>
                    <div>${writeoff.item_name}</div>
                    <div>${writeoff.quantity} шт.</div>
                    <div>${writeoff.total_amount} руб.</div>
                    <div>${writeoff.destination}</div>
                    <div>${writeoff.basis}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('Списания загружены:', data.writeoffs.length, 'шт.');
    } catch (error) {
        console.error('Ошибка загрузки списаний:', error);
        document.getElementById('writeoffs-list').innerHTML = '<p class="error-message">Ошибка загрузки данных</p>';
    }
}

async function loadDestinations() {
    try {
        console.log('Загрузка направлений...');
        const data = await safeFetch(`${API_BASE}/destinations`);
        const select = document.getElementById('stats-destination');
        
        select.innerHTML = '<option value="">Все направления</option>';
        data.destinations.forEach(dest => {
            const option = document.createElement('option');
            option.value = dest;
            option.textContent = dest;
            select.appendChild(option);
        });
        
        console.log('Направления загружены:', data.destinations);
    } catch (error) {
        console.error('Ошибка загрузки направлений:', error);
    }
}

async function submitWriteoff() {
    const formData = {
        category: document.getElementById('category-select').value,
        basis: document.getElementById('basis').value,
        item_name: document.getElementById('name-select').value,
        quantity: parseInt(document.getElementById('quantity').value),
        writeoff_date: document.getElementById('writeoff-date').value,
        destination: document.getElementById('destination').value
    };

    // Валидация
    if (!formData.category || !formData.item_name || !formData.quantity || !formData.writeoff_date || !formData.destination) {
        showMessage('writeoff-message', 'Заполните все обязательные поля', 'error');
        return;
    }

    try {
        console.log('Отправка списания:', formData);
        const params = new URLSearchParams(formData);
        const response = await fetch(`${API_BASE}/writeoff?${params}`, {
            method: 'POST',
            mode: 'cors'
        });

        const result = await response.json();
        
        if (response.ok) {
            showMessage('writeoff-message', 'Списание успешно записано!', 'success');
            document.getElementById('writeoff-form').reset();
            loadCategories();
            loadDestinations();
            loadWriteoffs(); // Обновляем список списаний
        } else {
            showMessage('writeoff-message', result.error || 'Ошибка при записи списания', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('writeoff-message', 'Ошибка подключения к серверу', 'error');
    }
}

async function addTMCItem() {
    const formData = {
        category: document.getElementById('tmc-category').value,
        name: document.getElementById('tmc-name').value,
        receipt_date: document.getElementById('tmc-date').value,
        amount: parseFloat(document.getElementById('tmc-amount').value),
        price: parseFloat(document.getElementById('tmc-price').value),
        quantity: parseInt(document.getElementById('tmc-quantity').value)
    };

    // Валидация
    if (!formData.category || !formData.name || !formData.receipt_date || 
        !formData.amount || !formData.price || !formData.quantity) {
        showMessage('tmc-message', 'Заполните все поля', 'error');
        return;
    }

    try {
        console.log('Добавление ТМЦ:', formData);
        const params = new URLSearchParams(formData);
        const response = await fetch(`${API_BASE}/tmc?${params}`, {
            method: 'POST',
            mode: 'cors'
        });

        if (response.ok) {
            showMessage('tmc-message', 'ТМЦ успешно добавлен!', 'success');
            document.getElementById('tmc-form').reset();
            loadCategories();
            loadAllTMC(); // Обновляем список ТМЦ
        } else {
            showMessage('tmc-message', 'Ошибка при добавлении ТМЦ', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('tmc-message', 'Ошибка подключения к серверу', 'error');
    }
}

async function loadStats() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const destination = document.getElementById('stats-destination').value;

    if (!startDate || !endDate) {
        alert('Выберите период дат');
        return;
    }

    try {
        console.log('Загрузка статистики:', {startDate, endDate, destination});
        let url = `${API_BASE}/stats?start_date=${startDate}&end_date=${endDate}`;
        if (destination) {
            url += `&destination=${destination}`;
        }

        const data = await safeFetch(url);
        const resultDiv = document.getElementById('stats-result');
        resultDiv.innerHTML = `
            <h3>Результаты статистики:</h3>
            <p><strong>Период:</strong> ${data.start_date} - ${data.end_date}</p>
            <p><strong>Направление:</strong> ${data.destination}</p>
            <p><strong>Общая сумма списаний:</strong> ${data.total_amount.toFixed(2)} руб.</p>
            <p><strong>Количество списаний:</strong> ${data.count}</p>
        `;
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка загрузки статистики');
    }
}

async function exportToExcel() {
    try {
        console.log('Экспорт в Excel...');
        const response = await fetch(`${API_BASE}/export/excel`, {
            mode: 'cors'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `отчет_тмц_${new Date().toISOString().slice(0,10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Error exporting:', error);
        alert('Ошибка при экспорте');
    }
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
    
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 5000);
}

// Добавляем глобальные функции для вызова из HTML
window.showTab = showTab;
window.loadNames = loadNames;
window.submitWriteoff = submitWriteoff;
window.addTMCItem = addTMCItem;
window.loadStats = loadStats;
window.exportToExcel = exportToExcel;