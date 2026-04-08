@echo off
chcp 65001 >nul
REM ========================================
REM Script: Deploy em DEV
REM Versao: 3.1 - Permite deploy direto de dev
REM ========================================

echo.
echo ========================================
echo   DEPLOY EM DESENVOLVIMENTO
echo ========================================
echo.

REM Limpar swap files do VIM antes de começar
if exist .git\.MERGE_MSG.swp del /f .git\.MERGE_MSG.swp 2>nul
if exist .git\.COMMIT_EDITMSG.swp del /f .git\.COMMIT_EDITMSG.swp 2>nul

REM Pegar branch atual ANTES de mudar
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i

REM Verificar se ja esta na dev
if /i "%CURRENT_BRANCH%"=="dev" (
    echo [INFO] Voce ja esta na branch dev!
    echo Deploy direto sera realizado (sem merge).
    echo.
    set DEPLOY_DIRETO=1
) else (
    set DEPLOY_DIRETO=0
)

REM Verificar se esta na main
if /i "%CURRENT_BRANCH%"=="main" (
    echo [ERRO] Voce esta na branch main!
    echo.
    echo Para deploy em DEV, crie uma feature primeiro.
    echo Use: Opcao [1] Iniciar Nova Feature
    echo.
    pause
    exit /b 1
)

echo Branch atual: %CURRENT_BRANCH%
if %DEPLOY_DIRETO%==1 (
    echo Deploy direto da branch dev sera realizado.
) else (
    echo Esta branch sera integrada em DEV e publicada.
)
echo.
set /p CONFIRMA="Deseja continuar? (S/N): "

if /i not "%CONFIRMA%"=="S" (
    echo Operacao cancelada!
    pause
    exit /b 0
)

echo.
echo [1/7] Salvando alteracoes pendentes...
git add . >nul 2>&1
git commit -m "WIP: salvando antes do deploy" >nul 2>&1

if %DEPLOY_DIRETO%==0 (
    echo [2/7] Mudando para branch dev...
    git checkout dev
    if errorlevel 1 (
        echo [ERRO] Falha ao mudar para branch dev!
        pause
        exit /b 1
    )

    echo [3/7] Atualizando branch dev...
    git pull origin dev
    if errorlevel 1 (
        echo [AVISO] Nao foi possivel atualizar - continuando...
    )

    echo [4/7] Fazendo merge de %CURRENT_BRANCH% em dev...
    REM CORRIGIDO v3.0: Usando --no-edit para nao abrir VIM
    git merge %CURRENT_BRANCH% --no-edit --no-ff -m "Merge %CURRENT_BRANCH% em dev"
    if errorlevel 1 (
        echo.
        echo [ERRO] Conflito detectado!
        echo.
        echo Como resolver:
        echo 1. Abra VS Code: code .
        echo 2. Resolva os conflitos nos arquivos marcados
        echo 3. Execute: git add .
        echo 4. Execute: git commit -m "Resolvido conflito"
        echo 5. Execute: git push origin dev
        echo 6. Execute: firebase deploy --only hosting -P dev
        echo.
        echo Para cancelar: git merge --abort
        echo.
        pause
        exit /b 1
    )
) else (
    echo [2/7] Pulando checkout (ja em dev)...
    echo [3/7] Atualizando branch dev...
    git pull origin dev
    if errorlevel 1 (
        echo [AVISO] Nao foi possivel atualizar - continuando...
    )
    echo [4/7] Pulando merge (deploy direto de dev)...
)

echo [5/7] Enviando para GitHub...
git push origin dev
if errorlevel 1 (
    echo [ERRO] Falha ao enviar para GitHub!
    pause
    exit /b 1
)

echo [6/7] Fazendo deploy no Firebase DEV...
echo Executando: firebase deploy --only hosting -P dev
echo.
firebase deploy --only hosting -P dev
if errorlevel 1 (
    echo.
    echo [ERRO] Falha no deploy!
    echo.
    echo Verifique:
    echo - Firebase CLI instalado? firebase --version
    echo - Logado? firebase login
    echo - Projeto dev configurado? firebase projects:list
    echo.
    pause
    exit /b 1
)

echo [7/7] Finalizando...
if %DEPLOY_DIRETO%==0 (
    echo Voltando para sua branch %CURRENT_BRANCH%...
    git checkout %CURRENT_BRANCH%
) else (
    echo Permanecendo em dev.
)

echo.
echo ========================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Ambiente: DEV
if %DEPLOY_DIRETO%==0 (
    echo Branch integrada: %CURRENT_BRANCH%
) else (
    echo Deploy direto de: %CURRENT_BRANCH%
)
echo.
echo Proximos passos:
echo - Teste no ambiente DEV
echo - Se OK, faca deploy em PRODUCAO (Opcao 6)
echo.
echo URL DEV: Verifique no Firebase Console
echo.
pause
