# Sirus Invoice Frontend

Modern React dashboard for the Sirus Invoice Management System with Tailwind CSS styling and green theme.

## Features

- **Modern Dashboard**: Clean, responsive interface with real-time data
- **Customer Management**: Add, edit, and manage customer information
- **Inventory Management**: Track products/services with pricing and tax rates
- **Sales Orders**: Create and manage sales orders with approval workflow
- **Invoice Management**: Generate and track invoices with status updates
- **Settings**: Company information and configuration management
- **Test Mode**: Built-in mock data for testing without backend

## Tech Stack

- **React 18** with modern hooks and functional components
- **React Router** for client-side routing
- **Tailwind CSS** for styling with green theme
- **React Query** for data fetching, caching, and synchronization
- **Headless UI** for accessible UI components
- **Heroicons** for consistent iconography
- **Axios** for HTTP requests

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Test Mode

The application includes a built-in test mode that works without a backend:

### Test Credentials
- **Email**: `admin@test.com`
- **Password**: `test123`

### Mock Data Includes
- 2 sample customers with contact information
- 2 inventory items with pricing and tax rates
- 1 sales order with items and calculations
- 1 invoice linked to the sales order
- Complete company profile with address

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Sidebar.jsx     # Navigation sidebar
│   ├── Header.jsx      # Top header with user menu
│   └── Modal.jsx       # Modal component
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Login.jsx       # Login page
│   ├── Customers.jsx   # Customer management
│   ├── Inventory.jsx   # Inventory management
│   ├── SalesOrders.jsx # Sales order management
│   ├── Invoices.jsx    # Invoice management
│   └── Settings.jsx    # Settings page
├── services/           # API services
│   └── api.js          # Axios configuration and mock data
└── index.css           # Global styles and Tailwind components
```

## Key Features

### Dashboard
- Statistics cards showing key metrics
- Recent activity feed
- Quick action buttons
- Revenue chart placeholder

### Customer Management
- View all customers in a responsive table
- Add new customers with validation
- Edit existing customer information
- Delete customers with confirmation

### Inventory Management
- Manage products/services with pricing
- Track quantities and tax rates
- Add/edit/delete inventory items
- Currency formatting (₹ INR)

### Sales Orders
- View orders with status badges
- Accept/reject pending orders
- Detailed order view with itemized breakdown
- Status tracking (Pending, Accepted, Rejected)

### Invoices
- Complete invoice management
- Status tracking (Pending, Paid, Overdue, Cancelled)
- Mark invoices as paid
- Detailed invoice view with calculations

### Settings
- Company information management
- Address and contact details
- GST number configuration
- Tabbed interface for different settings

## API Integration

The frontend is designed to work with the Sirus Invoice Backend API:

- **Base URL**: `http://localhost:5000/api/v1`
- **Authentication**: JWT tokens with automatic refresh
- **Error Handling**: Automatic logout on 401 errors
- **Mock Mode**: Fallback to mock data when backend is unavailable

### API Endpoints Used
- `POST /auth/login` - User authentication
- `GET /customers` - Fetch customers
- `POST /customers` - Create customer
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /inventory-item` - Fetch inventory items
- `POST /inventory-item` - Create inventory item
- `PATCH /inventory-item/:id` - Update inventory item
- `DELETE /inventory-item/:id` - Delete inventory item
- `GET /sales-order` - Fetch sales orders
- `PATCH /sales-order/:id/status/:action` - Update order status
- `GET /invoice` - Fetch invoices
- `PATCH /invoice/:id/status/:action` - Update invoice status

## Styling

The application uses a green color theme throughout:

- **Primary Green**: `#16a34a` (green-600)
- **Light Green**: `#22c55e` (green-500)
- **Dark Green**: `#15803d` (green-700)

### Custom CSS Classes
- `.btn-primary` - Green primary buttons
- `.btn-secondary` - White secondary buttons
- `.btn-success` - Green success buttons
- `.btn-danger` - Red danger buttons
- `.card` - White card containers
- `.input-field` - Styled form inputs
- `.table-header` - Table header styling

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

The frontend automatically detects the environment:

- **Development**: Uses `http://localhost:5000` for API calls
- **Test Mode**: Uses mock data when test credentials are used
- **Production**: Configure API base URL as needed

## Responsive Design

The application is fully responsive with:

- **Mobile-first** approach
- **Collapsible sidebar** for mobile devices
- **Responsive tables** with horizontal scrolling
- **Touch-friendly** interface elements
- **Adaptive layouts** for different screen sizes

## License

ISC