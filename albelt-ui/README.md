# ALBELT React 18 UI

Production-ready React 18 frontend for ALBELT Stock Management System.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Backend must be running on port 8080
```

Visit: `http://localhost:3000`

## Architecture

### Services Layer
- **ApiService**: Base HTTP client with interceptors, JWT auth, error handling
- **RollService**: FIFO inventory operations (critical path)
- **WastePieceService**: Waste reuse finder (waste reduction core)
- **CuttingOperationService**: Operation recording and analytics
- **SupplierService**: Supplier CRUD
- **UserService**: User management and roles

### API Integration
All endpoints mapped to TypeScript types:
- `@types/index.ts` - Full type definitions for all entities
- Automatic token injection from localStorage
- 401 responses redirect to login
- 15-second timeout per request

### Custom Hooks
- `useAsync<T>` - Data fetching with loading/error states
- `useForm<T>` - Form handling with validation

## Key Features (Ready to Implement)

### 1. **FIFO Inventory Management** (Priority 1)
```typescript
// Get oldest roll for a material
const roll = await RollService.selectByFifo('PU');

// View FIFO queue
const queue = await RollService.getFifoQueue('PU');
```

### 2. **Waste Reduction** (Priority 2)
```typescript
// Find reusable waste
const waste = await WastePieceService.findReuseCandidate('PU', 5);

// View large waste pieces
const largeWaste = await WastePieceService.getLargeAvailable();
```

### 3. **Operator Analytics** (Priority 3)
```typescript
// Performance metrics
const performance = await CuttingOperationService.getOperatorPerformance();

// High-efficiency operations
const efficient = await CuttingOperationService.getHighEfficiencyOperations();
```

## File Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Full-page components
├── services/           # API client layer
│   ├── api.ts          # Base HTTP client
│   ├── rollService.ts
│   ├── wastePieceService.ts
│   └── ...
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── utils/              # Helpers
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Build & Production

```bash
# Type check
npm run type-check

# Production build
npm run build  # Outputs to dist/

# Preview production build
npm run preview
```

## Environment Configuration

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Integration with Backend

**Ensure Spring Boot is running:**
```bash
cd ../albelt-api
./mvnw spring-boot:run
```

**API Documentation:**
- Swagger UI: http://localhost:8080/swagger-ui.html
- REST API reference: [API_DOCUMENTATION.md](../albelt-api/API_DOCUMENTATION.md)

---

**Status:** ✅ Project structure complete, ready for component development

**Next:** Implement FIFO selection page, waste management dashboard, operator analytics
