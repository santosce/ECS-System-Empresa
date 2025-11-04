# 🚀 Scripts de Automação - ECS-System-Empresa

Scripts para automatizar o workflow de desenvolvimento do projeto ECS-System-Empresa com Git, GitHub e Firebase.

## 📦 Sobre o Projeto

- **Repositório:** https://github.com/santosce/ECS-System-Empresa
- **Firebase DEV:** Usa comando `firebase deploy --only hosting -P dev`
- **Firebase PRD:** Usa comando `firebase deploy --only hosting -P prd`

## 🎯 Scripts Atualizados

Os scripts foram ajustados especificamente para seu projeto:

### ✅ Mudanças nos Scripts de Deploy

**Antes (genérico):**
```bash
firebase use dev
firebase deploy
```

**Agora (seu projeto):**
```bash
firebase deploy --only hosting -P dev
firebase deploy --only hosting -P prd
```

## 📋 Instalação

### 1. Copiar Scripts para o Projeto

Coloque todos os arquivos `.bat` na raiz do seu projeto:

```
C:\Projetos\ECS-System-Empresa\
├── git-helper.bat
├── nova-feature.bat
├── commit.bat
├── deploy-dev.bat           ← CORRIGIDO
├── deploy-producao.bat      ← CORRIGIDO
├── emergencia.bat
├── status.bat
├── setup.bat                ← CORRIGIDO
├── COMMIT_GUIDE.md
├── .gitignore
│
├── .firebase\               ← Seus arquivos
├── .git\
├── public\
└── ...outros arquivos...
```

### 2. Executar Setup

```bash
setup.bat
```

O script vai:
- ✅ Verificar Git, Node.js e Firebase CLI
- ✅ Configurar suas credenciais
- ✅ Testar conexão com Firebase
- ✅ Verificar branches dev e main
- ✅ Atualizar branches do GitHub

### 3. Usar o Menu Principal

```bash
git-helper.bat
```

## 🔄 Workflow Diário

### 🌅 Começar Nova Tarefa

```bash
git-helper.bat → [1] Iniciar Nova Feature
# Digite: feature/nome-da-tarefa
```

### 💻 Durante o Trabalho

1. Edite seus arquivos
2. Salve (Ctrl + S)
3. Execute:

```bash
git-helper.bat → [2] Salvar Alterações (Commit)
# Digite mensagem descritiva
```

### 🧪 Testar em DEV

```bash
git-helper.bat → [4] Deploy em DEV
# Confirma merge → Deploy automático com: firebase deploy --only hosting -P dev
```

**URLs de DEV:** Verifique no Firebase Console

### 🚀 Publicar em PRODUÇÃO

```bash
git-helper.bat → [5] Deploy em PRODUÇÃO
# Digite versão (ex: 1.0.5)
# Confirma → Deploy automático com: firebase deploy --only hosting -P prd
```

**URLs de PRODUÇÃO:** Verifique no Firebase Console

## 📝 Comandos Firebase Específicos

### Deploy Manual (se precisar)

```bash
# Deploy em DEV
firebase deploy --only hosting -P dev

# Deploy em PRODUÇÃO
firebase deploy --only hosting -P prd

# Ver projetos configurados
firebase projects:list

# Fazer login
firebase login
```

## 🆘 Problemas Comuns

### Firebase não reconhece projetos

```bash
# Faça login novamente
firebase login

# Liste os projetos
firebase projects:list

# Verifique se 'dev' e 'prd' aparecem na lista
```

### Deploy falha

```bash
# Verifique se está na pasta correta
cd C:\Projetos\ECS-System-Empresa

# Verifique se firebase.json existe
dir firebase.json

# Tente deploy com debug
firebase deploy --only hosting -P dev --debug
```

### Branch dev não existe

```bash
# O script setup.bat pode criar
setup.bat

# Ou crie manualmente:
git checkout -b dev
git push origin dev
```

## 📊 Estrutura de Branches

```
main (produção)
  ↑
  └─ dev (desenvolvimento)
      ↑
      └─ feature/nova-funcionalidade (sua tarefa)
```

**Fluxo:**
1. Trabalha em `feature/xxx`
2. Merge em `dev` → Deploy em DEV → Testa
3. Merge em `main` → Deploy em PRD → Versiona

## 🎯 Diferenças deste Pacote

Este pacote foi **customizado** para seu projeto:

✅ Usa `firebase deploy --only hosting -P dev/prd`
✅ Repositório: santosce/ECS-System-Empresa
✅ Estrutura de pastas: .firebase, public, etc
✅ Deploy apenas do hosting (não functions)

## 📚 Documentação Adicional

- **COMMIT_GUIDE.md** - Como escrever bons commits
- **CHEATSHEET.md** - Comandos Git rápidos
- **TROUBLESHOOTING.md** - Solução de problemas
- **INDEX.md** - Índice completo

## 💡 Dicas para seu Projeto

### Antes de Fazer Deploy em PRD

- [ ] Testou em DEV?
- [ ] Verificou console do navegador (F12)?
- [ ] Testou em diferentes navegadores?
- [ ] Fez backup do código atual?
- [ ] Definiu número de versão?

### Boas Práticas

```bash
# Commite frequentemente
git add .
git commit -m "feat: Adicionar validação de CPF"

# Pull antes de começar
git checkout dev
git pull origin dev

# Teste sempre em DEV primeiro
# NUNCA vá direto para PRD!
```

## 🔧 Personalização

### Mudar Nome dos Ambientes

Se você usar outros nomes no Firebase, edite:

**deploy-dev.bat** (linha 62):
```batch
call firebase deploy --only hosting -P SEU-AMBIENTE-DEV
```

**deploy-producao.bat** (linha 80):
```batch
call firebase deploy --only hosting -P SEU-AMBIENTE-PRD
```

## ⚙️ Verificação Rápida

Execute estes comandos para verificar se está tudo OK:

```bash
# 1. Git configurado?
git config user.name
git config user.email

# 2. Firebase funcionando?
firebase --version
firebase login
firebase projects:list

# 3. Repositório correto?
git remote -v
# Deve mostrar: github.com/santosce/ECS-System-Empresa

# 4. Branches OK?
git branch -a
# Deve mostrar: main e dev
```

## 📞 Suporte

Se tiver problemas:

1. Consulte **TROUBLESHOOTING.md**
2. Execute `status.bat` para ver o estado atual
3. Execute `emergencia.bat` se algo deu errado
4. Verifique os logs do Firebase Console

## 🎓 Comandos Úteis Específicos

```bash
# Ver estrutura do projeto
dir /b

# Ver arquivo firebase.json
type firebase.json

# Ver arquivo .firebaserc
type .firebaserc

# Histórico de deploys
firebase hosting:channel:list

# Ver status Git completo
git status
git log --oneline -10
```

## ✅ Checklist Pós-Instalação

- [ ] Scripts copiados para raiz do projeto
- [ ] Executei `setup.bat`
- [ ] Firebase CLI instalado e logado
- [ ] Testei `git-helper.bat`
- [ ] Deploy em DEV funcionou
- [ ] Li o README.md completo

---

**Projeto:** ECS-System-Empresa  
**Desenvolvedor:** santosce  
**Versão dos Scripts:** 1.0.1 (Customizado)  
**Data:** Novembro 2025

---

🚀 **Pronto para começar a desenvolver!**
