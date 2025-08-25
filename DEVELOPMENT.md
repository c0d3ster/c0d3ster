# Development Setup

This guide will help you get the project up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download here](https://nodejs.org/))
- **PostgreSQL** database ([Download here](https://www.postgresql.org/download/))
- **Git** ([Download here](https://git-scm.com/))

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/c0d3ster/c0d3ster.git
cd c0d3ster
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/c0d3ster"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Other services
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
POSTHOG_SECRET=your_posthog_secret
```

### 4. Database Setup

#### Option A: Local PostgreSQL

1. Create a new database:

```sql
CREATE DATABASE c0d3ster;
```

2. Run migrations:

```bash
npm run db:migrate
```

#### Option B: Use Local SQLite (Development Only)

For quick development, you can use SQLite:

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Your application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Database

```bash
npm run db:generate  # Generate new migration
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database with sample data
```

### Testing

```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

### GraphQL Code Generation

```bash
npm run codegen      # Generate GraphQL types
npm run codegen:watch # Watch for schema changes
```

## Project Structure

```
c0d3ster/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components (atoms, molecules, organisms)
│   ├── graphql/            # GraphQL schema, resolvers, and context
│   ├── services/           # Business logic and data access
│   ├── models/             # Database models and schemas
│   ├── libs/               # Shared utilities and configurations
│   └── styles/             # Global CSS and styling
├── migrations/             # Database migration files
├── tests/                  # Test files and configurations
└── public/                 # Static assets
```

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: GraphQL with Apollo Server, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Testing**: Vitest, Playwright
- **Code Quality**: ESLint, Prettier, TypeScript

## Development Workflow

### 1. Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the project's coding standards
3. Run tests: `npm run test`
4. Check code quality: `npm run lint && npm run type-check`
5. Commit your changes with a descriptive message

### 2. GraphQL Development

When working with GraphQL:

1. Define your schema in `src/graphql/schema/`
2. Implement resolvers in `src/graphql/resolvers/`
3. Add API client operations in `src/apiClients/`
4. Run `npm run codegen` to generate types
5. Use generated types in your components

### 3. Database Changes

When modifying the database:

1. Update your schema in `src/models/`
2. Generate a migration: `npm run db:generate`
3. Review the generated migration file
4. Run the migration: `npm run db:migrate`
5. Update your GraphQL schema if needed

## Troubleshooting

### Common Issues

#### Database Connection Issues

- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in `.env.local`
- Verify database exists and is accessible

#### GraphQL Type Generation Issues

- Run `npm run codegen` manually
- Check for syntax errors in your GraphQL schema
- Ensure all operations are properly defined

#### Build Issues

- Clear Next.js cache: `rm -rf .next`
- Delete node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`

### Getting Help

If you encounter issues:

1. Check the [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
2. Review existing issues in the repository
3. Create a new issue with detailed information about your problem

## Contributing

We welcome contributions! Please see our contributing guidelines for more information on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [GraphQL Documentation](https://graphql.org/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
