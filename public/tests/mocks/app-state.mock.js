// Mock de app-state.js para testes
let _data = { profissionais: [], projetos: [], alocacoes: [] };

export function setMockData(data) {
    _data = { profissionais: [], projetos: [], alocacoes: [], ...data };
}

export function getProfissionais() { return _data.profissionais; }
export function getProjetos()      { return _data.projetos; }
export function getAlocacoes()     { return _data.alocacoes; }
export function getUsers()         { return []; }

export function setProfissionais(v) { _data.profissionais = v; }
export function setProjetos(v)      { _data.projetos = v; }
export function setAlocacoes(v)     { _data.alocacoes = v; }

export default {};
