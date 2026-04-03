@echo off
chcp 65001 >nul
REM ========================================
REM Script: Iniciar Nova Feature
REM Versao: 3.0
REM ========================================

echo.
echo ========================================
echo   INICIANDO NOVA FEATURE
echo ========================================
echo.

REM Verifica se está em um repositório git
git rev-parse --git-dir > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Este nao e um repositorio Git!
    pause
    exit /b 1
)

REM Pedir nome da feature
set /p FEATURE_NAME="Digite o nome da feature (ex: corrigir-bug-login): "

if "%FEATURE_NAME%"=="" (
    echo [ERRO] Nome da feature nao pode ser vazio!
    pause
    exit /b 1
)

echo.
echo [1/4] Mudando para branch dev...
git checkout dev
if errorlevel 1 (
    echo [ERRO] Falha ao mudar para branch dev!
    pause
    exit /b 1
)

echo [2/4] Atualizando branch dev...
git pull origin dev
if errorlevel 1 (
    echo [AVISO] Nao foi possivel atualizar a branch dev
)

echo [3/4] Criando nova branch: feature/%FEATURE_NAME%...
git checkout -b feature/%FEATURE_NAME%
if errorlevel 1 (
    echo [ERRO] Falha ao criar branch!
    pause
    exit /b 1
)

echo [4/4] Branch criada e pronta para uso!
echo.
echo ========================================
echo   SUCESSO!
echo ========================================
echo.
echo Branch atual: feature/%FEATURE_NAME%
echo Agora voce pode editar seus arquivos!
echo.
echo Comandos uteis:
echo   - Para salvar: git add . e git commit -m "mensagem"
echo   - Para enviar: git push origin feature/%FEATURE_NAME%
echo   - Para ver status: git status
echo.
pause
