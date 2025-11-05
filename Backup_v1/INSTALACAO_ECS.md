# ⚡ INSTALAÇÃO RÁPIDA - ECS-System-Empresa

## 🎯 VERSÃO CUSTOMIZADA PARA SEU PROJETO

Este pacote foi **adaptado especificamente** para o projeto ECS-System-Empresa!

### ✅ O que foi ajustado:

1. **Deploy em DEV:** `firebase deploy --only hosting -P dev`
2. **Deploy em PRD:** `firebase deploy --only hosting -P prd`
3. **Repositório:** https://github.com/santosce/ECS-System-Empresa
4. **Estrutura:** Adaptada para sua pasta `.firebase` e `public`

---

## 📦 O QUE VOCÊ TEM

- 8 scripts automatizados (.bat) - **CORRIGIDOS**
- 6 guias completos (.md)
- 2 arquivos de configuração

**Total: 16 arquivos customizados para seu projeto**

---

## 🚀 INSTALAÇÃO EM 3 PASSOS

### 1️⃣ EXTRAIR NA RAIZ DO PROJETO

Extraia todos os arquivos para:
```
C:\Projetos\ECS-System-Empresa\
```

**IMPORTANTE:** Os scripts devem ficar na **mesma pasta** onde estão:
- `.firebase`
- `.git`
- `public`
- `.firebaserc`
- `firebase.json`

### 2️⃣ EXECUTAR SETUP

```bash
# Abra o terminal (CMD ou VS Code Terminal)
# Navegue até a pasta:
cd C:\Projetos\ECS-System-Empresa

# Execute:
setup.bat
```

O script vai:
- ✅ Verificar Git, Node.js, Firebase CLI
- ✅ Configurar credenciais
- ✅ Testar seus projetos Firebase (dev e prd)
- ✅ Criar/atualizar branches

### 3️⃣ USAR O MENU

```bash
git-helper.bat
```

**Pronto!** Você já pode usar todos os recursos! 🎉

---

## 🎯 COMANDOS ESPECÍFICOS DO SEU PROJETO

### Deploy em DEV
```bash
git-helper.bat → [4] Deploy em DEV
# Ou manualmente:
firebase deploy --only hosting -P dev
```

### Deploy em PRODUÇÃO
```bash
git-helper.bat → [5] Deploy em PRODUÇÃO
# Ou manualmente:
firebase deploy --only hosting -P prd
```

---

## 📋 CHECKLIST ANTES DE COMEÇAR

Verifique se você tem instalado:

- [ ] **Git** (https://git-scm.com/downloads)
- [ ] **Node.js** (https://nodejs.org/)
- [ ] **Firebase CLI** (`npm install -g firebase-tools`)
- [ ] Acesso ao repositório santosce/ECS-System-Empresa
- [ ] Permissões nos projetos Firebase dev e prd

---

## 🔍 VERIFICAÇÃO RÁPIDA

Execute estes comandos para ter certeza que está tudo OK:

```bash
# 1. Verificar versões
git --version
node --version
firebase --version

# 2. Verificar Firebase
firebase login
firebase projects:list
# Deve listar seus projetos dev e prd

# 3. Verificar repositório
git remote -v
# Deve mostrar: github.com/santosce/ECS-System-Empresa

# 4. Verificar branches
git branch
# Deve mostrar pelo menos: main e dev
```

---

## 🎯 WORKFLOW DO SEU PROJETO

```
┌─────────────────────────────────────┐
│ 1. INICIAR TAREFA                   │
│    git-helper.bat → [1]             │
│    Digite: feature/nome-da-tarefa   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. TRABALHAR                        │
│    Edite seus arquivos em:          │
│    - public/                        │
│    - Outros arquivos do projeto     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. SALVAR                           │
│    git-helper.bat → [2]             │
│    Digite mensagem descritiva       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. TESTAR EM DEV                    │
│    git-helper.bat → [4]             │
│    firebase deploy -P dev           │
│    Teste no ambiente DEV            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. PUBLICAR EM PRD                  │
│    git-helper.bat → [5]             │
│    firebase deploy -P prd           │
│    Digite número da versão          │
└─────────────────────────────────────┘
```

---

## 📁 ESTRUTURA APÓS INSTALAÇÃO

```
C:\Projetos\ECS-System-Empresa\
│
├── 🤖 SCRIPTS (novos!)
│   ├── git-helper.bat         ← Use este!
│   ├── setup.bat              ← Execute primeiro
│   ├── deploy-dev.bat         ← Deploy DEV (corrigido)
│   ├── deploy-producao.bat    ← Deploy PRD (corrigido)
│   ├── nova-feature.bat
│   ├── commit.bat
│   ├── status.bat
│   └── emergencia.bat
│
├── 📖 DOCUMENTAÇÃO (novos!)
│   ├── README-ECS.md          ← Específico do seu projeto
│   ├── README.md              ← Geral
│   ├── INSTALACAO_RAPIDA.md   ← Este arquivo
│   ├── COMMIT_GUIDE.md
│   ├── CHEATSHEET.md
│   └── TROUBLESHOOTING.md
│
├── ⚙️ CONFIGURAÇÃO (novos!)
│   ├── .gitignore
│   └── vscode-settings.json
│
└── 📁 SEUS ARQUIVOS (existentes)
    ├── .firebase/
    ├── .git/
    ├── public/
    ├── .firebaserc
    ├── firebase.json
    ├── .gitignore (será atualizado)
    └── outros arquivos...
```

---

## 🆘 PROBLEMAS COMUNS

### "Firebase não encontra projeto dev/prd"

```bash
# Liste os projetos
firebase projects:list

# Se dev/prd não aparecer, adicione:
# Abra .firebaserc e adicione:
{
  "projects": {
    "dev": "seu-projeto-dev",
    "prd": "seu-projeto-prd"
  }
}
```

### "Não consigo fazer deploy"

```bash
# Verifique se está na pasta correta
cd C:\Projetos\ECS-System-Empresa

# Verifique se firebase.json existe
dir firebase.json

# Tente login novamente
firebase login

# Teste deploy manual
firebase deploy --only hosting -P dev --debug
```

### "Scripts não executam"

```bash
# Certifique-se de estar na pasta do projeto
cd C:\Projetos\ECS-System-Empresa

# Execute com .\
.\git-helper.bat

# Ou clique direito → Executar como administrador
```

---

## 💡 DIFERENÇAS IMPORTANTES

### Scripts ANTES (genéricos):
```bash
firebase use dev
firebase deploy
```

### Scripts AGORA (seu projeto):
```bash
firebase deploy --only hosting -P dev
firebase deploy --only hosting -P prd
```

**Por quê?** Seus scripts foram customizados para usar o método `-P` que você já estava usando!

---

## 📚 PRÓXIMOS PASSOS

1. ✅ Execute `setup.bat`
2. ✅ Leia `README-ECS.md` (específico do seu projeto)
3. ✅ Teste `git-helper.bat`
4. ✅ Crie uma feature de teste
5. ✅ Faça um commit de teste
6. ✅ Teste deploy em DEV
7. ✅ Consulte `CHEATSHEET.md` quando precisar

---

## 🎓 DOCUMENTAÇÃO RECOMENDADA

**Para seu projeto:**
1. **README-ECS.md** ← Específico do ECS-System-Empresa
2. **INSTALACAO_RAPIDA.md** ← Este arquivo

**Documentação geral:**
3. **README.md** ← Guia completo
4. **CHEATSHEET.md** ← Comandos rápidos
5. **TROUBLESHOOTING.md** ← Solução de problemas

---

## ✅ CHECKLIST FINAL

- [ ] Extraí todos os arquivos na raiz do projeto
- [ ] Executei `setup.bat`
- [ ] Firebase CLI instalado e logado
- [ ] Projetos dev e prd configurados
- [ ] Testei `git-helper.bat`
- [ ] Li `README-ECS.md`
- [ ] Fiz um commit de teste
- [ ] Testei deploy em DEV

---

## 🎉 ESTÁ PRONTO!

Você agora tem um ambiente profissional customizado para o **ECS-System-Empresa**!

**Use `git-helper.bat` todos os dias e consulte os guias quando precisar.**

---

**Projeto:** ECS-System-Empresa  
**Desenvolvedor:** santosce  
**Scripts Version:** 1.0.1 (Customizado)  
**Data:** Novembro 2025

---

📌 **Dúvidas?** Consulte README-ECS.md ou TROUBLESHOOTING.md

🚀 **Bom trabalho!**
