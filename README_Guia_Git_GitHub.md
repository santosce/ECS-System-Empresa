
# 🚀 Guia Completo Git + GitHub (para iniciantes)

Este guia ensina o passo a passo completo para trabalhar com Git e GitHub no VS Code:
criar branchs, corrigir bugs, desenvolver novas features e publicar no repositório remoto.

---

## 🧩 Pré-requisitos
1. Instalar o Git: https://git-scm.com/downloads  
2. Configurar nome e e-mail:
   ```
   git config --global user.name "Seu Nome"
   git config --global user.email "seu@email.com"
   ```

3. Clonar repositório:
   ```
   git clone https://github.com/seu-usuario/ECS-System-Empresa.git
   cd ECS-System-Empresa
   ```

---

## 🔁 Fluxo completo (Feature ou Bugfix)

### 1️⃣ Atualizar o main
```
git checkout main
git pull origin main
```

### 2️⃣ Criar branch
```
git checkout -b feature/nova-feature
# ou
git checkout -b fix/corrigir-bug
```

### 3️⃣ Fazer alterações no VS Code
Edite arquivos (`index.html`, `style.css`, `app.js`) e salve.

### 4️⃣ Ver status e adicionar mudanças
```
git status
git add .
```

### 5️⃣ Fazer commit
```
git commit -m "feature: adicionar nova seção"
# ou
git commit -m "fix: corrigir erro no app.js"

git commit -am "Bug alocacao"
```

### 6️⃣ Enviar branch para GitHub
```
git push -u origin feature/nova-feature
```

### 7️⃣ Criar Pull Request no GitHub
1. Vá até o repositório no GitHub.
2. Clique em “Compare & Pull Request”.
3. Preencha título e descrição.
4. Clique em “Create Pull Request”.

### 8️⃣ Fazer merge e atualizar main
Após o merge no GitHub:
```
git checkout main
git pull origin main
git branch -d feature/nova-feature
```

---

## ⚙️ Comandos úteis

- `git log --oneline` → Ver histórico resumido
- `git stash` / `git stash pop` → Guardar e restaurar alterações
- `git reset --soft HEAD~1` → Desfazer commit (mantendo alterações)
- `git reset --hard HEAD~1` → Desfazer commit e apagar alterações
- `git branch` → Ver em qual branch você está
- `git status` → Ver status dos arquivos
- `git diff` → Ver diferenças do que você alterou
- `git checkout -- arquivo.js` → Descartar alterações em um arquivo
- `git pull`checkout -- arquivo.js
- `git branch -r`→ Listar branches remotas
- `git branch -d feature/nome-da-funcionalidade` → Deletar uma branch local (após fazer merge)
- `git push origin --delete feature/nome-da-funcionalidade`→ Deletar uma branch remota
- `git merge --abort` → Cancelar um merge em andamento
- `firebase projects:list` → Ver configuração do Firebase
- `firebase use` → Ver configuração do Firebase

---

## 🧠 Boas práticas
- Crie uma branch para cada tarefa.
- Faça commits pequenos e mensagens claras.
- Sempre dê `git pull` antes de começar algo novo.
- Teste antes de abrir Pull Requests.
- Nunca trabalhe diretamente na `main`.

---

## 📎 Modelo de Pull Request
```
### Descrição
Explique o que foi feito e por quê.

### Como testar
1. git checkout feature/nome
2. Rodar o projeto
3. Validar funcionalidade X

### Checklist
- [ ] Código revisado
- [ ] Testado localmente
- [ ] Sem erros no console
```

---

## ✅ Fluxo rápido (resumo)
```
git checkout main
git pull origin main
git checkout -b feature/nome
# editar arquivos
git add .
git commit -m "feature: descrição"
git push -u origin feature/nome
# abrir PR e merge
git checkout main
git pull origin main
git branch -d feature/nome
```

---

Guia criado para aprendizado — ideal para quem está iniciando com Git e GitHub 🚀
