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
    doc,
    setDoc,
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
        if (typeof populateTimelineFilters === 'function') populateTimelineFilters();
        if (typeof populateProfissionaisFilters === 'function') populateProfissionaisFilters();
    });
    firestoreUnsubscribers.push(unsubProf);

    // Listener para Projetos
    const unsubProj = onSnapshot(collection(getDb(), getCollectionPath('projetos')), (snapshot) => {
        setProjetos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (typeof renderProjetos === 'function') renderProjetos();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateDashboardFilters === 'function') populateDashboardFilters();
        if (typeof populateTimelineFilters === 'function') populateTimelineFilters();
    });
    firestoreUnsubscribers.push(unsubProj);

    // Listener para Alocações
    const unsubAloc = onSnapshot(collection(getDb(), getCollectionPath('alocacoes')), (snapshot) => {
        setAlocacoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        if (typeof renderAlocacoes === 'function') renderAlocacoes();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateAlocacoesFilters === 'function') populateAlocacoesFilters();
        if (typeof populateTimelineFilters === 'function') populateTimelineFilters();
        
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

    function populateTimelineFilters() {
        const profSelect = document.getElementById('timeline-filter-profissional');
        const projSelect = document.getElementById('timeline-filter-projeto');
        const perfilSelect = document.getElementById('timeline-filter-perfil');

        if (profSelect) {
            // ✅ Filtrar apenas profissionais ATIVOS e ordenar alfabeticamente
            const profissionaisAtivosOrdenados = [...getProfissionais()]
                .filter(p => p.ativo !== 'Não' && p.nome) // Apenas ativos com nome válido
                .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            profSelect.innerHTML = '<option value="">Todos</option>' +
                profissionaisAtivosOrdenados.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        if (projSelect) {
            const projetosOrdenados = [...getProjetos()].sort((a, b) => a.nome.localeCompare(b.nome));
            projSelect.innerHTML = '<option value="">Todos</option>' +
                projetosOrdenados.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        if (perfilSelect) {
            // ✅ Filtrar perfis apenas de profissionais ATIVOS
            const perfis = [...new Set(getProfissionais()
                .filter(p => p.ativo !== 'Não')
                .map(p => p.perfil)
                .filter(pf => pf) // Remover undefined/null
            )].sort();
            perfilSelect.innerHTML = '<option value="">Todos</option>' +
                perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
        }

        [profSelect, projSelect, perfilSelect].forEach(select => {
            select?.addEventListener('change', () => {
                if (isGoogleChartsLoaded) drawTimelineChart();
            });
        });
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

        let filtered = getProjetos();
        
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
   

    // ===== TIMELINE =====
window.drawTimelineChart = drawTimelineChart;
function drawTimelineChart() {
    const container = document.getElementById('timeline-chart-container');
    if (!container || !isGoogleChartsLoaded) return;

    const filterProf = document.getElementById('timeline-filter-profissional')?.value || '';
    const filterProj = document.getElementById('timeline-filter-projeto')?.value || '';
    const filterPerfil = document.getElementById('timeline-filter-perfil')?.value || '';

    let alocacoes = getAlocacoes().filter(a => {
        // ✅ Buscar profissional para validações
        const prof = getProfissionais().find(p => p.id === a.profissionalId);

        // ✅ FILTRO 1: Apenas profissionais ATIVOS e com nome válido
        if (!prof || prof.ativo === 'Não' || !prof.nome) return false;

        if (filterProf && a.profissionalId !== filterProf) return false;
        if (filterProj && a.projetoId !== filterProj) return false;

        if (filterPerfil) {
            if (prof.perfil !== filterPerfil) return false;
        }

        return true;
    });

    // ✅ ORDENAR alocações por nome do profissional (alfabeticamente)
    alocacoes.sort((a, b) => {
        const profA = getProfissionais().find(p => p.id === a.profissionalId);
        const profB = getProfissionais().find(p => p.id === b.profissionalId);
        return (profA?.nome || '').localeCompare(profB?.nome || '');
    });

    if (alocacoes.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 pt-16">Nenhuma alocação encontrada para os filtros selecionados.</p>';
        return;
    }

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Resource' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    dataTable.addColumn({ type: 'string', role: 'style' });

    // ✅ ADICIONAR LINHA INVISÍVEL PARA FORÇAR "HOJE" NO RANGE
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // ✅ Linha invisível com caractere zero-width space (invisível)
    const invisibleChar = '\u200B'; // Zero-Width Space - caractere Unicode invisível
    dataTable.addRow([
        invisibleChar, // Resource invisível
        invisibleChar, // Name invisível
        '', // Tooltip vazio
        today, // Start = hoje
        todayEnd, // End = hoje (mesmo dia)
        'opacity: 0; height: 0;' // ✅ INVISÍVEL
    ]);

    console.log('📅 Linha invisível adicionada para forçar "hoje" no range:', today.toLocaleDateString());

    // Adicionar as alocações normais
    alocacoes.forEach(aloc => {
        const prof = getProfissionais().find(p => p.id === aloc.profissionalId);
        const proj = getProjetos().find(p => p.id === aloc.projetoId);

        // ✅ Validar profissional, projeto e nomes (evitar "undefined")
        if (!prof || !proj) return;
        if (!prof.nome || !proj.nome) return;

        const profNome = prof.nome;
        const projNome = proj.nome;
        const inicio = new Date(aloc.dataInicio + 'T00:00:00');
        const fim = new Date(aloc.dataFim + 'T00:00:00');

        const tooltip = `
            <div style="padding: 10px; font-family: Arial, sans-serif;">
                <strong>${profNome}</strong><br/>
                <strong>Projeto:</strong> ${projNome}<br/>
                <strong>Período:</strong> ${formatDate(aloc.dataInicio)} - ${formatDate(aloc.dataFim)}<br/>
                <strong>Alocação:</strong> ${aloc.percentual}%<br/>
                <strong>Horas:</strong> ${aloc.horasEstimadas || 0}h estimadas / ${aloc.horasRealizadas || 0}h realizadas
            </div>
        `;

        dataTable.addRow([
            profNome, 
            projNome, 
            tooltip, 
            inicio, 
            fim,
            null // Sem estilo especial (visível normalmente)
        ]);
    });

    const options = {
        timeline: {
            showRowLabels: true,
            showBarLabels: true,
            groupByRowLabel: true,
            colorByRowLabel: false
        },
        avoidOverlappingGridLines: false,
        tooltip: { isHtml: true },
        backgroundColor: '#ffffff',
        height: Math.max(600, (alocacoes.length + 1) * 50) // +1 pela linha invisível
    };

    container.innerHTML = '';
    const chart = new google.visualization.Timeline(container);
    
    google.visualization.events.addListener(chart, 'select', function() {
        const selection = chart.getSelection();
        if (selection.length > 0) {
            const row = selection[0].row;
            // ✅ Ignorar a primeira linha (invisível)
            if (row === 0) return;
            
            const alocacao = alocacoes[row - 1]; // -1 porque a primeira é invisível
            if (alocacao) {
                setOpenedFromTimeline(true);
                openAlocacaoModal(alocacao);
            }
        }
    });

    chart.draw(dataTable, options);

    // ✅ OCULTAR LINHA "undefined" após renderização
    function hideUndefinedLabel() {
        const svg = container.querySelector('svg');
        if (!svg) return;

        const textElements = svg.querySelectorAll('text');
        textElements.forEach(text => {
            const content = text.textContent?.trim();
            if (content === 'undefined' || content === '' || !content) {
                // Ocultar o texto "undefined" ou vazio
                text.textContent = '';
                text.style.visibility = 'hidden';
            }
        });

        // ✅ Também ocultar a primeira linha da tabela se for a invisível
        const rows = svg.querySelectorAll('g > rect');
        if (rows.length > 0) {
            const firstRowRect = rows[0];
            if (firstRowRect && firstRowRect.getAttribute('fill') === 'none') {
                firstRowRect.style.display = 'none';
            }
        }

        console.log('✅ Label "undefined" ocultado do gráfico');
    }

    setTimeout(hideUndefinedLabel, 100);
    setTimeout(hideUndefinedLabel, 300);
    setTimeout(hideUndefinedLabel, 600);

    // ✅ SEMPRE ADICIONAR LINHA "HOJE"
    console.log('⏳ Aguardando renderização do gráfico...');
    setTimeout(() => {
        addTodayLineToTimeline(container, alocacoes);
    }, 500);
}
// Contador de tentativas para evitar loop infinito - Timeline
let todayLineRetries = 0;
const MAX_RETRIES_TIMELINE = 10;
function addTodayLineToTimeline(container, alocacoes) {
    const svg = container.querySelector('svg');
    if (!svg) {
    if (todayLineRetries < MAX_RETRIES_TIMELINE) {
        console.log('⏳ SVG não encontrado, tentando novamente...');
        todayLineRetries++;
        setTimeout(() => addTodayLineToTimeline(container, alocacoes), 300);
        return;
    } else {
        console.log('⚠ SVG timeline não encontrado após máximo de tentativas');
        todayLineRetries = 0;
        return;
    }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Remover linha antiga se existir
    const oldLine = svg.querySelector('.today-line');
    if (oldLine) oldLine.remove();

    // ✅ ESTRATÉGIA: Usar labels do eixo X para calcular escala precisa
    const textElements = svg.querySelectorAll('text');
    const monthMap = { 'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                       'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11 };

    // Coletar labels de mês e ano
    const axisLabels = [];
    let lastYear = new Date().getFullYear();

    textElements.forEach(text => {
        const content = text.textContent.trim();
        const x = parseFloat(text.getAttribute('x'));
        if (isNaN(x)) return;

        // Verificar se é um ano (ex: "2025", "2026")
        if (/^\d{4}$/.test(content)) {
            lastYear = parseInt(content);
            axisLabels.push({ x, type: 'year', year: lastYear });
        }

        // Verificar se é um mês (ex: "jan.", "fev.")
        const monthKey = content.toLowerCase().replace('.', '').substring(0, 3);
        if (monthMap.hasOwnProperty(monthKey)) {
            axisLabels.push({ x, type: 'month', month: monthMap[monthKey], text: content });
        }
    });

    // Ordenar por posição X
    axisLabels.sort((a, b) => a.x - b.x);

    // Associar anos aos meses (cada mês herda o último ano visto)
    let currentYear = 2025; // default
    axisLabels.forEach(label => {
        if (label.type === 'year') {
            currentYear = label.year;
        } else if (label.type === 'month') {
            label.year = currentYear;
            // Se já passamos de dezembro e voltamos pra janeiro, incrementa o ano
            const prevMonth = axisLabels.filter(l => l.type === 'month' && l.x < label.x).pop();
            if (prevMonth && prevMonth.month > label.month) {
                label.year = prevMonth.year + 1;
                currentYear = label.year;
            }
        }
    });

    const monthLabels = axisLabels.filter(l => l.type === 'month' && l.year);
    console.log('📅 Labels de mês com ano:', monthLabels.map(l => `${l.text}/${l.year} @${l.x.toFixed(0)}`));

    // ✅ Calcular escala usando dois labels de mês consecutivos
    let pixelsPerDay = null;
    let refLabel = null;

    for (let i = 0; i < monthLabels.length - 1; i++) {
        const l1 = monthLabels[i];
        const l2 = monthLabels[i + 1];

        const date1 = new Date(l1.year, l1.month, 1);
        const date2 = new Date(l2.year, l2.month, 1);
        const daysBetween = (date2 - date1) / (1000 * 60 * 60 * 24);
        const pixelsBetween = l2.x - l1.x;

        if (daysBetween > 0 && pixelsBetween > 0) {
            pixelsPerDay = pixelsBetween / daysBetween;
            refLabel = l1;
            console.log(`📐 Escala: ${pixelsBetween.toFixed(0)}px / ${daysBetween} dias = ${pixelsPerDay.toFixed(2)} px/dia`);
            break;
        }
    }

    if (!pixelsPerDay || !refLabel) {
        console.warn('⚠️ Não foi possível calcular escala precisa');
        return;
    }

    // ✅ Calcular posição de "hoje"
    const refDate = new Date(refLabel.year, refLabel.month, 1);
    const daysFromRef = (today - refDate) / (1000 * 60 * 60 * 24);
    const xPosition = refLabel.x + (daysFromRef * pixelsPerDay);

    console.log('📅 Referência:', refDate.toLocaleDateString(), '@ x =', refLabel.x.toFixed(0));
    console.log('📅 Hoje:', today.toLocaleDateString());
    console.log('📅 Dias desde ref:', daysFromRef.toFixed(0));
    console.log(`📍 Posição calculada: x = ${xPosition.toFixed(0)}`);

    // ✅ Calcular área Y do gráfico pelas barras
    const allBars = svg.querySelectorAll('rect');
    let minY = Infinity, maxY = 0;

    allBars.forEach(bar => {
        const fill = bar.getAttribute('fill');
        const height = parseFloat(bar.getAttribute('height') || 0);
        const y = parseFloat(bar.getAttribute('y') || 0);
        // Barras de dados têm altura entre 15 e 50px geralmente
        if (fill && fill !== 'none' && fill !== '#ffffff' && fill !== 'white' && height > 10 && height < 60) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y + height);
        }
    });

    if (minY === Infinity) { minY = 50; maxY = 400; }

    const chartY = minY;
    const chartHeight = maxY - minY;

    // ✅ CRIAR ELEMENTOS SVG COM VALIDAÇÃO
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('today-line');
    g.style.pointerEvents = 'none';

    // Fundo semi-transparente
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', xPosition - 15);
    bgRect.setAttribute('y', chartY);
    bgRect.setAttribute('width', '30');
    bgRect.setAttribute('height', chartHeight);
    bgRect.setAttribute('fill', '#fee2e2');
    bgRect.setAttribute('opacity', '0.3');

    // Linha vertical
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', xPosition);
    line.setAttribute('y1', chartY);
    line.setAttribute('x2', xPosition);
    line.setAttribute('y2', chartY + chartHeight);
    line.setAttribute('stroke', '#dc2626');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('opacity', '0.8');

    // Label "Hoje" com fundo
    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    labelBg.setAttribute('x', xPosition + 8);
    labelBg.setAttribute('y', chartY + 5);
    labelBg.setAttribute('width', '50');
    labelBg.setAttribute('height', '24');
    labelBg.setAttribute('fill', 'white');
    labelBg.setAttribute('stroke', '#dc2626');
    labelBg.setAttribute('stroke-width', '2');
    labelBg.setAttribute('rx', '4');

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', xPosition + 33);
    label.setAttribute('y', chartY + 22);
    label.setAttribute('fill', '#dc2626');
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = 'Hoje';

    // Adicionar tudo ao grupo
    g.appendChild(bgRect);
    g.appendChild(line);
    g.appendChild(labelBg);
    g.appendChild(label);

    // Adicionar ao SVG
    svg.appendChild(g);

    console.log('🎉 Linha "Hoje" adicionada com sucesso!');
}
        // ===== ⭐ INÍCIO: IMPORTAÇÃO DE HORAS DO KIMAI v2.0 =====
    const kimaiFileInput = document.getElementById('kimai-file-input');
    const selectedFileInfo = document.getElementById('selected-file-info');
    const processKimaiBtn = document.getElementById('process-kimai-btn');
    const removeFileBtn = document.getElementById('remove-file-btn');
    let selectedFile = null;

    // Drag and drop
    const dropArea = kimaiFileInput?.parentElement?.parentElement;
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('border-indigo-500', 'bg-indigo-50');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('border-indigo-500', 'bg-indigo-50');
            });
        });

        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }

    // Seleção de arquivo
    kimaiFileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Remover arquivo
    removeFileBtn?.addEventListener('click', () => {
        selectedFile = null;
        kimaiFileInput.value = '';
        selectedFileInfo?.classList.add('hidden');
        processKimaiBtn?.classList.add('hidden');
    });

    // Processar importação
    processKimaiBtn?.addEventListener('click', async () => {
        if (selectedFile) {
            await processKimaiImport(selectedFile);
        }
    });

    function handleFileSelect(file) {
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            showNotification('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showNotification('Arquivo muito grande! Máximo: 10MB', 'error');
            return;
        }

        selectedFile = file;

        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        
        selectedFileInfo?.classList.remove('hidden');
        processKimaiBtn?.classList.remove('hidden');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    async function processKimaiImport(file) {
        try {
            showNotification('Processando arquivo...', 'info');
            processKimaiBtn.disabled = true;
            processKimaiBtn.innerHTML = '<span class="loading-inline mr-2"></span>Processando...';

            const data = await readExcelFile(file);
            
            if (!data || data.length === 0) {
                throw new Error('Arquivo vazio ou formato inválido');
            }

            console.log('📊 Dados lidos do Excel:', data.length, 'linhas');

            const result = await processKimaiData(data);

            displayImportResults(result);

            showNotification(`✅ Importação concluída! ${result.updated} alocações atualizadas.`, 'success');

        } catch (error) {
            console.error('❌ Erro na importação:', error);
            showNotification('Erro ao processar arquivo: ' + error.message, 'error');
        } finally {
            processKimaiBtn.disabled = false;
            processKimaiBtn.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Processar Importação
            `;
        }
    }

    function readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // ✅ CORREÇÃO: Usar objetos em vez de arrays
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                        raw: false,  // Converter tudo para string
                        defval: ''   // Valores vazios como string vazia
                    });
                    
                    console.log('📊 Registros lidos:', jsonData.length);
                    console.log('📋 Primeiras colunas:', Object.keys(jsonData[0] || {}));
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Erro ao ler arquivo Excel: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    // ===== ⭐ PROCESSAMENTO v2.0 - GRANULAR POR DATA =====
    async function processKimaiData(excelData) {
        const result = {
            processed: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            details: []
        };

        console.log('🔍 Processando', excelData.length, 'registros...');

        // ✅ NOVO: Processar diretamente os objetos JSON
        const registrosPorAlocacao = new Map();

        for (const row of excelData) {
            const nomeProjeto = String(row['Projeto'] || '').trim();
            const nomeUsuario = String(row['Usuário'] || row['Nome'] || '').trim();
            const duracaoStr = String(row['Duração'] || '').trim();
            const dataStr = String(row['Data'] || '').trim();

            // Pular linhas vazias
            if (!nomeProjeto || !nomeUsuario || !duracaoStr || !dataStr) {
                continue;
            }

            // Converter data para formato ISO
            const dataISO = parseDate(dataStr);
            if (!dataISO) {
                const errorMsg = `⚠️ Formato de data não reconhecido: "${dataStr}"`;
                if (!result.errors.includes(errorMsg)) {
                    result.errors.push(errorMsg);
                }
                continue;
            }

            // ✅ CORREÇÃO: Converter duração para horas
            const horas = parseDuration(duracaoStr);
            
            console.log(`📊 ${nomeUsuario} | ${nomeProjeto} | ${dataStr} | "${duracaoStr}" → ${horas}h`);
            
            if (horas === 0) {
                console.warn(`⚠️ Duração zero: "${duracaoStr}"`);
                continue;
            }

            const key = `${nomeUsuario}|${nomeProjeto}`;
            
            if (!registrosPorAlocacao.has(key)) {
                registrosPorAlocacao.set(key, {
                    nomeUsuario,
                    nomeProjeto,
                    registrosPorData: new Map(),
                    totalHoras: 0
                });
            }

            const alocacao = registrosPorAlocacao.get(key);
            const horasExistentes = alocacao.registrosPorData.get(dataISO) || 0;
            alocacao.registrosPorData.set(dataISO, horasExistentes + horas);
            alocacao.totalHoras += horas;
        }

        console.log('✅ Dados agrupados:', registrosPorAlocacao.size, 'alocações únicas');

        // ✅ LOG DE DEBUG: Mostrar projetos e profissionais disponíveis no sistema
        console.log('📋 Projetos no sistema:', getProjetos().map(p => p.nome));
        console.log('📋 Profissionais no sistema:', getProfissionais().map(p => p.nome));

        // ✅ LOG DE DEBUG: Mostrar totais
        for (const [key, dados] of registrosPorAlocacao.entries()) {
            console.log(`👤 ${key}: ${dados.totalHoras.toFixed(2)}h (${dados.registrosPorData.size} dias)`);
        }

        // Atualizar alocações no Firestore
        for (const [key, dadosNovos] of registrosPorAlocacao.entries()) {
            const { nomeUsuario, nomeProjeto, registrosPorData, totalHoras } = dadosNovos;

            console.log(`🔍 Buscando: Profissional="${nomeUsuario}" | Projeto="${nomeProjeto}"`);
            
            result.processed++;

            try {
                // Encontrar profissional - priorizar match exato, depois match mais específico
                let profissional = getProfissionais().find(p =>
                    p.nome.toLowerCase().trim() === nomeUsuario.toLowerCase().trim()
                );

                // Se não encontrou match exato, buscar match parcial preferindo o mais específico
                if (!profissional) {
                    const profissionaisMatch = getProfissionais().filter(p =>
                        p.nome.toLowerCase().includes(nomeUsuario.toLowerCase()) ||
                        nomeUsuario.toLowerCase().includes(p.nome.toLowerCase())
                    );

                    if (profissionaisMatch.length > 1) {
                        profissional = profissionaisMatch.sort((a, b) => b.nome.length - a.nome.length)[0];
                        console.log(`⚠️ Múltiplos profissionais encontrados para "${nomeUsuario}", usando o mais específico: "${profissional.nome}"`);
                    } else if (profissionaisMatch.length === 1) {
                        profissional = profissionaisMatch[0];
                    }
                }

                if (!profissional) {
                    result.skipped++;
                    result.errors.push(`Profissional não encontrado: ${nomeUsuario}`);
                    console.warn(`❌ Profissional não encontrado: ${nomeUsuario}`);
                    continue;
                }

                // Encontrar projeto - priorizar match exato, depois match mais específico
                let projeto = getProjetos().find(p =>
                    p.nome.toLowerCase().trim() === nomeProjeto.toLowerCase().trim()
                );

                // Se não encontrou match exato, buscar match parcial preferindo o mais específico
                if (!projeto) {
                    const projetosMatch = getProjetos().filter(p =>
                        p.nome.toLowerCase().includes(nomeProjeto.toLowerCase()) ||
                        nomeProjeto.toLowerCase().includes(p.nome.toLowerCase())
                    );

                    // Se houver múltiplos matches, escolher o mais específico (nome mais longo que ainda faz match)
                    if (projetosMatch.length > 1) {
                        projeto = projetosMatch.sort((a, b) => b.nome.length - a.nome.length)[0];
                        console.log(`⚠️ Múltiplos projetos encontrados para "${nomeProjeto}", usando o mais específico: "${projeto.nome}"`);
                    } else if (projetosMatch.length === 1) {
                        projeto = projetosMatch[0];
                    }
                }

                if (!projeto) {
                    result.skipped++;
                    result.errors.push(`Projeto não encontrado: ${nomeProjeto}`);
                    console.warn(`❌ Projeto não encontrado: ${nomeProjeto}`);
                    continue;
                }

                // Encontrar alocação
                const alocacao = getAlocacoes().find(a => 
                    a.profissionalId === profissional.id && 
                    a.projetoId === projeto.id
                );

                if (!alocacao) {
                    result.skipped++;
                    result.errors.push(`Alocação não encontrada: ${nomeUsuario} → ${nomeProjeto}`);
                    console.warn(`❌ Alocação não encontrada: ${nomeUsuario} → ${nomeProjeto}`);
                    continue;
                }

                // ✅ CORREÇÃO: Usar totalHoras calculado
                const registrosAntigos = alocacao.registrosPorData || {};
                const registrosNovos = Object.fromEntries(registrosPorData);
                
                const novoTotal = Math.round(totalHoras); // Usar totalHoras, não recalcular

                console.log(`💾 Salvando: ${profissional.nome} → ${projeto.nome}: ${alocacao.horasRealizadas || 0}h → ${novoTotal}h`);

                // Atualizar no Firestore
                await setDoc(doc(getDb(), getCollectionPath('alocacoes'), alocacao.id), {
                    ...alocacao,
                    horasRealizadas: novoTotal,
                    registrosPorData: registrosNovos,
                    ultimaImportacao: new Date().toISOString()
                });

                result.updated++;
                result.details.push({
                    profissional: profissional.nome,
                    projeto: projeto.nome,
                    horasAntes: alocacao.horasRealizadas || 0,
                    horasDepois: novoTotal,
                    diferenca: novoTotal - (alocacao.horasRealizadas || 0)
                });

                console.log(`✅ Atualizado: ${profissional.nome} → ${projeto.nome}: ${alocacao.horasRealizadas || 0}h → ${novoTotal}h`);

            } catch (error) {
                result.errors.push(`Erro ao atualizar ${nomeUsuario} → ${nomeProjeto}: ${error.message}`);
                console.error('❌ Erro:', error);
            }
        }

        return result;
    }

    // ===== NOVA FUNÇÃO: Comparar registros por data (CORRIGIDA) =====
    function compararRegistrosPorData(antigos, novos) {
        const comparacao = {
            diasNovos: [],
            diasAlterados: [],
            diasRemovidos: [],
            diasInalterados: 0
        };

        const todasAsDatas = new Set([
            ...Object.keys(antigos),
            ...Object.keys(novos)
        ]);

        for (const data of todasAsDatas) {
            // ✅ CORREÇÃO AQUI: Arredonda para 2 casas decimais
            const horasAntigas = Math.round((antigos[data] || 0) * 100) / 100;
            const horasNovas = Math.round((novos[data] || 0) * 100) / 100;

            if (horasAntigas === 0 && horasNovas > 0) {
                comparacao.diasNovos.push({ data, horas: horasNovas });
            } else if (horasAntigas > 0 && horasNovas === 0) {
                comparacao.diasRemovidos.push({ data, horas: horasAntigas });
            } else if (horasAntigas !== horasNovas) {
                comparacao.diasAlterados.push({ 
                    data, 
                    horasAntes: horasAntigas, 
                    horasDepois: horasNovas,
                    diferenca: horasNovas - horasAntigas
                });
            } else {
                comparacao.diasInalterados++;
            }
        }

        return comparacao;
    }

    // ===== NOVA FUNÇÃO: Parse de data (CORRIGIDA) =====
    // ===== NOVA FUNÇÃO: Parse de data (v3.0 - Mais Robusta) =====
    function parseDate(dateStr) {
        dateStr = String(dateStr).trim();

        // 1. Tentar converter número serial do Excel (ex: 45733)
        if (/^\d{4,5}$/.test(dateStr)) {
            try {
                const excelSerialDate = parseInt(dateStr, 10);
                // 25569 é o offset entre 01/01/1900 (Excel) e 01/01/1970 (Unix)
                const jsTimestamp = (excelSerialDate - 25569) * 86400 * 1000;
                const date = new Date(jsTimestamp);
                const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
                if (!isNaN(utcDate.getTime())) {
                    return utcDate.toISOString().split('T')[0];
                }
            } catch (e) { /* falha, tenta outros formatos */ }
        }

        // 2. Tentar formatos comuns (ISO, BR, US, Alemão) com hífens, barras ou pontos
        // Regex para YYYY-MM-DD
        let match = dateStr.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        
        // Regex para DD/MM/YYYY (BR) ou DD.MM.YYYY (Alemão)
        match = dateStr.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
        if (match) {
            // Assumindo formato DD/MM/YYYY
            return `${match[3]}-${match[2]}-${match[1]}`;
        }

        // Regex para MM/DD/YYYY (US)
        match = dateStr.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
        if (match) {
            // Se o primeiro grupo (MM) for > 12, é provável que seja DD/MM/YYYY
            if (parseInt(match[1], 10) > 12) {
                return `${match[3]}-${match[2]}-${match[1]}`; // Formato BR
            }
            // Assumindo formato MM/DD/YYYY
            return `${match[3]}-${match[1]}-${match[2]}`;
        }
        
        // 3. Último recurso: Deixar o JavaScript tentar adivinhar
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            // Ignorar
        }
        
        // Se tudo falhar, retorna null para ser tratado como erro
        console.warn('Formato de data não reconhecido:', dateStr);
        return null;
    }

    function parseDuration(durationStr) {
        durationStr = String(durationStr).trim();
        
        // ✅ NOVO: Verificar formato "X days HH:MM:SS"
        if (durationStr.includes('days') || durationStr.includes('day')) {
            const partes = durationStr.split(/days?/i); // case-insensitive
            const dias = parseInt(partes[0].trim()) || 0;
            const tempoStr = partes[1].trim();
            
            // Processar a parte de tempo HH:MM:SS
            const timeParts = tempoStr.split(':').map(p => parseInt(p) || 0);
            const hours = (timeParts[0] || 0);
            const minutes = (timeParts[1] || 0);
            const seconds = (timeParts[2] || 0);
            
            // ✅ CORREÇÃO CRÍTICA: Converter dias em horas + tempo
            const totalHoras = (dias * 24) + hours + (minutes / 60) + (seconds / 3600);
            
            console.log(`🔍 Convertendo: "${durationStr}" → ${totalHoras.toFixed(2)}h`);
            
            return Math.round(totalHoras * 100) / 100; // 2 casas decimais
        }
        
        // Formato HH:MM ou HH:MM:SS
        if (durationStr.includes(':')) {
            const parts = durationStr.split(':').map(p => parseInt(p) || 0);
            const hours = parts[0] || 0;
            const minutes = parts[1] || 0;
            const seconds = parts[2] || 0;
            return hours + (minutes / 60) + (seconds / 3600);
        }
        
        // Formato decimal (1.5, 2.0, etc)
        const num = parseFloat(durationStr.replace(',', '.'));
        if (!isNaN(num)) {
            if (num < 24) return num;
            return num / 60;
        }
        
        return 0;
    }

    // ===== NOVA FUNÇÃO: Exibição de Resultados v2.0 =====
    // ===== NOVA FUNÇÃO: Exibição de Resultados v2.0 (CORRIGIDA) =====
    // ===== NOVA FUNÇÃO: Exibição de Resultados v2.0 (Com Expandir/Recolher) =====
    // ===== NOVA FUNÇÃO: Exibição de Resultados v2.0 (CORRIGIDO: Mostra decimais) =====
    function displayImportResults(result) {
        const importResults = document.getElementById('import-results');
        const importSummary = document.getElementById('import-summary');
        
        if (!importResults || !importSummary) return;

        let html = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-sm text-blue-600 font-medium">Processadas</p>
                    <p class="text-2xl font-bold text-blue-900">${result.processed}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <p class="text-sm text-green-600 font-medium">Atualizadas</p>
                    <p class="text-2xl font-bold text-green-900">${result.updated}</p>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <p class="text-sm text-yellow-600 font-medium">Ignoradas</p>
                    <p class="text-2xl font-bold text-yellow-900">${result.skipped}</p>
                </div>
            </div>
        `;

        if (result.details.length > 0) {
            html += `
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-800 mb-3">📋 Detalhes das Atualizações:</h4>
                    <div class="space-y-3">
                        ${result.details.map(d => {
                            const diferencaHoras = d.diferenca || 0;
                            const sinal = diferencaHoras > 0 ? '+' : '';
                            const corDiferenca = diferencaHoras > 0 ? 'text-green-600' : 
                                                 diferencaHoras < 0 ? 'text-red-600' : 'text-gray-600';
                            
                            return `
                                <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <p class="font-semibold text-gray-900 mb-2">${d.profissional} → ${d.projeto}</p>
                                    <div class="flex gap-4 text-sm">
                                        <span class="text-gray-600">Antes: <strong>${d.horasAntes}h</strong></span>
                                        <span class="${corDiferenca} font-bold">
                                            ${sinal}${diferencaHoras}h
                                        </span>
                                        <span class="text-indigo-600">Depois: <strong>${d.horasDepois}h</strong></span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        if (result.errors.length > 0) {
            const maxVisivel = 10;
            const temMais = result.errors.length > maxVisivel;

            html += `
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mt-6">
                    <h4 class="font-semibold text-yellow-800 mb-2">⚠️ Avisos (${result.errors.length}):</h4>
                    <ul id="import-errors-list" class="list-disc list-inside text-sm text-yellow-700 space-y-1 ${temMais ? 'max-h-64 overflow-y-auto' : ''}">
                        ${result.errors.slice(0, maxVisivel).map(err => `<li>${err}</li>`).join('')}
                    </ul>
                    ${temMais ? `
                        <div id="import-errors-hidden" class="hidden">
                            <ul class="list-disc list-inside text-sm text-yellow-700 space-y-1 max-h-96 overflow-y-auto">
                                ${result.errors.map(err => `<li>${err}</li>`).join('')}
                            </ul>
                        </div>
                        <button id="toggle-errors-btn" onclick="
                            const lista = document.getElementById('import-errors-list');
                            const hidden = document.getElementById('import-errors-hidden');
                            const btn = document.getElementById('toggle-errors-btn');
                            if (hidden.classList.contains('hidden')) {
                                lista.classList.add('hidden');
                                hidden.classList.remove('hidden');
                                btn.textContent = '▲ Mostrar menos';
                            } else {
                                lista.classList.remove('hidden');
                                hidden.classList.add('hidden');
                                btn.textContent = '▼ Ver todos os ${result.errors.length} avisos';
                            }
                        " class="mt-3 text-sm text-yellow-800 hover:text-yellow-900 font-semibold underline cursor-pointer">
                            ▼ Ver todos os ${result.errors.length} avisos
                        </button>
                    ` : ''}
                </div>
            `;
        }

        importSummary.innerHTML = html;
        importResults.classList.remove('hidden');
        
        // Scroll suave até os resultados
        setTimeout(() => {
            importResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    // ===== ⭐ FIM: IMPORTAÇÃO DE HORAS DO KIMAI v2.0 =====


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