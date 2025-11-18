# Database Migrations

This directory contains database migration files for the Figma Flow Mapper application.

## Schema Overview

The complete database schema is defined in `migrations/001_complete_schema.sql` and includes:

- **Authentication**: Users, accounts, sessions, tokens
- **Projects**: User projects and Figma file connections
- **Frames**: Screen frames extracted from Figma
- **Components**: Figma components and instances
- **Interactive Elements**: Buttons, input fields
- **Connections**: Flow connections between frames
- **Design System**: Colors, typography, spacing
- **Organization**: Frame groups and categorization
- **Audit**: Export history and audit logs

## Running Migrations

### Option 1: Using psql

```bash
# Connect to your database and run the migration
psql $DATABASE_URL -f db/migrations/001_complete_schema.sql
```

### Option 2: Using npm script

If you have a migration script configured:

```bash
npm run db:migrate
```

### Option 3: Using Drizzle Kit

```bash
# Push schema changes
npm run db:push

# Generate migrations
npm run db:generate
```

## Environment Setup

1. Create a PostgreSQL database:
```bash
createdb figma_flow_mapper
```

2. Set the DATABASE_URL environment variable:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/figma_flow_mapper"
```

3. Run the migration:
```bash
psql $DATABASE_URL -f db/migrations/001_complete_schema.sql
```

## Schema Features

### Extensions

The schema uses two PostgreSQL extensions:

- **uuid-ossp**: For UUID generation
- **pgcrypto**: For encryption functions

### Automatic Timestamps

Tables with `updated_at` columns automatically update the timestamp on row updates using triggers.

### Row-Level Security (RLS)

RLS policies ensure users can only access their own data:

- Users see only their own projects
- Frames, components, and connections are scoped to user's projects

### Indexes

All foreign keys and frequently queried fields are indexed for optimal performance:

- `idx_projects_user_id`
- `idx_frames_project_id`
- `idx_connections_from_frame_id`
- And many more...

## TypeScript Types

TypeScript type definitions matching the database schema are available in:

```typescript
import type { User, Project, Frame, Connection } from '@/types/database'
```

## Schema Diagram

```
users
  ↓
projects
  ↓
frames → connections → frames
  ↓
buttons
input_fields
components
  ↓
component_instances

Design System:
  - colors
  - typography_styles
  - spacing_scales

Organization:
  - frame_groups
  - exports
  - audit_log
```

## Common Queries

### Get user's projects

```sql
SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC;
```

### Get frames for a project

```sql
SELECT * FROM frames
WHERE project_id = $1
ORDER BY page_name, name;
```

### Get all connections for a project

```sql
SELECT
  c.*,
  f1.name as from_frame_name,
  f2.name as to_frame_name
FROM connections c
JOIN frames f1 ON c.from_frame_id = f1.id
JOIN frames f2 ON c.to_frame_id = f2.id
WHERE c.project_id = $1;
```

### Get design system for a project

```sql
-- Colors
SELECT * FROM colors
WHERE project_id = $1
ORDER BY usage_count DESC;

-- Typography
SELECT * FROM typography_styles
WHERE project_id = $1
ORDER BY font_size DESC;

-- Spacing
SELECT * FROM spacing_scales
WHERE project_id = $1;
```

## Maintenance

### Vacuum and Analyze

Regularly vacuum and analyze tables for optimal performance:

```sql
VACUUM ANALYZE;
```

### Check Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Monitor Connection Pool

```sql
SELECT
  count(*) as connections,
  state,
  usename,
  application_name
FROM pg_stat_activity
GROUP BY state, usename, application_name;
```

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump $DATABASE_URL > backup.sql

# Schema only
pg_dump $DATABASE_URL --schema-only > schema.sql

# Data only
pg_dump $DATABASE_URL --data-only > data.sql
```

### Restore

```bash
psql $DATABASE_URL < backup.sql
```

## Troubleshooting

### Permission Errors

If you get permission errors, ensure your database user has the necessary privileges:

```sql
GRANT ALL PRIVILEGES ON DATABASE figma_flow_mapper TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Extension Errors

If extensions fail to install, you may need superuser privileges:

```sql
-- As superuser
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Migration Already Run

The migration uses `CREATE TABLE IF NOT EXISTS` and conditional trigger creation, so it's safe to run multiple times. It will skip existing objects.

## Development vs Production

### Development

- RLS policies can be disabled for easier testing
- Lower connection pool limits
- More verbose logging

### Production

- Enable RLS policies
- Optimize connection pool settings
- Set up monitoring and alerting
- Configure automated backups
- Use read replicas for heavy read workloads

## Support

For issues or questions:

1. Check the main [README](../README.md)
2. Review the [SCALABILITY](../docs/SCALABILITY.md) documentation
3. Open an issue on GitHub
