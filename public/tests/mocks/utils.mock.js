// Mock de core/utils.js para testes
export const APP_VERSION = '4.0.0-test';
export const APP_NAME    = 'ECS Test';

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

export function getCollectionPath(name) { return `test/${name}`; }
export function showNotification(msg, type) { console.log(`[${type}] ${msg}`); }
export function debounce(fn, ms) { return fn; }
export function getStatusColor() { return ''; }
