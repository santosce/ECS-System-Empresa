// Mock de core/navigation.js para testes
let _openedFromTimeline = false;

export function setOpenedFromTimeline(v) { _openedFromTimeline = v; }
export function getOpenedFromTimeline()  { return _openedFromTimeline; }
export function initializeNavigation()   {}
export function switchView()             {}
export function setupNavigationListeners() {}
