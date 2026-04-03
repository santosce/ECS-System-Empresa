@echo off
chcp 65001 >nul
REM ========================================
REM Script: Atualizar Branch Atual
REM Versao: 3.0
REM ========================================

echo.
echo ========================================
echo   ATUALIZANDO BRANCH ATUAL
echo ========================================
echo.

REM Pegar branch atual
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i

echo Branch atual: %BRANCH%
echo.

echo Baixando atualizacoes do GitHub...
git pull origin %BRANCH%

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao atualizar!
    echo.
    echo Possiveis causas:
    echo - Sem conexao com internet
    echo - Branch nao existe no GitHub
    echo - Conflitos locais
    echo.
    echo Execute: git status (para ver o problema)
) else (
    echo.
    echo ========================================
    echo   BRANCH ATUALIZADA COM SUCESSO!
    echo ========================================
    echo.
    echo Branch: %BRANCH%
    echo Seus arquivos locais estao sincronizados.
)

echo.
pause
