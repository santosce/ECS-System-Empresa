@echo off
REM ========================================
REM Script: Deploy em PRODUCAO (CORRIGIDO)
REM ========================================

echo.
echo ========================================
echo   DEPLOY EM PRODUCAO
echo ========================================
echo.
echo [ATENCAO] Voce esta prestes a publicar em PRODUCAO!
echo.
set /p CONFIRMA="TEM CERTEZA que deseja continuar? (S/N): "

if /i not "%CONFIRMA%"=="S" (
    echo Operacao cancelada!
    pause
    exit /b 0
)

echo.
set /p VERSION="Digite a versao (ex: 1.0.1): "

if "%VERSION%"=="" (
    echo [ERRO] Versao nao pode ser vazia!
    pause
    exit /b 1
)

echo.
echo [1/7] Mudando para branch dev...
git checkout dev
if errorlevel 1 (
    echo [ERRO] Falha ao mudar para branch dev!
    pause
    exit /b 1
)

echo [2/7] Atualizando branch dev...
git pull origin dev

echo [3/7] Mudando para branch main...
git checkout main
if errorlevel 1 (
    echo [ERRO] Falha ao mudar para branch main!
    pause
    exit /b 1
)

echo [4/7] Atualizando branch main...
git pull origin main

echo [5/7] Fazendo merge da dev em main...
git merge dev --no-ff -m "Release v%VERSION%"
if errorlevel 1 (
    echo [ERRO] Conflito no merge! Resolva os conflitos manualmente.
    pause
    exit /b 1
)

echo [6/7] Enviando para GitHub e criando tag...
git push origin main
git tag -a v%VERSION% -m "Versao %VERSION%"
git push origin v%VERSION%

echo [7/7] Fazendo deploy no Firebase PRODUCAO...
echo Executando: firebase deploy --only hosting -P prd
echo.
call firebase deploy --only hosting -P prd
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
echo Ambiente: PRODUCAO
echo Versao: v%VERSION%
echo URL: Verifique no console do Firebase
echo.
echo Voltando para branch dev...
git checkout dev
echo.
pause
