@echo off
REM ========================================
REM Script: Emergencia - Desfazer Alteracoes
REM ========================================

echo.
echo ========================================
echo   MENU DE EMERGENCIA
echo ========================================
echo.
echo O que voce precisa fazer?
echo.
echo 1. Descartar TODAS as alteracoes nao salvas
echo 2. Desfazer ultimo commit (manter alteracoes)
echo 3. Desfazer ultimo commit (descartar alteracoes)
echo 4. Voltar para uma versao antiga (ver historico)
echo 5. Cancelar merge em andamento
echo 6. Sair
echo.
set /p OPCAO="Escolha uma opcao (1-6): "

if "%OPCAO%"=="1" goto DESCARTAR_ALTERACOES
if "%OPCAO%"=="2" goto DESFAZER_COMMIT_MANTER
if "%OPCAO%"=="3" goto DESFAZER_COMMIT_DESCARTAR
if "%OPCAO%"=="4" goto VER_HISTORICO
if "%OPCAO%"=="5" goto CANCELAR_MERGE
if "%OPCAO%"=="6" goto SAIR

echo Opcao invalida!
pause
exit /b 1

:DESCARTAR_ALTERACOES
echo.
echo [ATENCAO] Isso ira descartar TODAS as alteracoes nao salvas!
set /p CONFIRMA="Tem certeza? (S/N): "
if /i not "%CONFIRMA%"=="S" goto SAIR

echo.
echo Descartando alteracoes...
git reset --hard HEAD
git clean -fd
echo.
echo Alteracoes descartadas!
pause
goto SAIR

:DESFAZER_COMMIT_MANTER
echo.
echo Desfazendo ultimo commit (mantendo alteracoes)...
git reset --soft HEAD~1
echo.
echo Commit desfeito! Suas alteracoes ainda estao aqui.
pause
goto SAIR

:DESFAZER_COMMIT_DESCARTAR
echo.
echo [ATENCAO] Isso ira desfazer o ultimo commit E descartar as alteracoes!
set /p CONFIRMA="Tem certeza? (S/N): "
if /i not "%CONFIRMA%"=="S" goto SAIR

echo.
echo Desfazendo commit e descartando alteracoes...
git reset --hard HEAD~1
echo.
echo Commit desfeito e alteracoes descartadas!
pause
goto SAIR

:VER_HISTORICO
echo.
echo ========================================
echo   HISTORICO DE COMMITS
echo ========================================
echo.
git log --oneline -10
echo.
echo Para voltar para um commit especifico:
echo git checkout [codigo-do-commit]
echo.
echo Para voltar ao presente:
echo git checkout dev  (ou main)
echo.
pause
goto SAIR

:CANCELAR_MERGE
echo.
echo Cancelando merge em andamento...
git merge --abort
echo.
echo Merge cancelado!
pause
goto SAIR

:SAIR
exit /b 0
