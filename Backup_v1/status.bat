@echo off
REM ========================================
REM Script: Ver Status do Projeto
REM ========================================

echo.
echo ========================================
echo   STATUS DO PROJETO
echo ========================================
echo.

REM Branch atual
echo [BRANCH ATUAL]
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
echo Branch: %BRANCH%
echo.

REM Status dos arquivos
echo [ARQUIVOS MODIFICADOS]
git status --short
if errorlevel 1 (
    echo Nenhuma alteracao
)
echo.

REM Ultimos commits
echo [ULTIMOS 5 COMMITS]
git log --oneline -5
echo.

REM Branches locais
echo [BRANCHES LOCAIS]
git branch
echo.

REM Verificar se há algo para push
echo [STATUS DE SINCRONIZACAO]
git fetch origin 2>nul
for /f %%i in ('git rev-list --count HEAD..origin/%BRANCH% 2^>nul') do set BEHIND=%%i
for /f %%i in ('git rev-list --count origin/%BRANCH%..HEAD 2^>nul') do set AHEAD=%%i

if "%AHEAD%"=="0" (
    echo Nenhum commit local para enviar
) else (
    echo Existem %AHEAD% commit(s) locais para enviar
    echo Execute: git push origin %BRANCH%
)

if "%BEHIND%"=="0" (
    echo Atualizado com o remoto
) else (
    echo Existem %BEHIND% commit(s) novos no remoto
    echo Execute: git pull origin %BRANCH%
)
echo.

REM Projetos Firebase
echo [PROJETOS FIREBASE]
call firebase projects:list 2>nul
if errorlevel 1 (
    echo Firebase CLI nao instalado ou nao configurado
)
echo.

echo ========================================
pause
