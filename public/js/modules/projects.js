// ===== PROJECTS MODULE =====
// Módulo de gestão de projetos
// Extraído de app.js na refatoração v4.0.0

import { getDb } from '../config/firebase-config.js';
import { getProjetos } from '../state/app-state.js';
import { showNotification, getCollectionPath } from '../core/utils.js';
import { isAdmin, isEditor } from '../core/auth.js';

// Importações Firebase
import { collection, addDoc, setDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ===== UTILITÁRIO: BADGE DE STATUS =====
function getStatusBadge(status) {
    const map = {
        'Em Andamento': 'bg-blue-100 text-blue-800',
        'Concluído':    'bg-green-100 text-green-800',
        'Atrasado':     'bg-red-100 text-red-800',
        'Não Iniciado': 'bg-gray-100 text-gray-800',
        'Em Pausa':     'bg-yellow-100 text-yellow-800',
    };
    const cls = map[status] || 'bg-gray-100 text-gray-800';
    return `<span class="px-2 py-1 rounded-full text-xs font-medium ${cls}">${status || '—'}</span>`;
}

// ===== RENDERIZAR TABELA DE PROJETOS =====
export function renderProjetos() {
    const tbody = document.getElementById('projetos-table-body');
    if (!tbody) {
        console.warn('⚠️ Tabela de projetos não encontrada');
        return;
    }

    // Aplicar filtros — IDs corretos conforme o HTML
    const nomeFilter    = document.getElementById('projetos-filter-nome')?.value.toLowerCase() || '';
    const clienteFilter = document.getElementById('projetos-filter-cliente')?.value.toLowerCase() || '';
    const statusFilter  = document.getElementById('projetos-filter-status')?.value || '';

    let projetosFiltrados = getProjetos();

    if (nomeFilter) {
        projetosFiltrados = projetosFiltrados.filter(p =>
            p.nome?.toLowerCase().includes(nomeFilter)
        );
    }

    if (clienteFilter) {
        projetosFiltrados = projetosFiltrados.filter(p =>
            p.cliente?.toLowerCase().includes(clienteFilter)
        );
    }

    if (statusFilter) {
        projetosFiltrados = projetosFiltrados.filter(p =>
            p.status === statusFilter
        );
    }

    if (projetosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-4 text-center text-gray-400 text-sm">Nenhum projeto encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = projetosFiltrados.map(proj => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${proj.nome || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${proj.cliente || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${proj.tipo || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${proj.inicioPrevisto || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${proj.fimPrevisto || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${proj.horasEstimadasProjeto || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(proj.status)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                ${(isAdmin() || isEditor()) ? `
                    <button onclick="window.editProjeto('${proj.id}')" class="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                    ${isAdmin() ? `<button onclick="window.deleteProjeto('${proj.id}')" class="text-red-600 hover:text-red-900">Excluir</button>` : ''}
                ` : ''}
            </td>
        </tr>
    `).join('');

    console.log('📋 Projetos renderizados:', projetosFiltrados.length);
}

// ===== MODAL DE PROJETO =====
export function openProjetoModal(projId = null) {
    const modal = document.getElementById('projeto-modal');
    const modalTitle = document.getElementById('projeto-modal-title');
    const form = document.getElementById('projeto-form');

    if (!modal || !form) {
        console.warn('⚠️ Modal ou formulário de projeto não encontrado');
        return;
    }

    form.reset();

    if (projId) {
        // Editar projeto existente
        const proj = getProjetos().find(p => p.id === projId);
        if (!proj) return;

        modalTitle.textContent = 'Editar Projeto';
        document.getElementById('projeto-id').value              = projId;
        document.getElementById('nome-projeto').value            = proj.nome || '';
        document.getElementById('cliente').value                 = proj.cliente || '';
        document.getElementById('tipo-projeto').value            = proj.tipo || 'Direto';
        document.getElementById('horas-estimadas-projeto').value = proj.horasEstimadasProjeto || '';
        document.getElementById('inicio-previsto').value         = proj.inicioPrevisto || '';
        document.getElementById('fim-previsto').value            = proj.fimPrevisto || '';
        document.getElementById('inicio-real').value             = proj.inicioReal || '';
        document.getElementById('fim-real').value                = proj.fimReal || '';
        document.getElementById('status-projeto').value          = proj.status || 'Não Iniciado';
    } else {
        modalTitle.textContent = 'Adicionar Projeto';
        document.getElementById('projeto-id').value = '';
    }

    modal.classList.remove('hidden');
}

export function closeProjetoModal() {
    const modal = document.getElementById('projeto-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ===== SALVAR PROJETO =====
export async function saveProjeto(event) {
    event.preventDefault();

    const projId = document.getElementById('projeto-id').value;

    const projData = {
        nome:                  document.getElementById('nome-projeto').value.trim(),
        cliente:               document.getElementById('cliente').value.trim(),
        tipo:                  document.getElementById('tipo-projeto').value,
        horasEstimadasProjeto: parseInt(document.getElementById('horas-estimadas-projeto').value) || 0,
        inicioPrevisto:        document.getElementById('inicio-previsto').value,
        fimPrevisto:           document.getElementById('fim-previsto').value,
        inicioReal:            document.getElementById('inicio-real').value || null,
        fimReal:               document.getElementById('fim-real').value || null,
        status:                document.getElementById('status-projeto').value,
    };

    // Validações
    if (!projData.nome) {
        showNotification('Nome do projeto é obrigatório', 'error');
        return;
    }
    if (!projData.cliente) {
        showNotification('Cliente é obrigatório', 'error');
        return;
    }
    if (!projData.inicioPrevisto) {
        showNotification('Início Previsto é obrigatório', 'error');
        return;
    }
    if (!projData.fimPrevisto) {
        showNotification('Fim Previsto é obrigatório', 'error');
        return;
    }

    try {
        if (projId) {
            // Atualizar
            await setDoc(doc(getDb(), getCollectionPath('projetos'), projId), projData);
            showNotification('Projeto atualizado com sucesso!', 'success');
        } else {
            // Criar novo
            await addDoc(collection(getDb(), getCollectionPath('projetos')), projData);
            showNotification('Projeto adicionado com sucesso!', 'success');
        }

        closeProjetoModal();
    } catch (error) {
        console.error('Erro ao salvar projeto:', error);
        showNotification('Erro ao salvar projeto', 'error');
    }
}

// ===== DELETAR PROJETO =====
export async function deleteProjeto(projId) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

    try {
        await deleteDoc(doc(getDb(), getCollectionPath('projetos'), projId));
        showNotification('Projeto excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        showNotification('Erro ao excluir projeto', 'error');
    }
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
export function setupProjectsGlobalFunctions() {
    window.editProjeto   = openProjetoModal;
    window.deleteProjeto = deleteProjeto;
}

// ===== INICIALIZAR MÓDULO =====
export function initializeProjectsModule() {
    console.log('📂 Módulo de Projetos inicializado');

    // Configurar funções globais (edit/delete via onclick inline)
    setupProjectsGlobalFunctions();

    // Botão "Adicionar Projeto" — injetado dinamicamente pela navegação no #main-actions
    document.getElementById('main-actions')?.addEventListener('click', (e) => {
        if (e.target.id === 'add-projeto-btn' || e.target.closest('#add-projeto-btn')) {
            openProjetoModal();
        }
    });

    // Formulário de salvar
    const form = document.getElementById('projeto-form');
    if (form) {
        form.addEventListener('submit', saveProjeto);
    }

    // Botões de fechar modal
    const modal = document.getElementById('projeto-modal');
    if (modal) {
        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeProjetoModal);
        }

        // Clique fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProjetoModal();
            }
        });
    }

    // Nota: Os listeners dos filtros (projetos-filter-nome, cliente, status)
    // já são configurados pelo app.js — não duplicar aqui.
}

// ===== EXPORT DEFAULT =====
export default {
    renderProjetos,
    openProjetoModal,
    closeProjetoModal,
    saveProjeto,
    deleteProjeto,
    initializeProjectsModule
};
