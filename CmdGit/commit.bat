@echo off
REM ========================================
REM Script: Commit Rápido
REM ========================================

echo.
echo ========================================
echo   SALVANDO ALTERACOES (COMMIT)
echo ========================================
echo.

REM Mostrar status
echo Arquivos modificados:
echo.
git status --short
echo.

REM Pedir mensagem do commit
set /p COMMIT_MSG="Digite a mensagem do commit: "

if "%COMMIT_MSG%"=="" (
    echo [ERRO] Mensagem do commit nao pode ser vazia!
    pause
    exit /b 1
)

echo.
echo [1/3] Adicionando arquivos...
git add .
if errorlevel 1 (
    echo [ERRO] Falha ao adicionar arquivos!
    pause
    exit /b 1
)

echo [2/3] Criando commit...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo [ERRO] Falha ao criar commit!
    pause
    exit /b 1
)

echo [3/3] Enviando para GitHub...
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
git push origin %BRANCH%
if errorlevel 1 (
    echo [AVISO] Falha ao enviar para GitHub. Tente: git push origin %BRANCH%
)

echo.
echo ========================================
echo   SUCESSO!
echo ========================================
echo.
echo Commit criado: "%COMMIT_MSG%"
echo Branch: %BRANCH%
echo.
pause
