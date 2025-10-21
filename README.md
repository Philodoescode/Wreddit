# Wreddit
Open-source, full-stack clone of the popular community aggregation platform, designed to explore modern web technologies while fostering a vibrant, slightly self-aware community. We're here to see what you've wrote and maybe, just maybe, judge it slightly.
Of course. Here is a clear and concise `README.md` file that you can place in the root of your "Wreddit" project. It will guide other developers on how to set up and run the application in their local development environment using Docker.

## Prerequisites

Before you begin, ensure you have the following tools installed on your system.

*   **Git**: For cloning the repository.
*   **Docker & Docker Compose**: For building and running the containerized application. Make sure the Docker daemon is running.
*   **Node.js**: Recommended version `v18.x` or later.
*   **pnpm**: This project uses `pnpm` as its package manager. If you don't have it, you can install it globally with npm (you should have npm installed already):
    ```bash
    npm install -g pnpm
    ```

## 🚀 Getting Started

Follow these steps to get your local development environment up and running.

### 1. Clone the Repository

First, clone the project from GitHub to your local machine:

```bash
git clone https://github.com/Philodoescode/Wreddit.git
cd Wreddit
```

### 2. Start the Application

The entire application stack (frontend, backend, and database) is managed by Docker Compose. To build the container images and start all the services, run the following command from the root directory of the project:

```bash
docker-compose up --build
```

*   `--build`: This flag tells Docker Compose to build the images from your `Dockerfile`s the first time you run it or if any changes have been made to them.
*   This command will take a few minutes the first time you run it as it needs to download the base images and install all the `pnpm` dependencies for both the client and server.

Once the process is complete, the application will be running in detached containers.

## 🛠️ Usage

### Accessing the Services

With the containers running, you can access the different parts of the application at the following URLs:

*   **Frontend (React + Vite)**: [http://localhost:5173](http://localhost:5173)
*   **Backend (Node.js + Express)**: [http://localhost:5000](http://localhost:5000)
*   **Database (MongoDB)**: Connect via a client at `mongodb://localhost:27017`

### Live Reloading

This setup is configured for live reloading. Any changes you save in the code within the `client/` or `server/` directories on your local machine will automatically trigger a restart or reload of the corresponding service inside its container.

## ✅ How to Test the Setup

To verify that all services are running correctly, you can perform these simple checks:

1.  **Test the Frontend**:
    *   Open your web browser and navigate to **[http://localhost:5173](http://localhost:5173)**.
    *   You should see the default React + Vite starter page.

2.  **Test the Backend API**:
    *   Open another browser tab and navigate to **[http://localhost:5000](http://localhost:5000)**.
    *   You should see the message: `Hello from the Wreddit server!`

3.  **Check Running Containers**:
    *   Open a new terminal window and run `docker ps`.
    *   You should see three containers running with names like `wreddit_client`, `wreddit_server`, and `wreddit_mongo`.

## ⚙️ Useful Docker Commands

Here are some common commands for managing your development environment:

*   **Start all services**:
    ```bash
    docker-compose up
    ```

*   **Stop and remove all services, volumes, and networks**:
    ```bash
    docker-compose down
    ```

*   **View logs for a specific service** (in real-time):
    ```bash
    # View logs for the backend
    docker-compose logs -f server

    # View logs for the frontend
    docker-compose logs -f client
    ```

*   **List all running containers**:
    ```bash
    docker ps
    ```

## 📂 Project Structure

The project is organized into two main directories:

*   **`/client`**: Contains the React/Vite frontend application.
*   **`/server`**: Contains the Node.js/Express backend API.
*   **`docker-compose.yml`**: The central configuration file for orchestrating all our Docker containers.