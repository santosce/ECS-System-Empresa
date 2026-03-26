# 🔐 MÓDULO 4: core/auth.js

## ✅ STATUS: Criado e pronto para integração

---

## 📋 O QUE ESTE MÓDULO FAZ

Extrai do `app.js` original:
- ✅ Variáveis `currentUserId` e `currentUserRole`
- ✅ Função `loginWithGoogle()` (login com popup)
- ✅ Função `logout()`
- ✅ Função `getUserRole()`
- ✅ Função `updateUIBasedOnRole()`
- ✅ Configuração do `onAuthStateChanged`
- ✅ Getters e helpers (isAdmin, isEditor, isViewer)

---

## 📁 ONDE COLOCAR

```
public/js/core/auth.js
```

---

## 🔧 PASSO A PASSO - INTEGRAÇÃO

### PASSO 1: Copiar o arquivo

Copie o arquivo baixado para:
```
C:\Projetos\ECS-System-Empresa\public\js\core\auth.js
```

---

### PASSO 2: Modificar o index.html

Abra `public/index.html` e **ADICIONE** esta linha após o utils.js:

```html
<!-- Módulos de configuração -->
<script src="js/config/firebase-config.js" type="module"></script>
<script src="js/state/app-state.js" type="module"></script>
<script src="js/core/utils.js" type="module"></script>
<script src="js/core/auth.js" type="module"></script>  <!-- ← ADICIONAR -->
<script src="app.js" type="module"></script>
```

---

### PASSO 3: Modificar o app.js

#### 3.1 - ADICIONAR import no topo

Encontre os imports e **ADICIONE** após o import do utils:

```javascript
import {
    APP_VERSION,
    APP_NAME,
    debounce,
    formatDate,
    getStatusColor,
    getCollectionPath,
    showNotification
} from './js/core/utils.js';

// ← ADICIONAR AQUI:
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
```

---

#### 3.2 - REMOVER código de autenticação do app.js

Agora vamos **REMOVER** o código de autenticação que foi movido para o módulo.

---

**REMOVER 1: Variáveis currentUserId e currentUserRole**

Dentro da função `initializeAppLogic()`, procure e **DELETE**:
```javascript
let currentUserId = null;
let currentUserRole = null;
```

---

**REMOVER 2: Event listener do botão de login**

Procure e **DELETE** este bloco:
```javascript
loginBtn.addEventListener('click', async () => {
    try {
        console.log('🔵 Botão de login clicado');
        console.log('🔄 Abrindo popup de login...');
        const result = await signInWithPopup(getAuthInstance(), getProvider());
        console.log('✅ Login concluído com sucesso');
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification('Erro ao fazer login: ' + error.message, 'error');
    }
});
```

**SUBSTITUA POR:**
```javascript
loginBtn.addEventListener('click', loginWithGoogle);
```

---

**REMOVER 3: Event listener do botão de logout**

Procure e **DELETE** este bloco:
```javascript
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(getAuthInstance());
        showNotification('Logout realizado com sucesso', 'success');
    } catch (error) {
        console.error('Erro no logout:', error);
        showNotification('Erro ao fazer logout', 'error');
    }
});
```

**SUBSTITUA POR:**
```javascript
logoutBtn.addEventListener('click', logout);
```

---

**REMOVER 4: Função getUserRole**

Procure e **DELETE** toda esta função:
```javascript
async function getUserRole(user) {
    try {
        const userDocRef = doc(getDb(), getCollectionPath('users'), user.uid);
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
```

---

**REMOVER 5: Função updateUIBasedOnRole**

Procure e **DELETE** toda esta função:
```javascript
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
```

---

**REMOVER 6: onAuthStateChanged (o MAIOR)**

Procure por `onAuthStateChanged(getAuthInstance()` e **SUBSTITUA** todo o bloco.

**PROCURE POR ISTO (GRANDE):**
```javascript
onAuthStateChanged(getAuthInstance(), async (user) => {
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
```

**SUBSTITUA POR (VERSÃO SIMPLIFICADA):**
```javascript
// Configurar listener de autenticação
setupAuthListener(
    // Callback quando usuário está autenticado
    async (user, role) => {
        // Mostrar app, esconder login
        loginView.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Configurar listeners do Firestore
        setupFirestoreListeners();
    },
    // Callback quando usuário fez logout
    () => {
        // Mostrar login, esconder app
        loginView.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
);
```

---

#### 3.3 - SUBSTITUIR referências a variáveis

Use Find & Replace para substituir:

**Substituição 1: currentUserId**
```
Find (Regex):    \bcurrentUserId\b
Replace:         getCurrentUserId()
[.*] ← Ativado
```

**Substituição 2: currentUserRole**
```
Find (Regex):    \bcurrentUserRole\b
Replace:         getCurrentUserRole()
[.*] ← Ativado
```

---

## 🧪 PASSO 4: TESTAR

```bash
firebase serve
```

Abra `http://localhost:5000` e teste:
- ✅ Login funciona
- ✅ Logout funciona
- ✅ Role é detectado corretamente
- ✅ UI atualiza baseado no role (botões aparecem/somem)
- ✅ Dados carregam normalmente

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Arquivo `auth.js` copiado para `public/js/core/`
- [ ] `index.html` atualizado com import do módulo
- [ ] Import adicionado no topo do `app.js`
- [ ] Variáveis `currentUserId` e `currentUserRole` removidas
- [ ] Event listener de login simplificado
- [ ] Event listener de logout simplificado
- [ ] Função `getUserRole` removida
- [ ] Função `updateUIBasedOnRole` removida
- [ ] `onAuthStateChanged` substituído por `setupAuthListener`
- [ ] Referências substituídas por getters
- [ ] Testado e funcionando

---

## 📊 MÉTRICAS DESTA EXTRAÇÃO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Linhas em app.js | ~3200 | ~3100 |
| Módulos JS | 4 | 5 |
| Lógica de auth centralizada | ❌ | ✅ |

---

## ⏭️ PRÓXIMO MÓDULO

Após validar este módulo, vamos extrair:
**core/navigation.js** - Sistema de navegação entre views
