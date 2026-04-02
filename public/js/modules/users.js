// ===== USERS MODULE =====
// Módulo de gestão de usuários
// Extraído de app.js na refatoração v4.0.0

import { getDb } from '../config/firebase-config.js';
import { getUsers, setUsers } from '../state/app-state.js';
import { showNotification, getCollectionPath } from '../core/utils.js';
import { getCurrentUserId } from '../core/auth.js';

// Importações Firebase
import { collection, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ===== RENDERIZAR TABELA DE USUÁRIOS =====
export function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.warn('⚠️ Tabela de usuários não encontrada');
        return;
    }

    const users = getUsers();

    tbody.innerHTML = users.map(user => {
        const isActive = user.active !== false;

        const roleClass =
            user.role === 'admin'  ? 'bg-purple-100 text-purple-800' :
            user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800';

        const statusBadge = isActive
            ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>'
            : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inativo</span>';

        return `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">${user.name || user.displayName || user.email || 'N/A'}</td>
                <td class="px-6 py-4">${user.email || 'N/A'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${roleClass}">
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

    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Nenhum usuário cadastrado.</td></tr>';
    }

    console.log('👥 Usuários renderizados:', users.length);
}

// ===== MODAL DE USUÁRIO =====
export function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const modalTitle = document.getElementById('user-modal-title');
    const form = document.getElementById('user-form');
    
    if (!modal || !form) {
        console.warn('⚠️ Modal ou formulário de usuário não encontrado');
        return;
    }
    
    form.reset();
    
    if (userId) {
        // Editar usuário existente
        const user = getUsers().find(u => u.id === userId);
        if (!user) return;
        
        modalTitle.textContent = 'Editar Permissões';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-email').disabled = true;
        document.getElementById('user-display-name').value = user.displayName || '';
        document.getElementById('user-display-name').disabled = true;
        document.getElementById('user-role').value = user.role || 'viewer';
        document.getElementById('user-id').value = userId;
    } else {
        // Novo usuário
        modalTitle.textContent = 'Adicionar Usuário';
        document.getElementById('user-email').disabled = false;
        document.getElementById('user-display-name').disabled = false;
        document.getElementById('user-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

export function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ===== SALVAR USUÁRIO =====
export async function saveUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('user-id').value;
    const email = document.getElementById('user-email').value.trim();
    const displayName = document.getElementById('user-display-name').value.trim();
    const role = document.getElementById('user-role').value;
    
    // Validações
    if (!email) {
        showNotification('Email é obrigatório', 'error');
        return;
    }
    
    if (!role) {
        showNotification('Selecione uma permissão', 'error');
        return;
    }
    
    const userData = {
        email,
        displayName: displayName || email.split('@')[0],
        role
    };
    
    try {
        if (userId) {
            // Atualizar usuário existente
            const userRef = doc(getDb(), getCollectionPath('users'), userId);
            await setDoc(userRef, userData, { merge: true });
            showNotification('Permissões atualizadas com sucesso!', 'success');
        } else {
            // Adicionar novo usuário
            const userRef = doc(getDb(), getCollectionPath('users'), email);
            await setDoc(userRef, userData);
            showNotification('Usuário adicionado com sucesso!', 'success');
        }
        
        closeUserModal();
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showNotification('Erro ao salvar usuário', 'error');
    }
}

// ===== DELETAR USUÁRIO =====
export async function deleteUser(userId) {
    if (userId === getCurrentUserId()) {
        showNotification('Você não pode remover seu próprio usuário', 'error');
        return;
    }
    
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    
    try {
        await deleteDoc(doc(getDb(), getCollectionPath('users'), userId));
        showNotification('Usuário removido com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        showNotification('Erro ao remover usuário', 'error');
    }
}

// ===== ALTERAR PAPEL DO USUÁRIO =====
async function changeUserRole(userId) {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return;

    const newRole = prompt(`Alterar papel de ${user.name || user.email}:\n\nDigite 'admin', 'editor' ou 'viewer':`, user.role);
    if (!newRole || !['admin', 'editor', 'viewer'].includes(newRole)) {
        showNotification('Papel inválido!', 'warning');
        return;
    }

    try {
        await setDoc(doc(getDb(), getCollectionPath('users'), userId), { ...user, role: newRole });
        showNotification('Papel alterado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao alterar papel:', error);
        showNotification('Erro ao alterar papel', 'error');
    }
}

// ===== ALTERNAR STATUS DO USUÁRIO =====
async function toggleUserStatus(userId, newStatus) {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return;

    const action = newStatus ? 'ativar' : 'inativar';
    if (!confirm(`Tem certeza que deseja ${action} o usuário ${user.name || user.email}?`)) return;

    try {
        await setDoc(doc(getDb(), getCollectionPath('users'), userId), { ...user, active: newStatus });
        showNotification(`Usuário ${newStatus ? 'ativado' : 'inativado'} com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showNotification('Erro ao alterar status do usuário', 'error');
    }
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
export function setupUsersGlobalFunctions() {
    window.editUserRole      = openUserModal;
    window.deleteUser        = deleteUser;
    window.changeUserRole    = changeUserRole;
    window.toggleUserStatus  = toggleUserStatus;
}

// ===== INICIALIZAR MÓDULO =====
export function initializeUsersModule() {
    console.log('👤 Módulo de Usuários inicializado');
    
    // Configurar funções globais
    setupUsersGlobalFunctions();
    
    // Configurar botão de adicionar (event delegation)
    document.getElementById('main-actions')?.addEventListener('click', (e) => {
        if (e.target.id === 'add-user-btn' || e.target.closest('#add-user-btn')) {
            openUserModal();
        }
    });
    
    // Configurar formulário
    const form = document.getElementById('user-form');
    if (form) {
        form.addEventListener('submit', saveUser);
    }
    
    // Configurar botões de fechar modal
    const modal = document.getElementById('user-modal');
    if (modal) {
        // Botão cancel
        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeUserModal);
        }
        
        // Clique fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeUserModal();
            }
        });
    }
}

// ===== EXPORT DEFAULT =====
export default {
    renderUsersTable,
    openUserModal,
    closeUserModal,
    saveUser,
    deleteUser,
    initializeUsersModule
};
