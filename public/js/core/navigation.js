// ===== CORE NAVIGATION MODULE =====
// Módulo de navegação entre views
// Extraído de app.js na refatoração v4.0.0

// ===== VARIÁVEIS DE NAVEGAÇÃO =====
let views = [];
let navLinks = [];
let viewTitle = null;
let mainActionsContainer = null;
let openedFromTimeline = false;

// ===== ÍCONES E TEMPLATES =====
const addIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

const createButton = (id, text, icon) => `<button id="${id}" class="add-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium inline-flex items-center">${icon}${text}</button>`;

// ===== GETTERS =====
export function getOpenedFromTimeline() {
    return openedFromTimeline;
}

export function setOpenedFromTimeline(value) {
    openedFromTimeline = value;
}

// ===== INICIALIZAR NAVEGAÇÃO =====
export function initializeNavigation() {
    views = document.querySelectorAll('.view');
    navLinks = document.querySelectorAll('.nav-link');
    viewTitle = document.getElementById('view-title');
    mainActionsContainer = document.getElementById('main-actions');
    
    console.log('🧭 Navegação inicializada');
}

// ===== FUNÇÃO PRINCIPAL DE NAVEGAÇÃO =====
export function switchView(viewName, fromTimeline = false) {
    console.log(`🔄 Mudando para view: ${viewName}`);
    openedFromTimeline = fromTimeline;
    
    // Esconder todas as views
    views.forEach(view => view.classList.remove('active'));

    // Mostrar view selecionada
    const selectedView = document.getElementById(viewName);
    if (selectedView) {
        selectedView.classList.add('active');
    }
    
    // Atualizar links de navegação
    navLinks.forEach(link => {
        link.classList.remove('bg-indigo-700');
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('bg-indigo-700');
        }
    });
    
    // Atualizar título e ações baseado na view
    updateViewTitleAndActions(viewName);
}

// ===== ATUALIZAR TÍTULO E AÇÕES =====
function updateViewTitleAndActions(viewName) {
    const viewConfig = {
        'dashboard': {
            title: 'Dashboard',
            actions: ''
        },
        'buscar-disponibilidade': {
            title: 'Buscar Disponibilidade',
            actions: ''
        },
        'profissionais': {
            title: 'Profissionais',
            actions: createButton('add-profissional-btn', 'Adicionar Profissional', addIcon)
        },
        'projetos': {
            title: 'Projetos',
            actions: createButton('add-projeto-btn', 'Adicionar Projeto', addIcon)
        },
        'alocacoes': {
            title: 'Alocações',
            actions: createButton('add-alocacao-btn', 'Adicionar Alocação', addIcon)
        },
        'timeline': {
            title: 'Timeline',
            actions: ''
        },
        'importar-horas': {
            title: 'Importar Horas do Kimai',
            actions: ''
        },
        'usuarios': {
            title: 'Gerenciar Usuários',
            actions: ''
        }
    };
    
    const config = viewConfig[viewName] || { title: 'ECS System', actions: '' };
    
    // Atualizar título
    if (viewTitle) {
        viewTitle.textContent = config.title;
    }
    
    // Atualizar ações
    if (mainActionsContainer) {
        mainActionsContainer.innerHTML = config.actions;
    }
}

// ===== CONFIGURAR LISTENERS DE NAVEGAÇÃO =====
export function setupNavigationListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.getAttribute('data-view');
            if (viewName) {
                switchView(viewName);
            }
        });
    });
    
    console.log('🧭 Listeners de navegação configurados');
}

// ===== EXPORT DEFAULT =====
export default {
    initializeNavigation,
    switchView,
    setupNavigationListeners,
    getOpenedFromTimeline,
    setOpenedFromTimeline
};
