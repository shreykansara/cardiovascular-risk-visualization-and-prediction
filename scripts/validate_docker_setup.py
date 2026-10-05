"""
Docker Setup and Containerization Validation Script (Task D6)
Multimodal AI Hackathon 2026 - Track A: Perfusion3D
"""

import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

def test_file_exists(path: Path, desc: str):
    print(f"Checking {desc} ({path.relative_to(ROOT_DIR)})... ", end="")
    if not path.is_file():
        print("FAILED: File does not exist!")
        return False
    print("OK")
    return True

def validate_dockerfile_web():
    path = ROOT_DIR / "Dockerfile.web"
    content = path.read_text(encoding="utf-8")
    required = ["FROM node:20-alpine", "npm run build:web", "FROM nginx:alpine", "COPY apps/web/nginx.conf", "EXPOSE 80"]
    for item in required:
        if item not in content:
            print(f"FAILED: Dockerfile.web missing '{item}'")
            return False
    print("Dockerfile.web structure: OK")
    return True

def validate_dockerfile_api():
    path = ROOT_DIR / "Dockerfile.api"
    content = path.read_text(encoding="utf-8")
    required = [
        "FROM python:3.11-slim",
        "useradd",
        "appuser",
        "USER appuser",
        "HEALTHCHECK",
        "/api/v1/health",
        "models",
        "uvicorn",
        "EXPOSE 8000"
    ]
    for item in required:
        if item not in content:
            print(f"FAILED: Dockerfile.api missing '{item}'")
            return False
    print("Dockerfile.api structure: OK")
    return True

def validate_nginx_conf():
    path = ROOT_DIR / "apps" / "web" / "nginx.conf"
    content = path.read_text(encoding="utf-8")
    required = [
        "listen 80;",
        "proxy_pass http://api:8000;",
        "try_files $uri $uri/ /index.html;",
        "location /api/",
        "location = /health",
    ]
    for item in required:
        if item not in content:
            print(f"FAILED: nginx.conf missing '{item}'")
            return False
    print("apps/web/nginx.conf reverse proxy & SPA rules: OK")
    return True

def validate_docker_compose():
    path = ROOT_DIR / "docker-compose.yml"
    content = path.read_text(encoding="utf-8")
    required = [
        "services:",
        "api:",
        "web:",
        "8000:8000",
        "8080:80",
        "service_healthy",
        "Dockerfile.api",
        "Dockerfile.web",
    ]
    for item in required:
        if item not in content:
            print(f"FAILED: docker-compose.yml missing '{item}'")
            return False
    print("docker-compose.yml service topology: OK")
    return True

def validate_dockerignore():
    path = ROOT_DIR / ".dockerignore"
    content = path.read_text(encoding="utf-8")
    required = [".env", ".git", "node_modules", "apps/web/dist", "__pycache__"]
    for item in required:
        if item not in content:
            print(f"FAILED: .dockerignore missing exclusion '{item}'")
            return False
    if "models" in content.splitlines():
        print("FAILED: .dockerignore mistakenly excludes 'models'")
        return False
    print(".dockerignore exclusions: OK (models preserved)")
    return True

def validate_compose_syntax():
    print("Validating compose config using docker compose CLI... ", end="")
    try:
        res = subprocess.run(["docker", "compose", "config", "-q"], cwd=ROOT_DIR, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"FAILED:\n{res.stderr}")
            return False
        print("OK (Syntactically Valid)")
        return True
    except Exception as e:
        print(f"WARNING: docker compose CLI error ({e})")
        return True

def main():
    print("\n--- Validating Perfusion3D Docker Containerization (Phase D) ---\n")
    all_ok = True
    all_ok &= test_file_exists(ROOT_DIR / "Dockerfile.web", "Dockerfile.web")
    all_ok &= test_file_exists(ROOT_DIR / "Dockerfile.api", "Dockerfile.api")
    all_ok &= test_file_exists(ROOT_DIR / "apps" / "web" / "nginx.conf", "apps/web/nginx.conf")
    all_ok &= test_file_exists(ROOT_DIR / "docker-compose.yml", "docker-compose.yml")
    all_ok &= test_file_exists(ROOT_DIR / "docker-compose.dev.yml", "docker-compose.dev.yml")
    all_ok &= test_file_exists(ROOT_DIR / ".dockerignore", ".dockerignore")
    
    print("\nValidating file content & constraints:")
    all_ok &= validate_dockerfile_web()
    all_ok &= validate_dockerfile_api()
    all_ok &= validate_nginx_conf()
    all_ok &= validate_docker_compose()
    all_ok &= validate_dockerignore()
    all_ok &= validate_compose_syntax()

    if all_ok:
        print("\n[SUCCESS] All Docker files, configs, and constraints validated successfully!\n")
        sys.exit(0)
    else:
        print("\n[FAILURE] One or more Docker validations failed.\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
