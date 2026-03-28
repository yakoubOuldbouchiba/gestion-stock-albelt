@echo off
REM ALBELT Docker Build Script for Windows
REM Builds Docker images for ALBELT system

setlocal enabledelayedexpansion

echo ======================================
echo ALBELT Docker Build Script (Windows)
echo ======================================

REM Configuration
set BACKEND_IMAGE=albelt-api:0.0.1-SNAPSHOT
set FRONTEND_IMAGE=albelt-ui:latest
set BACKEND_DIR=albelt-api
set FRONTEND_DIR=albelt-ui

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed
    exit /b 1
)

echo [OK] Docker found

REM Parse arguments
set BUILD_BACKEND=0
set BUILD_FRONTEND=0
set PUSH=0

:parse_args
if "%~1"=="" goto parse_done
if "%~1"=="--backend" (
    set BUILD_BACKEND=1
    shift
    goto parse_args
)
if "%~1"=="--frontend" (
    set BUILD_FRONTEND=1
    shift
    goto parse_args
)
if "%~1"=="--all" (
    set BUILD_BACKEND=1
    set BUILD_FRONTEND=1
    shift
    goto parse_args
)
if "%~1"=="--push" (
    set PUSH=1
    shift
    goto parse_args
)

:parse_done

REM If no specific option, build all
if %BUILD_BACKEND%==0 if %BUILD_FRONTEND%==0 (
    set BUILD_BACKEND=1
    set BUILD_FRONTEND=1
)

REM Build Backend
if %BUILD_BACKEND%==1 (
    echo.
    echo [*] Building backend image: %BACKEND_IMAGE%
    
    if not exist "%BACKEND_DIR%" (
        echo [ERROR] Backend directory not found: %BACKEND_DIR%
        exit /b 1
    )
    
    cd "%BACKEND_DIR%"
    
    if not exist "pom.xml" (
        echo [ERROR] pom.xml not found in %BACKEND_DIR%
        exit /b 1
    )
    
    echo [*] Using Jib to build Docker image...
    call mvnw clean compile jib:dockerBuild -DskipTests
    
    if errorlevel 1 (
        echo [ERROR] Failed to build backend image
        exit /b 1
    )
    
    echo [OK] Backend image built successfully
    cd ..
)

REM Build Frontend
if %BUILD_FRONTEND%==1 (
    echo.
    echo [*] Building frontend image: %FRONTEND_IMAGE%
    
    if not exist "%FRONTEND_DIR%" (
        echo [ERROR] Frontend directory not found: %FRONTEND_DIR%
        exit /b 1
    )
    
    if not exist "%FRONTEND_DIR%\Dockerfile" (
        echo [ERROR] Dockerfile not found in %FRONTEND_DIR%
        exit /b 1
    )
    
    docker build ^
        -t %FRONTEND_IMAGE% ^
        -f "%FRONTEND_DIR%\Dockerfile" ^
        "%FRONTEND_DIR%"
    
    if errorlevel 1 (
        echo [ERROR] Failed to build frontend image
        exit /b 1
    )
    
    echo [OK] Frontend image built successfully
)

REM List built images
echo.
echo [*] Built images:
docker images | find "albelt-"

REM Push if requested
if %PUSH%==1 (
    echo.
    echo [*] Pushing images...
    
    if %BUILD_BACKEND%==1 (
        docker push %BACKEND_IMAGE%
        echo [OK] Backend image pushed
    )
    
    if %BUILD_FRONTEND%==1 (
        docker push %FRONTEND_IMAGE%
        echo [OK] Frontend image pushed
    )
)

echo.
echo [OK] Build complete!
echo.
echo Next steps:
echo   1. Start services: docker-compose up -d
echo   2. View logs: docker-compose logs -f
echo   3. Access UI: http://localhost
echo   4. Access API: http://localhost:8080/swagger-ui.html
