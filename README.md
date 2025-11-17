# Figma Flow Mapper

**Design System Context Tool for LLMs** - Bridge between Figma designs and AI-assisted development

Figma Flow Mapper is a web application that helps developers using AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.) to better understand and implement Figma designs. It automatically extracts design information, analyzes component relationships, and generates machine-readable context that LLMs can understand.

## Features

- **Google OAuth Authentication** - Secure, password-less sign-in
- **Figma Integration** - Import designs using Personal Access Tokens
- **Automated Design Analysis** - Extract frames, components, and layouts
- **Visual Flow Mapping** - Visualize relationships between screens
- **LLM-Optimized Export** - Generate context-rich documentation for AI tools
- **Secure Token Storage** - AES-256-GCM encrypted token management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **API**: Figma REST API
- **Deployment**: Vercel-ready

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- A Google Cloud account (for OAuth)
- A Figma account with access to design files

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/figma-flow-mapper.git
cd figma-flow-mapper
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/figma_flow_mapper"

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Encryption Key (for Figma tokens)
ENCRYPTION_KEY="your-64-char-hex-key"
```

### 4. Generate Required Secrets

**NextAuth Secret:**
```bash
openssl rand -base64 32
```

**Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret to `.env.local`

### 6. Set Up the Database

Create a PostgreSQL database:

```bash
createdb figma_flow_mapper
```

Push the schema to the database:

```bash
npm run db:push
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### View Database in Drizzle Studio

```bash
npm run db:studio
```

This opens a visual database browser at `https://local.drizzle.studio`

### Generate Migrations

```bash
npm run db:generate
```

### Apply Migrations

```bash
npm run db:migrate
```

## Usage

### 1. Sign In

- Click "Get Started" on the homepage
- Sign in with your Google account

### 2. Add Figma Token

- Go to Settings
- Generate a Personal Access Token in Figma:
  1. Go to Figma → Settings → Account
  2. Scroll to "Personal access tokens"
  3. Click "Create a new personal access token"
  4. Copy the token
- Paste the token in the settings page and click "Save"

### 3. Import a Figma File

- Click "New Project" in the dashboard
- Paste a Figma file URL (e.g., `https://figma.com/file/ABC123/My-Design`)
- Select the pages you want to import
- Click "Import"

### 4. View and Export

- Browse your imported frames and pages
- Export design documentation for your AI coding assistant

## Project Structure

```
figma-flow-mapper/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── figma/           # Figma API endpoints
│   │   ├── projects/        # Project management
│   │   └── user/            # User settings
│   ├── dashboard/           # Dashboard page
│   ├── projects/            # Project pages
│   ├── settings/            # Settings page
│   ├── signin/              # Sign-in page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── dashboard/           # Dashboard components
│   ├── settings/            # Settings components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utilities and libraries
│   ├── db/                  # Database schema and client
│   ├── figma/               # Figma API client
│   ├── auth.ts              # NextAuth configuration
│   ├── encryption.ts        # Token encryption
│   └── utils.ts             # Utility functions
├── types/                   # TypeScript type definitions
├── .env.example             # Environment variables template
├── drizzle.config.ts        # Drizzle ORM configuration
├── middleware.ts            # Next.js middleware
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Security

- **Token Encryption**: Figma tokens are encrypted using AES-256-GCM before storage
- **HTTPS Only**: Cookies are marked `secure` and `httpOnly`
- **CSRF Protection**: Built-in NextAuth.js CSRF protection
- **Rate Limiting**: API endpoints are rate-limited
- **Input Validation**: All user inputs are validated and sanitized

## Development

### Run Type Checking

```bash
npm run type-check
```

### Run Linter

```bash
npm run lint
```

### Build for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Set up a PostgreSQL database (Vercel Postgres, Supabase, etc.)
5. Deploy!

### Environment Variables for Production

Make sure to update these in your production environment:

- `NEXTAUTH_URL` → Your production domain
- `DATABASE_URL` → Your production database
- Update Google OAuth redirect URI to include your production domain

## Troubleshooting

### Database Connection Errors

- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Verify database exists: `psql -l`

### Google OAuth Errors

- Verify redirect URI matches exactly in Google Console
- Check that Google+ API is enabled
- Ensure NEXTAUTH_URL is correct

### Figma API Errors

- **403 Forbidden**: Token is invalid or file permissions are wrong
- **404 Not Found**: File doesn't exist or URL is malformed
- **429 Rate Limit**: Too many requests, wait and retry

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

### v1.1
- [ ] Flow connection editor
- [ ] Component detection and deduplication
- [ ] Enhanced export formats (JSON, CSV)

### v1.2
- [ ] Design system analysis
- [ ] Color and typography extraction
- [ ] Spacing grid detection

### v2.0
- [ ] Real-time collaboration
- [ ] Team workspaces
- [ ] Figma plugin version
- [ ] AI-generated flow suggestions

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/figma-flow-mapper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/figma-flow-mapper/discussions)
- **Email**: support@figmaflowmapper.com

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Figma API](https://www.figma.com/developers/api) - Design data

---

Built with ❤️ for developers using AI coding assistants
