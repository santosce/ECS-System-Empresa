# 📁 INSTALAÇÃO - ESTRUTURA ORGANIZADA v2.0

## 🎯 NOVA ESTRUTURA

Esta é a versão **2.0 ORGANIZADA** dos scripts Git + Firebase!

### ✨ O QUE MUDOU?

1. ✅ **Menu reorganizado** na ordem do fluxo de trabalho
2. ✅ **Scripts em pasta separada** (CmdGit/)
3. ✅ **Documentação em pasta separada** (Docs/)
4. ✅ **Apenas 1 arquivo na raiz** (git-helper.bat)

---

## 📦 ESTRUTURA DE PASTAS

```
C:\Projetos\ECS-System-Empresa\
│
├── git-helper.bat              ← ÚNICO ARQUIVO NA RAIZ!
│
├── CmdGit\                     ← Scripts organizados
│   ├── nova-feature.bat
│   ├── commit.bat
│   ├── status.bat
│   ├── atualizar.bat
│   ├── deploy-dev.bat
│   ├── deploy-producao.bat
│   ├── emergencia.bat
│   └── setup.bat
│
├── Docs\                       ← Documentação organizada
│   ├── README-ECS.md
│   ├── INSTALACAO_ECS.md
│   ├── CHEATSHEET.md
│   ├── COMMIT_GUIDE.md
│   ├── TROUBLESHOOTING.md
│   ├── MUDANCAS.md
│   └── INDEX.md
│
├── .firebase\                  ← Seus arquivos (não mexer)
├── .git\
├── public\
├── firebase.json
└── ...
```

---

## 🚀 INSTALAÇÃO EM 3 PASSOS

### 1️⃣ CRIAR AS PASTAS

No terminal (PowerShell ou CMD):

```bash
cd C:\Projetos\ECS-System-Empresa
mkdir CmdGit
mkdir Docs
```

### 2️⃣ EXTRAIR OS ARQUIVOS

**Baixe:** `git-firebase-helper-v2-organizado.zip`

**Extraia assim:**
- `git-helper.bat` → raiz de `ECS-System-Empresa\`
- Arquivos `.bat` → pasta `CmdGit\`
- Arquivos `.md` → pasta `Docs\`

### 3️⃣ TESTAR

```bash
# Execute o menu principal
git-helper.bat
```

---

## 📋 NOVO MENU (Ordem Lógica)

```
========================================
  GIT + FIREBASE HELPER v2.0
========================================

FLUXO DE TRABALHO:

[1] Iniciar Nova Feature      (Começar trabalho)
[2] Salvar Alterações         (Durante o trabalho)
[3] Ver Status                (Verificar mudanças)
[4] Atualizar Branch          (Sincronizar)
[5] Deploy em DEV             (Testar)
[6] Deploy em PRODUÇÃO        (Publicar)

UTILIDADES:

[7] Emergência                (Desfazer/Recuperar)
[8] Ver Guia de Commits       (Como escrever)
[9] Configuração Inicial      (Setup)
[0] Sair
```

---

## 🎯 FLUXO DE TRABALHO COMPLETO

### 🌅 DIA A DIA

```bash
# 1. Abrir menu
git-helper.bat

# 2. Iniciar trabalho
[1] Iniciar Nova Feature → Digite: feature/minha-tarefa

# 3. Trabalhar
(Edite seus arquivos no VS Code)

# 4. Salvar
[2] Salvar Alterações → Digite mensagem descritiva

# 5. Verificar
[3] Ver Status → Conferir o que mudou

# 6. Sincronizar (se necessário)
[4] Atualizar Branch → Pegar atualizações do GitHub
```

### 🧪 TESTAR

```bash
# 7. Publicar em DEV
[5] Deploy em DEV → Confirmar

# Testar no ambiente DEV
```

### 🚀 PUBLICAR

```bash
# 8. Publicar em PRODUÇÃO
[6] Deploy em PRODUÇÃO → Digite versão (ex: 1.0.1)

# Site vai ao ar!
```

---

## 🔄 MIGRAÇÃO DO V1 PARA V2

Se você já tem os scripts antigos instalados:

### Opção A: Limpar e Reinstalar (RECOMENDADO)

```bash
# 1. Backup dos scripts antigos
mkdir Backup_Scripts_Antigos
move *.bat Backup_Scripts_Antigos\
move *.md Backup_Scripts_Antigos\

# 2. Criar nova estrutura
mkdir CmdGit
mkdir Docs

# 3. Extrair nova versão
# (Baixe e extraia conforme instruções acima)
```

### Opção B: Mover Manualmente

```bash
# Mover scripts para CmdGit
move nova-feature.bat CmdGit\
move commit.bat CmdGit\
move status.bat CmdGit\
move deploy-dev.bat CmdGit\
move deploy-producao.bat CmdGit\
move emergencia.bat CmdGit\
move setup.bat CmdGit\

# Mover docs para Docs
mkdir Docs
move *.md Docs\

# Substituir git-helper.bat
# (Baixe a versão v2.0)
```

---

## ✅ VERIFICAÇÃO PÓS-INSTALAÇÃO

Execute para verificar:

```bash
# Ver estrutura
dir

# Deve mostrar:
# - git-helper.bat (na raiz)
# - CmdGit\ (pasta)
# - Docs\ (pasta)

# Ver conteúdo das pastas
dir CmdGit
dir Docs

# Testar
git-helper.bat
```

---

## 💡 VANTAGENS DA V2.0

✅ **Organização:** Projeto mais limpo
✅ **Menu Lógico:** Segue ordem do fluxo
✅ **Fácil Manutenção:** Scripts separados
✅ **Docs Organizadas:** Fácil encontrar ajuda
✅ **Melhor Performance:** Scripts otimizados

---

## 🆘 PROBLEMAS COMUNS

### Script não encontra arquivos

```bash
# Certifique-se que a estrutura está correta:
dir CmdGit\nova-feature.bat
dir Docs\README-ECS.md

# Se não existir, crie as pastas e extraia novamente
```

### Git-helper não abre

```bash
# Execute assim:
.\git-helper.bat

# Ou dê permissão:
# Clique direito → Executar como administrador
```

---

## 📚 DOCUMENTAÇÃO

**Guias disponíveis em `Docs\`:**

- `README-ECS.md` - Guia completo do projeto
- `INSTALACAO_ECS.md` - Instalação detalhada
- `CHEATSHEET.md` - Comandos rápidos
- `COMMIT_GUIDE.md` - Como escrever commits
- `TROUBLESHOOTING.md` - Solução de problemas

**Acesse:**
```bash
# Ver um guia
type Docs\CHEATSHEET.md

# Ou abrir todos
code Docs\
```

---

## 🎉 PRONTO!

Agora você tem:
- ✅ Projeto organizado
- ✅ Menu lógico
- ✅ Scripts otimizados
- ✅ Documentação acessível

**Execute:** `git-helper.bat` e comece a trabalhar! 🚀

---

**Versão:** 2.0 (Organizada)  
**Projeto:** ECS-System-Empresa  
**Data:** Novembro 2025
