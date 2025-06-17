#!/bin/bash

# Copilot Generated Script
# Exit immediately if a command fails
set -e

# Constants
REPO_URL="https://github.com/alire-alavi/LaChat.git"
PROJECT_DIR="LaChat"
BRANCH="main"
CONFIG_FILE_PATH="group-chat-backend/config.docker.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    if ! command_exists git; then
        echo -e "${RED}Error: Git is not installed.${NC}"
        exit 1
    fi

    if ! command_exists docker; then
        echo -e "${RED}Error: Docker is not installed.${NC}"
        exit 1
    fi

    if ! command_exists docker-compose; then
        echo -e "${RED}Error: Docker Compose is not installed.${NC}"
        exit 1
    fi

    echo -e "${GREEN}All prerequisites are installed.${NC}"
}

# Function to clone the repository
clone_repository() {
    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${YELLOW}Directory ${PROJECT_DIR} already exists. Skipping clone.${NC}"
    else
        echo -e "${YELLOW}Cloning the repository...${NC}"
        git clone --branch "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
        echo -e "${GREEN}Repository cloned into ${PROJECT_DIR}.${NC}"
    fi
}


# Function to create the configuration file
create_config_file() {
    echo -e "${YELLOW}Checking for ${CONFIG_FILE_PATH}...${NC}"
    cd "$PROJECT_DIR"

    if [ ! -f "$CONFIG_FILE_PATH" ]; then
        echo -e "${YELLOW}Copying sample.docker.yaml to ${CONFIG_FILE_PATH}...${NC}"
        mkdir -p "$(dirname "$CONFIG_FILE_PATH")" # Ensure the directory exists
        echo -e pwd
        cp group-chat-backend/sample.docker.yaml "$CONFIG_FILE_PATH"

        # Generate a random 64-character string for JWT_SECRET_KEY
        RANDOM_KEY=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 64)

        # Replace JWT_SECRET_KEY line in the config file
        sed -i "s/^JWT_SECRET_KEY:.*/JWT_SECRET_KEY: $RANDOM_KEY/" "$CONFIG_FILE_PATH"

        echo -e "${GREEN}Configuration file created at ${CONFIG_FILE_PATH} with a random JWT_SECRET_KEY.${NC}"
    else
        echo -e "${YELLOW}Configuration file already exists. Skipping creation.${NC}"
    fi
}

# Function to run Docker Compose
run_docker_compose() {
    echo -e "${YELLOW}Starting the services...${NC}"
    docker-compose up --build -d
    echo -e "${GREEN}Services are running.${NC}"
}

# Function to finish installation
finish_installation() {
    echo -e "${GREEN}Installation complete!${NC}"
    echo -e "${GREEN}Your services are now running.${NC}"
    echo -e "${YELLOW}To monitor logs, run:${NC} docker-compose logs -f"
}

# Script execution starts here
check_prerequisites
clone_repository
create_config_file
run_docker_compose
finish_installation
