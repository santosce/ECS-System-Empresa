// ===== CORE AUTH MODULE =====
// Módulo de autenticação e gerenciamento de usuários
// Extraído de app.js na refatoração v4.0.0

import { 
    getAuthInstance, 
    getProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    getDb,
    doc,
    getDoc,
    setDoc
} from '../config/firebase-config.js';
import { getCollectionPath, showNotification } from './utils.js';

// ===== ESTADO DE AUTENTICAÇÃO =====
let currentUserId = null;
let currentUserRole = null;

// ===== GETTERS =====
export function getCurrentUserId() {
    return currentUserId;
}

export function getCurrentUserRole() {
    return currentUserRole;
}

export function isAdmin() {
    return currentUserRole === 'admin';
}

export function isEditor() {
    return currentUserRole === 'editor';
}

export function isViewer() {
    return currentUserRole === 'viewer';
}

// ===== FUNÇÃO DE LOGIN =====
export async function loginWithGoogle() {
    try {
        console.log('🔵 Botão de login clicado');
        console.log('🔄 Abrindo popup de login...');
        
        const result = await signInWithPopup(getAuthInstance(), getProvider());
        console.log('✅ Login concluído com sucesso');
        
        return result.user;
    } catch (error) {
        console.error('❌ Erro no login:', error);
        showNotification('Erro ao fazer login: ' + error.message, 'error');
        throw error;
    }
}

// ===== FUNÇÃO DE LOGOUT =====
export async function logout() {
    try {
        await signOut(getAuthInstance());
        currentUserId = null;
        currentUserRole = null;
        showNotification('Logout realizado com sucesso', 'success');
    } catch (error) {
        console.error('Erro no logout:', error);
        showNotification('Erro ao fazer logout', 'error');
        throw error;
    }
}

// ===== VERIFICAR ROLE DO USUÁRIO =====
export async function getUserRole(user) {
    try {
        const userDocRef = doc(getDb(), getCollectionPath('users'), user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            return userDoc.data().role || 'viewer';
        } else {
            // Criar novo usuário com role viewer
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

// ===== ATUALIZAR UI BASEADO NO ROLE =====
export function updateUIBasedOnRole(role) {
    if (!role) return;
    
    const isViewer = role === 'viewer';
    const isAdmin = role === 'admin';
    
    // Esconder/mostrar botões de edição e exclusão
    document.querySelectorAll('.edit-btn, .delete-btn, .add-btn').forEach(btn => {
        btn.style.display = isViewer ? 'none' : '';
    });
    
    // Esconder/mostrar container de ações principais
    const mainActions = document.getElementById('main-actions');
    if (mainActions) {
        mainActions.style.display = isViewer ? 'none' : 'block';
    }
    
    // Mostrar/esconder link de gerenciar usuários (só admin)
    const manageUsersLink = document.getElementById('manage-users-link');
    if (manageUsersLink) {
        manageUsersLink.classList.toggle('hidden', !isAdmin);
    }
    
    // Atualizar display do role do usuário
    const userRoleElement = document.getElementById('user-role');
    if (userRoleElement) {
        userRoleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }
}

// ===== CONFIGURAR LISTENER DE AUTENTICAÇÃO =====
export function setupAuthListener(onUserAuthenticated, onUserLoggedOut) {
    onAuthStateChanged(getAuthInstance(), async (user) => {
        console.log('🔄 Estado de autenticação mudou:', user ? 'Logado' : 'Não logado');
        
        if (user) {
            console.log('✅ Usuário autenticado:', user.email);
            currentUserId = user.uid;
            
            // Obter role do usuário
            currentUserRole = await getUserRole(user);
            console.log('👤 Role do usuário:', currentUserRole);
            
            // Atualizar UI do usuário
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = user.displayName || user.email;
            }
            
            const userPhotoElement = document.getElementById('user-photo');
            if (userPhotoElement) {
                userPhotoElement.src = user.photoURL || 'https://via.placeholder.com/40';
            }
            
            const userRoleElement = document.getElementById('user-role');
            if (userRoleElement) {
                userRoleElement.textContent = currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1);
            }
            
            updateUIBasedOnRole(currentUserRole);
            
            // Callback quando usuário está autenticado
            if (onUserAuthenticated) {
                await onUserAuthenticated(user, currentUserRole);
            }
            
            showNotification('Bem-vindo, ' + user.displayName + '!', 'success');
        } else {
            console.log('❌ Usuário não autenticado');
            currentUserId = null;
            currentUserRole = null;
            
            // Callback quando usuário fez logout
            if (onUserLoggedOut) {
                onUserLoggedOut();
            }
        }
    });
}

// ===== EXPORT DEFAULT =====
export default {
    getCurrentUserId,
    getCurrentUserRole,
    isAdmin,
    isEditor,
    isViewer,
    loginWithGoogle,
    logout,
    getUserRole,
    updateUIBasedOnRole,
    setupAuthListener
};
