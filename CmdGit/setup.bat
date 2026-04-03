@echo off
chcp 65001 >nul
REM ========================================
REM Script de Configuracao para ECS-System-Empresa
REM Versao: 3.0 - Com configuracao de editor
REM ========================================

cls
echo.
echo ========================================
echo   CONFIGURACAO INICIAL v3.0
echo   ECS-System-Empresa
echo ========================================
echo.
echo Este script vai configurar seu ambiente
echo de desenvolvimento.
echo.
pause

REM Verificar Git
echo.
echo [1/6] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Git nao instalado!
    echo Baixe em: https://git-scm.com/downloads
    pause
    exit /b 1
) else (
    echo [OK] Git instalado!
)

REM Verificar Node
echo.
echo [2/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Node.js nao instalado!
    echo Baixe em: https://nodejs.org/
    echo (Necessario para Firebase CLI)
    set NODE_MISSING=1
) else (
    echo [OK] Node.js instalado!
)

REM Verificar Firebase CLI
echo.
echo [3/6] Verificando Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    if "%NODE_MISSING%"=="1" (
        echo [AVISO] Firebase CLI nao instalado
        echo Instale o Node.js primeiro, depois execute:
        echo npm install -g firebase-tools
    ) else (
        echo [AVISO] Firebase CLI nao instalado!
        set /p INSTALL_FB="Deseja instalar agora? (S/N): "
        if /i "%INSTALL_FB%"=="S" (
            echo Instalando Firebase CLI...
            npm install -g firebase-tools
        )
    )
) else (
    echo [OK] Firebase CLI instalado!
)

REM Configurar Git (se necessario)
echo.
echo [4/6] Verificando configuracao do Git...
git config user.name >nul 2>&1
if errorlevel 1 (
    echo.
    echo Vamos configurar seu Git:
    set /p GIT_NAME="Digite seu nome: "
    set /p GIT_EMAIL="Digite seu email: "
    
    git config --global user.name "%GIT_NAME%"
    git config --global user.email "%GIT_EMAIL%"
    
    echo [OK] Git configurado!
) else (
    for /f "tokens=*" %%i in ('git config user.name') do set CURRENT_NAME=%%i
    for /f "tokens=*" %%i in ('git config user.email') do set CURRENT_EMAIL=%%i
    echo [OK] Git ja configurado
    echo Nome: %CURRENT_NAME%
    echo Email: %CURRENT_EMAIL%
)

REM Configurar editor padrao (NOVO v3.0)
echo.
echo [5/6] Configurando editor padrao...
git config --global core.editor "notepad"
git config --global merge.conflictstyle diff3
echo [OK] Editor configurado para Notepad (sem VIM!)

REM Verificar repositorio
echo.
echo [6/6] Verificando repositorio...
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Este diretorio nao e um repositorio Git!
    echo.
    echo Deseja clonar o repositorio ECS-System-Empresa?
    set /p CLONE_REPO="(S/N): "
    if /i "%CLONE_REPO%"=="S" (
        echo.
        echo Clonando repositorio...
        cd ..
        git clone https://github.com/santosce/ECS-System-Empresa.git
        cd ECS-System-Empresa
        echo [OK] Repositorio clonado!
    )
) else (
    echo [OK] Repositorio Git detectado!
)

REM Verificar Firebase
echo.
echo ========================================
echo   CONFIGURACAO DO FIREBASE
echo ========================================
echo.
firebase --version >nul 2>&1
if not errorlevel 1 (
    echo Seus ambientes Firebase devem estar configurados como:
    echo - dev (desenvolvimento)
    echo - prd (producao)
    echo.
    echo Voce usa os comandos:
    echo   firebase deploy --only hosting -P dev
    echo   firebase deploy --only hosting -P prd
    echo.
    set /p TEST_FB="Deseja testar o Firebase agora? (S/N): "
    if /i "%TEST_FB%"=="S" (
        echo.
        echo Fazendo login no Firebase...
        firebase login
        
        echo.
        echo Listando projetos...
        firebase projects:list
    )
)

REM Verificar branches
echo.
echo ========================================
echo   ESTRUTURA DE BRANCHES
echo ========================================
echo.
git rev-parse --git-dir >nul 2>&1
if not errorlevel 1 (
    echo Branches disponiveis:
    git branch -a
    echo.
    
    REM Verificar se branch dev existe
    git rev-parse --verify dev >nul 2>&1
    if errorlevel 1 (
        echo.
        echo [AVISO] Branch 'dev' nao encontrada localmente
        echo.
        set /p CREATE_DEV="Deseja criar branch dev? (S/N): "
        if /i "%CREATE_DEV%"=="S" (
            git checkout -b dev
            git push origin dev
            echo [OK] Branch dev criada!
        )
    ) else (
        echo [OK] Branch dev existe!
    )
)

REM Atualizar branches
echo.
set /p UPDATE_BRANCHES="Deseja atualizar as branches do GitHub? (S/N): "
if /i "%UPDATE_BRANCHES%"=="S" (
    echo.
    echo Atualizando...
    git checkout main
    git pull origin main
    git checkout dev
    git pull origin dev
    echo [OK] Branches atualizadas!
)

REM Finalizar
echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo.
echo 1. Execute: git-helper.bat
echo 2. Escolha: [1] Iniciar Nova Feature
echo 3. Comece a desenvolver!
echo.
echo Documentacao completa: README.md
echo Guia de commits: COMMIT_GUIDE.md
echo.
echo ========================================
pause
