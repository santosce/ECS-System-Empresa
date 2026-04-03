@echo off
chcp 65001 >nul
REM ========================================
REM Script: Limpar Swap Files do VIM
REM Versao: 1.0 - Novo em v3.0
REM ========================================

echo.
echo ========================================
echo   LIMPANDO SWAP FILES DO VIM
echo ========================================
echo.

echo Procurando arquivos swap...
echo.

set FOUND=0

if exist .git\.MERGE_MSG.swp (
    echo [X] Encontrado: .git\.MERGE_MSG.swp
    del /f .git\.MERGE_MSG.swp
    echo [OK] Removido!
    set FOUND=1
)

if exist .git\.COMMIT_EDITMSG.swp (
    echo [X] Encontrado: .git\.COMMIT_EDITMSG.swp
    del /f .git\.COMMIT_EDITMSG.swp
    echo [OK] Removido!
    set FOUND=1
)

if exist .git\MERGE_HEAD (
    echo [!] ATENCAO: Merge em andamento detectado!
    echo.
    echo Voce tem um merge nao finalizado.
    echo.
    echo Opcoes:
    echo 1. Finalizar o merge: git commit -m "Merge concluido"
    echo 2. Cancelar o merge: git merge --abort
    echo.
    set FOUND=1
)

if "%FOUND%"=="0" (
    echo [OK] Nenhum swap file encontrado!
    echo Tudo limpo!
)

echo.
echo ========================================
pause
