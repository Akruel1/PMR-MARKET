# Marketplace

A modern marketplace application similar to Avito, built with Next.js 14+, TypeScript, Prisma, and PostgreSQL.

## Features

- 🔐 Authentication with Google OAuth (NextAuth.js)
- 📝 Create and manage listings with images
- 🔍 Full-text search and filtering
- 💬 Messaging system between buyers and sellers
- ⭐ Favorites functionality
- 👤 User dashboard with statistics
- 🔧 Admin panel for moderation
- 📱 Responsive design with Tailwind CSS
- 📧 Email notifications for messages and moderation
- 🔍 SEO optimized with sitemap, robots.txt, and meta tags
- 📄 Pagination for better navigation
- 🌐 Open Graph and Twitter Card support
- ⭐ Review and rating system

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: NextAuth.js
- **Image Storage**: Cloudinary / AWS S3
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL (via Docker) or local PostgreSQL instance
- Redis (via Docker) or local Redis instance

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd marketplace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Key variables to configure:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your application URL
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `CLOUDINARY_*` or `AWS_*` - For image storage
- `SENDGRID_API_KEY` - For email notifications (optional)
- `SENDGRID_FROM_EMAIL` - Sender email address for notifications

### 4. Start Docker services

```bash
docker-compose up -d postgres redis
```

This will start PostgreSQL and Redis containers.

### 5. Run database migrations

```bash
npm run db:migrate
```

### 6. Seed the database (optional)

```bash
npm run db:seed
```

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret to your `.env` file

## Docker Setup (Alternative)

To run everything in Docker:

```bash
docker-compose up
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Next.js app on port 3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
marketplace/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── (routes)/          # Public routes
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utilities and helpers
├── prisma/                # Prisma schema and migrations
├── services/              # Business logic services
├── types/                 # TypeScript types
└── public/                # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Add PostgreSQL and Redis services

### Environment Variables for Production

Make sure to set all required environment variables in your hosting platform:
- Database connection string
- Redis URL
- NextAuth secrets
- OAuth credentials
- Image storage credentials

## Security Notes

- Never commit `.env` files
- Use strong secrets in production
- Enable HTTPS in production
- Configure CORS properly
- Set up rate limiting
- Regularly update dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

