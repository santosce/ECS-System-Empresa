# 🧭 MÓDULO 5: core/navigation.js

## ✅ STATUS: Criado e pronto para integração

---

## 📋 O QUE ESTE MÓDULO FAZ

Extrai do `app.js` original:
- ✅ Variável `openedFromTimeline`
- ✅ Variáveis `views`, `navLinks`, `viewTitle`, `mainActionsContainer`
- ✅ Constantes `addIcon` e `createButton`
- ✅ Função `switchView()`
- ✅ Configuração de listeners de navegação
- ✅ Lógica de atualização de títulos e ações

---

## 📁 ONDE COLOCAR

```
public/js/core/navigation.js
```

---

## 🔧 PASSO A PASSO - INTEGRAÇÃO

### PASSO 1: Copiar o arquivo

Copie o arquivo baixado para:
```
C:\Projetos\ECS-System-Empresa\public\js\core\navigation.js
```

---

### PASSO 2: Modificar o index.html

Abra `public/index.html` e **ADICIONE** esta linha após o auth.js:

```html
<!-- Módulos -->
<script src="js/config/firebase-config.js" type="module"></script>
<script src="js/state/app-state.js" type="module"></script>
<script src="js/core/utils.js" type="module"></script>
<script src="js/core/auth.js" type="module"></script>
<script src="js/core/navigation.js" type="module"></script>  <!-- ← ADICIONAR -->
<script src="app.js" type="module"></script>
```

---

### PASSO 3: Modificar o app.js

#### 3.1 - ADICIONAR import no topo

Encontre os imports e **ADICIONE** após o import do auth:

```javascript
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

// ← ADICIONAR AQUI:
import {
    initializeNavigation,
    switchView,
    setupNavigationListeners,
    getOpenedFromTimeline,
    setOpenedFromTimeline
} from './js/core/navigation.js';
```

---

#### 3.2 - REMOVER código de navegação do app.js

Agora vamos **REMOVER** o código de navegação que foi movido para o módulo.

---

**REMOVER 1: Variável openedFromTimeline**

Procure no topo do arquivo (fora das funções) e **DELETE**:
```javascript
let openedFromTimeline = false;
```

---

**REMOVER 2: Variáveis de navegação**

Dentro da função `initializeAppLogic()`, procure e **DELETE**:
```javascript
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-link');
const viewTitle = document.getElementById('view-title');
const mainActionsContainer = document.getElementById('main-actions');
```

---

**REMOVER 3: Constantes addIcon e createButton**

Procure e **DELETE**:
```javascript
const addIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

const createButton = (id, text, icon) => `<button id="${id}" class="add-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium inline-flex items-center">${icon}${text}</button>`;
```

---

**REMOVER 4: Função switchView (A MAIOR)**

Procure e **DELETE** toda esta função:
```javascript
function switchView(viewName, fromTimeline = false) {
    console.log(`🔄 Mudando para view: ${viewName}`);
    openedFromTimeline = fromTimeline;
    
    views.forEach(view => view.classList.add('hidden'));
    
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.classList.remove('hidden');
    }
    
    navLinks.forEach(link => {
        link.classList.remove('bg-indigo-700');
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('bg-indigo-700');
        }
    });
    
    const viewConfig = {
        'dashboard': {
            title: 'Dashboard',
            actions: ''
        },
        // ... todo o resto da config ...
    };
    
    const config = viewConfig[viewName] || { title: 'ECS System', actions: '' };
    
    if (viewTitle) {
        viewTitle.textContent = config.title;
    }
    
    if (mainActionsContainer) {
        mainActionsContainer.innerHTML = config.actions;
    }
}
```

**DELETE TODA ESSA FUNÇÃO!**

---

**REMOVER 5: Listeners de navegação**

Procure e **DELETE** este bloco:
```javascript
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = link.getAttribute('data-view');
        if (viewName) {
            switchView(viewName);
        }
    });
});
```

---

#### 3.3 - ADICIONAR inicialização da navegação

Dentro da função `initializeAppLogic()`, **ADICIONE** no início (logo após a declaração das variáveis):

```javascript
function initializeAppLogic() {
    let profileChart = null;
    let monthlyAvailabilityChart = null;
    let isGoogleChartsLoaded = false;
    
    // ← ADICIONAR AQUI:
    // Inicializar navegação
    initializeNavigation();
    
    // Carregar Google Charts
    if (typeof google !== 'undefined' && google.charts) {
        // ...
    }
    
    // ... resto do código
}
```

E **ADICIONE** no final da função `initializeAppLogic()`, antes do último `switchView('dashboard')`:

```javascript
    // ... todo o código da função ...
    
    // ← ADICIONAR AQUI (antes do último switchView):
    // Configurar listeners de navegação
    setupNavigationListeners();
    
    // Inicialização da view inicial
    switchView('dashboard');
}
```

---

#### 3.4 - SUBSTITUIR referências a openedFromTimeline

Use Find & Replace:

**Substituição 1: Leitura de openedFromTimeline**
```
Find (Regex):    \bopenedFromTimeline\b
Replace:         getOpenedFromTimeline()
[.*] ← Ativado
```

**Substituição 2: Atribuição a openedFromTimeline**
```
Find (Regex):    openedFromTimeline = (.+);
Replace:         setOpenedFromTimeline($1);
[.*] ← Ativado
```

**ATENÇÃO:** Faça a substituição 2 (atribuição) ANTES da substituição 1 (leitura)!

---

## 🧪 PASSO 4: TESTAR

```bash
firebase serve
```

Teste:
- ✅ Navegação entre views funciona
- ✅ Títulos atualizam corretamente
- ✅ Botões de ação aparecem nas views certas
- ✅ Links de navegação destacam a view ativa
- ✅ Console sem erros

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Arquivo `navigation.js` copiado para `public/js/core/`
- [ ] `index.html` atualizado com import do módulo
- [ ] Import adicionado no topo do `app.js`
- [ ] Variável `openedFromTimeline` removida
- [ ] Variáveis de navegação removidas
- [ ] Constantes `addIcon` e `createButton` removidas
- [ ] Função `switchView` removida
- [ ] Listeners de navegação removidos
- [ ] `initializeNavigation()` adicionado
- [ ] `setupNavigationListeners()` adicionado
- [ ] Referências substituídas por getters/setters
- [ ] Testado e funcionando

---

## 📊 MÉTRICAS DESTA EXTRAÇÃO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Linhas em app.js | ~3100 | ~3000 |
| Módulos JS | 5 | 6 |
| Sistema de navegação centralizado | ❌ | ✅ |

---

## ⏭️ PRÓXIMO MÓDULO

Após validar este módulo, vamos extrair:
**modules/dashboard.js** - Dashboard e gráficos
