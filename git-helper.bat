@echo off
REM ========================================
REM Menu Principal - Git + Firebase Helper
REM ========================================

:MENU
cls
echo.
echo ========================================
echo   GIT + FIREBASE HELPER
echo ========================================
echo.
echo [1] Iniciar Nova Feature
echo [2] Salvar Alteracoes (Commit)
echo [3] Ver Status do Projeto
echo [4] Deploy em DEV
echo [5] Deploy em PRODUCAO
echo [6] Emergencia (Desfazer/Recuperar)
echo [7] Ver Guia de Commits
echo [8] Atualizar Branch Atual
echo [9] Sair
echo.
echo ========================================
set /p OPCAO="Escolha uma opcao (1-9): "

if "%OPCAO%"=="1" goto NOVA_FEATURE
if "%OPCAO%"=="2" goto COMMIT
if "%OPCAO%"=="3" goto STATUS
if "%OPCAO%"=="4" goto DEPLOY_DEV
if "%OPCAO%"=="5" goto DEPLOY_PROD
if "%OPCAO%"=="6" goto EMERGENCIA
if "%OPCAO%"=="7" goto GUIA_COMMIT
if "%OPCAO%"=="8" goto ATUALIZAR
if "%OPCAO%"=="9" goto SAIR

echo.
echo Opcao invalida!
timeout /t 2 >nul
goto MENU

:NOVA_FEATURE
cls
call nova-feature.bat
goto MENU

:COMMIT
cls
call commit.bat
goto MENU

:STATUS
cls
call status.bat
goto MENU

:DEPLOY_DEV
cls
call deploy-dev.bat
goto MENU

:DEPLOY_PROD
cls
call deploy-producao.bat
goto MENU

:EMERGENCIA
cls
call emergencia.bat
goto MENU

:GUIA_COMMIT
cls
type COMMIT_GUIDE.md
echo.
pause
goto MENU

:ATUALIZAR
cls
echo.
echo ========================================
echo   ATUALIZANDO BRANCH ATUAL
echo ========================================
echo.

for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
echo Branch atual: %BRANCH%
echo.

echo Puxando atualizacoes do GitHub...
git pull origin %BRANCH%

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao atualizar!
) else (
    echo.
    echo [SUCESSO] Branch atualizada!
)

echo.
pause
goto MENU

:SAIR
cls
echo.
echo Ate logo!
echo.
timeout /t 2 >nul
exit /b 0
