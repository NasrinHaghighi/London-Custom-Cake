# Copilot Instructions - London Custom Cake Admin Dashboard

## Architecture Overview

**London Custom Cake** is a Next.js 16 admin dashboard for managing custom cake orders, flavors, and pricing. The app uses a three-layer architecture:

- **Frontend**: Next.js App Router with React 19, TailwindCSS, React Query for caching
- **API**: Next.js Route Handlers (`/app/api/*`) with request validation via Zod
- **Database**: MongoDB with Mongoose ODM, authentication via JWT tokens

### Key Service Boundaries

1. **Authentication** (`lib/auth.ts`, `app/api/login/*`): JWT token generation/verification, stored in HTTP-only cookies
2. **Admin Management** (`app/api/admin/*`): CRUD for admin accounts with password reset tokens
3. **Menu Management** (`app/dashboard/menu-management/*`): Product types, flavor types, and flavor-product combinations
4. **Dashboard** (`app/dashboard/page.tsx`): Real-time stats and activity logs

## Development Workflow

**Install & Run:**
```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint validation
```

**Database:** MongoDB required. Set `MONGODB_URI` and `JWT_SECRET` in `.env.local`

## Critical Patterns

### Authentication Flow
- Login endpoint validates phone (9 digits) + password via Zod schema
- On success, JWT token (24h expiry) set as `auth_token` cookie
- `authenticateRequest()` middleware extracts/verifies token from cookies
- All protected routes check `request.cookies.get('auth_token')`

### Data Validation
- **Always use Zod schemas** (`lib/validators/*`) before database operations
- Example: `loginSchema` validates phone format and password requirements
- Frontend also validates but server-side is authoritative

### Product Type Pricing
- Two pricing methods: `perunit` (quantity-based) or `perkg` (weight-based)
- Each has min/max constraints (`minQuantity/maxQuantity` or `minWeight/maxWeight`)
- Components conditionally render pricing UI based on `pricingMethod` enum
- See [ProductTypeCard.tsx](components/MenuManagement/ProductTypeCard.tsx#L40-L65)

### React Query Usage
- Cache config: 5min stale time, 10min garbage collection (see [useProductTypes.ts](hooks/useProductTypes.ts#L11-L13))
- All mutations invalidate `['productTypes']` or `['flavorTypes']` query keys on success
- Custom hooks pattern: `use*` hooks wrap API calls with error handling and toast notifications

### Database Indexing
- MongoDB models include explicit indexes for common queries (email, phone, token lookups)
- Compound indexes on active status + sort order for efficient pagination
- See [productTypeSchema.ts](lib/models/productTypeSchema.ts#L30-L40) and [admin.ts](lib/models/admin.ts#L15-L24)

### Logging
- Use `logger` from [lib/logger.ts](lib/logger.ts) for all operations
- Pino with pretty-printing in dev, JSON formatting in production
- Log authentication attempts, errors, and state changes for audit trails

## Component Structure

**Menu Management** components use controlled forms with edit modals:
- Card component displays entity → triggers edit modal
- Form component has separate sections per concern (fields, relationships)
- `onSuccess` callbacks invalidate React Query cache

**Protected Pages** require auth:
- Check cookie presence in API routes
- Frontend redirects unauthenticated users to `/` (login page)
- Use middleware pattern to extract user from `authenticateRequest()`

## Common Tasks

**Add New Admin:**
1. Call `POST /api/admin/` with name, email, phone
2. System generates password reset token, sends via nodemailer
3. Admin clicks link to `POST /api/set-password/` with new password + token

**Add Product Type:**
1. Validate form data via Zod schema in frontend + API
2. `POST /api/product-type/` → MongoDB insert
3. React Query invalidates `['productTypes']` → UI refetches
4. Display pricing constraints based on `pricingMethod` choice

**Debug Issues:**
- Check `.env.local` has `MONGODB_URI`, `JWT_SECRET`, `SMTP_*` (for nodemailer)
- Review logs: `logger.info()` tracks flows, `logger.error()` catches issues
- MongoDB indexes: ensure indexes exist for frequent queries

## File Reference Map

- **Auth**: [lib/auth.ts](lib/auth.ts), [app/api/login/route.ts](app/api/login/route.ts)
- **Models**: [lib/models/](lib/models/) (admin, productType, flavorType schemas)
- **Validators**: [lib/validators/](lib/validators/) (Zod schemas for input validation)
- **Hooks**: [hooks/](hooks/) (useProductTypes, useFlavorTypes with React Query)
- **API Routes**: [app/api/](app/api/) (RESTful endpoints)
- **Dashboard UI**: [app/dashboard/](app/dashboard/), [components/](components/)
- **Utils**: [lib/api/](lib/api/) (API client functions), [lib/logger.ts](lib/logger.ts)
