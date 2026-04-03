# 📊 ECS System - Employee Capacity System

> Sistema de Gestão de Capacidade de Profissionais e Projetos

![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production-success.svg)
![Firebase](https://img.shields.io/badge/firebase-11.6.1-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Módulos](#módulos)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)
- [Contribuindo](#contribuindo)
- [Autores](#autores)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

O **ECS System (Employee Capacity System)** é um sistema web de gestão de alocação de profissionais em projetos, desenvolvido para otimizar o planejamento de recursos humanos e controle de capacidade de equipes.

### Principais Características:

- ✅ **Gestão de Profissionais** - Cadastro e acompanhamento de colaboradores
- ✅ **Gestão de Projetos** - Controle de portfólio de projetos
- ✅ **Alocação de Recursos** - Distribuição de profissionais em projetos com controle de porcentagem
- ✅ **Dashboard Analítico** - Métricas em tempo real de ocupação e disponibilidade
- ✅ **Timeline/Gantt** - Visualização cronológica de alocações
- ✅ **Importação Kimai** - Integração com sistema de time tracking
- ✅ **Controle de Acesso** - Sistema de permissões (Admin/Editor/Viewer)
- ✅ **Sincronização em Tempo Real** - Firestore real-time updates

---

## 🚀 Funcionalidades

### 📊 Dashboard
- Gráfico de perfil de profissionais
- Disponibilidade mensal por profissional
- Totalizadores (profissionais, projetos, alocações)
- Análise de prazos (planejado vs realizado)
- Horas alocadas por mês

### 👥 Profissionais
- CRUD completo de profissionais
- Filtros por nome, perfil, time, empresa
- Campos: nome, perfil, time, empresa, líder, faturado, senioridade, status
- Ordenação alfabética

### 📁 Projetos
- CRUD completo de projetos
- Filtros por nome, cliente, status
- Campos: nome, cliente, tipo, datas previstas, datas reais, horas estimadas, status
- Análise de desvio de prazo
- Formatação de datas (DD/MM/YYYY)

### 📅 Alocações
- CRUD completo de alocações
- Validação de conflitos (máximo 100% por profissional)
- Filtros por profissional e projeto
- Relacionamento entre profissional ↔ projeto
- Cálculo automático de disponibilidade
- Detecção de sobreposição de períodos

### 📈 Timeline
- Visualização Gantt de todas as alocações
- Agrupamento por profissional
- Linha indicadora do dia atual
- Filtros dinâmicos
- Integração com Google Charts

### ⏱️ Importação Kimai
- Upload de arquivos Excel (.xlsx)
- Parse automático de colunas (Usuário, Projeto, Duração, Data)
- Match inteligente de projetos
- Conversão de duração (HH:MM:SS → horas)
- Feedback de progresso

### 👤 Gestão de Usuários (Admin)
- CRUD de usuários
- Definição de permissões (admin/editor/viewer)
- Proteção contra auto-remoção
- Badges coloridos por role

---

## 🛠️ Tecnologias

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3 / Tailwind CSS** - Estilização responsiva
- **JavaScript ES6+ (Vanilla)** - Lógica e interatividade
- **Google Charts** - Visualizações (Timeline, Gráficos)
- **Chart.js** - Gráficos de dashboard

### Backend/Database
- **Firebase Authentication** - Autenticação de usuários
- **Cloud Firestore** - Banco de dados NoSQL em tempo real
- **Firebase Hosting** - Hospedagem de aplicação web

### Build/Deploy
- **Firebase CLI** - Deploy e configuração
- **Git/GitHub** - Controle de versão
- **Firebase Projects** - Ambientes (dev/prd)

### Libraries
- **SheetJS (XLSX)** - Leitura de arquivos Excel
- **date-fns** (planejado) - Manipulação de datas

---

## 🏗️ Arquitetura

O sistema segue uma **arquitetura modular** baseada em separação de responsabilidades:

```
┌─────────────────────────────────────────────────┐
│                  index.html                     │
│              (Entry Point)                      │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │  Core   │   │  State  │   │ Modules │
  │ Modules │   │  Mgmt   │   │Feature  │
  └─────────┘   └─────────┘   └─────────┘
        │             │             │
        │             │             │
        ▼             ▼             ▼
  ┌─────────────────────────────────────┐
  │        Firebase Services            │
  │  (Auth, Firestore, Hosting)         │
  └─────────────────────────────────────┘
```

### Camadas:

1. **Core Layer** - Funcionalidades base (auth, utils, navigation)
2. **State Layer** - Gerenciamento de estado global
3. **Module Layer** - Features isoladas (dashboard, professionals, etc)
4. **Service Layer** - Integração Firebase

---

## 📦 Instalação

### Pré-requisitos

- Node.js >= 14.x
- npm >= 6.x ou yarn >= 1.22
- Firebase CLI (`npm install -g firebase-tools`)
- Conta Firebase (https://firebase.google.com)

### Passo a Passo

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/ECS-System-Empresa.git
cd ECS-System-Empresa
```

2. **Instale as dependências:**
```bash
npm install
# ou
yarn install
```

3. **Configure o Firebase:**
```bash
firebase login
firebase init
```

4. **Configure as variáveis de ambiente:**

Crie um arquivo `public/js/config/firebase-config.js` (já existe no projeto):

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "seu-app-id"
};
```

5. **Rode localmente:**
```bash
firebase serve
# ou
npm run serve
```

Acesse: `http://localhost:5000`

---

## ⚙️ Configuração

### Firebase Setup

1. **Criar projeto no Firebase Console:**
   - Acesse https://console.firebase.google.com
   - Crie novo projeto
   - Ative Authentication (Email/Password)
   - Ative Firestore Database
   - Ative Hosting

2. **Configurar Firestore Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Funções auxiliares
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role;
    }
    
    function isAdmin() {
      return isSignedIn() && getUserRole() == 'admin';
    }
    
    function isEditor() {
      return isSignedIn() && (getUserRole() == 'admin' || getUserRole() == 'editor');
    }
    
    // Collections
    match /{tenant}/profissionais/{document=**} {
      allow read: if isSignedIn();
      allow write: if isEditor();
    }
    
    match /{tenant}/projetos/{document=**} {
      allow read: if isSignedIn();
      allow write: if isEditor();
    }
    
    match /{tenant}/alocacoes/{document=**} {
      allow read: if isSignedIn();
      allow write: if isEditor();
    }
    
    match /{tenant}/users/{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    match /{tenant}/kimai/{document=**} {
      allow read: if isSignedIn();
      allow write: if isEditor();
    }
  }
}
```

3. **Criar primeiro usuário admin:**

No Firebase Console > Authentication > Add User:
- Email: admin@empresa.com
- Password: (defina senha segura)

No Firestore > Criar collection `users`:
```json
{
  "email": "admin@empresa.com",
  "displayName": "Admin",
  "role": "admin"
}
```

---

## 💻 Uso

### Login

Acesse o sistema e faça login com suas credenciais Firebase.

### Navegação

O menu lateral permite acesso às funcionalidades:
- **Dashboard** - Visão geral e métricas
- **Profissionais** - Gestão de colaboradores
- **Projetos** - Gestão de projetos
- **Alocações** - Distribuição de recursos
- **Linha do Tempo** - Visualização Gantt
- **Importar Kimai** - Upload de horas
- **Gerenciar Usuários** - Controle de acesso (admin)

### Workflow Típico

1. **Cadastrar Profissionais** → View Profissionais
2. **Cadastrar Projetos** → View Projetos
3. **Alocar Profissionais em Projetos** → View Alocações
4. **Acompanhar Métricas** → Dashboard
5. **Visualizar Timeline** → Linha do Tempo

---

## 📂 Estrutura de Pastas

```
ECS-System-Empresa/
│
├── public/                          # Arquivos públicos
│   ├── index.html                   # Entry point
│   ├── styles.css                   # Estilos globais
│   ├── app.js                       # Orquestrador principal
│   │
│   ├── js/                          # Módulos JavaScript
│   │   ├── config/                  # Configurações
│   │   │   └── firebase-config.js   # Config Firebase
│   │   │
│   │   ├── state/                   # Gerenciamento de estado
│   │   │   └── app-state.js         # Estado global
│   │   │
│   │   ├── core/                    # Módulos core
│   │   │   ├── utils.js             # Funções utilitárias
│   │   │   ├── auth.js              # Autenticação
│   │   │   └── navigation.js        # Navegação entre views
│   │   │
│   │   └── modules/                 # Módulos de features
│   │       ├── dashboard.js         # Dashboard e gráficos
│   │       ├── professionals.js     # CRUD Profissionais
│   │       ├── projects.js          # CRUD Projetos
│   │       ├── allocations.js       # CRUD Alocações
│   │       ├── users.js             # CRUD Usuários
│   │       ├── timeline.js          # Visualização Gantt
│   │       └── kimai.js             # Importação Kimai
│   │
│   └── tests/                       # Testes unitários
│       ├── allocations.test.html
│       └── mocks/
│           ├── app-state.mock.js
│           ├── firebase-config.mock.js
│           ├── firestore.mock.js
│           ├── navigation.mock.js
│           └── utils.mock.js
│
├── .firebaserc                      # Configuração Firebase CLI
├── firebase.json                    # Configuração Firebase Hosting
├── .gitignore                       # Arquivos ignorados pelo Git
├── package.json                     # Dependências Node
└── README.md                        # Este arquivo
```

---

## 🧩 Módulos

### 📋 Core Modules

#### `firebase-config.js`
Configuração centralizada do Firebase SDK.

**Exports:**
- `initializeFirebase()` - Inicializa Firebase
- `getDb()` - Retorna instância Firestore

#### `app-state.js`
Gerenciamento de estado global da aplicação.

**Exports:**
- `getProfissionais()`, `setProfissionais()`
- `getProjetos()`, `setProjetos()`
- `getAlocacoes()`, `setAlocacoes()`
- `getUsers()`, `setUsers()`

#### `utils.js`
Funções utilitárias reutilizáveis.

**Exports:**
- `showNotification(message, type)` - Exibe toast
- `formatDate(dateString)` - Formata data para DD/MM/YYYY
- `getCollectionPath(collection)` - Retorna path com tenant

#### `auth.js`
Gerenciamento de autenticação.

**Exports:**
- `setupAuthListener()` - Listener de estado de auth
- `loginUser(email, password)` - Login
- `logoutUser()` - Logout
- `isAdmin()`, `isEditor()` - Verificação de permissões
- `getCurrentUserId()` - ID do usuário logado

#### `navigation.js`
Sistema de navegação entre views.

**Exports:**
- `initializeNavigation()` - Configura navegação
- `showView(viewName)` - Exibe view específica

---

### 🎯 Feature Modules

#### `dashboard.js`
Dashboard com métricas e gráficos.

**Exports:**
- `updateDashboard()` - Atualiza todos os gráficos
- `updateProfileChart()` - Gráfico de perfis
- `updateMonthlyAvailabilityChart()` - Disponibilidade mensal
- `updateDashboardTotals()` - Totalizadores

**Dependências:** Chart.js, Google Charts

#### `professionals.js`
CRUD de profissionais.

**Exports:**
- `renderProfissionais()` - Renderiza tabela
- `openProfissionalModal(id?)` - Abre modal
- `saveProfissional(event)` - Salva profissional
- `deleteProfissional(id)` - Deleta profissional
- `initializeProfessionalsModule()` - Inicializa módulo

#### `projects.js`
CRUD de projetos.

**Exports:**
- `renderProjetos()` - Renderiza tabela
- `openProjetoModal(id?)` - Abre modal
- `saveProjeto(event)` - Salva projeto
- `deleteProjeto(id)` - Deleta projeto
- `initializeProjectsModule()` - Inicializa módulo

#### `allocations.js`
CRUD de alocações com validações complexas.

**Exports:**
- `renderAlocacoes()` - Renderiza tabela
- `openAlocacaoModal(id?)` - Abre modal
- `saveAlocacao(event)` - Salva alocação (com validação)
- `deleteAlocacao(id)` - Deleta alocação
- `populateAlocacoesFilters()` - Popula filtros
- `initializeAllocationsModule()` - Inicializa módulo

**Features Especiais:**
- Validação de conflitos (máximo 100% por profissional)
- Detecção de sobreposição de datas
- Cálculo automático de disponibilidade

#### `users.js`
CRUD de usuários (apenas admin).

**Exports:**
- `renderUsersTable()` - Renderiza tabela
- `openUserModal(id?)` - Abre modal
- `saveUser(event)` - Salva usuário
- `deleteUser(id)` - Deleta usuário (com proteção)
- `initializeUsersModule()` - Inicializa módulo

#### `timeline.js`
Visualização Gantt de alocações.

**Exports:**
- `drawTimelineChart()` - Desenha timeline
- `initializeTimelineModule()` - Inicializa módulo

**Dependências:** Google Charts

#### `kimai.js`
Importação de dados do Kimai (Excel).

**Exports:**
- `processKimaiFile(file)` - Processa arquivo
- `initializeKimaiModule()` - Inicializa módulo

**Dependências:** SheetJS (XLSX)

---

## 👨‍💻 Desenvolvimento

### Padrões de Código

#### Estrutura de Módulo
```javascript
// ===== MODULE NAME =====
// Descrição do módulo

import { dependencies } from './path.js';

// ===== FUNÇÕES EXPORTADAS =====
export function myFunction() {
    // código
}

// ===== FUNÇÕES INTERNAS =====
function internalFunction() {
    // código
}

// ===== INICIALIZAR MÓDULO =====
export function initializeModule() {
    console.log('✅ Módulo inicializado');
    // setup
}

// ===== EXPORT DEFAULT =====
export default {
    myFunction,
    initializeModule
};
```

#### Convenções

- **Nomenclatura:**
  - Funções: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`
  - Classes: `PascalCase`

- **Imports:**
  - Sempre use imports nomeados
  - Ordene alfabeticamente

- **Event Delegation:**
  - Use para botões criados dinamicamente
  - Exemplo: `#main-actions` para botões de ação

- **IDs HTML:**
  - Sempre verifique IDs reais antes de usar `getElementById()`
  - Preferir IDs diretos a query selectors

- **Formatação de Datas:**
  - Sempre use `formatDate()` para exibição
  - Padrão: DD/MM/YYYY

### Adicionando um Novo Módulo

1. **Criar arquivo em `public/js/modules/`:**
```javascript
// public/js/modules/new-feature.js
export function initializeNewFeatureModule() {
    console.log('🆕 Novo módulo inicializado');
}
```

2. **Adicionar script no `index.html`:**
```html
<script src="js/modules/new-feature.js" type="module"></script>
```

3. **Importar no `app.js`:**
```javascript
import { initializeNewFeatureModule } from './js/modules/new-feature.js';
```

4. **Inicializar em `initializeAppLogic()`:**
```javascript
function initializeAppLogic() {
    // ...
    initializeNewFeatureModule();
}
```

### Debugging

**Logs Estruturados:**
```javascript
console.log('✅ Sucesso:', data);
console.warn('⚠️ Aviso:', message);
console.error('❌ Erro:', error);
```

**Console Firebase:**
```bash
# Ver logs do Firestore
firebase serve --debug

# Ver logs de hosting
firebase deploy --debug
```

### Testes

**Rodar testes unitários:**
```bash
# Abrir no navegador
open public/tests/allocations.test.html
```

**Criar novo teste:**
1. Criar arquivo `[module].test.html` em `public/tests/`
2. Criar mocks necessários em `public/tests/mocks/`
3. Implementar casos de teste

---

## 🚀 Deploy

### Ambientes

O projeto possui 2 ambientes configurados:

- **dev** - Desenvolvimento/Staging
- **prd** - Produção

### Deploy para DEV

```bash
# Testar localmente
firebase serve

# Deploy para dev
firebase deploy --only hosting -P dev
```

### Deploy para PRODUÇÃO

```bash
# 1. Merge para main
git checkout main
git merge dev
git push origin main

# 2. Criar tag de versão
git tag -a v4.0.0 -m "Release v4.0.0"
git push origin v4.0.0

# 3. Deploy para produção
firebase deploy --only hosting -P prd
```

### Rollback

```bash
# Listar versões
firebase hosting:channel:list

# Fazer rollback
firebase hosting:rollback
```

---

## 🔧 Troubleshooting

### Problema: "Permission Denied" no Firestore

**Solução:**
- Verifique as Security Rules no Firebase Console
- Confirme que o usuário está autenticado
- Confirme que o usuário tem a role correta

### Problema: Gráficos não renderizam

**Solução:**
- Verifique se Google Charts foi carregado: `typeof google !== 'undefined'`
- Verifique se o container existe: `document.getElementById('chart-id')`
- Verifique console para erros

### Problema: Modal não abre

**Solução:**
- Verifique se o ID do modal está correto
- Confirme que `initializeModule()` foi chamado
- Verifique event delegation em `#main-actions`

### Problema: Datas em formato errado

**Solução:**
- Use sempre `formatDate()` de `utils.js`
- Verifique se está importado: `import { formatDate } from '../core/utils.js'`

### Problema: Listener duplicado

**Solução:**
- Garanta que `initializeModule()` é chamado apenas 1 vez
- Use `removeEventListener` antes de `addEventListener` se necessário

---

## 📝 Changelog

### [4.0.0] - 2024-04-02

#### ✨ Added (Refatoração Completa)
- Arquitetura modular com 12 módulos independentes
- Separação de responsabilidades (core/state/modules)
- Sistema de testes unitários
- Ordenação alfabética de profissionais e projetos
- Formatação padronizada de datas (DD/MM/YYYY)
- Cálculo correto de horas mensais com múltiplas alocações
- Filtro de status funcional na análise de prazos
- Posicionamento correto da linha "hoje" na timeline com filtros

#### 🔧 Changed
- `app.js` reduzido de 3400 para 1400 linhas
- Todos os módulos extraídos para arquivos separados
- Event delegation implementado para botões dinâmicos
- Listeners de Firestore centralizados e com cleanup

#### 🐛 Fixed
- 25+ bugs corrigidos durante refatoração
- Infinite loops em funções recursivas (MAX_RETRIES)
- Validação de conflitos de alocação
- Formatação de datas em todas as views
- IDs HTML incorretos em múltiplos módulos
- Filtros não funcionando em profissionais e projetos
- Modal não salvando todos os campos
- Listeners duplicados

#### 🗑️ Removed
- Código duplicado
- Funções não utilizadas
- Objetos `modals` e `forms` obsoletos

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork o projeto**
2. **Crie uma branch para sua feature:**
   ```bash
   git checkout -b feature/minha-feature
   ```
3. **Commit suas mudanças:**
   ```bash
   git commit -m "feat: Adicionar minha feature"
   ```
4. **Push para a branch:**
   ```bash
   git push origin feature/minha-feature
   ```
5. **Abra um Pull Request**

### Padrão de Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Tarefas gerais

---

## 👥 Autores

**Cesar Santos**
- GitHub: [@santosce](https://github.com/santosce)
- Email: cesar.santos@ecs.com.br

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

- Firebase Team pela excelente plataforma
- Google Charts pela biblioteca de visualização
- Chart.js pelo framework de gráficos
- Comunidade open-source

---

## 📞 Suporte

Para suporte, entre em contato:
- Email: suporte@ecs.com.br
- Issues: https://github.com/seu-usuario/ECS-System-Empresa/issues

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela! ⭐**

Made with ❤️ by Cesar Santos

</div>
