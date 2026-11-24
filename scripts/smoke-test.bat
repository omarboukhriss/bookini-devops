
@echo off

echo Checking application...

curl -f http://localhost:8082/

if %ERRORLEVEL% NEQ 0 (
    echo Smoke test FAILED
    exit /b 1
)

echo Smoke test PASSED
exit /b 0
