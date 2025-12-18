# Wreddit

<div align="center">

### A modern, full-stack reddit clone with AI superpowers.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

## 📖 About The Project

**Wreddit** is a robust, open-source community aggregation platform inspired by Reddit. It's built to explore the
capabilities of modern web technologies, featuring real-time interactions, AI-generated content summaries, and a sleek,
responsive user interface.

Whether you're looking to share links, discuss topics, or just lurk, Wreddit provides a familiar yet enhanced
experience.

### ✨ Key Features

* **👥 Communities**: Create and join topic-specific communities (subreddits) to find your people.
* **📝 Rich Posts**: Share content with rich text support, images, and links.
* **🤖 AI Summaries**: Instantly get the gist of long posts with integrated **Google Gemini AI** summarization.
* **💬 Real-Time Chat**: Engage in live conversations with other users via WebSocket-powered chat rooms.
* **🗳️ Voting System**: Upvote or downvote posts and comments to curate the best content.
* **👤 User Profiles**: Customize your profile with avatars and banners, and view your activity history.
* **🔍 Search**: Find communities and posts quickly with comprehensive search functionality.
* **🌗 Dark Mode**: Easy on the eyes with a polished dark theme.

## 🛠️ Technology Stack

Wreddit is built using a modern MERN-like stack, leveraging the power of TypeScript and Docker.

### **Frontend (Client)**

* **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **UI Components**: [Radix UI](https://www.radix-ui.com/), [Shadcn UI](https://ui.shadcn.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **State & Forms**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
* **Routing**: [React Router v7](https://reactrouter.com/)

### **Backend (Server)**

* **Runtime**: [Node.js](https://nodejs.org/)
* **Framework**: [Express.js v5](https://expressjs.com/)
* **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose ODM)
* **Caching**: [Redis](https://redis.io/)
* **Authentication**: JWT (JSON Web Tokens)
* **Real-time**: [WebSocket (ws)](https://github.com/websockets/ws)
* **AI Integration**: [Google Gemini AI](https://deepmind.google/technologies/gemini/)

### **DevOps & Tools**

* **Containerization**: [Docker](https://www.docker.com/) & Docker Compose
* **Package Manager**: [pnpm](https://pnpm.io/)
* **Linting**: ESLint, Prettier

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:

* **[Git](https://git-scm.com/)**
* **[Docker Desktop](https://www.docker.com/products/docker-desktop)** (Ensure the Docker daemon is running)
* **[Node.js](https://nodejs.org/)** (v18.x or later recommended for local execution without Docker)
* **[pnpm](https://pnpm.io/installation)** (Optional, if running locally without Docker)

## 🚀 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Philodoescode/Wreddit.git
   cd Wreddit
   ```

2. **Environment Configuration**

   You need to set up environment variables for the application to function correctly, especially for AI features.

   Create a `.env` file in the **root** directory (or check `server/` and `client/` if separate configs are needed, but
   typically the root `.env` is used by Docker):

   ```bash
   cp .env.example .env
   ```

   **Required Variables:**
    * `GEMINI_API_KEY`: Get your API key from [Google AI Studio](https://aistudio.google.com/).
    * `MONGO_URI`: (Optional) Defaults to `mongodb://mongo:27017/wreddit` in Docker.
    * `JWT_SECRET`: (Optional) Secret key for signing tokens.

3. **Run with Docker (Recommended)**

   The easiest way to start Wreddit is using Docker Compose. This will spin up the Client, Server, MongoDB, and Redis
   containers.

   ```bash
   docker-compose up --build
   ```

    * **Frontend**: http://localhost:5173
    * **Backend**: http://localhost:5000
    * **Mongo Express** (if enabled): http://localhost:8081

4. **Run Locally (Dev Mode)**

   If you prefer to run services individually:

    * **Server**:
      ```bash
      cd server
      pnpm install
      pnpm start
      ```
    * **Client**:
      ```bash
      cd client
      pnpm install
      pnpm dev
      ```

## 📂 Project Structure

```
Wreddit/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route page components (Home, Profile, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and helpers
│   ├── public/             # Static assets
│   └── package.json
│
├── server/                 # Backend Express Application
│   ├── controller/         # Request logic handlers
│   ├── model/              # Mongoose schemas (User, Post, Community)
│   ├── routes/             # API route definitions
│   ├── websocket/          # Real-time chat logic
│   ├── uploads/            # User uploaded content
│   └── package.json
│
├── docker-compose.yml      # Docker services orchestration
└── README.md
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any
contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ✍️ Authors

* Yousif Abdulhafiz - [@ysif9](https://github.com/ysif9)
* Philodoescode [Philodoescode](https://github.com/Philodoescode)
* Saifeldin Elsayes - [@Saifeldinsais](https://github.com/Saifeldinsais)
* Noha Elsayed - [@Nohaelsayedd](https://github.com/Nohaelsayedd)
* Hams Hassan - [@Hams2305](https://github.com/Hams2305)
* Jana Sameh - [@janasameh7](https://github.com/janasameh7)

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.



<div align="center">
Built with ❤️ by the Wreddit Team
</div>
