# LaChat
Open and free temp chat

## Overview
-  For setup guide stay here visit 
-  For API and socket.io guides visit [Group Chat Backend Docs](group-chat-backend/README.md)
-  No Tests are implemented


# Setup Guide
This guide will help you automatically set up and run the LaChat Group Chat Service using the provided shell script.

## Prerequisites

-   **Docker**: Version 20.10 or higher
-   **Docker Compose**: Version 1.29 or higher
-   **Git**: Version 2.0 or higher
-   **OS**: Unix Linux, MacOS or WSL on windows

## Steps to Set Up and Run the Project

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/alire-alavi/LaChat/main/install.sh)"
```

## Default Configuration

-   The application will be accessible on port `3000` by default.
-   Configuration values are loaded from `config.docker.yaml`. Make sure to set up environment variables if overriding defaults is required.

## Step by Step and Better way to setup

If you wish to customize the Docker Compose setup or run the application manually:

1. Clone the repository:

    ```bash
    git clone https://github.com/alire-alavi/LaChat.git
    ```

2. Navigate to the project directory:

    ```bash
    cd LaChat
    ```

3. Create a config.docker.yml file in `group-chat-backend` dir

    ```
    cp group-chat-backend/sample.docker.yaml group-chat-backend/config.docker.yaml
    ```
4. Add your desired config to the config.docker.yaml file: e.g. JWT settings, APP settings and Database settings according to docker compose file

5. Start the services manually:
    ```bash
    docker compose up --build
    ```

