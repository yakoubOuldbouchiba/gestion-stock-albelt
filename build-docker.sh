#!/bin/bash
# ALBELT Docker Build Script
# Builds and pushes Docker images for ALBELT system

set -e

echo "======================================"
echo "ALBELT Docker Build Script"
echo "======================================"

# Configuration
REGISTRY=${DOCKER_REGISTRY:-"localhost"}
BACKEND_IMAGE="albelt-api:0.0.1-SNAPSHOT"
FRONTEND_IMAGE="albelt-ui:latest"
BACKEND_DIR="./albelt-api"
FRONTEND_DIR="./albelt-ui"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

print_status "Docker found: $(docker --version)"

# Parse arguments
BUILD_BACKEND=false
BUILD_FRONTEND=false
PUSH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            BUILD_BACKEND=true
            shift
            ;;
        --frontend)
            BUILD_FRONTEND=true
            shift
            ;;
        --all)
            BUILD_BACKEND=true
            BUILD_FRONTEND=true
            shift
            ;;
        --push)
            PUSH=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If no specific option, build all
if [ "$BUILD_BACKEND" = false ] && [ "$BUILD_FRONTEND" = false ]; then
    BUILD_BACKEND=true
    BUILD_FRONTEND=true
fi

# Build Backend
if [ "$BUILD_BACKEND" = true ]; then
    print_info "Building backend image: $BACKEND_IMAGE"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Check Maven
    if [ ! -f "pom.xml" ]; then
        print_error "pom.xml not found in $BACKEND_DIR"
        exit 1
    fi
    
    # Build with Jib
    print_info "Using Jib to build Docker image..."
    ./mvnw clean compile jib:dockerBuild -DskipTests
    
    if [ $? -eq 0 ]; then
        print_status "Backend image built successfully"
    else
        print_error "Failed to build backend image"
        exit 1
    fi
    
    cd ..
fi

# Build Frontend
if [ "$BUILD_FRONTEND" = true ]; then
    print_info "Building frontend image: $FRONTEND_IMAGE"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    
    if [ ! -f "$FRONTEND_DIR/Dockerfile" ]; then
        print_error "Dockerfile not found in $FRONTEND_DIR"
        exit 1
    fi
    
    docker build \
        -t "$FRONTEND_IMAGE" \
        -f "$FRONTEND_DIR/Dockerfile" \
        "$FRONTEND_DIR"
    
    if [ $? -eq 0 ]; then
        print_status "Frontend image built successfully"
    else
        print_error "Failed to build frontend image"
        exit 1
    fi
fi

# List built images
print_info "Built images:"
docker images | grep -E "albelt-|REPOSITORY"

# Push if requested
if [ "$PUSH" = true ]; then
    print_info "Pushing images to registry: $REGISTRY"
    
    if [ "$BUILD_BACKEND" = true ]; then
        docker tag "$BACKEND_IMAGE" "$REGISTRY/albelt-api:0.0.1-SNAPSHOT"
        docker push "$REGISTRY/albelt-api:0.0.1-SNAPSHOT"
        print_status "Backend image pushed"
    fi
    
    if [ "$BUILD_FRONTEND" = true ]; then
        docker tag "$FRONTEND_IMAGE" "$REGISTRY/albelt-ui:latest"
        docker push "$REGISTRY/albelt-ui:latest"
        print_status "Frontend image pushed"
    fi
fi

print_status "Build complete!"
echo ""
echo "Next steps:"
echo "  1. Start services: docker-compose up -d"
echo "  2. View logs: docker-compose logs -f"
echo "  3. Access UI: http://localhost"
echo "  4. Access API: http://localhost:8080/swagger-ui.html"
