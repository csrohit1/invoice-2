# Sirus Invoice Backend

Backend API for the Sirus Invoice Management System built with Node.js, Express, TypeScript, and Prisma.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Multi-tenant Architecture**: Support for multiple companies/tenants
- **Customer Management**: CRUD operations for customer data
- **Inventory Management**: Product/service catalog with pricing
- **Sales Orders**: Order management with approval workflow
- **Invoice Generation**: PDF invoice generation with email delivery
- **Payment Integration**: Cashfree payment gateway integration
- **Email System**: Automated email notifications
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Email**: Nodemailer with Mailgen
- **PDF Generation**: Puppeteer
- **Payment**: Cashfree
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- SMTP server for emails

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Seed the database (optional):
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/create` - Create new account
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/verify-email/:token` - Verify email
- `POST /api/v1/auth/request-password-reset` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer
- `PATCH /api/v1/customers/:id` - Update customer

### Inventory
- `GET /api/v1/inventory-item` - List inventory items
- `POST /api/v1/inventory-item` - Create item
- `GET /api/v1/inventory-item/:id` - Get item
- `PATCH /api/v1/inventory-item/:id` - Update item
- `DELETE /api/v1/inventory-item/:id` - Delete item

### Sales Orders
- `GET /api/v1/sales-order` - List sales orders
- `POST /api/v1/sales-order` - Create sales order
- `GET /api/v1/sales-order/:id` - Get sales order
- `PATCH /api/v1/sales-order/:id` - Update sales order
- `PATCH /api/v1/sales-order/:id/status/accept` - Accept order
- `PATCH /api/v1/sales-order/:id/status/reject` - Reject order

### Invoices
- `GET /api/v1/invoice` - List invoices
- `POST /api/v1/invoice` - Create invoice
- `GET /api/v1/invoice/:id` - Get invoice
- `PATCH /api/v1/invoice/:id` - Update invoice
- `PATCH /api/v1/invoice/:id/status/paid` - Mark as paid

### Plans & Subscriptions
- `GET /api/v1/plans` - List subscription plans
- `POST /api/v1/subscriptions/init-payment` - Initialize payment
- `POST /api/v1/subscriptions/confirm-payment` - Confirm payment

## Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database"
CLIENT_URI="http://localhost:3000"
BASE_PATH="api/v1"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# JWT Configuration
JWT_ACCESS_TOKEN_SECRET="your-access-token-secret"
JWT_ACCESS_TOKEN_EXPIRY="15m"
JWT_REFRESH_TOKEN_SECRET="your-refresh-token-secret"
JWT_REFRESH_TOKEN_EXPIRY="7d"

# Cashfree Configuration
CASHFREE_APP_ID="your-cashfree-app-id"
CASHFREE_APP_SECRET="your-cashfree-secret"
```

## Database Schema

The application uses a multi-tenant architecture with the following main entities:

- **Auth**: User authentication
- **UserProfile**: User profiles with roles
- **Tenant**: Company/organization data
- **Customer**: Customer information
- **InventoryItem**: Products/services catalog
- **SalesOrder**: Sales orders with items
- **Invoice**: Invoices with items
- **Plan**: Subscription plans
- **TenantSubscription**: Active subscriptions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## License

ISC