@echo off
REM ========================================
REM Script: Deploy em DEV (CORRIGIDO)
REM ========================================

echo.
echo ========================================
echo   DEPLOY EM DESENVOLVIMENTO
echo ========================================
echo.

REM Pegar branch atual
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i

echo Branch atual: %CURRENT_BRANCH%
echo.
set /p CONFIRMA="Deseja fazer merge da branch %CURRENT_BRANCH% em DEV? (S/N): "

if /i not "%CONFIRMA%"=="S" (
    echo Operacao cancelada!
    pause
    exit /b 0
)

echo.
echo [1/6] Salvando alteracoes atuais...
git add .
git commit -m "WIP: salvando antes do merge" 2>nul
echo.

echo [2/6] Mudando para branch dev...
git checkout dev
if errorlevel 1 (
    echo [ERRO] Falha ao mudar para branch dev!
    pause
    exit /b 1
)

echo [3/6] Atualizando branch dev...
git pull origin dev
if errorlevel 1 (
    echo [AVISO] Falha ao atualizar dev
)

echo [4/6] Fazendo merge da branch %CURRENT_BRANCH%...
git merge %CURRENT_BRANCH% --no-ff -m "Merge %CURRENT_BRANCH% em dev"
if errorlevel 1 (
    echo [ERRO] Conflito no merge! Resolva os conflitos manualmente.
    pause
    exit /b 1
)

echo [5/6] Enviando para GitHub...
git push origin dev
if errorlevel 1 (
    echo [ERRO] Falha ao enviar para GitHub!
    pause
    exit /b 1
)

echo [6/6] Fazendo deploy no Firebase DEV...
echo Executando: firebase deploy --only hosting -P dev
echo.
call firebase deploy --only hosting -P dev
if errorlevel 1 (
    echo [ERRO] Falha no deploy!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Ambiente: DEV
echo URL: Verifique no console do Firebase
echo.
pause
