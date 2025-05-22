# Inventory Management System Backend

A robust backend system for managing multi-store inventory, built with Node.js, Express, and MySQL.

## Features

- User authentication with JWT
- Role-based access control (Admin, Manager, Employee)
- Product and category management
- Stock movement tracking
- Purchase order management
- Supplier management
- Comprehensive API documentation

## Tech Stack

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JSON Web Tokens (JWT)
- Express Validator

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd inventory-management-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=inventory_management

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

4. Initialize the database:
```bash
# The database will be automatically created and synced when running the server in development mode
npm run dev
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - User login

### Categories
- GET /api/categories - Get all categories
- POST /api/categories - Create a new category
- GET /api/categories/:id - Get category by ID
- PUT /api/categories/:id - Update category
- DELETE /api/categories/:id - Delete category

### Products
- GET /api/products - Get all products
- POST /api/products - Create a new product
- GET /api/products/:id - Get product by ID
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

### Stock Movements
- GET /api/stock-movements - Get all stock movements
- POST /api/stock-movements - Create a new stock movement
- GET /api/stock-movements/:id - Get stock movement by ID

### Suppliers
- GET /api/suppliers - Get all suppliers
- POST /api/suppliers - Create a new supplier
- GET /api/suppliers/:id - Get supplier by ID
- PUT /api/suppliers/:id - Update supplier
- DELETE /api/suppliers/:id - Delete supplier

### Orders
- GET /api/orders - Get all orders
- POST /api/orders - Create a new order
- GET /api/orders/:id - Get order by ID
- PUT /api/orders/:id - Update order status
- DELETE /api/orders/:id - Cancel order

## Testing

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 