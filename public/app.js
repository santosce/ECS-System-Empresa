// ===== IMPORTAÇÕES DE MÓDULOS =====
import { 
    initializeFirebase,
    getDb,
    getProvider,
    getAppId,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    onSnapshot,
    getDoc,
    getDocs
} from './js/config/firebase-config.js';
import appState, {
    getProfissionais,
    setProfissionais,
    getProjetos,
    setProjetos,
    getAlocacoes,
    setAlocacoes,
    setUsers,
    getProfissionalById,
    getProjetoById,
    getAlocacaoById
} from './js/state/app-state.js';
import {
    APP_VERSION,
    APP_NAME,
    debounce,
    formatDate,
    getStatusColor,
    getCollectionPath,
    showNotification
} from './js/core/utils.js';
import {
    getCurrentUserId,
    getCurrentUserRole,
    isAdmin,
    loginWithGoogle,
    logout,
    getUserRole,
    updateUIBasedOnRole,
    setupAuthListener
} from './js/core/auth.js';
import {
    initializeNavigation,
    switchView,
    setupNavigationListeners,
    setOpenedFromTimeline
} from './js/core/navigation.js';
import {
    updateDashboard,
    updateProfileChart,
    updateMonthlyAvailabilityChart,
    populateDashboardFilters
} from './js/modules/dashboard.js';
import {
    renderProfissionais,
    openProfissionalModal,
    closeProfissionalModal,
    saveProfissional,
    deleteProfissional,
    populateProfissionaisFilters,
    initializeProfessionalsModule
} from './js/modules/professionals.js';
import {
    renderProjetos,
    openProjetoModal,
    closeProjetoModal,
    saveProjeto,
    deleteProjeto,
    initializeProjectsModule
} from './js/modules/projects.js';
import {
    renderAlocacoes,
    openAlocacaoModal,
    closeAlocacaoModal,
    deleteAlocacao,
    populateAlocacoesFilters,
    initializeAllocationsModule
} from './js/modules/allocations.js';
import {
    renderUsersTable,
    openUserModal,
    closeUserModal,
    saveUser,
    deleteUser,
    initializeUsersModule
} from './js/modules/users.js';
import {
    drawTimelineChart,
    populateTimelineFilters,
    initializeTimelineModule
} from './js/modules/timeline.js';
import { initializeKimaiModule } from './js/modules/kimai.js';



// ===== ECS SYSTEM - VERSÃO 4.0.0 MODULAR =====
// Sistema de Gestão de Capacity
// Refatoração modular iniciada em: [24/03/26]



// ===== INICIALIZAR FIREBASE =====
async function initializeFirebaseApp() {
    try {
        console.log(`%c${APP_NAME} v${APP_VERSION}`, 'color: #4f46e5; font-size: 16px; font-weight: bold;');
        console.log('%cSistema inicializando...', 'color: #6b7280;');
        
        // Inicializar Firebase usando o módulo
        await initializeFirebase();
        
        // Inicializar lógica da aplicação
        initializeAppLogic();
    } catch (error) {
        console.error("Falha ao inicializar o Firebase:", error);
        showNotification('Erro ao inicializar Firebase', 'error');
    }
}

// ===== LÓGICA PRINCIPAL DA APLICAÇÃO =====
function initializeAppLogic() {
    let isGoogleChartsLoaded = false;
    // Inicializar navegação
    initializeNavigation();
    // Inicializar módulo de profissionais
    initializeProfessionalsModule();
   // Inicializar módulo de projetos
    initializeProjectsModule();
    // Inicializar módulo de alocações
    initializeAllocationsModule();
    // Inicializar módulo de usuários
    initializeUsersModule();
    // Inicializar módulo de timeline
    initializeTimelineModule();
    // Inicializar módulo de kimai
    initializeKimaiModule();

    // Carregar Google Charts
    if (typeof google !== 'undefined' && google.charts) {
        // ...
    }

    // Carregar Google Charts
    if (typeof google !== 'undefined' && google.charts) {
        google.charts.load('current', { 'packages': ['timeline', 'corechart'], 'language': 'pt' });
        google.charts.setOnLoadCallback(() => {
            isGoogleChartsLoaded = true;
            console.log('%c✓ Google Charts carregado', 'color: #10b981;');
        });
    } else {
        console.warn('Google Charts não disponível.');
    }

    const loginView = document.getElementById('login-view');
    const appContainer = document.getElementById('app-container');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    //  Login 
    loginBtn.addEventListener('click', loginWithGoogle);

    // Logout
    logoutBtn.addEventListener('click', logout);

	// ===== NOVO: Listener global para expandir/recolher listas de importação =====
    document.body.addEventListener('click', function(e) {
        // Verifica se o clique foi em um link "expand-toggle"
        if (e.target.classList.contains('expand-toggle')) {
            e.preventDefault(); // Impede o link de navegar
            
            const parentLi = e.target.parentElement;
            const ul = parentLi.parentElement;
            const items = ul.querySelectorAll('.expandable-item');
            const isExpanding = !parentLi.classList.contains('is-expanded');
            
            items.forEach(item => item.classList.toggle('hidden'));
            parentLi.classList.toggle('is-expanded');
            
            if (isExpanding) {
                e.target.textContent = 'Recolher';
            } else {
                const count = items.length;
                e.target.textContent = `... e mais ${count}`;
            }
        }
    });
    // Configurar listener de autenticação
setupAuthListener(
    async (user, role) => {
        loginView.classList.add('hidden');
        appContainer.classList.remove('hidden');
        setupFirestoreListeners();
    },
    () => {
        clearFirestoreListeners();  // ← ADICIONAR ESTA LINHA
        loginView.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
);
    

    // Função para configurar listeners do Firestore
    // Variável global para armazenar os unsubscribe dos listeners
let firestoreUnsubscribers = [];

function setupFirestoreListeners() {
    console.log('🔄 Configurando listeners do Firestore...');
    
    // Limpar listeners anteriores se existirem
    clearFirestoreListeners();
    
    // Listener para Profissionais
    const unsubProf = onSnapshot(collection(getDb(), getCollectionPath('profissionais')), (snapshot) => {
        setProfissionais(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (typeof renderProfissionais === 'function') renderProfissionais();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateDashboardFilters === 'function') populateDashboardFilters();
        if (typeof populateAvailabilityChartFilters === 'function') populateAvailabilityChartFilters();
        if (typeof populateProfileFilters === 'function') populateProfileFilters();
        populateTimelineFilters();
        if (typeof populateProfissionaisFilters === 'function') populateProfissionaisFilters();
    });
    firestoreUnsubscribers.push(unsubProf);

    // Listener para Projetos
    const unsubProj = onSnapshot(collection(getDb(), getCollectionPath('projetos')), (snapshot) => {
        setProjetos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (typeof renderProjetos === 'function') renderProjetos();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateDashboardFilters === 'function') populateDashboardFilters();
        populateTimelineFilters();
    });
    firestoreUnsubscribers.push(unsubProj);

    // Listener para Alocações
    const unsubAloc = onSnapshot(collection(getDb(), getCollectionPath('alocacoes')), (snapshot) => {
        setAlocacoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (typeof renderAlocacoes === 'function') renderAlocacoes();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateAlocacoesFilters === 'function') populateAlocacoesFilters();
        populateTimelineFilters();
        
        setTimeout(() => {
            if (typeof updateMonthlyAvailabilityChart === 'function') {
                console.log('🔄 Redesenhando gráfico mensal após carregar dados...');
                updateMonthlyAvailabilityChart();
            }
        }, 800);
    });
    firestoreUnsubscribers.push(unsubAloc);

    // Listener para Usuários (apenas admin)
    if (getCurrentUserRole() === 'admin') {
        const unsubUsers = onSnapshot(collection(getDb(), getCollectionPath('users')), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            if (typeof renderUsersTable === 'function') renderUsersTable();
        });
        firestoreUnsubscribers.push(unsubUsers);
    }
    
    console.log('✅ Listeners do Firestore configurados');
}

function clearFirestoreListeners() {
    console.log('🧹 Limpando listeners do Firestore...');
    firestoreUnsubscribers.forEach(unsub => unsub());
    firestoreUnsubscribers = [];
}
// ===== FIM DA PARTE 1 =====
// ===== PARTE 2 - NAVEGAÇÃO, MODAIS E RENDERIZAÇÃO =====

     // ===== SISTEMA DE ABAS DO DASHBOARD =====
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');
    const dashboardTabContents = document.querySelectorAll('.dashboard-tab-content');

    dashboardTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        dashboardTabs.forEach(t => {
            t.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
            t.classList.add('border-transparent', 'text-gray-500');
        });
        
        tab.classList.add('active', 'border-indigo-600', 'text-indigo-600');
        tab.classList.remove('border-transparent', 'text-gray-500');
        
        dashboardTabContents.forEach(content => {
            content.classList.add('hidden');
        });
        
        document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
        
        // ✅ NOVO: Redesenhar gráficos quando voltar para "Visão Geral"
        if (tabName === 'visao-geral') {
            setTimeout(() => {
                if (profileChart) {
                    profileChart.resize();
                    profileChart.update('none');
                }
                if (monthlyAvailabilityChart) {
                    monthlyAvailabilityChart.resize();
                    monthlyAvailabilityChart.update('none');
                }
            }, 100);
        }
    });
});

    // Collapsible headers
    document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('svg');
        
        const wasHidden = content.classList.contains('hidden');
        
        if (wasHidden) {
            content.classList.remove('hidden');
            icon?.classList.add('rotate-180');
            
            // ✅ NOVO: Redesenhar gráficos após abrir collapsible
            setTimeout(() => {
                // Verificar se o collapsible contém gráficos
                const chartCanvas = content.querySelector('canvas');
                if (chartCanvas) {
                    const chartId = chartCanvas.id;
                    
                    if (chartId === 'profile-distribution-chart' && profileChart) {
                        profileChart.resize();
                        profileChart.update('none');
                    } else if (chartId === 'monthly-availability-chart' && monthlyAvailabilityChart) {
                        monthlyAvailabilityChart.resize();
                        monthlyAvailabilityChart.update('none');
                    }
                }
            }, 350); // Aguardar animação CSS terminar
        } else {
            content.classList.add('hidden');
            icon?.classList.remove('rotate-180');
        }
    });
});

    // Event listeners de filtros
    document.getElementById('profissionais-filter-nome')?.addEventListener('input', debounce(renderProfissionais, 300));
    document.getElementById('profissionais-filter-perfil')?.addEventListener('input', debounce(renderProfissionais, 300));
    document.getElementById('profissionais-filter-time')?.addEventListener('input', debounce(renderProfissionais, 300));
    document.getElementById('profissionais-filter-empresa')?.addEventListener('input', debounce(renderProfissionais, 300));

    document.getElementById('projetos-filter-nome')?.addEventListener('input', debounce(renderProjetos, 300));
    document.getElementById('projetos-filter-cliente')?.addEventListener('input', debounce(renderProjetos, 300));
    document.getElementById('projetos-filter-tipo')?.addEventListener('change', renderProjetos);
    document.getElementById('projetos-filter-status')?.addEventListener('change', renderProjetos);
    
    document.getElementById('prazos-filter-projeto')?.addEventListener('input', debounce(updatePlannedVsRealizedTable, 300));
    document.getElementById('prazos-filter-status-inicio')?.addEventListener('change', updatePlannedVsRealizedTable);
    document.getElementById('prazos-filter-status-fim')?.addEventListener('change', updatePlannedVsRealizedTable);
    document.getElementById('prazos-filter-status-projeto')?.addEventListener('change', updatePlannedVsRealizedTable);
    
    document.getElementById('esforco-filter-projeto')?.addEventListener('input', debounce(updateEffortTable, 300));
    
    // ===== POPULADORES DE FILTROS =====


    function populateAvailabilityChartFilters() {
        const profSelect = document.getElementById('availability-chart-prof-filter');
        const perfilSelect = document.getElementById('availability-chart-perfil-filter');

        if (profSelect) {
            const profissionaisAtivos = getProfissionais()
                .filter(p => p.ativo !== 'Não')
                .sort((a, b) => a.nome.localeCompare(b.nome));
            profSelect.innerHTML = '<option value="">Todos</option>' +
                profissionaisAtivos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        if (perfilSelect) {
            const perfis = [...new Set(getProfissionais().map(p => p.perfil))].sort();
            perfilSelect.innerHTML = '<option value="">Todos Perfis</option>' +
                perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
        }
    }

    function populateProfileFilters() {
        const profileSelect = document.getElementById('availability-filter-profile');
        if (profileSelect) {
            const perfis = [...new Set(getProfissionais().map(p => p.perfil))].sort();
            profileSelect.innerHTML = '<option value="">Todos os Perfis</option>' +
                perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
        }
    }


// ===== FIM DA PARTE 2 =====
// ===== PARTE 3 - DASHBOARD, GRÁFICOS E TIMELINE =====

    // ===== DASHBOARD =====
    let updateDashboard = function() {
        // Métricas principais
        const totalProfissionais = getProfissionais().filter(p => p.ativo !== 'Não').length;
        const totalProjetos = getProjetos().length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alocacoesAtivas = getAlocacoes().filter(a => {
            const inicio = new Date(a.dataInicio + 'T00:00:00');
            const fim = new Date(a.dataFim + 'T00:00:00');
            return inicio <= today && fim >= today;
        });

        const profissionaisAlocadosIds = new Set(alocacoesAtivas.map(a => a.profissionalId));
        const profissionaisAlocados = profissionaisAlocadosIds.size;
        const profissionaisDisponiveis = totalProfissionais - profissionaisAlocados;

        document.getElementById('total-profissionais') && (document.getElementById('total-profissionais').textContent = totalProfissionais);
        document.getElementById('total-projetos') && (document.getElementById('total-projetos').textContent = totalProjetos);
        document.getElementById('profissionais-alocados') && (document.getElementById('profissionais-alocados').textContent = profissionaisAlocados);
        document.getElementById('profissionais-disponiveis') && (document.getElementById('profissionais-disponiveis').textContent = profissionaisDisponiveis);

        // Dashboard de Profissionais
        updateProfissionaisAllocationTable();
        
        // Dashboard de Projetos
        updateProjetosTable();
        
        // Dashboard Planejado vs Realizado
        updatePlannedVsRealizedTable();
        
        // Dashboard de Esforço
        updateEffortTable();
        
        // Gráficos
        updateProfileChart();
        updateMonthlyAvailabilityChart();
    };

    function updateProfissionaisAllocationTable() {
    const tbody = document.getElementById('dashboard-profissionais-table');
    if (!tbody) return;

    const filterNome = document.getElementById('dashboard-filter-nome')?.value.toLowerCase() || '';
    const filterTime = document.getElementById('dashboard-filter-time')?.value || '';
    const filterLider = document.getElementById('dashboard-filter-lider')?.value || '';
    const filterProjeto = document.getElementById('dashboard-filter-projeto')?.value || '';
    const filterInicio = document.getElementById('dashboard-filter-inicio')?.value || '';
    const filterFim = document.getElementById('dashboard-filter-fim')?.value || '';

    const temFiltroPeriodo = filterInicio && filterFim;
    let periodoInicio, periodoFim;
    
    if (temFiltroPeriodo) {
        periodoInicio = new Date(filterInicio + 'T00:00:00');
        periodoFim = new Date(filterFim + 'T00:00:00');
    } else {
        // Primeiro dia do mês atual
        periodoInicio = new Date();
        periodoInicio.setDate(1);
        periodoInicio.setHours(0, 0, 0, 0);
        
        // 2 anos no futuro
        periodoFim = new Date();
        periodoFim.setFullYear(periodoFim.getFullYear() + 2);
        periodoFim.setHours(23, 59, 59, 999);
    }

    let filtered = getProfissionais().filter(p => p.ativo !== 'Não');

    if (filterNome) filtered = filtered.filter(p => p.nome.toLowerCase().includes(filterNome));
    if (filterTime) filtered = filtered.filter(p => p.time === filterTime);
    if (filterLider) filtered = filtered.filter(p => p.lider === filterLider);

    const rows = filtered.map(prof => {
        let alocacoes = getAlocacoes().filter(a => a.profissionalId === prof.id);

        if (filterProjeto) {
            alocacoes = alocacoes.filter(a => a.projetoId === filterProjeto);
        }

        // ✅ CORREÇÃO: Se filtrou por projeto e não há alocações, não mostrar profissional
        if (filterProjeto && alocacoes.length === 0) {
            return null;
        }

        const alocacoesNoPeriodo = alocacoes.filter(a => {
            const inicio = new Date(a.dataInicio + 'T00:00:00');
            const fim = new Date(a.dataFim + 'T00:00:00');
            return inicio <= periodoFim && fim >= periodoInicio;
        });

        // ✅ CORREÇÃO: CALCULAR SOBREPOSIÇÃO REAL DIA A DIA
        let percentualNoPeriodo = 0;

        for (let d = new Date(periodoInicio); d <= periodoFim; d.setDate(d.getDate() + 1)) {
            let percentualDia = 0;
            
            alocacoesNoPeriodo.forEach(aloc => {
                const inicio = new Date(aloc.dataInicio + 'T00:00:00');
                const fim = new Date(aloc.dataFim + 'T00:00:00');
                
                if (d >= inicio && d <= fim) {
                    percentualDia += parseInt(aloc.percentual) || 0;
                }
            });
            
            if (percentualDia > percentualNoPeriodo) {
                percentualNoPeriodo = percentualDia;
            }
        }
        
        const status = percentualNoPeriodo === 0 ? 'Disponível' : 
                      percentualNoPeriodo >= 100 ? 'Totalmente Alocado' : 
                      'Parcialmente Alocado';
        const statusColor = percentualNoPeriodo === 0 ? 'text-green-600' : 
                           percentualNoPeriodo >= 100 ? 'text-blue-600' : 
                           'text-yellow-600';

        const projetos = alocacoes.map(a => {
            const proj = getProjetos().find(p => p.id === a.projetoId);
            return proj?.nome || 'N/A';
        });
        const projetosUnicos = [...new Set(projetos)].join(', ') || 'Nenhum';

        let proximaDisponibilidade;
        
        if (percentualNoPeriodo === 0) {
            proximaDisponibilidade = 'Disponível agora';
        } else if (percentualNoPeriodo >= 100) {
            const alocacoesAtivas = alocacoesNoPeriodo
                .filter(a => new Date(a.dataFim + 'T00:00:00') >= periodoInicio)
                .sort((a, b) => new Date(b.dataFim) - new Date(a.dataFim));
            
            if (alocacoesAtivas.length > 0) {
                const ultimaAlocacao = alocacoesAtivas[0];
                const dataTermino = new Date(ultimaAlocacao.dataFim + 'T00:00:00');
                dataTermino.setDate(dataTermino.getDate() + 1);
                proximaDisponibilidade = `A partir de ${formatDate(dataTermino.toISOString().split('T')[0])}`;
            } else {
                proximaDisponibilidade = 'Verificar alocações';
            }
        } else {
            const disponivel = 100 - percentualNoPeriodo;
            proximaDisponibilidade = `${disponivel}% disponível no período`;
        }

        // ✅ FORMATAÇÃO VISUAL COM ALERTA DE SOBRE-ALOCAÇÃO
        let alocacaoDisplay;
        let alocacaoClass;
        let alocacaoTitle;
        
        if (percentualNoPeriodo === 0) {
            alocacaoDisplay = '0%';
            alocacaoClass = 'text-gray-600';
            alocacaoTitle = 'Nenhuma alocação no período';
        } else if (percentualNoPeriodo > 100) {
            alocacaoDisplay = '100% ⚠️';
            alocacaoClass = 'text-red-600 font-bold';
            alocacaoTitle = `⚠️ SOBRE-ALOCADO: ${percentualNoPeriodo}% máximo em algum dia (${alocacoesNoPeriodo.length} alocações)`;
        } else if (percentualNoPeriodo === 100) {
            alocacaoDisplay = '100%';
            alocacaoClass = 'text-blue-600 font-semibold';
            alocacaoTitle = 'Totalmente alocado no período';
        } else {
            alocacaoDisplay = `${percentualNoPeriodo}%`;
            alocacaoClass = 'text-yellow-600';
            alocacaoTitle = `${percentualNoPeriodo}% máximo de alocação no período`;
        }

        return `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${prof.nome}</td>
                <td class="px-6 py-4">${prof.perfil}</td>
                <td class="px-6 py-4">${prof.time}</td>
                <td class="px-6 py-4">${projetosUnicos}</td>
                <td class="px-6 py-4 ${statusColor} font-semibold">${status}</td>
                <td class="px-6 py-4 ${alocacaoClass}" title="${alocacaoTitle}" style="cursor: help;">
                    ${alocacaoDisplay}
                </td>
                <td class="px-6 py-4">${proximaDisponibilidade}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.filter(Boolean).length > 0 ? rows.filter(Boolean).join('') : '<tr><td colspan="7" class="text-center p-4">Nenhum profissional encontrado.</td></tr>';
}


    function updateProjetosTable() {
        const tbody = document.getElementById('dashboard-projetos-table');
        if (!tbody) return;

        const filterNome = document.getElementById('project-dashboard-filter-nome')?.value.toLowerCase() || '';
        const filterTime = document.getElementById('project-dashboard-filter-time')?.value || '';
        const filterLider = document.getElementById('project-dashboard-filter-lider')?.value || '';
        
        const selectedStatuses = Array.from(document.querySelectorAll('.project-status-filter:checked')).map(cb => cb.value);

        let filtered = getProjetos();

        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(p => selectedStatuses.includes(p.status));
        }

        const rows = filtered.map(proj => {
            const alocacoes = getAlocacoes().filter(a => a.projetoId === proj.id);
            
            const profissionaisAlocados = alocacoes.map(a => {
                const prof = getProfissionais().find(p => p.id === a.profissionalId);
                if (!prof) return null;
                
                if (filterNome && !prof.nome.toLowerCase().includes(filterNome)) return null;
                if (filterTime && prof.time !== filterTime) return null;
                if (filterLider && prof.lider !== filterLider) return null;
                
                return `${prof.nome} (${a.percentual}%)`;
            }).filter(Boolean);

            if ((filterNome || filterTime || filterLider) && profissionaisAlocados.length === 0) {
                return null;
            }

            const profissionaisList = profissionaisAlocados.length > 0 ? profissionaisAlocados.join(', ') : 'Nenhum';

            return `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 font-medium text-gray-900">${proj.nome}</td>
                    <td class="px-6 py-4">${profissionaisList}</td>
                    <td class="px-6 py-4">${formatDate(proj.inicioPrevisto)}</td>
                    <td class="px-6 py-4">${formatDate(proj.fimPrevisto)}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proj.status)}">
                            ${proj.status}
                        </span>
                    </td>
                </tr>
            `;
        }).filter(Boolean);

        tbody.innerHTML = rows.length > 0 ? rows.join('') : '<tr><td colspan="5" class="text-center p-4">Nenhum projeto encontrado.</td></tr>';
    }

    function updatePlannedVsRealizedTable() {
        const tbody = document.getElementById('dashboard-planned-vs-realized-table');
        if (!tbody) return;

        // ✅ APLICAR FILTROS
        const filterProjeto = document.getElementById('prazos-filter-projeto')?.value.toLowerCase() || '';
        const filterStatusInicio = document.getElementById('prazos-filter-status-inicio')?.value || '';
        const filterStatusFim = document.getElementById('prazos-filter-status-fim')?.value || '';
        const filterStatusProjeto = document.getElementById('prazos-filter-status-projeto')?.value || '';

        let filtered = getProjetos();
        
        // Filtro por nome do projeto
        if (filterProjeto) {
            filtered = filtered.filter(p => p.nome.toLowerCase().includes(filterProjeto));
        }
        
        // Filtro por status do projeto
        if (filterStatusProjeto) {
            filtered = filtered.filter(p => p.status === filterStatusProjeto);
        }

        const rows = filtered.map(proj => {
            let inicioStatus, inicioStatusColor;
            if (proj.inicioReal) {
                if (new Date(proj.inicioReal) <= new Date(proj.inicioPrevisto)) {
                    inicioStatus = 'No Prazo';
                    inicioStatusColor = 'bg-green-100 text-green-800';
                } else {
                    inicioStatus = 'Atrasado';
                    inicioStatusColor = 'bg-red-100 text-red-800';
                }
            } else {
                inicioStatus = 'Não Iniciado';
                inicioStatusColor = 'bg-gray-100 text-gray-800';
            }

            let fimStatus, fimStatusColor;
            if (proj.fimReal) {
                if (new Date(proj.fimReal) <= new Date(proj.fimPrevisto)) {
                    fimStatus = 'No Prazo';
                    fimStatusColor = 'bg-green-100 text-green-800';
                } else {
                    fimStatus = 'Atrasado';
                    fimStatusColor = 'bg-red-100 text-red-800';
                }
            } else {
                if (proj.status === 'Concluído') {
                    fimStatus = 'Não Registrado';
                    fimStatusColor = 'bg-yellow-100 text-yellow-800';
                } else {
                    fimStatus = 'Em Andamento';
                    fimStatusColor = 'bg-blue-100 text-blue-800';
                }
            }
             // ✅ APLICAR FILTRO DE STATUS INÍCIO
            if (filterStatusInicio && inicioStatus !== filterStatusInicio) {
                return null;
            }
            
            // ✅ APLICAR FILTRO DE STATUS FIM
            if (filterStatusFim && fimStatus !== filterStatusFim) {
                return null;
            }

            return `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 font-medium text-gray-900">${proj.nome}</td>
                    <td class="px-6 py-4">${formatDate(proj.inicioPrevisto)}</td>
                    <td class="px-6 py-4">${proj.inicioReal ? formatDate(proj.inicioReal) : '-'}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${inicioStatusColor}">
                            ${inicioStatus}
                        </span>
                    </td>
                    <td class="px-6 py-4">${formatDate(proj.fimPrevisto)}</td>
                    <td class="px-6 py-4">${proj.fimReal ? formatDate(proj.fimReal) : '-'}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${fimStatusColor}">
                            ${fimStatus}
                        </span>
                    </td>
                </tr>
            `;
        }).filter(Boolean); // ✅ REMOVER VALORES NULL DOS FILTROS

        tbody.innerHTML = rows.length > 0 ? rows.join('') : '<tr><td colspan="7" class="text-center p-4">Nenhum projeto encontrado.</td></tr>';
    }

    function updateEffortTable() {
        const tbody = document.getElementById('dashboard-effort-table');
        if (!tbody) return;

        // ✅ APLICAR FILTRO
        const filterProjeto = document.getElementById('esforco-filter-projeto')?.value.toLowerCase() || '';

        let filtered = getProjetos().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        // Filtro por nome do projeto
        if (filterProjeto) {
            filtered = filtered.filter(p => p.nome.toLowerCase().includes(filterProjeto));
        }

        const rows = filtered.map(proj => {
            const alocacoes = getAlocacoes().filter(a => a.projetoId === proj.id);
            
            const horasEstimadasProj = proj.horasEstimadasProjeto || 0;
            const horasAlocadas = alocacoes.reduce((sum, a) => sum + (parseInt(a.horasEstimadas) || 0), 0);
            const horasRealizadas = alocacoes.reduce((sum, a) => sum + (parseInt(a.horasRealizadas) || 0), 0);
            
            const variacao = horasEstimadasProj - horasAlocadas;
            const variacaoText = variacao > 0 ? `+${variacao}h` : variacao < 0 ? `${variacao}h` : '0h';
            const variacaoColor = variacao > 0 ? 'text-green-500' : variacao < 0 ? 'text-red-500' : 'text-gray-500';

            const progresso = horasAlocadas > 0 ? Math.round((horasRealizadas / horasAlocadas) * 100) : 0;
            const progressoColor = progresso <= 0 ? 'bg-gray-500' : progresso <= 50 ? 'bg-green-500' : progresso < 100 ? 'bg-yellow-500' : progresso === 100 ? 'bg-blue-500' : 'bg-red-500';

            return `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 font-medium text-gray-900">${proj.nome}</td>
                    <td class="px-6 py-4">${horasEstimadasProj}h</td>
                    <td class="px-6 py-4">${horasAlocadas}h</td>
					<td class="px-6 py-4 ${variacaoColor} font-semibold">${variacaoText}</td>
                    <td class="px-6 py-4">${horasRealizadas}h</td>                  
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div class="${progressoColor} h-2.5 rounded-full" style="width: ${Math.min(progresso, 100)}%"></div>
                            </div>
                            <span class="text-sm font-medium">${progresso}%</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = rows.length > 0 ? rows.join('') : '<tr><td colspan="6" class="text-center p-4">Nenhum projeto cadastrado.</td></tr>';
    }

    // Event listeners do dashboard
    const dashboardFilters = [
        'dashboard-filter-nome', 'dashboard-filter-time', 'dashboard-filter-lider', 
        'dashboard-filter-projeto', 'dashboard-filter-inicio', 'dashboard-filter-fim',
        'project-dashboard-filter-nome', 'project-dashboard-filter-time', 'project-dashboard-filter-lider'
    ];

    dashboardFilters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            if (filterId.includes('nome')) {
                element.addEventListener('input', debounce(updateDashboard, 300));
            } else {
                element.addEventListener('change', updateDashboard);
            }
        }
    });

    // Listener delegado para checkboxes de status (criados dinamicamente)
    document.getElementById('project-dashboard-filter-status')?.addEventListener('change', updateDashboard);

    // ===== GRÁFICOS =====
    // Inicializar seletor de mês com mês atual
    const monthSelector = document.getElementById('availability-month-selector');
    if (monthSelector) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        monthSelector.value = `${year}-${month}`;
        
        // Chamar função para renderizar o gráfico com mês atual
        updateMonthlyAvailabilityChart();
    }

// Listeners para atualização do gráfico
document.getElementById('availability-month-selector')?.addEventListener('change', updateMonthlyAvailabilityChart);
document.getElementById('availability-chart-prof-filter')?.addEventListener('change', updateMonthlyAvailabilityChart);
document.getElementById('availability-chart-perfil-filter')?.addEventListener('change', updateMonthlyAvailabilityChart);

    
    // ===== BUSCA DE DISPONIBILIDADE =====
    document.getElementById('search-availability-btn')?.addEventListener('click', () => {
        const startDate = document.getElementById('availability-filter-start')?.value;
        const endDate = document.getElementById('availability-filter-end')?.value;
        const profile = document.getElementById('availability-filter-profile')?.value || '';
        const resultsDiv = document.getElementById('availability-results');

        if (!startDate || !endDate) {
            showNotification('Por favor, selecione as datas de início e fim', 'warning');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showNotification('A data de início deve ser anterior à data de fim', 'warning');
            return;
        }

        let profissionais = getProfissionais().filter(p => p.ativo !== 'Não');
        if (profile) profissionais = profissionais.filter(p => p.perfil === profile);

        const periodoInicio = new Date(startDate + 'T00:00:00');
        const periodoFim = new Date(endDate + 'T00:00:00');

        const disponibilidades = profissionais.map(prof => {
            const alocacoes = getAlocacoes().filter(a => {
                if (a.profissionalId !== prof.id) return false;
                const alocInicio = new Date(a.dataInicio + 'T00:00:00');
                const alocFim = new Date(a.dataFim + 'T00:00:00');
                return alocInicio <= periodoFim && alocFim >= periodoInicio;
            });

            // ✅ Calcular sobreposição real dia a dia
            let percentualMaximo = 0;

            for (let d = new Date(periodoInicio); d <= periodoFim; d.setDate(d.getDate() + 1)) {
                let percentualDia = 0;
                
                alocacoes.forEach(aloc => {
                    const inicio = new Date(aloc.dataInicio + 'T00:00:00');
                    const fim = new Date(aloc.dataFim + 'T00:00:00');
                    
                    if (d >= inicio && d <= fim) {
                        percentualDia += parseInt(aloc.percentual) || 0;
                    }
                });
                
                if (percentualDia > percentualMaximo) {
                    percentualMaximo = percentualDia;
                }
            }

            const percentualAlocado = Math.min(percentualMaximo, 100);
            const disponibilidade = 100 - percentualAlocado;

            // ✅ NOVO: Calcular próxima disponibilidade
            let proximaDisponibilidade = '';
            let proximaDispClass = '';
            
            if (disponibilidade === 100) {
                proximaDisponibilidade = '✓ Disponível agora';
                proximaDispClass = 'text-green-600 font-semibold';
            } else if (disponibilidade > 0) {
                proximaDisponibilidade = `${disponibilidade}% disponível`;
                proximaDispClass = 'text-yellow-600';
            } else {
                // Totalmente alocado - encontrar quando fica disponível
                const alocacoesAtivas = alocacoes
                    .filter(a => new Date(a.dataFim + 'T00:00:00') >= periodoInicio)
                    .sort((a, b) => new Date(b.dataFim) - new Date(a.dataFim));
                
                if (alocacoesAtivas.length > 0) {
                    const ultimaAlocacao = alocacoesAtivas[0];
                    const dataTermino = new Date(ultimaAlocacao.dataFim + 'T00:00:00');
                    dataTermino.setDate(dataTermino.getDate() + 1);
                    
                    // Verificar se a data de término está dentro do período de busca
                    if (dataTermino <= periodoFim) {
                        proximaDisponibilidade = `📅 A partir de ${formatDate(dataTermino.toISOString().split('T')[0])}`;
                        proximaDispClass = 'text-blue-600';
                    } else {
                        proximaDisponibilidade = `📅 Após ${formatDate(ultimaAlocacao.dataFim)}`;
                        proximaDispClass = 'text-gray-600';
                    }
                } else {
                    proximaDisponibilidade = '⚠️ Verificar alocações';
                    proximaDispClass = 'text-orange-600';
                }
            }

            return { 
                prof, 
                disponibilidade, 
                percentualAlocado,
                totalAlocacoes: alocacoes.length,
                proximaDisponibilidade,
                proximaDispClass
            };
        }).sort((a, b) => b.disponibilidade - a.disponibilidade);

        if (!resultsDiv) return;

        if (disponibilidades.length === 0) {
            resultsDiv.innerHTML = '<p class="text-gray-600 text-center py-4">Nenhum profissional encontrado.</p>';
        } else {
            // Estatísticas resumidas
            const totalProfs = disponibilidades.length;
            const totalmente100 = disponibilidades.filter(d => d.disponibilidade === 100).length;
            const parcialmente = disponibilidades.filter(d => d.disponibilidade > 0 && d.disponibilidade < 100).length;
            const totalmente0 = disponibilidades.filter(d => d.disponibilidade === 0).length;

            // Renderizar com filtro padrão "disponíveis"
            let filtroAtual = 'disponiveis';
            
            const renderTabela = (filtro) => {
                let dadosFiltrados = disponibilidades;
                
                if (filtro === 'disponiveis') {
                    dadosFiltrados = disponibilidades.filter(d => d.disponibilidade > 0);
                } else if (filtro === 'totalmente-disponiveis') {
                    dadosFiltrados = disponibilidades.filter(d => d.disponibilidade === 100);
                } else if (filtro === 'parcialmente') {
                    dadosFiltrados = disponibilidades.filter(d => d.disponibilidade > 0 && d.disponibilidade < 100);
                } else if (filtro === 'alocados') {
                    dadosFiltrados = disponibilidades.filter(d => d.disponibilidade === 0);
                }
                // 'todos' mostra tudo sem filtro

                const tabelaHTML = `
                    <tbody>
                        ${dadosFiltrados.length === 0 ? `
                            <tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhum profissional nesta categoria.</td></tr>
                        ` : dadosFiltrados.map(item => {
                            let statusClass, statusText, statusIcon;
                            
                            if (item.disponibilidade === 100) {
                                statusClass = 'bg-green-100 text-green-800';
                                statusText = '100% Disponível';
                                statusIcon = '✓';
                            } else if (item.disponibilidade === 0) {
                                statusClass = 'bg-red-100 text-red-800';
                                statusText = 'Totalmente Alocado';
                                statusIcon = '✗';
                            } else {
                                statusClass = 'bg-yellow-100 text-yellow-800';
                                statusText = `${item.disponibilidade}% Disponível`;
                                statusIcon = '◐';
                            }

                            const alocacaoText = item.percentualAlocado > 100 
                                ? `<span class="text-red-600 font-bold" title="Sobre-alocado!">${item.percentualAlocado}% ⚠️</span>`
                                : `${item.percentualAlocado}%`;

                            return `
                                <tr class="bg-white border-b hover:bg-gray-50">
                                    <td class="px-6 py-4 font-medium text-gray-900">${item.prof.nome}</td>
                                    <td class="px-6 py-4">${item.prof.perfil}</td>
                                    <td class="px-6 py-4">${item.prof.time}</td>
                                    <td class="px-6 py-4">${alocacaoText}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                                            ${statusIcon} ${statusText}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 ${item.proximaDispClass}">
                                        ${item.proximaDisponibilidade}
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                            ${item.totalAlocacoes}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                `;

                document.querySelector('#availability-table-body').innerHTML = tabelaHTML;
                
                // Atualizar contador de resultados
                document.querySelector('#results-count').textContent = `Mostrando ${dadosFiltrados.length} de ${totalProfs} profissionais`;
            };

            resultsDiv.innerHTML = `
                <!-- Cards de Estatísticas -->
                <div class="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" data-filtro="todos">
                        <p class="text-sm text-blue-600 font-medium">Total</p>
                        <p class="text-2xl font-bold text-blue-900">${totalProfs}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" data-filtro="totalmente-disponiveis">
                        <p class="text-sm text-green-600 font-medium">100% Disponíveis</p>
                        <p class="text-2xl font-bold text-green-900">${totalmente100}</p>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors" data-filtro="parcialmente">
                        <p class="text-sm text-yellow-600 font-medium">Parcialmente</p>
                        <p class="text-2xl font-bold text-yellow-900">${parcialmente}</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg cursor-pointer hover:bg-red-100 transition-colors" data-filtro="alocados">
                        <p class="text-sm text-red-600 font-medium">Totalmente Alocados</p>
                        <p class="text-2xl font-bold text-red-900">${totalmente0}</p>
                    </div>
                </div>

                <!-- Botões de Filtro -->
                <div class="mb-4 flex flex-wrap gap-2 items-center justify-between">
                    <div class="flex flex-wrap gap-2">
                        <button class="availability-filter-btn px-4 py-2 rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white" data-filtro="disponiveis">
                            📊 Disponíveis (${totalmente100 + parcialmente})
                        </button>
                        <button class="availability-filter-btn px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" data-filtro="todos">
                            🔍 Todos (${totalProfs})
                        </button>
                        <button class="availability-filter-btn px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" data-filtro="totalmente-disponiveis">
                            ✓ 100% (${totalmente100})
                        </button>
                        <button class="availability-filter-btn px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" data-filtro="parcialmente">
                            ◐ Parciais (${parcialmente})
                        </button>
                        <button class="availability-filter-btn px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" data-filtro="alocados">
                            ✗ Alocados (${totalmente0})
                        </button>
                    </div>
                    <p id="results-count" class="text-sm text-gray-600"></p>
                </div>

                <!-- Tabela com Scroll -->
                <div class="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th class="px-6 py-3">Profissional</th>
                                <th class="px-6 py-3">Perfil</th>
                                <th class="px-6 py-3">Time</th>
                                <th class="px-6 py-3">Alocação</th>
                                <th class="px-6 py-3">Disponibilidade</th>
                                <th class="px-6 py-3">📅 Próxima Disponibilidade</th>
                                <th class="px-6 py-3">Nº Alocações</th>
                            </tr>
                        </thead>
                        <tbody id="availability-table-body"></tbody>
                    </table>
                </div>
            `;

            // Event listeners para filtros
            document.querySelectorAll('.availability-filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const novoFiltro = e.currentTarget.dataset.filtro;
                    filtroAtual = novoFiltro;
                    
                    // Atualizar aparência dos botões
                    document.querySelectorAll('.availability-filter-btn').forEach(b => {
                        b.classList.remove('bg-indigo-600', 'text-white');
                        b.classList.add('bg-white', 'text-gray-700', 'border', 'border-gray-300');
                    });
                    e.currentTarget.classList.remove('bg-white', 'text-gray-700', 'border', 'border-gray-300');
                    e.currentTarget.classList.add('bg-indigo-600', 'text-white');
                    
                    renderTabela(novoFiltro);
                });
            });

            // Event listeners para cards (clicáveis)
            document.querySelectorAll('[data-filtro]').forEach(card => {
                if (!card.classList.contains('availability-filter-btn')) {
                    card.addEventListener('click', (e) => {
                        const novoFiltro = e.currentTarget.dataset.filtro;
                        
                        // Simular clique no botão correspondente
                        const btnCorrespondente = document.querySelector(`.availability-filter-btn[data-filtro="${novoFiltro}"]`);
                        if (btnCorrespondente) {
                            btnCorrespondente.click();
                        }
                    });
                }
            });

            // Renderizar tabela inicial (apenas disponíveis)
            renderTabela('disponiveis');
        }
    });
   

    // Inicialização da view inicial
    // Configurar listeners de navegação
    setupNavigationListeners();

    // Chamar drawTimelineChart ao navegar para a Timeline
    document.querySelectorAll('.nav-link[data-view="timeline"]').forEach(link => {
        link.addEventListener('click', () => {
            if (isGoogleChartsLoaded) {
                setTimeout(() => drawTimelineChart(), 150);
            }
        });
    });

    switchView('dashboard');
}	

// ===== INICIALIZAÇÃO =====
initializeFirebaseApp();

// ===== FIM DA PARTE 3 =====
// ✅ ARQUIVO app.js COMPLETO v4.0.0