// ===== APP STATE MODULE =====
// Módulo de gerenciamento de estado global da aplicação
// Extraído de app.js na refatoração v4.0.0

// ===== ESTADO GLOBAL =====
const appState = {
    profissionais: [],
    projetos: [],
    alocacoes: [],
    users: []
};

// ===== GETTERS =====
export function getProfissionais() {
    return appState.profissionais;
}

export function getProjetos() {
    return appState.projetos;
}

export function getAlocacoes() {
    return appState.alocacoes;
}

export function getUsers() {
    return appState.users;
}

// ===== SETTERS =====
export function setProfissionais(profissionais) {
    appState.profissionais = profissionais;
    console.log('📊 Profissionais atualizados:', appState.profissionais.length);
}

export function setProjetos(projetos) {
    appState.projetos = projetos;
    console.log('📊 Projetos atualizados:', appState.projetos.length);
}

export function setAlocacoes(alocacoes) {
    appState.alocacoes = alocacoes;
    console.log('📊 Alocações atualizadas:', appState.alocacoes.length);
}

export function setUsers(users) {
    appState.users = users;
    console.log('📊 Usuários atualizados:', appState.users.length);
}

// ===== HELPER - BUSCAR POR ID =====
export function getProfissionalById(id) {
    return appState.profissionais.find(p => p.id === id);
}

export function getProjetoById(id) {
    return appState.projetos.find(p => p.id === id);
}

export function getAlocacaoById(id) {
    return appState.alocacoes.find(a => a.id === id);
}

export function getUserById(id) {
    return appState.users.find(u => u.id === id);
}

// ===== HELPER - FILTROS =====
export function getProfissionaisAtivos() {
    return appState.profissionais.filter(p => p.ativo !== false);
}

export function getProjetosAtivos() {
    return appState.projetos.filter(p => p.status !== 'Concluído');
}

export function getAlocacoesByProfissional(profissionalId) {
    return appState.alocacoes.filter(a => a.profissionalId === profissionalId);
}

export function getAlocacoesByProjeto(projetoId) {
    return appState.alocacoes.filter(a => a.projetoId === projetoId);
}

// ===== HELPER - ESTATÍSTICAS =====
export function getTotalProfissionais() {
    return appState.profissionais.length;
}

export function getTotalProjetos() {
    return appState.projetos.length;
}

export function getTotalAlocacoes() {
    return appState.alocacoes.length;
}

export function getTotalUsers() {
    return appState.users.length;
}

// ===== HELPER - LIMPAR ESTADO =====
export function clearState() {
    appState.profissionais = [];
    appState.projetos = [];
    appState.alocacoes = [];
    appState.users = [];
    console.log('🧹 Estado global limpo');
}

// ===== EXPORT DO ESTADO COMPLETO (para casos especiais) =====
// ATENÇÃO: Use os getters acima sempre que possível!
export function getAppState() {
    return appState;
}

// ===== EXPORT DEFAULT =====
export default appState;
