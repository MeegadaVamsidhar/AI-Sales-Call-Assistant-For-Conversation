# Next.js Frontend

Modern React-based user interface for the AI Sales Call Assistant with real-time voice interaction, admin dashboard, and order management.

## Project Structure

```
agent-starter-react/
├── app/               # Next.js App Router pages
│   ├── page.tsx      # Home page
│   ├── auth/         # Authentication pages
│   ├── call-summary/ # Call summary pages
│   ├── feedback/     # Feedback pages
│   └── api/          # API routes
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   └── ...           # Custom components
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── public/           # Static assets
└── package.json      # Node dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Backend API URL
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=mongodb://localhost:27017
DB_NAME=agent_starter_db

# LiveKit
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 3. Start Development Server

```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

Visit http://localhost:3000 to see the application.

## Key Features

- **Voice Interaction** - Real-time AI voice assistant for book sales
- **User Switching** - Toggle between customer profiles (e.g., John Smith vs Sarah Johnson) to see personalized recommendations
- **Admin Dashboard** - Order management and analytics
- **Call Summaries** - Automatic post-call reports with sentiment analysis
- **Feedback System** - Customer ratings and reviews
- **Dark Mode** - Modern slate color palette
- **Responsive Design** - Mobile-first approach

## Main Pages

### Public Pages
- `/` - Home page with voice assistant
- `/auth/login` - Admin login
- `/auth/admin-signup` - Admin registration

### Protected Pages (Admin Only)
- `/call-summary/{roomId}` - Call summary and analytics
- `/feedback/{roomId}` - Customer feedback form
- `/admin/dashboard` - Admin dashboard (if configured)

## Development

### Build for Production

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

### Linting & Formatting

```bash
# Run ESLint
pnpm lint

# Format code with Prettier
pnpm format
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js
- **Voice**: LiveKit React SDK
- **State Management**: React Hooks
- **HTTP Client**: Fetch API

## Configuration Files

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier formatting rules

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process-id> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Delete node_modules: `rm -rf node_modules`
- Reinstall dependencies: `pnpm install`

### Environment Variables Not Loading
- Ensure `.env.local` exists (not `.env`)
- Restart development server after changing env vars
- Use `NEXT_PUBLIC_` prefix for client-side variables

### Backend Connection Issues
- Verify `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Ensure backend is running on port 8000
- Check CORS settings in backend

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

## Security Notes

- Never commit `.env.local` files
- Use `NEXT_PUBLIC_` prefix only for non-sensitive client-side variables
- Keep API keys and secrets in server-side environment variables
- Enable CSRF protection for forms
- Validate all user inputs

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Ensure Node.js 18+ is available
- Set environment variables
- Run `pnpm build && pnpm start`
