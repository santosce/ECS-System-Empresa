// ===== ECS SYSTEM - VERSÃO 3.1.0 =====
// Sistema de Gestão de Capacity
// Última atualização: 29/10/25 - 16h30
// Login via Popup + Todas correções aplicadas

// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ===== VARIÁVEIS GLOBAIS =====
const APP_VERSION = '3.1.0';
const APP_NAME = 'ECS System';
let app;
let db;
let auth;
let provider;
let appId;

const appState = {
    profissionais: [],
    projetos: [],
    alocacoes: [],
    users: []
};

let openedFromTimeline = false;

// ===== FUNÇÃO PARA DEBOUNCE =====
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// ===== FUNÇÃO GLOBAL PARA NOTIFICAÇÕES =====
window.showNotification = function(message, type = 'info') {
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
};

const showNotification = window.showNotification;

// ===== INICIALIZAR FIREBASE =====
async function initializeFirebase() {
    try {
        console.log(`%c${APP_NAME} v${APP_VERSION}`, 'color: #4f46e5; font-size: 16px; font-weight: bold;');
        console.log('%cSistema inicializando...', 'color: #6b7280;');
        
        const response = await fetch('/__/firebase/init.json');
        if (!response.ok) throw new Error('Falha ao carregar configuração do Firebase');
        
        const firebaseConfig = await response.json();
        appId = firebaseConfig.projectId;
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        provider = new GoogleAuthProvider();

        console.log('%c✓ Firebase inicializado com sucesso', 'color: #10b981;');
        initializeAppLogic();
    } catch (error) {
        console.error("Falha ao inicializar o Firebase:", error);
        showNotification('Erro ao inicializar Firebase', 'error');
    }
}

// ===== LÓGICA PRINCIPAL DA APLICAÇÃO =====
function initializeAppLogic() {
    let currentUserId = null;
    let currentUserRole = null;
    let profileChart = null;
    let monthlyAvailabilityChart = null;
    let isGoogleChartsLoaded = false;

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

    // ✅ CORREÇÃO: Login com Popup (estava faltando!)
    loginBtn?.addEventListener('click', async () => {
        console.log('🔵 Botão de login clicado');
        try {
            console.log('🔄 Abrindo popup de login...');
            await signInWithPopup(auth, provider);
            console.log('✅ Login concluído com sucesso');
        } catch (error) {
            console.error("❌ Erro no login:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                showNotification('Erro ao fazer login: ' + error.message, 'error');
            }
        }
    });

    // Logout
    logoutBtn?.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showNotification('Logout realizado com sucesso', 'info');
        } catch (error) {
            console.error("Erro no logout:", error);
            showNotification('Erro ao fazer logout', 'error');
        }
    });

    // Listener de mudança de autenticação
    onAuthStateChanged(auth, async (user) => {
        console.log('🔄 Estado de autenticação mudou:', user ? 'Logado' : 'Não logado');
        
        if (user) {
            console.log('✅ Usuário autenticado:', user.email);
            currentUserId = user.uid;
            
            // Obter role do usuário
            currentUserRole = await getUserRole(user);
            console.log('👤 Role do usuário:', currentUserRole);
            
            // Atualizar UI do usuário
            document.getElementById('user-name').textContent = user.displayName || user.email;
            document.getElementById('user-photo').src = user.photoURL || 'https://via.placeholder.com/40';
            document.getElementById('user-role').textContent = currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1);
            
            // Mostrar app, esconder login
            loginView.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            updateUIBasedOnRole(currentUserRole);
            
            // Configurar listeners do Firestore
            setupFirestoreListeners();
            
            showNotification('Bem-vindo, ' + user.displayName + '!', 'success');
        } else {
            console.log('❌ Usuário não autenticado');
            currentUserId = null;
            currentUserRole = null;
            
            // Mostrar login, esconder app
            loginView.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    });

    // Função para configurar listeners do Firestore
    function setupFirestoreListeners() {
    console.log('🔄 Configurando listeners do Firestore...');
    
    // Listener para Profissionais
    onSnapshot(collection(db, getCollectionPath('profissionais')), (snapshot) => {
        appState.profissionais = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('📊 Profissionais atualizados:', appState.profissionais.length);
        if (typeof renderProfissionais === 'function') renderProfissionais();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateDashboardFilters === 'function') populateDashboardFilters();
        if (typeof populateAvailabilityChartFilters === 'function') populateAvailabilityChartFilters();
        if (typeof populateProfileFilters === 'function') populateProfileFilters();
        if (typeof populateTimelineFilters === 'function') populateTimelineFilters();
    });

    // Listener para Projetos
    onSnapshot(collection(db, getCollectionPath('projetos')), (snapshot) => {
        appState.projetos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('📊 Projetos atualizados:', appState.projetos.length);
        if (typeof renderProjetos === 'function') renderProjetos();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateDashboardFilters === 'function') populateDashboardFilters();
        if (typeof populateTimelineFilters === 'function') populateTimelineFilters();
    });

    // Listener para Alocações
    onSnapshot(collection(db, getCollectionPath('alocacoes')), (snapshot) => {
        appState.alocacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('📊 Alocações atualizadas:', appState.alocacoes.length);
        if (typeof renderAlocacoes === 'function') renderAlocacoes();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof populateAlocacoesFilters === 'function') populateAlocacoesFilters();
        if (typeof populateTimelineFilters === 'function') populateTimelineFilters();
        
        // ✅ REDESENHAR GRÁFICO MENSAL APÓS CARREGAR ALOCAÇÕES
        setTimeout(() => {
            if (typeof updateMonthlyAvailabilityChart === 'function') {
                console.log('🔄 Redesenhando gráfico mensal após carregar dados...');
                updateMonthlyAvailabilityChart();
            }
        }, 800);
    });

    // Listener para Usuários (apenas admin)
    if (currentUserRole === 'admin') {
        onSnapshot(collection(db, getCollectionPath('users')), (snapshot) => {
            appState.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('📊 Usuários atualizados:', appState.users.length);
            if (typeof renderUsersTable === 'function') renderUsersTable();
        });
    }
    
    console.log('✅ Listeners do Firestore configurados');
}

    // Verificar role do usuário
    async function getUserRole(user) {
        try {
            const userDocRef = doc(db, getCollectionPath('users'), user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                return userDoc.data().role || 'viewer';
            } else {
                const newUserData = {
                    email: user.email,
                    name: user.displayName,
                    role: 'viewer',
                    active: true,
                    createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, newUserData);
                return 'viewer';
            }
        } catch (error) {
            console.error('Erro ao verificar role:', error);
            return 'viewer';
        }
    }

    // Atualizar UI baseado no role
    function updateUIBasedOnRole(role) {
        if (!role) return;
        
        const isViewer = role === 'viewer';
        const isAdmin = role === 'admin';
        
        document.querySelectorAll('.edit-btn, .delete-btn, .add-btn').forEach(btn => {
            btn.style.display = isViewer ? 'none' : '';
        });
        
        const mainActions = document.getElementById('main-actions');
        if (mainActions) {
            mainActions.style.display = isViewer ? 'none' : 'block';
        }
        
        const manageUsersLink = document.getElementById('manage-users-link');
        if (manageUsersLink) {
            manageUsersLink.classList.toggle('hidden', !isAdmin);
        }
        
        const userRoleElement = document.getElementById('user-role');
        if (userRoleElement) {
            userRoleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }
    }

    // Função para formatar data
    function formatDate(dateString) {
        if (!dateString || dateString.length < 10) return 'N/A';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Obter caminho da coleção
    function getCollectionPath(collectionName) {
        if (!appId) throw new Error('Firebase não inicializado');
        return `artifacts/${appId}/public/data/${collectionName}`;
    }

    function getStatusColor(status) {
        const colors = {
            'Não Iniciado': 'bg-gray-100 text-gray-800',
            'Em Andamento': 'bg-blue-100 text-blue-800',
            'Concluído': 'bg-green-100 text-green-800',
            'Atrasado': 'bg-red-100 text-red-800',
            'Em Pausa': 'bg-yellow-100 text-yellow-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

// ===== FIM DA PARTE 1 =====
// ===== PARTE 2 - NAVEGAÇÃO, MODAIS E RENDERIZAÇÃO =====

    // ===== NAVEGAÇÃO E VIEWS =====
    const views = document.querySelectorAll('.view');
    const navLinks = document.querySelectorAll('.nav-link');
    const viewTitle = document.getElementById('view-title');
    const mainActionsContainer = document.getElementById('main-actions');
    
    const addIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    
    const createButton = (id, text, icon) => `<button id="${id}" class="add-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center">${icon}${text}</button>`;

    const viewConfig = {
        dashboard: { title: 'Dashboard', actions: '' },
        'buscar-disponibilidade': { title: 'Buscar Disponibilidade', actions: '' },
        profissionais: { title: 'Profissionais', actions: createButton('add-profissional-btn', 'Adicionar Profissional', addIcon) },
        projetos: { title: 'Projetos', actions: createButton('add-projeto-btn', 'Adicionar Projeto', addIcon) },
        alocacoes: { title: 'Alocações', actions: createButton('add-alocacao-btn', 'Adicionar Alocação', addIcon) },
        timeline: { title: 'Timeline de Capacity', actions: '' },
        'gerenciar-usuarios': { title: 'Gerenciar Usuários', actions: '' },
    };

    function switchView(viewId) {
        views.forEach(view => view.classList.remove('active'));
        document.getElementById(viewId)?.classList.add('active');

        navLinks.forEach(link => link.classList.remove('bg-gray-900'));
        document.querySelector(`.nav-link[data-view="${viewId}"]`)?.classList.add('bg-gray-900');
        
        viewTitle.textContent = viewConfig[viewId]?.title || 'Página não encontrada';
        mainActionsContainer.innerHTML = viewConfig[viewId]?.actions || '';
        
        document.getElementById('add-profissional-btn')?.addEventListener('click', () => openProfissionalModal());
        document.getElementById('add-projeto-btn')?.addEventListener('click', () => openProjetoModal());
        document.getElementById('add-alocacao-btn')?.addEventListener('click', () => openAlocacaoModal());

        if (viewId === 'timeline' && isGoogleChartsLoaded) {
            setTimeout(() => {
                drawTimelineChart();
            }, 100);
        }
        
        updateUIBasedOnRole(currentUserRole);
    }

    navLinks.forEach(link => link.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(e.currentTarget.dataset.view);
    }));

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
        });
    });

    // Collapsible headers
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('svg');
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon?.classList.add('rotate-180');
            } else {
                content.classList.add('hidden');
                icon?.classList.remove('rotate-180');
            }
        });
    });

    // ===== FERIADOS NACIONAIS DO BRASIL =====
    function getFeriadosNacionais(ano) {
        const feriadosFixos = [
            `${ano}-01-01`, `${ano}-04-21`, `${ano}-05-01`, `${ano}-09-07`, 
            `${ano}-10-12`, `${ano}-11-02`, `${ano}-11-15`, `${ano}-11-20`, `${ano}-12-25`
        ];
        
        const a = ano % 19;
        const b = Math.floor(ano / 100);
        const c = ano % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mes = Math.floor((h + l - 7 * m + 114) / 31);
        const dia = ((h + l - 7 * m + 114) % 31) + 1;
        
        const pascoa = new Date(ano, mes - 1, dia);
        const sextaSanta = new Date(pascoa);
        sextaSanta.setDate(pascoa.getDate() - 2);
        const carnaval = new Date(pascoa);
        carnaval.setDate(pascoa.getDate() - 47);
        const corpus = new Date(pascoa);
        corpus.setDate(pascoa.getDate() + 60);
        
        const feriadosMoveis = [
            sextaSanta.toISOString().split('T')[0],
            carnaval.toISOString().split('T')[0],
            corpus.toISOString().split('T')[0]
        ];
        
        return [...feriadosFixos, ...feriadosMoveis];
    }

    function calcularDiasUteis(dataInicio, dataFim) {
        const inicio = new Date(dataInicio + 'T00:00:00');
        const fim = new Date(dataFim + 'T00:00:00');
        
        const anos = new Set();
        for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
            anos.add(d.getFullYear());
        }
        
        const todosFeriados = new Set();
        anos.forEach(ano => {
            getFeriadosNacionais(ano).forEach(feriado => todosFeriados.add(feriado));
        });
        
        let diasUteis = 0;
        for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
            const diaSemana = d.getDay();
            const dataStr = d.toISOString().split('T')[0];
            
            if (diaSemana !== 0 && diaSemana !== 6 && !todosFeriados.has(dataStr)) {
                diasUteis++;
            }
        }
        
        return diasUteis;
    }

    // ===== MODAIS =====
    const modals = {
        profissional: document.getElementById('profissional-modal'),
        projeto: document.getElementById('projeto-modal'),
        alocacao: document.getElementById('alocacao-modal'),
    };
    
    const forms = {
        profissional: document.getElementById('profissional-form'),
        projeto: document.getElementById('projeto-form'),
        alocacao: document.getElementById('alocacao-form'),
    };

    function populateAlocacaoDropdowns() {
        const profSelect = document.getElementById('alocacao-profissional');
        const projSelect = document.getElementById('alocacao-projeto');
        if (!profSelect || !projSelect) return;
        
        profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
        projSelect.innerHTML = '<option value="">Selecione um projeto</option>';
        
        const activeProfessionals = appState.profissionais.filter(p => p.ativo !== 'Não');
        activeProfessionals.forEach(p => profSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
        appState.projetos.forEach(p => projSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
    }

    // Cálculo de Horas Estimadas
    function calcularHorasEstimadas() {
        const dataInicio = document.getElementById('alocacao-inicio')?.value;
        const dataFim = document.getElementById('alocacao-fim')?.value;
        const percentual = parseInt(document.getElementById('alocacao-percentual')?.value) || 0;
        const horasEstimadasInput = document.getElementById('horas-estimadas-profissional');
        
        if (dataInicio && dataFim && percentual > 0 && horasEstimadasInput) {
            const diasUteis = calcularDiasUteis(dataInicio, dataFim);
            const horasEstimadas = Math.round(diasUteis * (percentual / 100) * 8);
            horasEstimadasInput.value = horasEstimadas;
        } else if (horasEstimadasInput) {
            horasEstimadasInput.value = '';
        }
    }

    document.getElementById('alocacao-inicio')?.addEventListener('change', calcularHorasEstimadas);
    document.getElementById('alocacao-fim')?.addEventListener('change', calcularHorasEstimadas);
    document.getElementById('alocacao-percentual')?.addEventListener('input', calcularHorasEstimadas);

    // Função para verificar disponibilidade
    function checkProfissionalDisponibilidade(profissionalId, dataInicio, dataFim, percentualNovo, alocacaoIdAtual = null) {
        if (!profissionalId || !dataInicio || !dataFim) {
            return { disponivel: true, conflitos: [] };
        }

        const inicio = new Date(dataInicio + 'T00:00:00');
        const fim = new Date(dataFim + 'T00:00:00');

        const alocacoesConflitantes = appState.alocacoes.filter(a => {
            if (alocacaoIdAtual && a.id === alocacaoIdAtual) return false;
            if (a.profissionalId !== profissionalId) return false;

            const alocInicio = new Date(a.dataInicio + 'T00:00:00');
            const alocFim = new Date(a.dataFim + 'T00:00:00');

            return alocInicio <= fim && alocFim >= inicio;
        });

        if (alocacoesConflitantes.length === 0) {
            return { disponivel: true, conflitos: [], percentualTotal: percentualNovo };
        }

        const conflitos = alocacoesConflitantes.map(a => {
            const projeto = appState.projetos.find(p => p.id === a.projetoId);
            return {
                projeto: projeto?.nome || 'N/A',
                percentual: a.percentual,
                dataInicio: a.dataInicio,
                dataFim: a.dataFim
            };
        });

        const percentualJaAlocado = alocacoesConflitantes.reduce((sum, a) => sum + (parseInt(a.percentual) || 0), 0);
        const percentualTotal = percentualJaAlocado + (parseInt(percentualNovo) || 0);

        return {
            disponivel: percentualTotal <= 100,
            conflitos: conflitos,
            percentualJaAlocado: percentualJaAlocado,
            percentualTotal: percentualTotal
        };
    }

    // Função para mostrar modal de conflito
    function showConflictModal(profissionalNome, resultado, onConfirm, onCancel) {
        const conflitosHTML = resultado.conflitos.map(c => `
            <li class="py-2">
                <strong>${c.projeto}</strong>: ${c.percentual}% 
                (${formatDate(c.dataInicio)} - ${formatDate(c.dataFim)})
            </li>
        `).join('');

        const modalHTML = `
            <div id="conflict-modal" class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center" style="background-color: rgba(0,0,0,0.5);">
                <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                    <div class="p-6">
                        <h2 class="text-2xl font-bold text-red-600 mb-4">⚠️ Atenção: Conflito de Alocação Detectado</h2>
                        
                        <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                            <p class="text-gray-700 mb-2">
                                <strong>Profissional:</strong> ${profissionalNome}
                            </p>
                            <p class="text-gray-700 mb-4">
                                Este profissional ficará sobre-alocado se continuar!
                            </p>
                            
                            <div class="mb-3">
                                <p class="font-semibold text-gray-800">Alocações Existentes no Período:</p>
                                <ul class="mt-2 space-y-1">${conflitosHTML}</ul>
                            </div>
                            
                            <div class="flex justify-between items-center pt-3 border-t border-red-200">
                                <span class="text-gray-700">Percentual já alocado:</span>
                                <span class="font-bold text-red-600">${resultado.percentualJaAlocado}%</span>
                            </div>
                            <div class="flex justify-between items-center pt-2">
                                <span class="text-gray-700">Percentual total (com nova alocação):</span>
                                <span class="font-bold text-red-600">${resultado.percentualTotal}%</span>
                            </div>
                        </div>

                        <p class="text-sm text-gray-600 mb-4">
                            ⚠️ Tem certeza que deseja continuar com esta alocação?
                        </p>

                        <div class="flex justify-end space-x-3">
                            <button id="conflict-cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium">
                                Cancelar
                            </button>
                            <button id="conflict-confirm-btn" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">
                                Salvar Mesmo Assim
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('conflict-cancel-btn').addEventListener('click', () => {
            document.getElementById('conflict-modal').remove();
            onCancel();
        });

        document.getElementById('conflict-confirm-btn').addEventListener('click', () => {
            document.getElementById('conflict-modal').remove();
            onConfirm();
        });

        document.getElementById('conflict-modal').addEventListener('click', (e) => {
            if (e.target.id === 'conflict-modal') {
                document.getElementById('conflict-modal').remove();
                onCancel();
            }
        });
    }

    function openModal(modalName, data = null) {
        const form = forms[modalName];
        if (form) form.reset();

        const modal = modals[modalName];
        if (!modal) return;

        const modalTitle = modal.querySelector('h2');
        const idInput = modal.querySelector('input[type="hidden"]');
        if (idInput) idInput.value = '';

        document.querySelectorAll('.error-msg').forEach(msg => msg.classList.add('hidden'));
        
        const todayLine = document.querySelector('.today-line');
        if (todayLine) {
            todayLine.style.display = 'none';
        }

        if (data) {
            modalTitle.textContent = `Editar ${modalName.charAt(0).toUpperCase() + modalName.slice(1)}`;
            if (idInput) idInput.value = data.id || '';
            
            if (modalName === 'profissional') {
                document.getElementById('nome').value = data.nome || '';
                document.getElementById('perfil').value = data.perfil || '';
                document.getElementById('time').value = data.time || '';
                document.getElementById('lider').value = data.lider || '';
                document.getElementById('faturado').value = data.faturado || 'Sim';
                document.getElementById('senioridade').value = data.senioridade || '';
                document.getElementById('ativo').value = data.ativo || 'Sim';
            } else if (modalName === 'projeto') {
                document.getElementById('nome-projeto').value = data.nome || '';
                document.getElementById('cliente').value = data.cliente || '';
                document.getElementById('tipo-projeto').value = data.tipo || 'Direto';
                document.getElementById('horas-estimadas-projeto').value = data.horasEstimadasProjeto || '';
                document.getElementById('inicio-previsto').value = data.inicioPrevisto || '';
                document.getElementById('fim-previsto').value = data.fimPrevisto || '';
                document.getElementById('inicio-real').value = data.inicioReal || '';
                document.getElementById('fim-real').value = data.fimReal || '';
                document.getElementById('status-projeto').value = data.status || '';
            } else if (modalName === 'alocacao') {
                populateAlocacaoDropdowns();
                setTimeout(() => {
                    document.getElementById('alocacao-profissional').value = data.profissionalId || '';
                    document.getElementById('alocacao-projeto').value = data.projetoId || '';
                    document.getElementById('alocacao-faturado').value = data.faturado || 'Sim';
                    document.getElementById('alocacao-percentual').value = data.percentual || '';
                    document.getElementById('horas-estimadas-profissional').value = data.horasEstimadas || '';
                    document.getElementById('horas-realizadas-profissional').value = data.horasRealizadas || '';
                    document.getElementById('alocacao-inicio').value = data.dataInicio || '';
                    document.getElementById('alocacao-fim').value = data.dataFim || '';
                }, 100);
            }
        } else {
            modalTitle.textContent = `Adicionar ${modalName.charAt(0).toUpperCase() + modalName.slice(1)}`;
            if (modalName === 'alocacao') populateAlocacaoDropdowns();
        }
        
        modal.classList.remove('hidden');
    }

    const openProfissionalModal = (data) => openModal('profissional', data);
    const openProjetoModal = (data) => openModal('projeto', data);
    const openAlocacaoModal = (data) => {
        openedFromTimeline = false;
        openModal('alocacao', data);
    };

    function closeModal() {
        Object.values(modals).forEach(modal => modal?.classList.add('hidden'));
        
        const todayLine = document.querySelector('.today-line');
        if (todayLine) {
            todayLine.style.display = 'block';
        }
        
        if (openedFromTimeline) {
            openedFromTimeline = false;
            switchView('timeline');
        }
    }

    document.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', closeModal));
    Object.values(modals).forEach(modal => modal?.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    }));

    // ===== HANDLERS DOS FORMULÁRIOS =====
    
    // Form: Profissional
    forms.profissional?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('profissional-id').value;
        const data = {
            nome: document.getElementById('nome').value,
            perfil: document.getElementById('perfil').value,
            time: document.getElementById('time').value,
            lider: document.getElementById('lider').value,
            faturado: document.getElementById('faturado').value,
            senioridade: document.getElementById('senioridade').value,
            ativo: document.getElementById('ativo').value
        };

        try {
            if (id) {
                await setDoc(doc(db, getCollectionPath('profissionais'), id), data);
                showNotification('Profissional atualizado com sucesso!', 'success');
            } else {
                await addDoc(collection(db, getCollectionPath('profissionais')), data);
                showNotification('Profissional adicionado com sucesso!', 'success');
            }
            closeModal();
        } catch (error) {
            console.error('Erro ao salvar profissional:', error);
            showNotification('Erro ao salvar profissional', 'error');
        }
    });

    // Form: Projeto
    forms.projeto?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('projeto-id').value;
        const data = {
            nome: document.getElementById('nome-projeto').value,
            cliente: document.getElementById('cliente').value,
            tipo: document.getElementById('tipo-projeto').value,
            horasEstimadasProjeto: parseInt(document.getElementById('horas-estimadas-projeto').value) || 0,
            inicioPrevisto: document.getElementById('inicio-previsto').value,
            fimPrevisto: document.getElementById('fim-previsto').value,
            inicioReal: document.getElementById('inicio-real').value || null,
            fimReal: document.getElementById('fim-real').value || null,
            status: document.getElementById('status-projeto').value
        };

        try {
            if (id) {
                await setDoc(doc(db, getCollectionPath('projetos'), id), data);
                showNotification('Projeto atualizado com sucesso!', 'success');
            } else {
                await addDoc(collection(db, getCollectionPath('projetos')), data);
                showNotification('Projeto adicionado com sucesso!', 'success');
            }
            closeModal();
        } catch (error) {
            console.error('Erro ao salvar projeto:', error);
            showNotification('Erro ao salvar projeto', 'error');
        }
    });

    // Form: Alocação
    // Form: Alocação (VERSÃO CORRIGIDA)
forms.alocacao?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('alocacao-id').value;
    const profissionalId = document.getElementById('alocacao-profissional').value;
    const projetoId = document.getElementById('alocacao-projeto').value;
    const dataInicio = document.getElementById('alocacao-inicio').value;
    const dataFim = document.getElementById('alocacao-fim').value;
    const percentual = parseInt(document.getElementById('alocacao-percentual').value);

    const data = {
        profissionalId,
        projetoId,
        faturado: document.getElementById('alocacao-faturado').value,
        dataInicio,
        dataFim,
        percentual,
        horasEstimadas: parseInt(document.getElementById('horas-estimadas-profissional').value) || 0,
        horasRealizadas: parseInt(document.getElementById('horas-realizadas-profissional').value) || 0
    };

    const profissional = appState.profissionais.find(p => p.id === profissionalId);
    const resultado = checkProfissionalDisponibilidade(profissionalId, dataInicio, dataFim, percentual, id);

    const saveAlocacao = async () => {
        try {
            if (id) {
                await setDoc(doc(db, getCollectionPath('alocacoes'), id), data);
                showNotification('Alocação atualizada com sucesso!', 'success');
            } else {
                await addDoc(collection(db, getCollectionPath('alocacoes')), data);
                showNotification('Alocação adicionada com sucesso!', 'success');
            }
            closeModal();
            
            // ✅ REDESENHAR TIMELINE APÓS SALVAR
            if (isGoogleChartsLoaded && document.querySelector('.view.active')?.id === 'timeline') {
                console.log('🔄 Redesenhando timeline após salvar...');
                setTimeout(() => {
                    drawTimelineChart();
                }, 500);
            }
        } catch (error) {
            console.error('Erro ao salvar alocação:', error);
            showNotification('Erro ao salvar alocação', 'error');
        }
    };

    if (!resultado.disponivel) {
        showConflictModal(profissional?.nome || 'Profissional', resultado, saveAlocacao, () => {});
    } else {
        await saveAlocacao();
    }
});

    // ===== FUNÇÕES DE RENDERIZAÇÃO (ESTAVAM FALTANDO!) =====
    
    function renderProfissionais() {
        const tbody = document.getElementById('profissionais-table-body');
        if (!tbody) return;

        const filterNome = document.getElementById('profissionais-filter-nome')?.value.toLowerCase() || '';
        const filterPerfil = document.getElementById('profissionais-filter-perfil')?.value.toLowerCase() || '';

        let filtered = appState.profissionais;
        if (filterNome) filtered = filtered.filter(p => p.nome.toLowerCase().includes(filterNome));
        if (filterPerfil) filtered = filtered.filter(p => p.perfil.toLowerCase().includes(filterPerfil));

        const rows = filtered.map(prof => `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${prof.nome}</td>
                <td class="px-6 py-4">${prof.perfil}</td>
                <td class="px-6 py-4">${prof.time}</td>
                <td class="px-6 py-4">${prof.lider}</td>
                <td class="px-6 py-4">${prof.faturado}</td>
                <td class="px-6 py-4">${prof.senioridade || 'N/A'}</td>
                <td class="px-6 py-4">${prof.ativo}</td>
                <td class="px-6 py-4">
                    <button onclick="window.editProfissional('${prof.id}')" class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                    <button onclick="window.deleteProfissional('${prof.id}')" class="delete-btn text-red-600 hover:text-red-900">Excluir</button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = rows || '<tr><td colspan="8" class="text-center p-4">Nenhum profissional encontrado.</td></tr>';
    }

    function renderProjetos() {
        const tbody = document.getElementById('projetos-table-body');
        if (!tbody) return;

        const rows = appState.projetos.map(proj => `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${proj.nome}</td>
                <td class="px-6 py-4">${proj.cliente || 'N/A'}</td>
                <td class="px-6 py-4">${proj.tipo}</td>
                <td class="px-6 py-4">${formatDate(proj.inicioPrevisto)}</td>
                <td class="px-6 py-4">${formatDate(proj.fimPrevisto)}</td>
                <td class="px-6 py-4">${proj.horasEstimadasProjeto || 0}h</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proj.status)}">
                        ${proj.status}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <button onclick="window.editProjeto('${proj.id}')" class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                    <button onclick="window.deleteProjeto('${proj.id}')" class="delete-btn text-red-600 hover:text-red-900">Excluir</button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = rows || '<tr><td colspan="8" class="text-center p-4">Nenhum projeto cadastrado.</td></tr>';
    }

    function renderAlocacoes() {
        const tbody = document.getElementById('alocacoes-table-body');
        if (!tbody) return;

        const filterProf = document.getElementById('alocacoes-filter-profissional')?.value || '';
        const filterProj = document.getElementById('alocacoes-filter-projeto')?.value || '';

        let filtered = appState.alocacoes;
        if (filterProf) filtered = filtered.filter(a => a.profissionalId === filterProf);
        if (filterProj) filtered = filtered.filter(a => a.projetoId === filterProj);

        const rows = filtered.map(aloc => {
            const prof = appState.profissionais.find(p => p.id === aloc.profissionalId);
            const proj = appState.projetos.find(p => p.id === aloc.projetoId);

            return `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 font-medium text-gray-900">${prof?.nome || 'N/A'}</td>
                    <td class="px-6 py-4">${proj?.nome || 'N/A'}</td>
                    <td class="px-6 py-4">${formatDate(aloc.dataInicio)} - ${formatDate(aloc.dataFim)}</td>
                    <td class="px-6 py-4">${aloc.percentual}%</td>
                    <td class="px-6 py-4">${aloc.horasEstimadas || 0}h</td>
                    <td class="px-6 py-4">${aloc.horasRealizadas || 0}h</td>
                    <td class="px-6 py-4">${aloc.faturado}</td>
                    <td class="px-6 py-4">
                        <button onclick="window.editAlocacao('${aloc.id}')" class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                        <button onclick="window.deleteAlocacao('${aloc.id}')" class="delete-btn text-red-600 hover:text-red-900">Excluir</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows || '<tr><td colspan="8" class="text-center p-4">Nenhuma alocação encontrada.</td></tr>';
    }

   function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const rows = appState.users.map(user => {
        const isActive = user.active !== false; // Default true se não definido
        const statusBadge = isActive 
            ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>'
            : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inativo</span>';

        return `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${user.name || user.email}</td>
                <td class="px-6 py-4">${user.email}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        ${(user.role || 'viewer').charAt(0).toUpperCase() + (user.role || 'viewer').slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 space-x-2">
                    <button onclick="window.changeUserRole('${user.id}')" class="text-indigo-600 hover:text-indigo-900 font-medium">
                        Alterar Papel
                    </button>
                    <button onclick="window.toggleUserStatus('${user.id}', ${!isActive})" class="text-${isActive ? 'orange' : 'green'}-600 hover:text-${isActive ? 'orange' : 'green'}-900 font-medium">
                        ${isActive ? 'Inativar' : 'Ativar'}
                    </button>
                    <button onclick="window.deleteUser('${user.id}')" class="text-red-600 hover:text-red-900 font-medium">
                        Excluir
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows || '<tr><td colspan="5" class="text-center p-4">Nenhum usuário cadastrado.</td></tr>';
}

    // ===== FUNÇÕES GLOBAIS PARA OS BOTÕES =====
    window.editProfissional = async (id) => {
        const prof = appState.profissionais.find(p => p.id === id);
        if (prof) openProfissionalModal(prof);
    };

    window.deleteProfissional = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este profissional?')) return;
        try {
            await deleteDoc(doc(db, getCollectionPath('profissionais'), id));
            showNotification('Profissional excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showNotification('Erro ao excluir profissional', 'error');
        }
    };

    window.editProjeto = async (id) => {
        const proj = appState.projetos.find(p => p.id === id);
        if (proj) openProjetoModal(proj);
    };

    window.deleteProjeto = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
        try {
            await deleteDoc(doc(db, getCollectionPath('projetos'), id));
            showNotification('Projeto excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showNotification('Erro ao excluir projeto', 'error');
        }
    };

    window.editAlocacao = async (id) => {
        const aloc = appState.alocacoes.find(a => a.id === id);
        if (aloc) openAlocacaoModal(aloc);
    };

    window.deleteAlocacao = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta alocação?')) return;
        try {
            await deleteDoc(doc(db, getCollectionPath('alocacoes'), id));
            showNotification('Alocação excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showNotification('Erro ao excluir alocação', 'error');
        }
    };

    window.changeUserRole = async (userId) => {
        const user = appState.users.find(u => u.id === userId);
        if (!user) return;

        const newRole = prompt(`Alterar papel de ${user.name}:\n\nDigite 'admin', 'editor' ou 'viewer':`, user.role);
        if (!newRole || !['admin', 'editor', 'viewer'].includes(newRole)) {
            showNotification('Papel inválido!', 'warning');
            return;
        }

        try {
            await setDoc(doc(db, getCollectionPath('users'), userId), { ...user, role: newRole });
            showNotification('Papel alterado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao alterar papel:', error);
            showNotification('Erro ao alterar papel', 'error');
        }
    };
	// ✅ Função para alternar status do usuário (Ativar/Inativar)
	window.toggleUserStatus = async (userId, newStatus) => {
		const user = appState.users.find(u => u.id === userId);
		if (!user) return;

		const action = newStatus ? 'ativar' : 'inativar';
		
		if (!confirm(`Tem certeza que deseja ${action} o usuário ${user.name || user.email}?`)) {
			return;
		}

		try {
			await setDoc(doc(db, getCollectionPath('users'), userId), {
				...user,
				active: newStatus
			});
			showNotification(`Usuário ${newStatus ? 'ativado' : 'inativado'} com sucesso!`, 'success');
		} catch (error) {
			console.error('Erro ao alterar status:', error);
			showNotification('Erro ao alterar status do usuário', 'error');
		}
	};

// ✅ Função para excluir usuário
// ✅ Versão alternativa se currentUserId não estiver acessível
	window.deleteUser = async (userId) => {
		const user = appState.users.find(u => u.id === userId);
		if (!user) return;

		// Prevenir exclusão do próprio usuário usando auth.currentUser
		if (userId === auth.currentUser?.uid) {
			showNotification('Você não pode excluir seu próprio usuário!', 'warning');
			return;
		}

		const confirmText = `ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente o usuário ${user.name || user.email}?\n\nEsta ação não pode ser desfeita!\n\nDigite "EXCLUIR" para confirmar:`;
		
		const confirmation = prompt(confirmText);
		
		if (confirmation !== 'EXCLUIR') {
			showNotification('Exclusão cancelada', 'info');
			return;
		}

		try {
			await deleteDoc(doc(db, getCollectionPath('users'), userId));
			showNotification('Usuário excluído com sucesso!', 'success');
		} catch (error) {
			console.error('Erro ao excluir usuário:', error);
			showNotification('Erro ao excluir usuário', 'error');
		}
	};

    // Event listeners de filtros
    document.getElementById('profissionais-filter-nome')?.addEventListener('input', debounce(renderProfissionais, 300));
    document.getElementById('profissionais-filter-perfil')?.addEventListener('input', debounce(renderProfissionais, 300));
    document.getElementById('alocacoes-filter-profissional')?.addEventListener('change', renderAlocacoes);
    document.getElementById('alocacoes-filter-projeto')?.addEventListener('change', renderAlocacoes);

    // ===== POPULADORES DE FILTROS =====
    
    function populateDashboardFilters() {
        const times = [...new Set(appState.profissionais.map(p => p.time))].sort();
        const lideres = [...new Set(appState.profissionais.map(p => p.lider))].sort();
        
        ['dashboard-filter-time', 'project-dashboard-filter-time'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">Todos os Times</option>' + 
                    times.map(t => `<option value="${t}">${t}</option>`).join('');
            }
        });

        ['dashboard-filter-lider', 'project-dashboard-filter-lider'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">Todos Líderes</option>' + 
                    lideres.map(l => `<option value="${l}">${l}</option>`).join('');
            }
        });

        const projetoSelect = document.getElementById('dashboard-filter-projeto');
        if (projetoSelect) {
            projetoSelect.innerHTML = '<option value="">Todos Projetos</option>' + 
                appState.projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        const statusContainer = document.getElementById('project-dashboard-filter-status');
        if (statusContainer) {
            const statuses = ['Não Iniciado', 'Em Andamento', 'Concluído', 'Atrasado', 'Em Pausa'];
            statusContainer.innerHTML = statuses.map(s => `
                <label class="inline-flex items-center">
                    <input type="checkbox" class="project-status-filter form-checkbox text-indigo-600" value="${s}">
                    <span class="ml-2 text-sm">${s}</span>
                </label>
            `).join('');

            document.querySelectorAll('.project-status-filter').forEach(cb => {
                cb.addEventListener('change', () => {
                    if (typeof updateDashboard === 'function') updateDashboard();
                });
            });
        }
    }

    function populateAlocacoesFilters() {
        const profSelect = document.getElementById('alocacoes-filter-profissional');
        const projSelect = document.getElementById('alocacoes-filter-projeto');

        if (profSelect) {
            profSelect.innerHTML = '<option value="">Todos Profissionais</option>' +
                appState.profissionais.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        if (projSelect) {
            projSelect.innerHTML = '<option value="">Todos Projetos</option>' +
                appState.projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }
    }

    function populateAvailabilityChartFilters() {
        const profSelect = document.getElementById('availability-chart-prof-filter');
        const perfilSelect = document.getElementById('availability-chart-perfil-filter');

        if (profSelect) {
            profSelect.innerHTML = '<option value="">Todos</option>' +
                appState.profissionais.filter(p => p.ativo !== 'Não').map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        if (perfilSelect) {
            const perfis = [...new Set(appState.profissionais.map(p => p.perfil))].sort();
            perfilSelect.innerHTML = '<option value="">Todos Perfis</option>' +
                perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
        }
    }

    function populateProfileFilters() {
        const profileSelect = document.getElementById('availability-filter-profile');
        if (profileSelect) {
            const perfis = [...new Set(appState.profissionais.map(p => p.perfil))].sort();
            profileSelect.innerHTML = '<option value="">Todos os Perfis</option>' +
                perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
        }
    }

    function populateTimelineFilters() {
        const profSelect = document.getElementById('timeline-filter-profissional');
        const projSelect = document.getElementById('timeline-filter-projeto');
        const perfilSelect = document.getElementById('timeline-filter-perfil');

        if (profSelect) {
            profSelect.innerHTML = '<option value="">Todos</option>' +
                appState.profissionais.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        if (projSelect) {
            projSelect.innerHTML = '<option value="">Todos</option>' +
                appState.projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        if (perfilSelect) {
            const perfis = [...new Set(appState.profissionais.map(p => p.perfil))].sort();
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
        const totalProfissionais = appState.profissionais.filter(p => p.ativo !== 'Não').length;
        const totalProjetos = appState.projetos.length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alocacoesAtivas = appState.alocacoes.filter(a => {
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
            periodoInicio = new Date();
            periodoInicio.setHours(0, 0, 0, 0);
            periodoFim = new Date(periodoInicio);
        }

        let filtered = appState.profissionais.filter(p => p.ativo !== 'Não');

        if (filterNome) filtered = filtered.filter(p => p.nome.toLowerCase().includes(filterNome));
        if (filterTime) filtered = filtered.filter(p => p.time === filterTime);
        if (filterLider) filtered = filtered.filter(p => p.lider === filterLider);

        const rows = filtered.map(prof => {
            let alocacoes = appState.alocacoes.filter(a => a.profissionalId === prof.id);

            if (filterProjeto) {
                alocacoes = alocacoes.filter(a => a.projetoId === filterProjeto);
            }

            if (temFiltroPeriodo) {
                alocacoes = alocacoes.filter(a => {
                    const alocInicio = new Date(a.dataInicio + 'T00:00:00');
                    const alocFim = new Date(a.dataFim + 'T00:00:00');
                    return alocInicio <= periodoFim && alocFim >= periodoInicio;
                });
            }

            const alocacoesNoPeriodo = alocacoes.filter(a => {
                const inicio = new Date(a.dataInicio + 'T00:00:00');
                const fim = new Date(a.dataFim + 'T00:00:00');
                return inicio <= periodoFim && fim >= periodoInicio;
            });

            const percentualNoPeriodo = alocacoesNoPeriodo.reduce((sum, a) => sum + (parseInt(a.percentual) || 0), 0);
            
            const status = percentualNoPeriodo === 0 ? 'Disponível' : 
                          percentualNoPeriodo >= 100 ? 'Totalmente Alocado' : 
                          'Parcialmente Alocado';
            const statusColor = percentualNoPeriodo === 0 ? 'text-green-600' : 
                               percentualNoPeriodo >= 100 ? 'text-blue-600' : 
                               'text-yellow-600';

            const projetos = alocacoes.map(a => {
                const proj = appState.projetos.find(p => p.id === a.projetoId);
                return proj?.nome || 'N/A';
            });
            const projetosUnicos = [...new Set(projetos)].join(', ') || 'Nenhum';

            let proximaDisponibilidade;
            
            // ✅ Pegar TODAS as alocações do profissional para calcular disponibilidade corretamente
            const todasAlocacoesProfissional = appState.alocacoes.filter(a => a.profissionalId === prof.id);
            
            if (percentualNoPeriodo === 0) {
                // Verificar se há alocações futuras
                const alocacoesFuturas = todasAlocacoesProfissional
                    .filter(a => new Date(a.dataInicio + 'T00:00:00') > periodoFim)
                    .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
                
                if (alocacoesFuturas.length > 0) {
                    const proximaAlocacao = alocacoesFuturas[0];
                    proximaDisponibilidade = `Disponível até ${formatDate(proximaAlocacao.dataInicio)}`;
                } else {
                    proximaDisponibilidade = 'Disponível agora';
                }
            } else if (percentualNoPeriodo >= 100) {
                // ✅ Pegar a última alocação considerando TODAS as alocações do profissional
                const todasAlocacoesOrdenadas = todasAlocacoesProfissional
                    .sort((a, b) => new Date(b.dataFim) - new Date(a.dataFim));
                
                if (todasAlocacoesOrdenadas.length > 0) {
                    const ultimaAlocacao = todasAlocacoesOrdenadas[0];
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

            return `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 font-medium text-gray-900">${prof.nome}</td>
                    <td class="px-6 py-4">${prof.perfil}</td>
                    <td class="px-6 py-4">${prof.time}</td>
                    <td class="px-6 py-4">${projetosUnicos}</td>
                    <td class="px-6 py-4 ${statusColor} font-semibold">${status}</td>
                    <td class="px-6 py-4">${percentualNoPeriodo}%</td>
                    <td class="px-6 py-4">${proximaDisponibilidade}</td>
                </tr>
            `;
        });

        tbody.innerHTML = rows.length > 0 ? rows.join('') : '<tr><td colspan="7" class="text-center p-4">Nenhum profissional encontrado.</td></tr>';
    }

    function updateProjetosTable() {
        const tbody = document.getElementById('dashboard-projetos-table');
        if (!tbody) return;

        const filterNome = document.getElementById('project-dashboard-filter-nome')?.value.toLowerCase() || '';
        const filterTime = document.getElementById('project-dashboard-filter-time')?.value || '';
        const filterLider = document.getElementById('project-dashboard-filter-lider')?.value || '';
        
        const selectedStatuses = Array.from(document.querySelectorAll('.project-status-filter:checked')).map(cb => cb.value);

        let filtered = appState.projetos;

        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(p => selectedStatuses.includes(p.status));
        }

        const rows = filtered.map(proj => {
            const alocacoes = appState.alocacoes.filter(a => a.projetoId === proj.id);
            
            const profissionaisAlocados = alocacoes.map(a => {
                const prof = appState.profissionais.find(p => p.id === a.profissionalId);
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

        const rows = appState.projetos.map(proj => {
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
        });

        tbody.innerHTML = rows.length > 0 ? rows.join('') : '<tr><td colspan="7" class="text-center p-4">Nenhum projeto cadastrado.</td></tr>';
    }

    function updateEffortTable() {
        const tbody = document.getElementById('dashboard-effort-table');
        if (!tbody) return;

        const rows = appState.projetos.map(proj => {
            const alocacoes = appState.alocacoes.filter(a => a.projetoId === proj.id);
            
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

    // ===== GRÁFICOS =====
    function updateProfileChart() {
        const canvas = document.getElementById('profile-distribution-chart');
        if (!canvas) return;

        const profiles = {};
        appState.profissionais.filter(p => p.ativo !== 'Não').forEach(p => {
            profiles[p.perfil] = (profiles[p.perfil] || 0) + 1;
        });

        const labels = Object.keys(profiles);
        const data = Object.values(profiles);
        const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

        if (profileChart) profileChart.destroy();

        profileChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 30,
                        bottom: 30,
						left: 10,
						right: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'center',
                        labels: { 
                            padding: 12,
                            font: { size: 11 },
                            boxWidth: 12,
                            boxHeight: 12,
                            usePointStyle: true,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const meta = chart.getDatasetMeta(0);
                                        const style = meta.controller.getStyle(i);
                                        return {
                                            text: label,
                                            fillStyle: style.backgroundColor,
                                            strokeStyle: style.borderColor,
                                            lineWidth: style.borderWidth,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        },
                        maxWidth: 1000,
                        display: true
                    },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 14 },
                        formatter: (value) => value,
						anchor: 'center',
						align: 'center' 
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    function updateMonthlyAvailabilityChart() {
    const canvas = document.getElementById('monthly-availability-chart');
    if (!canvas) return;

    const monthSelector = document.getElementById('availability-month-selector');
    const profFilter = document.getElementById('availability-chart-prof-filter')?.value || '';
    const perfilFilter = document.getElementById('availability-chart-perfil-filter')?.value || '';

    if (!monthSelector) return;

    if (!monthSelector.value) {
        const today = new Date();
        monthSelector.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }

    const [year, month] = monthSelector.value.split('-');
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);

    let profissionais = appState.profissionais.filter(p => p.ativo !== 'Não');
    if (profFilter) profissionais = profissionais.filter(p => p.id === profFilter);
    if (perfilFilter) profissionais = profissionais.filter(p => p.perfil === perfilFilter);

    profissionais.sort((a, b) => a.nome.localeCompare(b.nome));

    const labels = profissionais.map(p => p.nome);
    const horasAlocadas = profissionais.map(prof => {
        const alocacoes = appState.alocacoes.filter(a => {
            if (a.profissionalId !== prof.id) return false;
            const alocInicio = new Date(a.dataInicio + 'T00:00:00');
            const alocFim = new Date(a.dataFim + 'T00:00:00');
            return alocInicio <= lastDay && alocFim >= firstDay;
        });

        return alocacoes.reduce((sum, a) => {
            const alocInicio = new Date(a.dataInicio + 'T00:00:00');
            const alocFim = new Date(a.dataFim + 'T00:00:00');
            const inicio = alocInicio < firstDay ? firstDay : alocInicio;
            const fim = alocFim > lastDay ? lastDay : alocFim;
            
            const diasUteis = calcularDiasUteis(
                inicio.toISOString().split('T')[0],
                fim.toISOString().split('T')[0]
            );
            
            return sum + (diasUteis * ((parseFloat(a.percentual) || 0) / 100) * 8);
        }, 0);
    });

    if (monthlyAvailabilityChart) monthlyAvailabilityChart.destroy();

    // ✅ CÁLCULO MELHORADO DA ALTURA
    const minHeight = 400;
    const pixelsPorProfissional = 30; // ✅ Altura total do gráfico, se reduzir aumenta
    const alturaCalculada = Math.max(minHeight, profissionais.length * pixelsPorProfissional);
    
    canvas.style.height = `${alturaCalculada}px`;

    monthlyAvailabilityChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas Alocadas',
                data: horasAlocadas,
                backgroundColor: '#4f46e5',
                borderColor: '#4338ca',
                borderWidth: 1,
                barThickness: 'flex',
                maxBarThickness: 40,  // ✅ REDUZIDO de 40 para 35
                categoryPercentage: 0.8,  // ✅ ADICIONADO - Controla espaço a área de cada barra
                barPercentage: 0.6        // ✅ ADICIONADO - Controla largura da barra
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 15,    // ✅ AUMENTADO de 10 para 15
                    right: 30,
                    top: 15,     // ✅ AUMENTADO de 10 para 15
                    bottom: 15   // ✅ AUMENTADO de 10 para 15
                }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    offset: 4,
                    formatter: (value) => value > 0 ? `${Math.round(value)}h` : '',
                    font: { 
                        weight: 'bold', 
                        size: 11  // ✅ Fonte
                    },
                    color: '#1f2937'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${Math.round(context.parsed.x)}h alocadas`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { 
                        callback: (value) => `${value}h`,
                        font: { size: 10 }  // ✅ REDUZIDO de 11 para 10
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        autoSkip: false,
                        font: { 
                            size: 10  // ✅ REDUZIDO de 11 para 10
                        },
                        padding: 12,  // ✅ AUMENTADO de 8 para 12
                        color: '#374151',
                        // ✅ TRUNCAR NOMES LONGOS
                        callback: function(value, index) {
                            const label = this.getLabelForValue(value);
                            if (label.length > 30) {
                                return label.substring(0, 27) + '...';
                            }
                            return label;
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
	setTimeout(() => {
        if (monthlyAvailabilityChart) {
            monthlyAvailabilityChart.resize();
            monthlyAvailabilityChart.update('none'); // Update sem animação
        }
    }, 100);
	

    // ✅ MENSAGEM SE MUITOS PROFISSIONAIS
    const messageDiv = document.getElementById('chart-info-message');
    if (messageDiv) {
        messageDiv.remove();
    }

    if (profissionais.length > 50) {
        const infoMessage = document.createElement('div');
        infoMessage.id = 'chart-info-message';
        infoMessage.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3 text-sm text-blue-800';
        infoMessage.innerHTML = `
            <strong>💡 Dica:</strong> Há ${profissionais.length} profissionais no gráfico. 
            Use os filtros acima para visualizar grupos menores e facilitar a leitura.
        `;
        canvas.parentElement.appendChild(infoMessage);
    }
}

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

        let profissionais = appState.profissionais.filter(p => p.ativo !== 'Não');
        if (profile) profissionais = profissionais.filter(p => p.perfil === profile);

        const disponibilidades = profissionais.map(prof => {
            const alocacoes = appState.alocacoes.filter(a => {
                if (a.profissionalId !== prof.id) return false;
                const alocInicio = new Date(a.dataInicio + 'T00:00:00');
                const alocFim = new Date(a.dataFim + 'T00:00:00');
                const periodoInicio = new Date(startDate + 'T00:00:00');
                const periodoFim = new Date(endDate + 'T00:00:00');
                return alocInicio <= periodoFim && alocFim >= periodoInicio;
            });

            const percentualAlocado = alocacoes.reduce((sum, a) => sum + (parseInt(a.percentual) || 0), 0);
            const disponibilidade = 100 - percentualAlocado;

            return { prof, disponibilidade, percentualAlocado };
        }).filter(item => item.disponibilidade > 0)
          .sort((a, b) => b.disponibilidade - a.disponibilidade);

        if (!resultsDiv) return;

        if (disponibilidades.length === 0) {
            resultsDiv.innerHTML = '<p class="text-gray-600 text-center py-4">Nenhum profissional disponível no período selecionado.</p>';
        } else {
            resultsDiv.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-6 py-3">Profissional</th>
                                <th class="px-6 py-3">Perfil</th>
                                <th class="px-6 py-3">Time</th>
                                <th class="px-6 py-3">Disponibilidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${disponibilidades.map(item => `
                                <tr class="bg-white border-b hover:bg-gray-50">
                                    <td class="px-6 py-4 font-medium text-gray-900">${item.prof.nome}</td>
                                    <td class="px-6 py-4">${item.prof.perfil}</td>
                                    <td class="px-6 py-4">${item.prof.time}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${item.disponibilidade === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                            ${item.disponibilidade}% disponível
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    });

    // ===== TIMELINE =====
function drawTimelineChart() {
    const container = document.getElementById('timeline-chart-container');
    if (!container || !isGoogleChartsLoaded) return;

    const filterProf = document.getElementById('timeline-filter-profissional')?.value || '';
    const filterProj = document.getElementById('timeline-filter-projeto')?.value || '';
    const filterPerfil = document.getElementById('timeline-filter-perfil')?.value || '';

    let alocacoes = appState.alocacoes.filter(a => {
        if (filterProf && a.profissionalId !== filterProf) return false;
        if (filterProj && a.projetoId !== filterProj) return false;
        
        if (filterPerfil) {
            const prof = appState.profissionais.find(p => p.id === a.profissionalId);
            if (!prof || prof.perfil !== filterPerfil) return false;
        }
        
        return true;
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

    dataTable.addRow([
        '', // Resource vazio
        '', // Name vazio
        '', // Tooltip vazio
        today, // Start = hoje
        todayEnd, // End = hoje (mesmo dia)
        'opacity: 0' // ✅ INVISÍVEL - esta é a mágica!
    ]);

    console.log('📅 Linha invisível adicionada para forçar "hoje" no range:', today.toLocaleDateString());

    // Adicionar as alocações normais
    alocacoes.forEach(aloc => {
        const prof = appState.profissionais.find(p => p.id === aloc.profissionalId);
        const proj = appState.projetos.find(p => p.id === aloc.projetoId);
        
        if (!prof || !proj) return;

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
                openedFromTimeline = true;
                openAlocacaoModal(alocacao);
            }
        }
    });

    chart.draw(dataTable, options);

    // ✅ SEMPRE ADICIONAR LINHA "HOJE"
    console.log('⏳ Aguardando renderização do gráfico...');
    setTimeout(() => {
        addTodayLineToTimeline(container, alocacoes);
    }, 500);
}

function addTodayLineToTimeline(container, alocacoes) {
    const svg = container.querySelector('svg');
    if (!svg) {
        console.log('⏳ SVG não encontrado, tentando novamente...');
        setTimeout(() => addTodayLineToTimeline(container, alocacoes), 300);
        return;
    }

    console.log('✅ SVG encontrado, adicionando linha "Hoje"');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Remover linha antiga se existir
    const oldLine = svg.querySelector('.today-line');
    if (oldLine) {
        console.log('🗑️ Removendo linha antiga');
        oldLine.remove();
    }

    // ✅ VALIDAR DATAS ANTES DE CALCULAR
    const validDates = alocacoes
        .flatMap(a => [a.dataInicio, a.dataFim])
        .filter(d => d && d.match(/^\d{4}-\d{2}-\d{2}$/))
        .map(d => new Date(d + 'T00:00:00'))
        .filter(d => !isNaN(d.getTime()));

    if (validDates.length === 0) {
        console.warn('⚠️ Nenhuma data válida encontrada nas alocações');
        return;
    }

    // ✅ ADICIONAR "HOJE" PARA GARANTIR QUE ESTÁ NO RANGE
    validDates.push(today);

    const minDate = new Date(Math.min(...validDates));
    const maxDate = new Date(Math.max(...validDates));

    console.log('📅 Range válido (com hoje):', minDate.toLocaleDateString(), 'até', maxDate.toLocaleDateString());
    console.log('📅 Hoje:', today.toLocaleDateString());

    // ✅ REMOVER VERIFICAÇÃO DE MARGEM - SEMPRE DESENHAR
    // A linha anterior que verificava se today estava fora do range foi REMOVIDA

    // ✅ ENCONTRAR ÁREA DO GRÁFICO DE FORMA ROBUSTA
    let chartX, chartY, chartWidth, chartHeight;
    const allRects = svg.querySelectorAll('rect');
    
    let maxArea = 0;
    let chartArea = null;

    allRects.forEach((rect) => {
        const width = parseFloat(rect.getAttribute('width') || 0);
        const height = parseFloat(rect.getAttribute('height') || 0);
        const area = width * height;
        
        if (area > maxArea && width > 100 && height > 80 && !isNaN(width) && !isNaN(height)) {
            maxArea = area;
            chartArea = rect;
        }
    });

    if (!chartArea) {
        console.warn('⚠️ Não foi possível encontrar a área do gráfico');
        return;
    }

    chartX = parseFloat(chartArea.getAttribute('x'));
    chartY = parseFloat(chartArea.getAttribute('y'));
    chartWidth = parseFloat(chartArea.getAttribute('width'));
    chartHeight = parseFloat(chartArea.getAttribute('height'));

    // ✅ VALIDAR VALORES ANTES DE USAR
    if (isNaN(chartX) || isNaN(chartY) || isNaN(chartWidth) || isNaN(chartHeight)) {
        console.error('❌ Valores inválidos da área do gráfico:', {chartX, chartY, chartWidth, chartHeight});
        return;
    }

    console.log('🎯 Área do gráfico:', {chartX, chartY, chartWidth, chartHeight});

    // ✅ CALCULAR POSIÇÃO X COM VALIDAÇÃO
    const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    const daysFromStart = (today - minDate) / (1000 * 60 * 60 * 24);
    
    if (totalDays <= 0 || isNaN(totalDays)) {
        console.error('❌ Total de dias inválido:', totalDays);
        return;
    }

    const ratio = daysFromStart / totalDays;
    const xPosition = chartX + (ratio * chartWidth);

    if (isNaN(xPosition)) {
        console.error('❌ Posição X calculada é NaN:', {daysFromStart, totalDays, ratio, chartX, chartWidth});
        return;
    }

    console.log(`📍 Linha "Hoje" em: x=${Math.round(xPosition)} (${Math.round(ratio * 100)}% do range)`);

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

    // Inicialização da view inicial
    switchView('dashboard');
}

// ===== INICIALIZAÇÃO =====
initializeFirebase();

// ===== FIM DA PARTE 3 =====
// ✅ ARQUIVO app.js COMPLETO v3.1.0