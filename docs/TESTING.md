# Testing Guide

This document provides a manual functional testing checklist for the Saba Chips Store system.

## Test Scope

The focus is on:

- Functional correctness
- UI flow validation
- Regression checks after refinement changes
- Admin reporting and export validation

## Environment

- Frontend running on `http://localhost:5173`
- Backend running on `http://localhost:5000`
- MySQL database available
- Valid customer account
- Valid admin account using `admin@sabachips.com`

## Functional Test Checklist

### 1. Authentication

- Register a new customer account
  - Expected: account is created successfully
- Log in with a valid account
  - Expected: session starts and protected pages become accessible
- Log in with invalid credentials
  - Expected: error message is shown
- Log out
  - Expected: session is cleared
- Request password reset
  - Expected: reset email flow starts if mail configuration is valid
- Reset password using a valid token
  - Expected: password is updated successfully

### 2. Customer Features

- Open the home page and load products
  - Expected: products display correctly
- Add an in-stock product to cart
  - Expected: cart updates successfully
- Attempt to add more than available stock
  - Expected: stock warning appears
- Update cart quantity
  - Expected: quantity changes correctly
- Remove an item from cart
  - Expected: item is removed
- Checkout with valid details
  - Expected: order is created and cart is cleared
- View profile order history
  - Expected: newest orders appear first

### 3. Admin Features

- Log in using the admin account
  - Expected: admin pages are accessible
- Open admin dashboard
  - Expected: summary cards load successfully
- Open user management
  - Expected: users list loads and pagination works
- Search users
  - Expected: filtered results appear
- Edit a user
  - Expected: user details update correctly
- Delete a user
  - Expected: user is removed successfully
- Open product management
  - Expected: products list loads and newest items appear first
- Add a new product
  - Expected: product appears in the list
- Update a product
  - Expected: product changes are saved
- Delete a product
  - Expected: product is removed successfully
- Open order management
  - Expected: newest orders appear on page 1
- Update order status
  - Expected: status changes persist

### 4. Reporting and Visualization

- Open reports page
  - Expected: summary, charts, and transactions load
- Verify charts render
  - Expected: sales, status, and top-product charts display properly
- Check transaction history pagination
  - Expected: newest transactions appear first
- Check activity log pagination
  - Expected: newest logs appear first

### 5. Export Testing

- Export summary report as CSV
  - Expected: file downloads and opens with structured data
- Export summary report as Excel-compatible `.xls`
  - Expected: file opens in spreadsheet software
- Export transaction history as CSV
  - Expected: file contains transaction rows and item summaries
- Export transaction history as Excel-compatible `.xls`
  - Expected: spreadsheet opens correctly
- Export users and activity logs
  - Expected: downloads work for CSV, Excel, and PDF-ready view
- Export PDF-ready report
  - Expected: browser print view opens and can be saved as PDF

## Regression Checks

After any new change, retest:

- Login/logout
- Cart add/remove/update
- Checkout
- Admin order status update
- Product create/update/delete
- Reports page loading
- Export buttons

## Known Verification Notes

- Frontend linting should be run with:

```bash
cd client
npm run lint
```

- Frontend build can be tested with:

```bash
cd client
npm run build
```

- Backend health route:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "OK"
}
```

## Suggested Final Demo Flow

1. Register or log in as a customer
2. Add products to cart
3. Checkout an order
4. Show order history in the profile page
5. Log in as admin
6. Show dashboard, users, products, and orders
7. Open reports and charts
8. Demonstrate CSV, Excel, and PDF export
