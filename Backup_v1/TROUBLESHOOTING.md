# 🔧 GUIA DE SOLUÇÃO DE PROBLEMAS

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### 1. "Git não é reconhecido como comando"

**Causa:** Git não está instalado ou não está no PATH

**Solução:**
```bash
# 1. Baixe e instale o Git
# https://git-scm.com/downloads

# 2. Durante a instalação, marque "Add to PATH"

# 3. Feche e abra o terminal novamente

# 4. Teste:
git --version
```

---

### 2. "Firebase não é reconhecido como comando"

**Causa:** Firebase CLI não está instalado

**Solução:**
```bash
# 1. Instale o Node.js primeiro
# https://nodejs.org/

# 2. Instale o Firebase CLI
npm install -g firebase-tools

# 3. Teste:
firebase --version

# 4. Faça login
firebase login
```

---

### 3. "Permission denied" ao fazer push

**Causa:** Não está autenticado no GitHub

**Solução:**
```bash
# Método 1: Usando VS Code
# 1. Clique no ícone de conta no VS Code
# 2. Faça login com GitHub

# Método 2: Usando token
# 1. Vá em GitHub → Settings → Developer settings → Personal access tokens
# 2. Crie um token
# 3. Use o token como senha ao fazer push
```

---

### 4. "Merge conflict" / Conflito de Merge

**Causa:** Duas pessoas editaram o mesmo arquivo

**Solução:**
```bash
# 1. Abra os arquivos com conflito no VS Code
# 2. Você verá marcações como:
<<<<<<< HEAD
seu código
=======
código de outra pessoa
>>>>>>> branch-name

# 3. Escolha qual versão manter ou combine ambas
# 4. Remova as marcações <<<<<<, =======, >>>>>>>
# 5. Salve o arquivo
# 6. Faça commit:
git add .
git commit -m "Resolvido conflito de merge"
git push
```

---

### 5. "Detached HEAD state"

**Causa:** Você fez checkout de um commit específico

**Solução:**
```bash
# Voltar para uma branch normal:
git checkout dev
# ou
git checkout main
```

---

### 6. "Your branch is behind 'origin/main'"

**Causa:** Existem commits no GitHub que você não tem localmente

**Solução:**
```bash
# Atualizar sua branch:
git pull origin main
```

---

### 7. "Your branch is ahead of 'origin/main'"

**Causa:** Você tem commits locais que não foram enviados

**Solução:**
```bash
# Enviar seus commits:
git push origin main
```

---

### 8. Commitei arquivo errado (senha, .env, etc)

**Causa:** Arquivo sensível foi commitado por engano

**Solução:**
```bash
# Se ainda NÃO fez push:
git reset --soft HEAD~1
# Remove o arquivo
git reset HEAD arquivo-sensivel.txt
# Adicione ao .gitignore
echo arquivo-sensivel.txt >> .gitignore
git add .gitignore
git commit -m "Adicionar arquivo sensível ao .gitignore"

# Se JÁ fez push (CUIDADO!):
# 1. Adicione ao .gitignore primeiro
# 2. Remove do Git mas mantém no disco
git rm --cached arquivo-sensivel.txt
git commit -m "Remover arquivo sensível"
git push

# 3. IMPORTANTE: Mude as senhas/tokens expostos!
```

---

### 9. "Failed to push some refs"

**Causa:** Alguém fez push antes de você

**Solução:**
```bash
# 1. Baixe as mudanças
git pull --rebase origin main

# 2. Se houver conflitos, resolva-os

# 3. Continue o rebase
git rebase --continue

# 4. Tente push novamente
git push origin main
```

---

### 10. Quero desfazer o último commit

**Solução:**
```bash
# Manter as alterações:
git reset --soft HEAD~1

# Descartar as alterações:
git reset --hard HEAD~1

# Criar commit reverso (mais seguro):
git revert HEAD
```

---

### 11. Mudei de branch e minhas alterações sumiram

**Causa:** Alterações não foram commitadas antes de trocar de branch

**Solução:**
```bash
# Voltar para a branch original:
git checkout nome-da-branch-anterior

# Suas alterações devem estar lá!
# Faça commit antes de trocar de branch novamente
```

---

### 12. "Please commit your changes or stash them"

**Causa:** Tentou trocar de branch com alterações não salvas

**Solução:**
```bash
# Opção 1: Commitar as alterações
git add .
git commit -m "WIP: trabalho em progresso"

# Opção 2: Guardar temporariamente (stash)
git stash
git checkout outra-branch
# Quando voltar:
git checkout branch-original
git stash pop
```

---

### 13. Firebase deploy falhou

**Causa:** Várias possíveis

**Soluções:**
```bash
# 1. Verificar se está logado
firebase login

# 2. Verificar projeto atual
firebase use

# 3. Verificar se firebase.json está correto
type firebase.json

# 4. Verificar permissões no Firebase Console

# 5. Limpar cache e tentar novamente
firebase deploy --only hosting --debug
```

---

### 14. Node_modules está no Git

**Causa:** Não adicionou ao .gitignore antes de commitar

**Solução:**
```bash
# 1. Adicionar ao .gitignore
echo node_modules/ >> .gitignore

# 2. Remover do Git (mas manter no disco)
git rm -r --cached node_modules

# 3. Commit
git add .gitignore
git commit -m "Remover node_modules do Git"
git push
```

---

### 15. Scripts .bat não estão executando

**Causa:** Permissões ou caminho errado

**Solução:**
```bash
# 1. Certifique-se de estar na pasta correta
cd C:\caminho\do\seu\projeto

# 2. Execute com extensão:
git-helper.bat

# 3. Se ainda não funcionar, clique direito → "Executar como administrador"

# 4. Ou use pelo VS Code:
# Abra terminal integrado (Ctrl + `)
# Digite: .\git-helper.bat
```

---

### 16. VS Code não mostra mudanças do Git

**Causa:** Extensão Git não está ativa

**Solução:**
```
1. Ctrl + Shift + P
2. Digite: "Git: Enable"
3. Ou: View → SCM (Ctrl + Shift + G)
4. Recarregue a janela: Ctrl + Shift + P → "Reload Window"
```

---

### 17. "Failed to connect to github.com"

**Causa:** Problema de rede ou proxy

**Solução:**
```bash
# 1. Verificar conexão com internet

# 2. Verificar se está usando VPN/Proxy

# 3. Testar conexão:
ping github.com

# 4. Configurar proxy (se necessário):
git config --global http.proxy http://proxy.exemplo.com:8080
git config --global https.proxy http://proxy.exemplo.com:8080

# 5. Remover proxy:
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

### 18. Quero recuperar arquivo deletado

**Solução:**
```bash
# Se ainda não commitou:
git checkout HEAD -- arquivo.txt

# Se já commitou:
# 1. Ver histórico do arquivo
git log -- arquivo.txt

# 2. Recuperar de um commit específico
git checkout abc1234 -- arquivo.txt

# 3. Commit
git add arquivo.txt
git commit -m "Recuperar arquivo deletado"
```

---

### 19. "Repository not found"

**Causa:** URL do repositório errada ou sem permissão

**Solução:**
```bash
# 1. Verificar URL do remote
git remote -v

# 2. Atualizar URL se necessário
git remote set-url origin https://github.com/usuario/repo.git

# 3. Verificar permissões no GitHub
# Você tem acesso ao repositório?
```

---

### 20. Tudo deu errado, quero começar do zero

**Solução de Último Recurso:**
```bash
# 1. Backup dos seus arquivos importantes!
# Copie para outra pasta

# 2. Clone o repositório novamente
cd ..
git clone https://github.com/usuario/repo.git repo-novo
cd repo-novo

# 3. Copie seus arquivos de volta (exceto .git)

# 4. Commite as alterações
git add .
git commit -m "Restaurar após problemas"
git push
```

---

## 📞 QUANDO PEDIR AJUDA

Pedir ajuda é normal! Antes de perguntar, tenha em mãos:

1. **O erro exato** (copie a mensagem completa)
2. **O que você estava fazendo** quando o erro ocorreu
3. **Resultado de:**
   ```bash
   git status
   git log --oneline -5
   git branch
   ```
4. **Versões:**
   ```bash
   git --version
   node --version
   firebase --version
   ```

---

## 🆘 COMANDOS DE EMERGÊNCIA

```bash
# Descartar TODAS as alterações locais
git reset --hard HEAD
git clean -fd

# Cancelar merge/rebase
git merge --abort
git rebase --abort

# Ver o que vai ser commitado
git diff --cached

# Voltar ao último estado estável
git checkout dev
git pull origin dev
```

---

## 💡 PREVENÇÃO

✅ **Faça sempre:**
- Commit frequentemente
- Pull antes de começar
- Push regularmente
- Teste em DEV antes de PRODUÇÃO
- Mantenha backup do .env

❌ **Nunca faça:**
- Force push em main/dev
- Commit de senhas/tokens
- Delete branches sem certeza
- Trabalhe direto em main
- Ignore mensagens de erro

---

## 📚 RECURSOS ÚTEIS

- Git Docs: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com/
- Firebase Docs: https://firebase.google.com/docs
- VS Code Docs: https://code.visualstudio.com/docs

---

**Lembre-se: Todo desenvolvedor já passou por esses problemas!** 💪

**Não tenha medo de errar - é assim que aprendemos!** 🚀
