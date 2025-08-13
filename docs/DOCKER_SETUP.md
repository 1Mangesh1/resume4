# Resume Generator - Dockerized Setup Documentation

Generated on: Wed Aug 13 18:53:12 IST 2025

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│  Single Docker Container               │
├─────────────────────────────────────────┤
│  Node.js App + Integrated LaTeX        │
│  ├── Express Server (Port 3000)        │
│  ├── AI Resume Generator               │
│  ├── Native pdflatex Compilation       │
│  ├── LaTeX Code Cleaning              │
│  └── Professional Error Handling       │
├─────────────────────────────────────────┤
│  Alpine Linux + TeX Live Full          │
│  ├── texlive + texlive-full            │
│  ├── Node.js 18                       │
│  └── Production Security              │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start Commands

```bash
# Development
make build && make run    # Build and run development container
make health              # Check container health
make logs                # View container logs

# Production
make build-prod && make run-prod  # Production deployment

# Docker Compose (with Redis & monitoring)
make dev-up              # Start full development stack
make dev-down            # Stop development stack
```
