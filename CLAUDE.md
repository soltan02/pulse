# Pulse Monitoring - Project Context & AI Agent Guidelines

## Project Overview
Self-hosted website health monitoring tool with multi-layer checks (Frontend, Backend, Database, SSL), AI-powered incident diagnosis, and real-time alerts.

## Tech Stack
- **Frontend:** React 18, TypeScript, Framer Motion, Recharts, Lucide React
- **Backend:** Express 5, Node 20, Prisma 6, PostgreSQL
- **Build:** Vite, TypeScript, Vitest
- **Deploy:** Docker, Render, Vercel

## Core Features
1. Multi-layer site monitoring with interval control
2. AI-powered incident diagnosis (Gemini API)
3. Real-time alerts (Telegram, Slack, Discord, Webhook)
4. Public status page with 30-day uptime
5. Incident history with resolution tracking
6. Responsive dark theme UI with animations

## Coding Standards

### TypeScript
- Use strict mode with `noUncheckedIndexedAccess`
- Prefer typed interfaces over inline types
- Use Prisma-generated types where possible
- Avoid `any` - use proper type guards

### React Components
- Functional components with hooks only
- Use `motion` from Framer Motion for animations
- Keep components under 200 lines
- Extract reusable UI patterns into separate components
- Use TypeScript props interfaces

### Backend
- Express middleware for auth
- Async/await with proper error handling
- Use Prisma for all database operations
- Cron jobs for scheduled monitoring

### Styling
- CSS custom properties in `globals.css`
- Inline styles for dynamic values
- Dark theme with semantic color tokens
- Responsive design with flexbox/grid

### Testing
- Vitest for unit tests
- Test status mapping logic
- Mock Prisma queries in tests

## Git Conventions
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`
- Keep commits atomic and descriptive
- Link to issues when applicable

## Security
- Password hashing with SHA-256
- HTTP-only cookies for sessions
- Rate limiting on auth endpoints
- Input validation on all forms

## Performance
- Debounce rapid API calls
- Use React.memo for expensive components
- Optimize Framer Motion animations (transform/opacity only)
- Paginate large datasets

## AI Agent Guidelines
When working on this project:
1. Read CLAUDE.md before making changes
2. Check existing patterns in similar files
3. Use TypeScript types consistently
4. Test changes with `npm test`
5. Build with `npm run build` before committing
6. Update documentation for new features
