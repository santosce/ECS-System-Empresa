# 🛠️ MÓDULO 3: core/utils.js

## ✅ STATUS: Criado e pronto para integração

---

## 📋 O QUE ESTE MÓDULO FAZ

Extrai do `app.js` original:
- ✅ Constantes APP_VERSION e APP_NAME
- ✅ Função `debounce()`
- ✅ Função `formatDate()`
- ✅ Função `getStatusColor()`
- ✅ Função `getCollectionPath()`
- ✅ Função `showNotification()`
- ✅ Helpers adicionais (validação, cálculo, formatação, ordenação)

---

## 📁 ONDE COLOCAR

```
public/js/core/utils.js
```

---

## 🔧 PASSO A PASSO - INTEGRAÇÃO

### PASSO 1: Copiar o arquivo

Copie o arquivo baixado para:
```
C:\Projetos\ECS-System-Empresa\public\js\core\utils.js
```

---

### PASSO 2: Modificar o index.html

Abra `public/index.html` e **ADICIONE** esta linha após o app-state:

```html
<!-- Módulos de configuração -->
<script src="js/config/firebase-config.js" type="module"></script>
<script src="js/state/app-state.js" type="module"></script>
<script src="js/core/utils.js" type="module"></script>  <!-- ← ADICIONAR -->
<script src="app.js" type="module"></script>
```

---

### PASSO 3: Modificar o app.js

#### 3.1 - ADICIONAR import no topo

Encontre os imports e **ADICIONE** após o import do app-state:

```javascript
import appState, {
    getProfissionais,
    setProfissionais,
    getProjetos,
    setProjetos,
    getAlocacoes,
    setAlocacoes,
    getUsers,
    setUsers,
    getProfissionalById,
    getProjetoById,
    getAlocacaoById
} from './js/state/app-state.js';

// ← ADICIONAR AQUI:
import {
    APP_VERSION,
    APP_NAME,
    debounce,
    formatDate,
    getStatusColor,
    getCollectionPath,
    showNotification
} from './js/core/utils.js';
```

---

#### 3.2 - REMOVER código duplicado do app.js

Agora vamos **REMOVER** as funções que foram movidas para o módulo:

---

**REMOVER 1: Constantes APP_VERSION e APP_NAME**

Procure e **DELETE**:
```javascript
const APP_VERSION = '3.2.8';
const APP_NAME = 'ECS System';
```

Elas agora vêm do módulo utils!

---

**REMOVER 2: Função debounce**

Procure e **DELETE** esta função completa:
```javascript
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
```

---

**REMOVER 3: Função showNotification**

Procure e **DELETE** esta função completa (é grande!):
```javascript
window.showNotification = function(message, type = 'info') {
    if (typeof Toastify === 'undefined') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    const config = {
        success: {
            background: 'linear-gradient(to right, #00b09b, #96c93d)',
            icon: '✓',
            duration: 3000
        },
        error: {
            background: 'linear-gradient(to right, #ff5f6d, #ffc371)',
            icon: '✕',
            duration: 4000
        },
        warning: {
            background: 'linear-gradient(to right, #f7971e, #ffd200)',
            icon: '⚠',
            duration: 3500
        },
        info: {
            background: 'linear-gradient(to right, #667eea, #764ba2)',
            icon: 'ℹ',
            duration: 3000
        }
    };

    const settings = config[type] || config.info;

    Toastify({
        text: `${settings.icon} ${message}`,
        duration: settings.duration,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: settings.background,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
    }).showToast();
};

const showNotification = window.showNotification;
```

**DELETE TUDO ISSO!**

---

**REMOVER 4: Função formatDate**

Procure e **DELETE**:
```javascript
function formatDate(dateString) {
    if (!dateString || dateString.length < 10) return 'N/A';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}
```

---

**REMOVER 5: Função getCollectionPath**

Procure e **DELETE**:
```javascript
function getCollectionPath(collectionName) {
    const id = getAppId();
    if (!id) throw new Error('Firebase não inicializado');
    return `artifacts/${id}/public/data/${collectionName}`;
}
```

---

**REMOVER 6: Função getStatusColor**

Procure e **DELETE**:
```javascript
function getStatusColor(status) {
    const colors = {
        'Não Iniciado': 'bg-gray-100 text-gray-800',
        'Em Andamento': 'bg-blue-100 text-blue-800',
        'Concluído': 'bg-green-100 text-green-800',
        'Atrasado': 'bg-red-100 text-red-800',
        'Em Pausa': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}
```

---

## 🧪 PASSO 4: TESTAR

```bash
# 1. Salvar todas as alterações
# 2. Testar localmente
firebase serve

# 3. Abrir http://localhost:5000
# 4. Fazer login
# 5. Verificar console (F12):
#    - Sistema deve funcionar normalmente
#    - Notificações devem aparecer
#    - Datas devem ser formatadas
#    - Status devem ter cores
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Arquivo `utils.js` copiado para `public/js/core/`
- [ ] `index.html` atualizado com import do módulo
- [ ] Import adicionado no topo do `app.js`
- [ ] APP_VERSION e APP_NAME removidos
- [ ] Função `debounce()` removida
- [ ] Função `showNotification()` removida
- [ ] Função `formatDate()` removida
- [ ] Função `getCollectionPath()` removida
- [ ] Função `getStatusColor()` removida
- [ ] Testado localmente com `firebase serve`
- [ ] Notificações funcionam
- [ ] Datas formatadas corretamente
- [ ] Console sem erros

---

## 🐛 TROUBLESHOOTING

### Erro: "showNotification is not defined"
→ Você removeu a função mas não importou do módulo

### Erro: "formatDate is not defined"
→ Você removeu a função mas não importou do módulo

### Notificações não aparecem
→ Verifique se Toastify está carregado no index.html

---

## 📊 MÉTRICAS DESTA EXTRAÇÃO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Linhas em app.js | ~3320 | ~3200 |
| Módulos JS | 3 | 4 |
| Funções auxiliares centralizadas | ❌ | ✅ |
| Helpers adicionais disponíveis | ❌ | ✅ |

---

## 💡 BENEFÍCIOS DESTE MÓDULO

✅ **Funções centralizadas** - Um lugar para todos os helpers
✅ **Reutilizáveis** - Fácil usar em outros módulos
✅ **Helpers extras** - Validação, cálculo, formatação prontos
✅ **Manutenção fácil** - Mudanças em um só lugar

---

## ⏭️ PRÓXIMO MÓDULO

Após validar este módulo, vamos extrair:
**core/auth.js** - Sistema de autenticação completo
