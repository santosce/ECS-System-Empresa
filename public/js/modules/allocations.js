// ===== ALLOCATIONS MODULE =====
// Módulo de gestão de alocações
// Extraído de app.js na refatoração v4.0.0

import { getDb } from '../config/firebase-config.js';
import { getProfissionais, getProjetos, getAlocacoes } from '../state/app-state.js';
import { showNotification, getCollectionPath, formatDate } from '../core/utils.js';
import { setOpenedFromTimeline } from '../core/navigation.js';

// Importações Firebase
import { collection, addDoc, setDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ===== FERIADOS E DIAS ÚTEIS =====
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

// ===== POPULAR DROPDOWNS DO MODAL =====
function populateAlocacaoDropdowns() {
    const profSelect = document.getElementById('alocacao-profissional');
    const projSelect = document.getElementById('alocacao-projeto');
    if (!profSelect || !projSelect) return;

    profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
    projSelect.innerHTML = '<option value="">Selecione um projeto</option>';

    const activeProfessionals = getProfissionais()
        .filter(p => p.ativo !== 'Não')
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    activeProfessionals.forEach(p => profSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
    const projetos = getProjetos().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    projetos.forEach(p => projSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
}

// ===== CÁLCULO DE HORAS ESTIMADAS =====
function calcularHorasEstimadas() {
    const dataInicio = document.getElementById('alocacao-inicio')?.value;
    const dataFim = document.getElementById('alocacao-fim')?.value;
    const percentual = parseInt(document.getElementById('alocacao-percentual')?.value) || 0;
    const horasEstimadasInput = document.getElementById('horas-estimadas-profissional');

    if (dataInicio && dataFim && percentual > 0 && horasEstimadasInput) {
        const diasUteis = calcularDiasUteis(dataInicio, dataFim);
        horasEstimadasInput.value = Math.round(diasUteis * (percentual / 100) * 8);
    } else if (horasEstimadasInput) {
        horasEstimadasInput.value = '';
    }
}

// ===== VERIFICAR DISPONIBILIDADE DO PROFISSIONAL =====
function checkProfissionalDisponibilidade(profissionalId, dataInicio, dataFim, percentualNovo, alocacaoIdAtual = null) {
    if (!profissionalId || !dataInicio || !dataFim) {
        return { disponivel: true, conflitos: [] };
    }

    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim = new Date(dataFim + 'T00:00:00');

    const alocacoesConflitantes = getAlocacoes().filter(a => {
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
        const projeto = getProjetos().find(p => p.id === a.projetoId);
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
        conflitos,
        percentualJaAlocado,
        percentualTotal
    };
}

// ===== MODAL DE CONFLITO =====
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
                        <p class="text-gray-700 mb-2"><strong>Profissional:</strong> ${profissionalNome}</p>
                        <p class="text-gray-700 mb-4">Este profissional ficará sobre-alocado se continuar!</p>
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
                    <p class="text-sm text-gray-600 mb-4">⚠️ Tem certeza que deseja continuar com esta alocação?</p>
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

// ===== ABRIR MODAL DE ALOCAÇÃO =====
export function openAlocacaoModal(data = null) {
    setOpenedFromTimeline(false);

    const modal = document.getElementById('alocacao-modal');
    const form = document.getElementById('alocacao-form');
    if (!modal) return;

    if (form) form.reset();
    document.querySelectorAll('.error-msg').forEach(msg => msg.classList.add('hidden'));

    const todayLine = document.querySelector('.today-line');
    if (todayLine) todayLine.style.display = 'none';

    const modalTitle = modal.querySelector('h2');
    const idInput = modal.querySelector('input[type="hidden"]');
    if (idInput) idInput.value = '';

    if (data) {
        if (modalTitle) modalTitle.textContent = 'Editar Alocação';
        if (idInput) idInput.value = data.id || '';

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
    } else {
        if (modalTitle) modalTitle.textContent = 'Adicionar Alocação';
        populateAlocacaoDropdowns();
    }

    modal.classList.remove('hidden');
}

// ===== FECHAR MODAL DE ALOCAÇÃO =====
export function closeAlocacaoModal() {
    const modal = document.getElementById('alocacao-modal');
    if (modal) modal.classList.add('hidden');

    const todayLine = document.querySelector('.today-line');
    if (todayLine) todayLine.style.display = 'block';
}

// ===== RENDERIZAR TABELA DE ALOCAÇÕES =====
export function renderAlocacoes() {
    const tbody = document.getElementById('alocacoes-table-body');
    if (!tbody) return;

    const filterProf = document.getElementById('alocacoes-filter-profissional')?.value || '';
    const filterProj = document.getElementById('alocacoes-filter-projeto')?.value || '';

    let filtered = getAlocacoes();
    if (filterProf) filtered = filtered.filter(a => a.profissionalId === filterProf);
    if (filterProj) filtered = filtered.filter(a => a.projetoId === filterProj);

    filtered.sort((a, b) => {
        const profA = getProfissionais().find(p => p.id === a.profissionalId);
        const profB = getProfissionais().find(p => p.id === b.profissionalId);
        const nomeA = profA?.nome || '';
        const nomeB = profB?.nome || '';
        const comparacaoNome = nomeA.localeCompare(nomeB);
        if (comparacaoNome === 0) {
            return new Date(a.dataInicio + 'T00:00:00') - new Date(b.dataInicio + 'T00:00:00');
        }
        return comparacaoNome;
    });

    const rows = filtered.map(aloc => {
        const prof = getProfissionais().find(p => p.id === aloc.profissionalId);
        const proj = getProjetos().find(p => p.id === aloc.projetoId);
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

// ===== EXCLUIR ALOCAÇÃO =====
export async function deleteAlocacao(id) {
    if (!confirm('Tem certeza que deseja excluir esta alocação?')) return;
    try {
        await deleteDoc(doc(getDb(), getCollectionPath('alocacoes'), id));
        showNotification('Alocação excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showNotification('Erro ao excluir alocação', 'error');
    }
}

// ===== POPULAR FILTROS DE ALOCAÇÕES =====
export function populateAlocacoesFilters() {
    const profSelect = document.getElementById('alocacoes-filter-profissional');
    const projSelect = document.getElementById('alocacoes-filter-projeto');

    if (profSelect) {
        const profissionaisAtivos = getProfissionais()
            .filter(p => p.ativo !== 'Não')
            .sort((a, b) => a.nome.localeCompare(b.nome));

        profSelect.innerHTML = '<option value="">Todos Profissionais</option>' +
            profissionaisAtivos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    }

    if (projSelect) {
        const projetos = getProjetos().sort((a, b) => a.nome.localeCompare(b.nome));
        projSelect.innerHTML = '<option value="">Todos Projetos</option>' +
            projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    }
}

// ===== INICIALIZAR MÓDULO =====
export function initializeAllocationsModule() {
    console.log('📅 Módulo de Alocações inicializado');

    // Funções globais para os botões na tabela
    window.editAlocacao = async (id) => {
        const aloc = getAlocacoes().find(a => a.id === id);
        if (aloc) openAlocacaoModal(aloc);
    };

    window.deleteAlocacao = async (id) => {
        await deleteAlocacao(id);
    };

    // Listeners de cálculo automático de horas
    document.getElementById('alocacao-inicio')?.addEventListener('change', calcularHorasEstimadas);
    document.getElementById('alocacao-fim')?.addEventListener('change', calcularHorasEstimadas);
    document.getElementById('alocacao-percentual')?.addEventListener('input', calcularHorasEstimadas);

    // Listeners de filtros
    document.getElementById('alocacoes-filter-profissional')?.addEventListener('change', renderAlocacoes);
    document.getElementById('alocacoes-filter-projeto')?.addEventListener('change', renderAlocacoes);

    // Botão "Adicionar Alocação"
    document.getElementById('main-actions')?.addEventListener('click', (e) => {
        if (e.target.closest('#add-alocacao-btn')) {
            openAlocacaoModal();
        }
    });

    // Fechar modal
    const modal = document.getElementById('alocacao-modal');
    if (modal) {
        modal.querySelector('.cancel-btn')?.addEventListener('click', closeAlocacaoModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAlocacaoModal();
        });
    }

    // Form submit
    const form = document.getElementById('alocacao-form');
    form?.addEventListener('submit', async (e) => {
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

        const profissional = getProfissionais().find(p => p.id === profissionalId);
        const resultado = checkProfissionalDisponibilidade(profissionalId, dataInicio, dataFim, percentual, id);

        const salvar = async () => {
            const filtroProf = document.getElementById('alocacoes-filter-profissional')?.value || '';
            const filtroProj = document.getElementById('alocacoes-filter-projeto')?.value || '';

            try {
                if (id) {
                    await setDoc(doc(getDb(), getCollectionPath('alocacoes'), id), data);
                    showNotification('Alocação atualizada com sucesso!', 'success');
                } else {
                    await addDoc(collection(getDb(), getCollectionPath('alocacoes')), data);
                    showNotification('Alocação adicionada com sucesso!', 'success');
                }
                closeAlocacaoModal();

                setTimeout(() => {
                    if (filtroProf) document.getElementById('alocacoes-filter-profissional').value = filtroProf;
                    if (filtroProj) document.getElementById('alocacoes-filter-projeto').value = filtroProj;
                    renderAlocacoes();
                }, 300);

                // Redesenhar timeline se estiver visível
                if (typeof window.drawTimelineChart === 'function' &&
                    document.querySelector('.view.active')?.id === 'timeline') {
                    setTimeout(() => window.drawTimelineChart(), 500);
                }
            } catch (error) {
                console.error('Erro ao salvar alocação:', error);
                showNotification('Erro ao salvar alocação', 'error');
            }
        };

        if (!resultado.disponivel) {
            showConflictModal(profissional?.nome || 'Profissional', resultado, salvar, () => {});
        } else {
            await salvar();
        }
    });
}

// ===== EXPORT DEFAULT =====
export default {
    renderAlocacoes,
    openAlocacaoModal,
    closeAlocacaoModal,
    deleteAlocacao,
    populateAlocacoesFilters,
    initializeAllocationsModule
};
