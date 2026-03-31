// ===== PROFESSIONALS MODULE =====
// Módulo de gestão de profissionais
// Extraído de app.js na refatoração v4.0.0

import { getDb } from '../config/firebase-config.js';
import { getProfissionais } from '../state/app-state.js';
import { showNotification, getCollectionPath } from '../core/utils.js';
import { isAdmin, isEditor } from '../core/auth.js';

// Importações Firebase
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ===== RENDERIZAR TABELA DE PROFISSIONAIS =====
export function renderProfissionais() {
    const tbody = document.getElementById('profissionais-table-body');
    if (!tbody) return;

    const filterNome    = document.getElementById('profissionais-filter-nome')?.value.toLowerCase()    || '';
    const filterPerfil  = document.getElementById('profissionais-filter-perfil')?.value.toLowerCase()  || '';
    const filterTime    = document.getElementById('profissionais-filter-time')?.value.toLowerCase()    || '';
    const filterEmpresa = document.getElementById('profissionais-filter-empresa')?.value.toLowerCase() || '';

    const profissionaisFiltrados = getProfissionais().filter(p => {
        if (filterNome    && !(p.nome    || '').toLowerCase().includes(filterNome))    return false;
        if (filterPerfil  && !(p.perfil  || '').toLowerCase().includes(filterPerfil))  return false;
        if (filterTime    && !(p.time    || '').toLowerCase().includes(filterTime))    return false;
        if (filterEmpresa && !(p.empresa || '').toLowerCase().includes(filterEmpresa)) return false;
        return true;
    });

    tbody.innerHTML = profissionaisFiltrados.map(prof => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${prof.nome || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prof.perfil || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prof.time || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prof.empresa || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prof.lider || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prof.faturado || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prof.senioridade || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prof.ativo === 'Sim' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${prof.ativo}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                ${(isAdmin() || isEditor()) ? `
                    <button onclick="window.editProfissional('${prof.id}')" class="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                    ${isAdmin() ? `<button onclick="window.deleteProfissional('${prof.id}')" class="text-red-600 hover:text-red-900">Excluir</button>` : ''}
                ` : ''}
            </td>
        </tr>
    `).join('');

    console.log('📋 Profissionais renderizados:', profissionaisFiltrados.length);
}

// ===== MODAL DE PROFISSIONAL =====
export function openProfissionalModal(profId = null) {
    const modal = document.getElementById('profissional-modal');
    const modalTitle = document.getElementById('profissional-modal-title');
    const form = document.getElementById('profissional-form');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('profissional-id').value = '';

    if (profId) {
        // Editar profissional existente
        const prof = getProfissionais().find(p => p.id === profId);
        if (!prof) return;

        modalTitle.textContent = 'Editar Profissional';
        document.getElementById('profissional-id').value = prof.id;
        document.getElementById('nome').value         = prof.nome        || '';
        document.getElementById('perfil').value       = prof.perfil      || '';
        document.getElementById('time').value         = prof.time        || '';
        document.getElementById('empresa').value      = prof.empresa     || '';
        document.getElementById('lider').value        = prof.lider       || '';
        document.getElementById('faturado').value     = prof.faturado    || 'Sim';
        document.getElementById('senioridade').value  = prof.senioridade || '';
        document.getElementById('ativo').value        = prof.ativo       || 'Sim';
    } else {
        modalTitle.textContent = 'Adicionar Profissional';
    }

    modal.classList.remove('hidden');
}

export function closeProfissionalModal() {
    const modal = document.getElementById('profissional-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ===== SALVAR PROFISSIONAL =====
export async function saveProfissional(event) {
    event.preventDefault();

    const profId = document.getElementById('profissional-id').value;

    const profData = {
        nome:        document.getElementById('nome').value.trim(),
        perfil:      document.getElementById('perfil').value.trim(),
        time:        document.getElementById('time').value.trim(),
        empresa:     document.getElementById('empresa').value.trim(),
        lider:       document.getElementById('lider').value.trim(),
        faturado:    document.getElementById('faturado').value,
        senioridade: document.getElementById('senioridade').value.trim(),
        ativo:       document.getElementById('ativo').value
    };

    if (!profData.nome) {
        showNotification('Nome é obrigatório', 'error');
        return;
    }

    try {
        if (profId) {
            const profRef = doc(getDb(), getCollectionPath('profissionais'), profId);
            await updateDoc(profRef, profData);
            showNotification('Profissional atualizado com sucesso!', 'success');
        } else {
            await addDoc(collection(getDb(), getCollectionPath('profissionais')), profData);
            showNotification('Profissional adicionado com sucesso!', 'success');
        }

        closeProfissionalModal();
    } catch (error) {
        console.error('Erro ao salvar profissional:', error);
        showNotification('Erro ao salvar profissional', 'error');
    }
}

// ===== DELETAR PROFISSIONAL =====
export async function deleteProfissional(profId) {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    try {
        await deleteDoc(doc(getDb(), getCollectionPath('profissionais'), profId));
        showNotification('Profissional excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao deletar profissional:', error);
        showNotification('Erro ao excluir profissional', 'error');
    }
}

// ===== FILTROS DE PROFISSIONAIS =====
export function populateProfissionaisFilters() {
    console.log('📋 Populando filtros de profissionais');
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
export function setupProfessionalsGlobalFunctions() {
    window.editProfissional = openProfissionalModal;
    window.deleteProfissional = deleteProfissional;
}

// ===== INICIALIZAR MÓDULO =====
export function initializeProfessionalsModule() {
    console.log('👥 Módulo de Profissionais inicializado');

    // Configurar funções globais
    setupProfessionalsGlobalFunctions();

    // Botão "Adicionar Profissional" é criado dinamicamente pela navegação,
    // então usamos event delegation no container de ações
    document.getElementById('main-actions')?.addEventListener('click', (e) => {
        if (e.target.closest('#add-profissional-btn')) {
            openProfissionalModal();
        }
    });

    // Configurar formulário
    const form = document.getElementById('profissional-form');
    if (form) {
        form.addEventListener('submit', saveProfissional);
    }

    // Configurar botão de fechar (X) e Cancelar do modal
    const modal = document.getElementById('profissional-modal');
    if (modal) {
        modal.querySelector('.cancel-btn')?.addEventListener('click', closeProfissionalModal);
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProfissionalModal();
        });
    }
}

// ===== EXPORT DEFAULT =====
export default {
    renderProfissionais,
    openProfissionalModal,
    closeProfissionalModal,
    saveProfissional,
    deleteProfissional,
    populateProfissionaisFilters,
    initializeProfessionalsModule
};
