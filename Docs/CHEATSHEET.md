# 📋 CHEAT SHEET - Comandos Rápidos

## 🚀 INÍCIO RÁPIDO

```bash
# 1. Configuração (apenas 1 vez)
setup.bat

# 2. Menu principal (use sempre)
git-helper.bat
```

---

## 🔥 COMANDOS MAIS USADOS

### Dia a Dia

```bash
# Iniciar trabalho
git-helper.bat → [1] Nova Feature

# Salvar trabalho
git-helper.bat → [2] Commit

# Ver o que mudou
git-helper.bat → [3] Status

# Publicar em DEV
git-helper.bat → [4] Deploy DEV

# Publicar em PRODUÇÃO
git-helper.bat → [5] Deploy PRODUÇÃO
```

---

## 📝 GIT BÁSICO (linha de comando)

```bash
# Ver status
git status

# Ver branch atual
git branch

# Trocar de branch
git checkout nome-da-branch

# Atualizar branch
git pull

# Adicionar arquivos
git add .

# Fazer commit
git commit -m "mensagem"

# Enviar para GitHub
git push

# Ver histórico
git log --oneline
```

---

## 🌿 TRABALHANDO COM BRANCHES

```bash
# Criar nova branch
git checkout -b feature/minha-feature

# Listar branches
git branch -a

# Deletar branch local
git branch -d feature/minha-feature

# Deletar branch remota
git push origin --delete feature/minha-feature

# Atualizar lista de branches
git fetch --prune
```

---

## 🔄 MERGE E SYNC

```bash
# Merge de outra branch para a atual
git merge nome-da-branch

# Atualizar com o remoto
git pull origin nome-da-branch

# Enviar para remoto
git push origin nome-da-branch

# Ver diferenças entre branches
git diff branch1..branch2
```

---

## 🆘 EMERGÊNCIA

```bash
# Descartar todas alterações
git reset --hard HEAD
git clean -fd

# Desfazer último commit (manter alterações)
git reset --soft HEAD~1

# Desfazer último commit (descartar alterações)
git reset --hard HEAD~1

# Cancelar merge
git merge --abort

# Voltar para commit específico (temporário)
git checkout abc1234

# Voltar ao presente
git checkout dev
```

---

## 🔍 INSPEÇÃO

```bash
# Ver alterações não commitadas
git diff

# Ver alterações de um arquivo
git diff arquivo.js

# Ver commits de um autor
git log --author="Seu Nome"

# Ver commits de hoje
git log --since="1 day ago"

# Ver arquivos modificados em um commit
git show abc1234 --name-only

# Ver conteúdo de um commit
git show abc1234
```

---

## 🏷️ TAGS E VERSÕES

```bash
# Criar tag
git tag -a v1.0.0 -m "Versão 1.0.0"

# Enviar tag
git push origin v1.0.0

# Listar tags
git tag

# Deletar tag local
git tag -d v1.0.0

# Deletar tag remota
git push origin --delete v1.0.0

# Checkout de uma tag
git checkout v1.0.0
```

---

## 🔥 FIREBASE

```bash
# Login
firebase login

# Listar projetos
firebase projects:list

# Ver projeto atual
firebase use

# Trocar projeto
firebase use nome-do-projeto

# Adicionar projeto
firebase use --add

# Deploy
firebase deploy

# Deploy apenas hosting
firebase deploy --only hosting

# Deploy apenas functions
firebase deploy --only functions
```

---

## ⚙️ CONFIGURAÇÃO

```bash
# Ver configurações
git config --list

# Configurar nome
git config --global user.name "Seu Nome"

# Configurar email
git config --global user.email "seu@email.com"

# Ver configuração específica
git config user.name

# Ver remotes
git remote -v

# Adicionar remote
git remote add origin URL
```

---

## 📊 ATALHOS ÚTEIS VS CODE

| Atalho | Ação |
|--------|------|
| `Ctrl + Shift + P` | Paleta de comandos |
| `Ctrl + Shift + G` | Abrir Git |
| `Ctrl + `` | Abrir terminal |
| `Ctrl + K Ctrl + O` | Abrir pasta |
| `Ctrl + S` | Salvar |
| `Ctrl + Shift + S` | Salvar tudo |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Shift + Z` | Refazer |
| `Ctrl + F` | Buscar |
| `Ctrl + H` | Buscar e substituir |

---

## 🎯 WORKFLOW RECOMENDADO

```
1. git checkout dev
2. git pull origin dev
3. git checkout -b feature/nova-feature
4. (fazer alterações)
5. git add .
6. git commit -m "mensagem"
7. git push origin feature/nova-feature
8. git checkout dev
9. git merge feature/nova-feature
10. git push origin dev
11. firebase use dev && firebase deploy
12. (testar)
13. git checkout main
14. git merge dev
15. git push origin main
16. firebase use production && firebase deploy
17. git tag -a v1.0.0 -m "Versão 1.0.0"
18. git push origin v1.0.0
```

**OU simplesmente use os scripts!** 😉

---

## 💡 DICAS RÁPIDAS

- ✅ Commite pelo menos 1x por dia
- ✅ Faça commits pequenos e frequentes
- ✅ Use mensagens descritivas
- ✅ Sempre teste em DEV primeiro
- ✅ Faça pull antes de começar
- ✅ Mantenha .gitignore atualizado
- ❌ Nunca commite senhas ou .env
- ❌ Nunca force push em main/dev
- ❌ Nunca commite node_modules

---

## 🆘 EM CASO DE EMERGÊNCIA

```bash
# Algo deu errado?
emergencia.bat

# Ou ligue para um colega experiente! 😅
```

---

**Imprima este cheat sheet e deixe perto do computador!** 📌
