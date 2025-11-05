@echo off
chcp 65001 >nul
REM ========================================
REM Script: Deploy em DEV
REM Versao: 3.0 - Corrigido e Melhorado
REM ========================================

echo.
echo ========================================
echo   DEPLOY EM DESENVOLVIMENTO
echo ========================================
echo.

REM Pegar branch atual ANTES de mudar
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i

REM Verificar se ja esta na dev
if /i "%CURRENT_BRANCH%"=="dev" (
    echo [ERRO] Voce ja esta na branch dev!
    echo.
    echo Para fazer deploy, volte para sua feature:
    git branch
    echo.
    echo Execute: git checkout feature/nome-da-sua-feature
    echo.
    pause
    exit /b 1
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
echo Esta branch sera integrada em DEV e publicada.
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
git merge %CURRENT_BRANCH% --no-ff -m "Merge %CURRENT_BRANCH% em dev"
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

echo [7/7] Voltando para sua branch...
git checkout %CURRENT_BRANCH%

echo.
echo ========================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Ambiente: DEV
echo Branch integrada: %CURRENT_BRANCH%
echo.
echo Proximos passos:
echo - Teste no ambiente DEV
echo - Se OK, faca deploy em PRODUCAO (Opcao 6)
echo.
echo URL DEV: Verifique no Firebase Console
echo.
pause
