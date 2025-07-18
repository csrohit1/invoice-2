# Sirus Invoice Management System

A complete invoice and billing management system with separate backend API and frontend dashboard.

## Project Structure

```
├── backend/           # Node.js + TypeScript + Prisma API
│   ├── src/          # Source code
│   ├── prisma/       # Database schema and migrations
│   └── package.json  # Backend dependencies
├── frontend/         # React + Tailwind CSS Dashboard
│   ├── src/          # React components and pages
│   └── package.json  # Frontend dependencies
└── README.md         # This file
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and configuration
```

4. Set up database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Start backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Test Mode (No Backend Required)

The frontend includes a complete test mode that works without the backend:

### Test Login Credentials
- **Email**: `admin@test.com`
- **Password**: `test123`

### Features Available in Test Mode
- ✅ Complete dashboard with sample data
- ✅ Customer management (CRUD operations)
- ✅ Inventory management (CRUD operations)
- ✅ Sales order viewing and status updates
- ✅ Invoice viewing and status updates
- ✅ Settings management
- ✅ All UI interactions and workflows

## System Features

### Backend API Features
- **Multi-tenant Architecture**: Support for multiple companies
- **Authentication & Authorization**: JWT-based with role management
- **Customer Management**: Complete CRUD operations
- **Inventory Management**: Product/service catalog with pricing
- **Sales Orders**: Order management with approval workflow
- **Invoice Generation**: PDF generation with email delivery
- **Payment Integration**: Cashfree payment gateway
- **Email System**: Automated notifications
- **Database**: PostgreSQL with Prisma ORM

### Frontend Dashboard Features
- **Modern React Dashboard**: Responsive design with green theme
- **Real-time Data**: React Query for efficient data management
- **Customer Management**: Add, edit, delete customers
- **Inventory Tracking**: Manage products with pricing and taxes
- **Sales Order Management**: Create and approve orders
- **Invoice Management**: Generate and track invoices
- **Settings**: Company configuration and user management
- **Mobile Responsive**: Works on all device sizes

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Email**: Nodemailer + Mailgen
- **PDF Generation**: Puppeteer
- **Payment**: Cashfree Gateway
- **Validation**: Zod

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS (Green Theme)
- **Routing**: React Router
- **State Management**: React Query
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **HTTP Client**: Axios

## API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/create` - Create account
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/verify-email/:token` - Verify email

### Business Endpoints
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/inventory-item` - List inventory
- `POST /api/v1/inventory-item` - Create inventory item
- `GET /api/v1/sales-order` - List sales orders
- `POST /api/v1/sales-order` - Create sales order
- `GET /api/v1/invoice` - List invoices
- `POST /api/v1/invoice` - Create invoice

## Development Workflow

### Running Both Services
1. **Terminal 1** - Backend:
```bash
cd backend && npm run dev
```

2. **Terminal 2** - Frontend:
```bash
cd frontend && npm run dev
```

### Testing Without Backend
1. **Terminal 1** - Frontend only:
```bash
cd frontend && npm run dev
```

2. Use test credentials: `admin@test.com` / `test123`

## Production Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

## Environment Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
CLIENT_URI="http://localhost:3000"
JWT_ACCESS_TOKEN_SECRET="your-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Frontend
- Automatically detects backend at `http://localhost:5000`
- Falls back to mock data in test mode
- Configure API base URL for production

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes in appropriate directory (`backend/` or `frontend/`)
4. Test thoroughly (including test mode)
5. Submit pull request

## License

ISC - See individual package.json files for details

## Support

For issues and questions:
- Backend API issues: Check `backend/README.md`
- Frontend issues: Check `frontend/README.md`
- General questions: Create an issue in the repository

---

**Quick Test**: Use `admin@test.com` / `test123` to explore the full dashboard without any setup! 🚀