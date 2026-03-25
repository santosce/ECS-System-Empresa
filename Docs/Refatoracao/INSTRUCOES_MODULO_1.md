# 🔥 MÓDULO 1: firebase-config.js

## ✅ STATUS: Criado e pronto para integração

---

## 📋 O QUE ESTE MÓDULO FAZ

Extrai do `app.js` original:
- ✅ Importações do Firebase (11.6.1)
- ✅ Variáveis globais (app, db, auth, provider, appId)
- ✅ Função `initializeFirebase()`
- ✅ Re-exports de funções Firebase para facilitar imports
- ✅ Getters seguros para acessar as instâncias

---

## 📁 ONDE COLOCAR

```
public/js/config/firebase-config.js
```

---

## 🔧 PASSO A PASSO - INTEGRAÇÃO

### PASSO 1: Copiar o arquivo

```bash
# No PowerShell/CMD, na raiz do projeto:
copy firebase-config.js public\js\config\firebase-config.js
```

### PASSO 2: Modificar o index.html

Abra `public/index.html` e **ADICIONE** esta linha **ANTES** da tag `<script src="app.js" type="module"></script>`:

```html
<!-- Adicionar ANTES do app.js -->
<script src="js/config/firebase-config.js" type="module"></script>
<script src="app.js" type="module"></script>
```

### PASSO 3: Modificar o app.js

Abra `public/app.js` e faça as seguintes mudanças:

#### 3.1 - REMOVER as linhas 1-12 (Importações Firebase)

**REMOVER ISTO:**
```javascript
// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
```

#### 3.2 - ADICIONAR no topo do arquivo (linha 1):

**ADICIONAR ISTO:**
```javascript
// ===== IMPORTAÇÕES DE MÓDULOS =====
import { 
    initializeFirebase,
    getDb,
    getAuthInstance,
    getProvider,
    getAppId,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    onSnapshot,
    addDoc,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs
} from './js/config/firebase-config.js';

// ===== ECS SYSTEM - VERSÃO 4.0.0 MODULAR =====
// Sistema de Gestão de Capacity
// Refatoração modular iniciada em: [DATA_HOJE]
```

#### 3.3 - MODIFICAR as variáveis globais (linhas ~17-22)

**TROCAR ISTO:**
```javascript
let app;
let db;
let auth;
let provider;
let appId;
```

**POR ISTO:**
```javascript
// Variáveis Firebase agora vêm do módulo firebase-config
// Usar getters: getDb(), getAuthInstance(), getProvider(), getAppId()
```

#### 3.4 - MODIFICAR a função initializeFirebase (linhas ~90-110)

**TROCAR TODA A FUNÇÃO:**
```javascript
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
```

**POR ESTA VERSÃO SIMPLIFICADA:**
```javascript
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
```

#### 3.5 - MODIFICAR a última linha do arquivo

**TROCAR:**
```javascript
initializeFirebase();
```

**POR:**
```javascript
initializeFirebaseApp();
```

#### 3.6 - SUBSTITUIR referências a variáveis Firebase

**Em TODO o app.js**, substituir:
- `db` → `getDb()`
- `auth` → `getAuthInstance()`
- `provider` → `getProvider()`
- `appId` → `getAppId()`

**DICA:** Use Find & Replace no VS Code:
- Ctrl+H
- Buscar: `\bdb\b` (modo regex ativado)
- Substituir: `getDb()`
- Replace All

Repetir para `auth`, `provider`, `appId`

---

## 🧪 PASSO 4: TESTAR

```bash
# 1. Salvar todas as alterações no VS Code

# 2. Testar localmente
firebase serve

# 3. Abrir no navegador
# http://localhost:5000

# 4. Abrir Console (F12) e verificar:
# - Deve aparecer "Firebase inicializado com sucesso"
# - NÃO deve ter erros de importação
# - Login deve funcionar normalmente
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Arquivo `firebase-config.js` copiado para `public/js/config/`
- [ ] `index.html` atualizado com import do módulo
- [ ] Importações adicionadas no topo do `app.js`
- [ ] Variáveis globais Firebase removidas
- [ ] Função `initializeFirebase()` simplificada
- [ ] Referências a `db`, `auth`, `provider`, `appId` substituídas pelos getters
- [ ] Testado localmente com `firebase serve`
- [ ] Login funciona
- [ ] Console sem erros

---

## 🐛 TROUBLESHOOTING

### Erro: "Firebase não inicializado"
→ Verifique se chamou `await initializeFirebase()` antes de usar os getters

### Erro: "Cannot find module"
→ Verifique o caminho no import: `'./js/config/firebase-config.js'`

### Erro: "db is not defined"
→ Você esqueceu de substituir `db` por `getDb()` em algum lugar

---

## 📊 MÉTRICAS DESTA EXTRAÇÃO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Linhas em app.js | 3400 | ~3350 |
| Módulos JS | 1 | 2 |
| Linhas extraídas | ~50 | - |

---

## ⏭️ PRÓXIMO MÓDULO

Após validar este módulo, vamos extrair:
**state/app-state.js** - Estado global da aplicação

