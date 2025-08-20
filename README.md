# Realtime Chat Application

A full-stack realtime chat application built with React/Next.js frontend and Node.js/Express backend.

## Features

- 🔐 User authentication (register/login)
- 💬 Real-time messaging with Socket.IO
- 👥 User presence (online/offline status)
- ⌨️ Typing indicators
- 📱 Responsive design with modern UI
- 🗄️ MySQL database with Sequelize ORM

## Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication
- **Axios** - API requests

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Sequelize** - ORM
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn

## Quick Start

1. **Clone and setup the project:**
   ```bash
   cd realtime-chat
   npm install
   ```

2. **Database setup:**
   - Make sure MySQL is running
   - Update server/.env with your database credentials

3. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend on http://localhost:3000

## Manual Setup

If you prefer to run servers separately:

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   Create `.env` file in the server directory:
   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:5000
   
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=chatapp
   DB_PORT=3306
   
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

3. **Sync database:**
   ```bash
   npm run sync
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to web directory:**
   ```bash
   cd web
   npm install
   ```

2. **Configure environment variables:**
   Create `.env.local` file in the web directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_WS_URL=http://localhost:5000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get current user profile

### Conversations
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create/get conversation with partner

### Messages
- `GET /api/messages/:conversationId` - Get conversation messages
- `POST /api/messages` - Send new message
- `PUT /api/messages/:messageId/read` - Mark message as read

## Socket Events

### Client to Server
- `conversation:join` - Join conversation room
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator

### Server to Client
- `message:new` - New message received
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline

## Project Structure

```
realtime-chat/
├── server/                 # Backend Node.js/Express
│   ├── src/
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── sockets/        # Socket.IO handlers
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Main server file
│   ├── models/             # Sequelize models
│   └── package.json
├── web/                    # Frontend Next.js
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utilities and stores
│   │   ├── stores/         # Zustand stores
│   │   ├── api.ts          # API configuration
│   │   └── socket.ts       # Socket configuration
│   └── package.json
└── package.json            # Root package.json
```

## Development Tips

1. **Database Changes:** Run `npm run server:sync` to sync database schema changes
2. **Hot Reload:** Both frontend and backend support hot reload during development
3. **Error Handling:** Check browser console and server logs for debugging
4. **Socket Connection:** Ensure both servers are running for real-time features

## Common Issues

1. **CORS errors:** Make sure `FRONTEND_URL` in server/.env matches your frontend URL
2. **Database connection:** Verify MySQL is running and credentials are correct
3. **Socket connection failed:** Check that both servers are running on correct ports
4. **JWT errors:** Ensure `JWT_SECRET` is set in server/.env

## Production Deployment

1. **Build frontend:**
   ```bash
   cd web && npm run build
   ```

2. **Set production environment variables**

3. **Use process manager like PM2 for the backend**

4. **Configure reverse proxy (nginx) for production**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
