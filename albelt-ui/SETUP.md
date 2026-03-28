# ALBELT React UI - Development Setup

## Project Structure

```
albelt-ui/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/              # Page-level components
│   ├── services/           # API service layer
│   │   ├── api.ts          # Base API service with interceptors
│   │   ├── supplierService.ts
│   │   ├── rollService.ts
│   │   ├── wastePieceService.ts
│   │   ├── cuttingOperationService.ts
│   │   └── userService.ts
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   ├── App.css             # Global styles
│   ├── main.tsx            # React entry point
│   └── index.css           # Base styles
├── public/                 # Static assets
├── index.html              # HTML entry point
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── .gitignore            # Git ignore rules
```

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript 5
- **Build Tool**: Vite
- **HTTP Client**: Axios with interceptors
- **State Management**: Zustand (ready to integrate)
- **Routing**: React Router v6 (ready to implement)
- **Styling**: CSS + CSS Modules (ready to enhance)
- **UI Components**: TanStack React Table (ready to integrate)

## Installation & Development

### 1. Install Dependencies

```bash
cd albelt-ui
npm install
```

### 2. Set Up Environment

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. Start Development Server

```bash
npm run dev
```

The UI will be available at: **http://localhost:3000**

The Vite dev server includes:
- ✅ Hot Module Replacement (HMR)
- ✅ API proxy to http://localhost:8080/api
- ✅ TypeScript checking
- ✅ automatic rebuild

### 4. Other Commands

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Linting (eslint)
npm run lint
```

## API Integration

All API calls go through the base `ApiService` with:
- ✅ Automatic interceptors
- ✅ JWT token handling
- ✅ Error handling (401 redirects to login)
- ✅ Timeout management (15 seconds)

### Usage Example

```typescript
import { RollService } from '@services/rollService';

// FIFO selection
const response = await RollService.selectByFifo('PU');
if (response.success) {
  console.log('Selected roll:', response.data);
}

// Find waste for reuse
const waste = await WastePieceService.findReuseCandidate('PU', 5);
```

## Component Development

### Starting a New Page

1. Create file in `src/pages/`
2. Import and style
3. Use service hooks for data fetching
4. Example structure:

```typescript
import { useAsync } from '@hooks/index';
import { RollService } from '@services/rollService';

export function RollsPage() {
  const { data: rolls, status, error } = useAsync(
    () => RollService.getAll()
  );

  if (status === 'pending') return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render rolls */}</div>;
}
```

## Custom Hooks Available

### `useAsync<T>`
- Handles async data fetching
- Returns: `status`, `data`, `error`, `execute`

### `useForm<T>`
- Manages form state and validation
- Returns: `values`, `errors`, `handleChange`, `handleSubmit`, `reset`

## FIFO Operations Page (High Priority)

Next component to build:
- FIFO selection dropdown by material
- Available rolls list (oldest first)
- Quick action buttons
- Stock level indicators

## Waste Management Page (High Priority)

Next component for waste reduction feature:
- Find reuse candidate button
- Waste inventory list
- Status filters (AVAILABLE, USED, SCRAP)
- Reuse efficiency metrics

## Next Steps

1. ✅ Project setup complete
2. Create core pages (Dashboard, Rolls, Waste, Operations)
3. Implement routing (React Router v6)
4. Add state management (Zustand)
5. Create reusable UI components
6. Build authentication flow
7. Responsive design optimization

## Troubleshooting

**Port 3000 already in use?**
```bash
npx kill-port 3000
npm run dev
```

**API not connecting?**
- Check backend is running on 8080
- Verify CORS is configured (RestConfig.java)
- Check Network tab in browser DevTools

**TypeScript errors?**
```bash
npm run type-check
```

## Backend Requirements

Ensure Spring Boot backend is running:
```bash
cd albelt-api
./mvnw spring-boot:run
```

---

**Ready to start building!** 🚀
