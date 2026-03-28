# ALBEL UI - Frontend Setup Guide

## What's Built

### 1. **Authentication System**
- `useAuth` hook (Zustand store) for managing authentication state
- Token-based authentication with JWT support
- Automatic token refresh on API calls
- Redirect to login on 401 unauthorized

### 2. **Login Page** (`/login`)
- Beautiful, responsive login form
- Support for demo users:
  - **admin** / admin123 (Admin role)
  - **ahmed.operator** / operator123 (Operator role)
  - **manager.report** / readonly123 (Readonly role)
- Error handling and loading states

### 3. **Navigation Components**
- **Navbar**: Top navigation bar with:
  - ALBEL branding
  - User info display (username + role badge)
  - Logout button
- **Sidebar**: Left sidebar navigation with:
  - Dashboard link
  - Operations section (Inventory, Cutting, Waste)
  - Configuration section (Suppliers, Users - admin only)
  - Reports section

### 4. **Dashboard** (`/dashboard`)
- Real-time inventory metrics
- Material type breakdown
- Waste management statistics
- Recent rolls table with sorting
- Refresh functionality
- Backend-connected data loading

### 5. **Layout System**
- Protected routes preventing unauthenticated access
- Responsive design (mobile-friendly)
- Consistent styling across all pages

## File Structure

```
src/
├── components/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   └── index.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx
│   ├── ComingSoon.tsx (placeholder for other pages)
│   └── index.ts
├── services/
│   ├── api.ts (already configured)
│   ├── rollService.ts (updated with getAll method)
│   └── userService.ts (for future use)
├── hooks/
│   ├── useAuth.ts (new)
│   └── index.ts (updated)
├── styles/
│   ├── LoginPage.css
│   ├── Navbar.css
│   ├── Sidebar.css
│   ├── Layout.css
│   └── Dashboard.css
├── App.tsx (updated with routing)
├── index.css (updated with base styles)
└── main.tsx (unchanged)
```

## Running the Application

### Prerequisites
- Node.js 16+
- Backend API running on http://localhost:8080

### Installation
```bash
cd albelt-ui
npm install
```

### Development
```bash
npm run dev
```
The UI will be available at `http://localhost:3000`

### Building
```bash
npm run build
```

## Features

### ✅ Implemented
- Login page with authentication
- Dashboard with backend data integration
- Navigation system (navbar + sidebar)
- Protected routes
- User session management
- Responsive design
- Error handling

### 🔄 Coming Soon (Placeholder pages created)
- Inventory Management page
- Cutting Operations page
- Waste Management page
- Suppliers Configuration page
- Users Management page
- Analytics & Reports page

## API Integration

The frontend is fully integrated with the backend API:
- Base URL: `http://localhost:8080/api`
- Authentication: Bearer token in Authorization header
- Auto-redirects to login on 401 errors
- Dashboard loads real inventory metrics from `/api/rolls`

## Environment Variables

Create a `.env` file (optional):
```
VITE_API_BASE_URL=http://localhost:8080/api
```

If not set, defaults to `http://localhost:8080/api`

## Styling

- Modern gradient design with primary colors (#667eea, #764ba2)
- Responsive CSS Grid and Flexbox layouts
- Material-inspired card designs
- Smooth transitions and hover effects
- Mobile-first responsive design

## Next Steps

1. Verify the backend API is running and has the sample data from database migrations
2. Test login with demo credentials:
   - Username: `admin`
   - Password: `admin123`
3. Verify dashboard displays inventory data
4. Build out the remaining pages as needed
5. Add more detailed reporting and filtering capabilities
