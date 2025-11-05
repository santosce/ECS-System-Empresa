@echo off
chcp 65001 >nul
REM ========================================
REM Script: Deploy em PRODUCAO
REM Versao: 3.0 - Corrigido e Melhorado
REM ========================================

echo.
echo ========================================
echo   DEPLOY EM PRODUCAO
echo ========================================
echo.
echo [ATENCAO] Voce esta prestes a PUBLICAR em PRODUCAO!
echo.
echo Checklist de seguranca:
echo [ ] Testou em DEV?
echo [ ] Funciona sem erros?
echo [ ] Revisou o codigo?
echo [ ] Fez backup?
echo.
set /p CONFIRMA="TEM CERTEZA que deseja continuar? (S/N): "

if /i not "%CONFIRMA%"=="S" (
    echo.
    echo Operacao cancelada - Decisao sábia!
    pause
    exit /b 0
)

echo.
set /p VERSION="Digite o numero da versao (ex: 1.0.1): "

if "%VERSION%"=="" (
    echo [ERRO] Versao nao pode ser vazia!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   PUBLICANDO VERSAO %VERSION%
echo ========================================
echo.

echo [1/8] Salvando alteracoes pendentes...
git add . >nul 2>&1
git commit -m "Preparando release v%VERSION%" >nul 2>&1

echo [2/8] Mudando para branch dev...
git checkout dev
if errorlevel 1 (
    echo [ERRO] Falha ao mudar para branch dev!
    pause
    exit /b 1
)

echo [3/8] Atualizando branch dev...
git pull origin dev

echo [4/8] Mudando para branch main...
git checkout main
if errorlevel 1 (
    echo [ERRO] Falha ao mudar para branch main!
    pause
    exit /b 1
)

echo [5/8] Atualizando branch main...
git pull origin main

echo [6/8] Fazendo merge de dev em main...
git merge dev --no-ff -m "Release v%VERSION%"
if errorlevel 1 (
    echo.
    echo [ERRO] Conflito detectado!
    echo.
    echo Como resolver:
    echo 1. Abra VS Code: code .
    echo 2. Resolva os conflitos
    echo 3. Execute: git add .
    echo 4. Execute: git commit -m "Release v%VERSION%"
    echo 5. Execute: git push origin main
    echo 6. Execute: git tag -a v%VERSION% -m "Versao %VERSION%"
    echo 7. Execute: git push origin v%VERSION%
    echo 8. Execute: firebase deploy --only hosting -P prd
    echo.
    echo Para cancelar: git merge --abort
    echo.
    pause
    exit /b 1
)

echo [7/8] Enviando para GitHub e criando tag...
git push origin main
git tag -a v%VERSION% -m "Versao %VERSION%"
git push origin v%VERSION%

echo [8/8] Fazendo deploy no Firebase PRODUCAO...
echo Executando: firebase deploy --only hosting -P prd
echo.
firebase deploy --only hosting -P prd
if errorlevel 1 (
    echo.
    echo [ERRO] Falha no deploy!
    echo.
    echo Verifique:
    echo - Firebase CLI instalado? firebase --version
    echo - Logado? firebase login
    echo - Projeto prd configurado? firebase projects:list
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   PUBLICACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Ambiente: PRODUCAO
echo Versao: v%VERSION%
echo.
echo Tag criada: v%VERSION%
echo URL PRD: Verifique no Firebase Console
echo.
echo Voltando para branch dev...
git checkout dev
echo.
echo IMPORTANTE:
echo - Teste o site em producao
echo - Monitore erros no console
echo - Verifique feedback dos usuarios
echo.
pause
