# RS3 Efficiency Hub

## Project Description
RS3 Efficiency Hub is a full-stack web application designed to help RuneScape 3 players optimize their gameplay. It features:
- **Efficiency Dashboard**: Visualizes progress toward goals like Max Cape.
- **Daily Task Optimizer**: Ranks daily activities by efficiency.
- **Express Data Layer**: Proxies Jagex Hiscores and handles data caching.

## Tech Stack
- **Frontend**: React (Vite)
- **Backend**: Node.js, Express
- **API**: Jagex Hiscores

## Prerequisite
- Node.js (v20 tested)

## Getting Started

1.  **Install Dependencies**:
    Run the following command in the root directory to install dependencies for root, client, and server:
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    cd ..
    ```
    *(Note: Dependencies are already installed in this workspace)*

2.  **Run the Application**:
    You can start both the client and server simultaneously using:
    ```bash
    npm start
    ```
    - Client runs on: `http://localhost:5173`
    - Server runs on: `http://localhost:5000`

## Structure
- `/client`: React Vite application.
- `/server`: Express backend application.
