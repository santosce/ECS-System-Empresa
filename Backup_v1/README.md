# 🚀 Scripts de Automação - Git + Firebase

Este pacote contém scripts para automatizar seu workflow de desenvolvimento com Git, GitHub e Firebase.

## 📦 Instalação

### 1. Copiar Scripts para o Projeto

Coloque todos os arquivos `.bat` na **raiz do seu projeto**:

```
seu-projeto/
├── git-helper.bat         ← Menu principal
├── nova-feature.bat
├── commit.bat
├── deploy-dev.bat
├── deploy-producao.bat
├── emergencia.bat
├── status.bat
├── COMMIT_GUIDE.md
├── .gitignore
└── ...seus arquivos...
```

### 2. Configurar VS Code

1. Crie uma pasta `.vscode` na raiz do projeto
2. Copie o arquivo `vscode-settings.json` para `.vscode/settings.json`
3. Instale as extensões recomendadas (o VS Code vai sugerir)

### 3. Configurar Firebase

```bash
# No terminal do VS Code, execute:
firebase login
firebase init
firebase use --add

# Adicione seus ambientes:
# - Escolha "dev" para desenvolvimento
# - Escolha "production" (ou "default") para produção
```

## 🎯 Como Usar

### Método 1: Menu Principal (Recomendado)

Abra o terminal no VS Code e execute:

```bash
git-helper.bat
```

Você verá um menu com todas as opções disponíveis!

### Método 2: Scripts Individuais

Execute diretamente cada script quando precisar:

```bash
# Iniciar nova feature
nova-feature.bat

# Fazer commit
commit.bat

# Ver status
status.bat

# Deploy em dev
deploy-dev.bat

# Deploy em produção
deploy-producao.bat

# Emergência
emergencia.bat
```

## 📋 Workflow Diário Recomendado

### 🌅 Começo do Dia

1. Execute `git-helper.bat`
2. Escolha opção **[8] Atualizar Branch Atual**
3. Escolha opção **[1] Iniciar Nova Feature**
4. Digite o nome da feature (ex: `corrigir-bug-login`)

### 💻 Durante o Trabalho

1. Edite seus arquivos no VS Code
2. Salve com `Ctrl + S`
3. Execute `git-helper.bat` → **[2] Salvar Alterações**
4. Digite uma mensagem clara (consulte COMMIT_GUIDE.md)

### 🧪 Testar em DEV

1. Execute `git-helper.bat` → **[4] Deploy em DEV**
2. Confirme o merge
3. Aguarde o deploy
4. Teste no ambiente de desenvolvimento

### 🚀 Publicar em Produção

1. Execute `git-helper.bat` → **[5] Deploy em PRODUÇÃO**
2. **ATENÇÃO:** Leia o aviso
3. Digite a versão (ex: `1.0.5`)
4. Confirme
5. Aguarde o deploy

### 🆘 Em Caso de Problema

1. Execute `git-helper.bat` → **[6] Emergência**
2. Escolha a ação apropriada
3. Siga as instruções

## 📝 Guia Rápido de Comandos

| Comando | O que faz |
|---------|-----------|
| `git-helper.bat` | Abre o menu principal |
| `nova-feature.bat` | Cria uma nova branch de feature |
| `commit.bat` | Salva suas alterações |
| `status.bat` | Mostra o status do projeto |
| `deploy-dev.bat` | Publica em DEV |
| `deploy-producao.bat` | Publica em PRODUÇÃO |
| `emergencia.bat` | Menu de recuperação |

## 🎓 Dicas Importantes

### ✅ Boas Práticas

- **Sempre** teste em DEV antes de ir para produção
- **Commite** frequentemente (várias vezes por dia)
- Use **mensagens descritivas** nos commits
- **Nunca** vá direto para produção sem testar
- Mantenha suas branches **atualizadas**

### ❌ Evite

- Commits com mensagens vagas ("mudanças", "fix", etc)
- Fazer merge direto em main sem passar por dev
- Deixar alterações sem commit por muito tempo
- Commitar arquivos sensíveis (.env, senhas, etc)

## 🔧 Personalização

### Alterar Nome dos Ambientes Firebase

Se seus ambientes têm nomes diferentes, edite os scripts:

**deploy-dev.bat:**
```batch
firebase use SEU-AMBIENTE-DEV
```

**deploy-producao.bat:**
```batch
firebase use SEU-AMBIENTE-PRODUCAO
```

### Adicionar Novos Scripts

1. Crie um novo arquivo `.bat`
2. Adicione ao menu em `git-helper.bat`
3. Teste antes de usar em produção!

## 🐛 Solução de Problemas

### "Git não é reconhecido como comando"

Instale o Git: https://git-scm.com/downloads

### "Firebase não é reconhecido como comando"

```bash
npm install -g firebase-tools
firebase login
```

### "Conflito no merge"

1. Execute `emergencia.bat` → opção **[5] Cancelar merge**
2. Resolva os conflitos manualmente no VS Code
3. Tente novamente

### Scripts não estão funcionando

1. Verifique se está na raiz do projeto
2. Verifique se os scripts têm permissão de execução
3. Execute `git status` para ver se é um repositório Git

## 📚 Recursos Adicionais

- **Guia de Commits:** Abra `COMMIT_GUIDE.md`
- **Git Docs:** https://git-scm.com/doc
- **Firebase Docs:** https://firebase.google.com/docs
- **VS Code:** https://code.visualstudio.com/docs

## 🆘 Precisa de Ajuda?

1. Execute `status.bat` para ver o estado atual
2. Execute `emergencia.bat` se algo deu errado
3. Consulte o `COMMIT_GUIDE.md` para dúvidas sobre mensagens

## 📄 Licença

Estes scripts são fornecidos como estão, para uso livre em seus projetos.

---

**Versão:** 1.0.0
**Última atualização:** Novembro 2025

💡 **Dica:** Adicione este README.md ao seu projeto e mantenha atualizado!
