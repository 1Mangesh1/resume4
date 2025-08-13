#!/bin/bash
# Resume Generator Build and Deploy Script

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="resume-generator"
CONTAINER_NAME="resume-app"
PORT=3000

echo -e "${BLUE}🚀 Resume Generator Build and Deploy Script${NC}"
echo -e "${BLUE}============================================${NC}"

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ Error: $1 is not installed${NC}"
        exit 1
    fi
}

# Function to check Docker
check_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to health check
health_check() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}🔍 Performing health check...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f $url &> /dev/null; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - waiting for service...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ Health check failed after $max_attempts attempts${NC}"
    return 1
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
check_command docker
check_command curl
check_docker
echo -e "${GREEN}✅ Prerequisites satisfied${NC}"

# Parse command line arguments
BUILD_TYPE="development"
SKIP_TESTS=false
SKIP_HEALTH_CHECK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --production|-p)
            BUILD_TYPE="production"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-health)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --production, -p    Build production image"
            echo "  --skip-tests        Skip running tests"
            echo "  --skip-health       Skip health checks"
            echo "  --help, -h          Show this help"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}📋 Build Configuration:${NC}"
echo -e "  Build type: ${BUILD_TYPE}"
echo -e "  Skip tests: ${SKIP_TESTS}"
echo -e "  Skip health: ${SKIP_HEALTH_CHECK}"
echo ""

# Stop existing container
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || echo -e "${YELLOW}No existing container to stop${NC}"
docker rm $CONTAINER_NAME 2>/dev/null || echo -e "${YELLOW}No existing container to remove${NC}"

# Build appropriate image
if [ "$BUILD_TYPE" = "production" ]; then
    echo -e "${YELLOW}🏗️ Building production Docker image...${NC}"
    docker build -f Dockerfile.production -t ${IMAGE_NAME}:latest .
    IMAGE_TAG="${IMAGE_NAME}:latest"
else
    echo -e "${YELLOW}🏗️ Building development Docker image...${NC}"
    docker build -t ${IMAGE_NAME}:dev .
    IMAGE_TAG="${IMAGE_NAME}:dev"
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Run tests if not skipped
if [ "$SKIP_TESTS" = false ]; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        $IMAGE_TAG \
        npm test || {
        echo -e "${RED}❌ Tests failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⏭️ Skipping tests${NC}"
fi

# Start container
echo -e "${YELLOW}🚀 Starting container...${NC}"
if [ "$BUILD_TYPE" = "production" ]; then
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        -e NODE_ENV=production \
        -e DOCKERIZED=true \
        --restart unless-stopped \
        $IMAGE_TAG
else
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        -e NODE_ENV=development \
        -e DOCKERIZED=true \
        -v $(pwd)/temp:/app/temp \
        -v $(pwd)/uploads:/app/uploads \
        $IMAGE_TAG
fi

echo -e "${GREEN}✅ Container started successfully${NC}"

# Health check if not skipped
if [ "$SKIP_HEALTH_CHECK" = false ]; then
    if health_check "http://localhost:$PORT/api/health"; then
        echo -e "${GREEN}🎉 Deployment successful!${NC}"
        echo -e "${BLUE}📍 Application is running at: http://localhost:$PORT${NC}"
    else
        echo -e "${RED}❌ Deployment failed - health check failed${NC}"
        echo -e "${YELLOW}📋 Container logs:${NC}"
        docker logs $CONTAINER_NAME --tail 20
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️ Skipping health check${NC}"
    echo -e "${BLUE}📍 Application should be running at: http://localhost:$PORT${NC}"
fi

# Show container info
echo -e "${BLUE}📊 Container Information:${NC}"
docker ps | grep $CONTAINER_NAME || echo -e "${RED}Container not found${NC}"

echo -e "${GREEN}🎉 Build and deploy completed successfully!${NC}"
echo -e "${BLUE}Use 'docker logs $CONTAINER_NAME' to view logs${NC}"
echo -e "${BLUE}Use 'docker stop $CONTAINER_NAME' to stop the application${NC}"
