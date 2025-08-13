# Resume Generator Docker Makefile
# Usage: make [target]

# Variables
IMAGE_NAME = resume-generator
CONTAINER_NAME = resume-app
PORT = 3000
PROD_IMAGE_NAME = $(IMAGE_NAME):latest
DEV_IMAGE_NAME = $(IMAGE_NAME):dev

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help build build-prod run run-prod stop clean logs shell test health dev-up dev-down restart doc

# Default target
help: ## Show this help message
	@echo "$(GREEN)Resume Generator Docker Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make build        - Build development Docker image"
	@echo "  make run          - Run development container"
	@echo "  make dev-up       - Start development environment with docker-compose"
	@echo "  make dev-down     - Stop development environment"
	@echo ""
	@echo "$(YELLOW)Production:$(NC)"
	@echo "  make build-prod   - Build production Docker image"
	@echo "  make run-prod     - Run production container"
	@echo ""
	@echo "$(YELLOW)Management:$(NC)"
	@echo "  make stop         - Stop running container"
	@echo "  make restart      - Restart container"
	@echo "  make logs         - Show container logs"
	@echo "  make shell        - Open shell in running container"
	@echo "  make health       - Check container health"
	@echo ""
	@echo "$(YELLOW)Maintenance:$(NC)"
	@echo "  make clean        - Remove containers and images"
	@echo "  make test         - Run tests in container"
	@echo "  make push         - Push image to registry"
	@echo "  make doc          - Generate comprehensive documentation"

# Development builds
build: ## Build development Docker image
	@echo "$(GREEN)Building development Docker image...$(NC)"
	docker build -t $(DEV_IMAGE_NAME) .
	@echo "$(GREEN)Development build complete!$(NC)"

build-prod: ## Build production Docker image
	@echo "$(GREEN)Building production Docker image...$(NC)"
	docker build -f Dockerfile.production -t $(PROD_IMAGE_NAME) .
	@echo "$(GREEN)Production build complete!$(NC)"

# Run containers
run: ## Run development container
	@echo "$(GREEN)Starting development container...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):3000 \
		-e NODE_ENV=development \
		-e DOCKERIZED=true \
		-v $(PWD)/temp:/app/temp \
		-v $(PWD)/uploads:/app/uploads \
		$(DEV_IMAGE_NAME)
	@echo "$(GREEN)Development container started on port $(PORT)$(NC)"
	@echo "$(YELLOW)Access the app at: http://localhost:$(PORT)$(NC)"

run-prod: ## Run production container
	@echo "$(GREEN)Starting production container...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):3000 \
		-e NODE_ENV=production \
		-e DOCKERIZED=true \
		--restart unless-stopped \
		$(PROD_IMAGE_NAME)
	@echo "$(GREEN)Production container started on port $(PORT)$(NC)"
	@echo "$(YELLOW)Access the app at: http://localhost:$(PORT)$(NC)"

# Docker Compose
dev-up: ## Start development environment with docker-compose
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)Development environment started!$(NC)"

dev-down: ## Stop development environment
	@echo "$(GREEN)Stopping development environment...$(NC)"
	docker-compose down
	@echo "$(GREEN)Development environment stopped!$(NC)"

# Container management
stop: ## Stop running container
	@echo "$(GREEN)Stopping container...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || echo "$(YELLOW)Container not running$(NC)"

restart: ## Restart container
	@echo "$(GREEN)Restarting container...$(NC)"
	@docker restart $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not found$(NC)"

logs: ## Show container logs
	@echo "$(GREEN)Showing container logs...$(NC)"
	@docker logs -f $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not found$(NC)"

logs-tail: ## Show last 50 lines of logs
	@echo "$(GREEN)Showing last 50 lines of logs...$(NC)"
	@docker logs --tail 50 $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not found$(NC)"

# Container interaction
shell: ## Open shell in running container
	@echo "$(GREEN)Opening shell in container...$(NC)"
	@docker exec -it $(CONTAINER_NAME) /bin/sh 2>/dev/null || echo "$(RED)Container not running$(NC)"

health: ## Check container health
	@echo "$(GREEN)Checking container health...$(NC)"
	@docker exec $(CONTAINER_NAME) curl -f http://localhost:3000/api/health 2>/dev/null \
		&& echo "$(GREEN)✅ Health check passed$(NC)" \
		|| echo "$(RED)❌ Health check failed$(NC)"

test: ## Run tests in container
	@echo "$(GREEN)Running tests in container...$(NC)"
	docker run --rm \
		-v $(PWD):/app \
		-w /app \
		$(DEV_IMAGE_NAME) \
		npm test

# Maintenance
clean: ## Remove containers and images
	@echo "$(GREEN)Cleaning up containers and images...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@docker rmi $(DEV_IMAGE_NAME) 2>/dev/null || true
	@docker rmi $(PROD_IMAGE_NAME) 2>/dev/null || true
	@docker system prune -f
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-all: ## Remove everything including volumes
	@echo "$(GREEN)Cleaning up everything...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@docker rmi $(DEV_IMAGE_NAME) 2>/dev/null || true
	@docker rmi $(PROD_IMAGE_NAME) 2>/dev/null || true
	@docker volume prune -f
	@docker system prune -a -f
	@echo "$(GREEN)Complete cleanup done!$(NC)"

# Build and test
build-and-test: build ## Build and test the image
	@echo "$(GREEN)Building and testing...$(NC)"
	@make test
	@echo "$(GREEN)Build and test complete!$(NC)"

# Quick development workflow
dev: ## Quick development setup (build + run)
	@echo "$(GREEN)Quick development setup...$(NC)"
	@make build
	@make run
	@sleep 3
	@make health

# Production deployment workflow
deploy: ## Build production image and run
	@echo "$(GREEN)Production deployment...$(NC)"
	@make build-prod
	@make run-prod
	@sleep 5
	@make health

# Docker registry operations (customize for your registry)
push: ## Push image to registry
	@echo "$(GREEN)Pushing image to registry...$(NC)"
	@echo "$(YELLOW)Configure your registry in Makefile first!$(NC)"
	# docker tag $(PROD_IMAGE_NAME) your-registry/$(IMAGE_NAME)
	# docker push your-registry/$(IMAGE_NAME)

# Monitoring
stats: ## Show container stats
	@echo "$(GREEN)Container statistics:$(NC)"
	@docker stats $(CONTAINER_NAME) --no-stream 2>/dev/null || echo "$(RED)Container not running$(NC)"

inspect: ## Inspect container
	@echo "$(GREEN)Container inspection:$(NC)"
	@docker inspect $(CONTAINER_NAME) 2>/dev/null || echo "$(RED)Container not found$(NC)"

# Database/Volume operations
backup-volumes: ## Backup application volumes
	@echo "$(GREEN)Backing up volumes...$(NC)"
	docker run --rm \
		-v $(PWD)/temp:/backup/temp \
		-v $(PWD)/uploads:/backup/uploads \
		alpine tar czf /backup/volumes-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /backup temp uploads
	@echo "$(GREEN)Volume backup complete!$(NC)"

# Development helpers
lint: ## Run linter in container
	@echo "$(GREEN)Running linter...$(NC)"
	docker run --rm \
		-v $(PWD):/app \
		-w /app \
		$(DEV_IMAGE_NAME) \
		npm run lint

format: ## Format code in container
	@echo "$(GREEN)Formatting code...$(NC)"
	docker run --rm \
		-v $(PWD):/app \
		-w /app \
		$(DEV_IMAGE_NAME) \
		npm run format

# Status check
status: ## Show current status
	@echo "$(GREEN)Current Status:$(NC)"
	@echo "$(YELLOW)Images:$(NC)"
	@docker images | grep $(IMAGE_NAME) || echo "No images found"
	@echo "$(YELLOW)Containers:$(NC)"
	@docker ps -a | grep $(CONTAINER_NAME) || echo "No containers found"
	@echo "$(YELLOW)Running containers:$(NC)"
	@docker ps | grep $(CONTAINER_NAME) || echo "No running containers"

# Documentation
doc: ## Generate comprehensive documentation
	@echo "$(GREEN)Generating comprehensive documentation...$(NC)"
	@mkdir -p docs
	@echo "# Resume Generator - Dockerized Setup Documentation" > docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "Generated on: $$(date)" >> docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "## 🏗️ Architecture Overview" >> docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "\`\`\`" >> docs/DOCKER_SETUP.md
	@echo "┌─────────────────────────────────────────┐" >> docs/DOCKER_SETUP.md
	@echo "│  Single Docker Container               │" >> docs/DOCKER_SETUP.md
	@echo "├─────────────────────────────────────────┤" >> docs/DOCKER_SETUP.md
	@echo "│  Node.js App + Integrated LaTeX        │" >> docs/DOCKER_SETUP.md
	@echo "│  ├── Express Server (Port 3000)        │" >> docs/DOCKER_SETUP.md
	@echo "│  ├── AI Resume Generator               │" >> docs/DOCKER_SETUP.md
	@echo "│  ├── Native pdflatex Compilation       │" >> docs/DOCKER_SETUP.md
	@echo "│  ├── LaTeX Code Cleaning              │" >> docs/DOCKER_SETUP.md
	@echo "│  └── Professional Error Handling       │" >> docs/DOCKER_SETUP.md
	@echo "├─────────────────────────────────────────┤" >> docs/DOCKER_SETUP.md
	@echo "│  Alpine Linux + TeX Live Full          │" >> docs/DOCKER_SETUP.md
	@echo "│  ├── texlive + texlive-full            │" >> docs/DOCKER_SETUP.md
	@echo "│  ├── Node.js 18                       │" >> docs/DOCKER_SETUP.md
	@echo "│  └── Production Security              │" >> docs/DOCKER_SETUP.md
	@echo "└─────────────────────────────────────────┘" >> docs/DOCKER_SETUP.md
	@echo "\`\`\`" >> docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "## 🚀 Quick Start Commands" >> docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "\`\`\`bash" >> docs/DOCKER_SETUP.md
	@echo "# Development" >> docs/DOCKER_SETUP.md
	@echo "make build && make run    # Build and run development container" >> docs/DOCKER_SETUP.md
	@echo "make health              # Check container health" >> docs/DOCKER_SETUP.md
	@echo "make logs                # View container logs" >> docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "# Production" >> docs/DOCKER_SETUP.md
	@echo "make build-prod && make run-prod  # Production deployment" >> docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "# Docker Compose (with Redis & monitoring)" >> docs/DOCKER_SETUP.md
	@echo "make dev-up              # Start full development stack" >> docs/DOCKER_SETUP.md
	@echo "make dev-down            # Stop development stack" >> docs/DOCKER_SETUP.md
	@echo "\`\`\`" >> docs/DOCKER_SETUP.md
	@echo "" >> docs/DOCKER_SETUP.md
	@echo "$(GREEN)Documentation generated in docs/DOCKER_SETUP.md$(NC)"
	@echo "$(YELLOW)Opening documentation...$(NC)"
	@cat docs/DOCKER_SETUP.md
