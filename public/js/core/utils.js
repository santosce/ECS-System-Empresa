// ===== CORE UTILS MODULE =====
// Módulo de funções auxiliares e helpers
// Extraído de app.js na refatoração v4.0.0

import { getAppId } from '../config/firebase-config.js';

// ===== CONSTANTES =====
export const APP_VERSION = '4.2.1';
export const APP_NAME = 'ECS System';

// ===== FUNÇÃO PARA DEBOUNCE =====
export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// ===== FUNÇÃO PARA FORMATAR DATA =====
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    if (dateString instanceof Date) {
        dateString = dateString.toISOString().split('T')[0];
    }
    if (typeof dateString !== 'string' || dateString.length < 10) return 'N/A';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// ===== FUNÇÃO PARA OBTER COR DO STATUS =====
export function getStatusColor(status) {
    const colors = {
        'Não Iniciado': 'bg-gray-100 text-gray-800',
        'Em Andamento': 'bg-blue-100 text-blue-800',
        'Concluído': 'bg-green-100 text-green-800',
        'Atrasado': 'bg-red-100 text-red-800',
        'Em Pausa': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

// ===== FUNÇÃO PARA OBTER CAMINHO DA COLEÇÃO =====
export function getCollectionPath(collectionName) {
    const id = getAppId();
    if (!id) throw new Error('Firebase não inicializado');
    return `artifacts/${id}/public/data/${collectionName}`;
}

// ===== FUNÇÃO GLOBAL PARA NOTIFICAÇÕES =====
export function showNotification(message, type = 'info') {
    if (typeof Toastify === 'undefined') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    const config = {
        success: {
            background: 'linear-gradient(to right, #00b09b, #96c93d)',
            icon: '✓',
            duration: 3000
        },
        error: {
            background: 'linear-gradient(to right, #ff5f6d, #ffc371)',
            icon: '✕',
            duration: 4000
        },
        warning: {
            background: 'linear-gradient(to right, #f7971e, #ffd200)',
            icon: '⚠',
            duration: 3500
        },
        info: {
            background: 'linear-gradient(to right, #667eea, #764ba2)',
            icon: 'ℹ',
            duration: 3000
        }
    };

    const settings = config[type] || config.info;

    Toastify({
        text: `${settings.icon} ${message}`,
        duration: settings.duration,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: settings.background,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
    }).showToast();
}

// Exportar também como window.showNotification para compatibilidade
if (typeof window !== 'undefined') {
    window.showNotification = showNotification;
}

// ===== HELPERS DE VALIDAÇÃO =====
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// ===== HELPERS DE CÁLCULO =====
export function calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
}

export function calculateDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// ===== HELPERS DE FORMATAÇÃO =====
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

export function formatNumber(value, decimals = 2) {
    return Number(value).toFixed(decimals);
}

// ===== HELPERS DE ORDENAÇÃO =====
export function sortByDate(array, dateField, ascending = true) {
    return array.sort((a, b) => {
        const dateA = new Date(a[dateField]);
        const dateB = new Date(b[dateField]);
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

export function sortByName(array, nameField = 'nome', ascending = true) {
    return array.sort((a, b) => {
        const nameA = (a[nameField] || '').toLowerCase();
        const nameB = (b[nameField] || '').toLowerCase();
        if (ascending) {
            return nameA.localeCompare(nameB, 'pt-BR');
        } else {
            return nameB.localeCompare(nameA, 'pt-BR');
        }
    });
}

// ===== EXPORT DEFAULT =====
export default {
    APP_VERSION,
    APP_NAME,
    debounce,
    formatDate,
    getStatusColor,
    getCollectionPath,
    showNotification,
    isValidEmail,
    isValidDate,
    calculatePercentage,
    calculateDaysBetween,
    formatCurrency,
    formatNumber,
    sortByDate,
    sortByName
};
