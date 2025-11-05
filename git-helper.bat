@echo off
chcp 65001 >nul
REM ========================================
REM Menu Principal - Git + Firebase Helper
REM Versao: 2.0 - Reorganizado por Fluxo
REM ========================================

:MENU
cls
echo.
echo ========================================
echo   GIT + FIREBASE HELPER v2.0
echo   ECS-System-Empresa
echo ========================================
echo.
echo FLUXO DE TRABALHO:
echo.
echo [1] Iniciar Nova Feature      (Comecar trabalho)
echo [2] Salvar Alteracoes          (Durante o trabalho)
echo [3] Ver Status                 (Verificar mudancas)
echo [4] Atualizar Branch           (Sincronizar)
echo [5] Deploy em DEV              (Testar)
echo [6] Deploy em PRODUCAO         (Publicar)
echo.
echo UTILIDADES:
echo.
echo [7] Emergencia                 (Desfazer/Recuperar)
echo [8] Ver Guia de Commits        (Como escrever)
echo [9] Configuracao Inicial       (Setup)
echo [0] Sair
echo.
echo ========================================
set /p OPCAO="Escolha uma opcao (0-9): "

if "%OPCAO%"=="1" goto NOVA_FEATURE
if "%OPCAO%"=="2" goto COMMIT
if "%OPCAO%"=="3" goto STATUS
if "%OPCAO%"=="4" goto ATUALIZAR
if "%OPCAO%"=="5" goto DEPLOY_DEV
if "%OPCAO%"=="6" goto DEPLOY_PROD
if "%OPCAO%"=="7" goto EMERGENCIA
if "%OPCAO%"=="8" goto GUIA_COMMIT
if "%OPCAO%"=="9" goto SETUP
if "%OPCAO%"=="0" goto SAIR

echo.
echo Opcao invalida!
timeout /t 2 >nul
goto MENU

:NOVA_FEATURE
cls
call CmdGit\nova-feature.bat
goto MENU

:COMMIT
cls
call CmdGit\commit.bat
goto MENU

:STATUS
cls
call CmdGit\status.bat
goto MENU

:ATUALIZAR
cls
call CmdGit\atualizar.bat
goto MENU

:DEPLOY_DEV
cls
call CmdGit\deploy-dev.bat
goto MENU

:DEPLOY_PROD
cls
call CmdGit\deploy-producao.bat
goto MENU

:EMERGENCIA
cls
call CmdGit\emergencia.bat
goto MENU

:GUIA_COMMIT
cls
if exist Docs\COMMIT_GUIDE.md (
    type Docs\COMMIT_GUIDE.md
) else if exist COMMIT_GUIDE.md (
    type COMMIT_GUIDE.md
) else (
    echo Guia de commits nao encontrado.
    echo.
    echo Dicas rapidas:
    echo - feat: Nova funcionalidade
    echo - fix: Correcao de bug
    echo - docs: Documentacao
    echo - style: Formatacao
    echo - refactor: Refatoracao
)
echo.
pause
goto MENU

:SETUP
cls
call CmdGit\setup.bat
goto MENU

:SAIR
cls
echo.
echo ========================================
echo   Ate logo!
echo   Bom trabalho no ECS-System-Empresa!
echo ========================================
echo.
timeout /t 2 >nul
exit /b 0
