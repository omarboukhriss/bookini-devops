@echo off
setlocal

REM Use the URL passed as first arg, fall back to 8081 if none
set "URL=%~1"
if "%URL%"=="" set "URL=http://localhost:8081"

echo Checking application at %URL% ...

REM Retry up to 10 times, 3s apart, fail on HTTP errors
curl -fsS --retry 10 --retry-delay 3 --retry-connrefused --max-time 10 "%URL%"
if errorlevel 1 (
    echo Smoke test FAILED
    exit /b 1
)

echo Smoke test PASSED
exit /b 0