# 📊 MÓDULO 6: modules/dashboard.js

## ✅ STATUS: Criado e pronto para integração

---

## 📋 O QUE ESTE MÓDULO FAZ

Extrai do `app.js` original:
- ✅ Variáveis `profileChart`, `monthlyAvailabilityChart`
- ✅ Contadores de retry (`profileChartRetries`, `monthlyChartRetries`)
- ✅ Função `updateDashboard()`
- ✅ Função `updateProfileChart()`
- ✅ Função `updateMonthlyAvailabilityChart()`
- ✅ Função `updateDashboardTotals()`
- ✅ Função `populateDashboardFilters()`

---

## 📁 ONDE COLOCAR

```
public/js/modules/dashboard.js
```

**ATENÇÃO:** Crie a pasta `modules` dentro de `public/js/` se não existir!

---

## 🔧 PASSO A PASSO - INTEGRAÇÃO

### PASSO 1: Criar pasta e copiar arquivo

#### 1.1 - Criar pasta modules
```
C:\Projetos\ECS-System-Empresa\public\js\modules\
```

#### 1.2 - Copiar o arquivo para:
```
C:\Projetos\ECS-System-Empresa\public\js\modules\dashboard.js
```

---

### PASSO 2: Modificar o index.html

Abra `public/index.html` e **ADICIONE** esta linha após o navigation.js:

```html
<!-- Módulos -->
<script src="js/config/firebase-config.js" type="module"></script>
<script src="js/state/app-state.js" type="module"></script>
<script src="js/core/utils.js" type="module"></script>
<script src="js/core/auth.js" type="module"></script>
<script src="js/core/navigation.js" type="module"></script>
<script src="js/modules/dashboard.js" type="module"></script>  <!-- ← ADICIONAR -->
<script src="app.js" type="module"></script>
```

---

### PASSO 3: Modificar o app.js

#### 3.1 - ADICIONAR import no topo

Encontre os imports e **ADICIONE** após o import do navigation:

```javascript
import {
    initializeNavigation,
    switchView,
    setupNavigationListeners,
    getOpenedFromTimeline,
    setOpenedFromTimeline
} from './js/core/navigation.js';

// ← ADICIONAR AQUI:
import {
    updateDashboard,
    updateProfileChart,
    updateMonthlyAvailabilityChart,
    populateDashboardFilters
} from './js/modules/dashboard.js';
```

---

#### 3.2 - REMOVER código de dashboard do app.js

Agora vamos **REMOVER** o código de dashboard que foi movido para o módulo.

---

**REMOVER 1: Variáveis de gráficos**

Procure dentro da função `initializeAppLogic()` e **DELETE**:
```javascript
let profileChart = null;
let monthlyAvailabilityChart = null;
```

---

**REMOVER 2: Contadores de retry**

Procure e **DELETE** (se existirem):
```javascript
let profileChartRetries = 0;
const MAX_RETRIES = 10;
```

E também:
```javascript
let monthlyChartRetries = 0;
const MAX_RETRIES_TIMELINE = 10;
```

---

**REMOVER 3: Função updateDashboard**

Procure e **DELETE** toda esta função:
```javascript
function updateDashboard() {
    // ... código ...
}
```

---

**REMOVER 4: Função updateProfileChart**

Procure e **DELETE** toda esta função (ela é GRANDE, ~80 linhas):
```javascript
function updateProfileChart() {
    const canvas = document.getElementById('profile-distribution-chart');
    // ... todo o código até o final da função ...
}
```

---

**REMOVER 5: Função updateMonthlyAvailabilityChart**

Procure e **DELETE** toda esta função (também é grande):
```javascript
function updateMonthlyAvailabilityChart() {
    const canvas = document.getElementById('monthly-availability-chart');
    // ... todo o código até o final da função ...
}
```

---

**REMOVER 6: Função populateDashboardFilters (se existir)**

Procure e **DELETE** se encontrar:
```javascript
function populateDashboardFilters() {
    // ... código ...
}
```

---

## 🧪 PASSO 4: TESTAR

```bash
firebase serve
```

Teste:
- ✅ Dashboard carrega
- ✅ Gráfico de perfil renderiza
- ✅ Gráfico mensal renderiza
- ✅ Cards com totais atualizam
- ✅ Filtros funcionam
- ✅ Console sem erros

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Pasta `public/js/modules/` criada
- [ ] Arquivo `dashboard.js` copiado para `public/js/modules/`
- [ ] `index.html` atualizado com import do módulo
- [ ] Import adicionado no topo do `app.js`
- [ ] Variáveis `profileChart` e `monthlyAvailabilityChart` removidas
- [ ] Contadores de retry removidos
- [ ] Função `updateDashboard()` removida
- [ ] Função `updateProfileChart()` removida
- [ ] Função `updateMonthlyAvailabilityChart()` removida
- [ ] Função `populateDashboardFilters()` removida (se existir)
- [ ] Testado e funcionando

---

## 📊 MÉTRICAS DESTA EXTRAÇÃO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Linhas em app.js | ~3000 | ~2800 |
| Módulos JS | 6 | 7 |
| Dashboard centralizado | ❌ | ✅ |

---

## ⏭️ PRÓXIMO MÓDULO

Após validar este módulo, vamos extrair:
**modules/professionals.js** - Gestão de profissionais
