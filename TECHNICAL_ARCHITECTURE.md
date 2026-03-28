# 🏗️ TECHNICAL ARCHITECTURE & TECHNOLOGY RECOMMENDATIONS

**Date**: March 23, 2026

---

## Executive Summary

**Recommended Stack for ALBEL Stock Management System:**

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                       │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Frontend: React.js + SVG (Visualization)            ││
│  │  State: Redux or Context API                         ││
│  │  UI Library: Material-UI or Ant Design               ││
│  │  Charts: Chart.js or D3.js                          ││
│  └──────────────────────────────────────────────────────┘│
└─────────────┬────────────────────────────────────────────┘
              │  HTTP/REST API
              ↓
┌─────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Docker)                     │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Runtime: Spring Boot (Java 17+)                    ││
│  │  Framework: Spring Web + Spring Data JPA            ││
│  │  API Layer: RESTful endpoints + WebSocket support   ││
│  │  Auth: Spring Security + JWT + bcrypt               ││
│  │  Logging: SLF4J + Logback                           ││
│  │  Task Queue: Spring Async or Quartz Scheduler       ││
│  └──────────────────────────────────────────────────────┘│
└─────────────┬────────────────────────────────────────────┘
              │  Connection pool
              ↓
┌─────────────────────────────────────────────────────────┐
│          DATABASE (PostgreSQL, Docker)                   │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Engine: PostgreSQL 15+                             ││
│  │  ORM: Sequelize or TypeORM (Node)                   ││
│  │          or Django ORM (Python)                      ││
│  │  Schema: Normalized, indexed for performance        ││
│  │  Backup: Automated daily dumps                      ││
│  │  Replication: Optional for reliability              ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Layer-by-Layer Breakdown

### 1. PRESENTATION LAYER (Frontend)

#### Technology Stack
**Frontend Choice: React.js**
```
Framework:     React 18+
State Manager: Redux Toolkit (complex state) or Context API (simple)
Routing:       React Router v6
Styling:       Tailwind CSS + Material-UI
Charts:        Chart.js + react-chartjs-2
Visualization: SVG (native React) + Canvas (Fabric.js if needed)
HTTP Client:   Axios
Testing:       Jest + React Testing Library
Build Tool:    Vite or Create React App
```

#### UI Components Needed
```
1. Authentication
   - Login form
   - Password reset
   - Session timeout warning

2. Stock Management
   - Inventory table (sortable, filterable)
   - Add/edit stock dialog
   - Material selector (PU/PVC/Caoutchouc)
   - Status indicators

3. Cutting Interface
   - Input form (W, L, Qty)
   - Material & roll selector
   - Validation feedback
   - Confirmation dialog

4. Visualization
   - SVG canvas for cutting plans
   - Zoomable, pannable diagram
   - Dimension labels
   - Color-coded pieces & waste
   - Print button

5. Dashboard
   - KPI cards (total stock, waste %, etc.)
   - Line charts (trends over time)
   - Bar charts (material breakdown)
   - Recent operations timeline

6. Historical Viewer
   - Table with filtering/sorting
   - View past cutting plans
   - Export buttons
   - Operation details modal
```

#### Key Frontend Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@reduxjs/toolkit": "^1.9.1",
    "@mui/material": "^5.11.0",
    "chart.js": "^3.9.1",
    "react-chartjs-2": "^5.2.0",
    "axios": "^1.3.0"
  },
  "devDependencies": {
    "vite": "^4.1.0",
    "typescript": "^4.9.0",
    "eslint": "^8.33.0"
  }
}
```

---

### 2. BUSINESS LOGIC LAYER (Backend)

#### Technology Stack
**Primary Choice: Spring Boot (Java)**
```
Runtime:       Java 17+ (OpenJDK or Oracle JDK)
Framework:     Spring Boot 3.x LTS
Web Framework: Spring Web MVC / Spring Webflux
Language:      Java (strongly typed, enterprise-proven)
ORM:           Spring Data JPA + Hibernate
Authentication: Spring Security + JWT (jjwt library)
Validation:    Java Bean Validation (Jakarta Validation)
Rate Limiting: Spring Cloud Sleuth or custom filters
CORS:          Spring Web CORS configuration
Logging:       SLF4J + Logback
Error Handler: Spring Boot Global Exception Handler
API Docs:      SpringDoc OpenAPI (Swagger)
```

**Why Spring Boot over Node.js?**
- Mature ecosystem for enterprise applications
- Strong type safety prevents runtime errors
- Excellent performance under load
- Built-in dependency injection
- Comprehensive Spring ecosystem (Security, Data, Cloud)
- Better suited for complex algorithms

#### Core Modules/Services

**1. Authentication Service**
```
- Register user
- Login (validate password, issue JWT)
- Refresh token
- Logout
- Change password
- Admin user management
```

**2. Stock Service**
```
- Create roll entry
- Update roll details
- Query by material/date/status
- Calculate surface
- FIFO selection algorithm
- Status transitions
```

**3. Cutting Engine (CRITICAL)**
```
- Validate input dimensions
- Select optimal rolls (FIFO + fallback)
- Call nesting algorithm
- Generate cutting plan coordinates
- Calculate waste
- Update inventory
- Log operation
```

**4. Nesting Algorithm Service (CORE)**
```
- Guillotine 2D implementation
  ├─ Top-down partition
  ├─ Piece placement
  ├─ Waste tracking
  └─ Utilization calculation
  
- Input: Roll (W, L), Pieces [(w1,l1,q1), ...]
- Output: Cutting plan with coordinates
- Performance: < 2 seconds
```

**5. Visualization Service**
```
- Generate SVG cutting diagram
- Add dimensions + labels
- Color different pieces
- Render waste zones
- Cache SVG for export
```

**6. Waste Management Service**
```
- Generate waste pieces after cutting
- Classify by size (chute vs scrap)
- Create new stock entries
- Update original roll status
- Log waste event
```

**7. Report Service**
```
- Query historical operations
- Filter by date/user/material
- Calculate statistics
- Export to PDF (PDFKit)
- Export to Excel (xlsx)
```

**8. Dashboard Service**
```
- Aggregate stock statistics
- Calculate waste trends
- Count rolls by status
- Material breakdown
- Top operations
```

#### API Endpoints (RESTful)

```
AUTH ENDPOINTS
POST   /api/auth/register              - Create user
POST   /api/auth/login                 - Issue JWT
POST   /api/auth/refresh               - Refresh token
POST   /api/auth/logout                - Invalidate session
GET    /api/auth/me                    - Get current user

STOCK ENDPOINTS
GET    /api/stock                      - List all rolls (paginated)
GET    /api/stock/:id                  - Get roll details
POST   /api/stock                      - Create new roll
PATCH  /api/stock/:id                  - Update roll
DELETE /api/stock/:id                  - Archive roll
GET    /api/stock/search?material=PU   - Search rolls
GET    /api/stock/by-material          - Aggregate by material
GET    /api/stock/fifo/:material       - Get FIFO candidates

CUTTING ENDPOINTS
POST   /api/cutting/calculate          - Compute cutting plan
POST   /api/cutting/execute            - Perform cut + update inventory
GET    /api/cutting/history            - List past operations
GET    /api/cutting/history/:id        - Get operation details
POST   /api/cutting/export-pdf/:id     - Generate PDF plan

VISUALIZATION ENDPOINTS
GET    /api/visualization/:id          - Get SVG diagram
GET    /api/visualization/:id/png      - Get PNG thumbnail

WASTE ENDPOINTS
GET    /api/waste                      - List waste pieces
GET    /api/waste/summary              - Waste statistics

DASHBOARD ENDPOINTS
GET    /api/dashboard/stats            - KPI summary
GET    /api/dashboard/trends           - Historical trends
GET    /api/dashboard/recent           - Recent operations

ADMIN ENDPOINTS
GET    /api/admin/users                - List users
POST   /api/admin/users                - Create user
PATCH  /api/admin/users/:id            - Update user
DELETE /api/admin/users/:id            - Delete user
GET    /api/admin/audit-log            - Access logs
```

---

### 3. DATA LAYER (Database)

#### PostgreSQL Schema Overview

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR'
        CHECK (role IN ('ADMIN', 'OPERATOR', 'READ_ONLY')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STOCK MANAGEMENT
-- ============================================

CREATE TABLE rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material VARCHAR(20) NOT NULL
        CHECK (material IN ('PU', 'PVC', 'CAOUTCHOUC')),
    width_mm INTEGER NOT NULL CHECK (width_mm > 0),
    length_m DECIMAL(10,2) NOT NULL CHECK (length_m > 0),
    surface_m2 DECIMAL(12,4) GENERATED ALWAYS AS 
        (width_mm::NUMERIC / 1000 * length_m) STORED,
    entry_date DATE NOT NULL,
    supplier VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OPENED', 'EXHAUSTED')),
    remaining_km DECIMAL(10,4),
    remaining_m2 DECIMAL(12,4),
    location VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rolls_material ON rolls(material);
CREATE INDEX idx_rolls_entry_date ON rolls(entry_date);
CREATE INDEX idx_rolls_status ON rolls(status);

-- ============================================
-- CUTTING OPERATIONS
-- ============================================

CREATE TABLE cutting_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    material VARCHAR(20) NOT NULL
        CHECK (material IN ('PU', 'PVC', 'CAOUTCHOUC')),
    requested_width_mm INTEGER NOT NULL,
    requested_length_m DECIMAL(10,2) NOT NULL,
    requested_qty INTEGER NOT NULL,
    operation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Execution details
    selected_rolls UUID[] NOT NULL,  -- Array of roll IDs used
    cutting_plan JSONB NOT NULL,    -- Coordinates, pieces placement
    waste_json JSONB,                -- Waste pieces generated
    utilization_pct DECIMAL(5,2),
    total_waste_m2 DECIMAL(12,4),
    
    notes VARCHAR(500),
    customer_ref VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cutting_ops_user ON cutting_operations(user_id);
CREATE INDEX idx_cutting_ops_date ON cutting_operations(operation_timestamp);
CREATE INDEX idx_cutting_ops_material ON cutting_operations(material);

-- ============================================
-- WASTE PIECES GENERATED
-- ============================================

CREATE TABLE waste_pieces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL REFERENCES cutting_operations(id),
    source_roll_id UUID REFERENCES rolls(id),
    width_mm INTEGER NOT NULL,
    length_m DECIMAL(10,2) NOT NULL,
    surface_m2 DECIMAL(12,4),
    classification VARCHAR(20) NOT NULL
        CHECK (classification IN ('CHUTE', 'SCRAP')),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waste_operation ON waste_pieces(operation_id);
CREATE INDEX idx_waste_classification ON waste_pieces(classification);

-- ============================================
-- VISUALIZATION CACHE
-- ============================================

CREATE TABLE visualization_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL REFERENCES cutting_operations(id),
    svg_content TEXT NOT NULL,
    png_thumbnail BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```

#### Key Indexes & Performance Tuning
```sql
-- Speed up FIFO queries
CREATE INDEX idx_rolls_available_by_date ON rolls(entry_date) 
    WHERE status = 'AVAILABLE' AND material = 'PU';

-- Speed up historical queries
CREATE INDEX idx_cutting_ops_date_material 
    ON cutting_operations(operation_timestamp, material);

-- Enable full-text search on notes
ALTER TABLE cutting_operations ADD COLUMN notes_fts tsvector 
    GENERATED ALWAYS AS (to_tsvector('french', notes)) STORED;
CREATE INDEX idx_notes_fts ON cutting_operations USING GIN(notes_fts);

-- Analyze query performance
ANALYZE rolls;
ANALYZE cutting_operations;
```

---

### 4. ALGORITHM LAYER (Nesting/Cutting)

#### Guillotine 2D Cutting Algorithm

```python
class GoldenSectionCutting:
    """
    Guillotine 2D Bin Packing Algorithm
    
    Approach:
    1. Sort pieces by area (largest first)
    2. Recursively partition roll into rectangles
    3. Place pieces top-down
    4. Track waste zones
    
    Complexity: O(n²) time, O(n) space
    Utilization: 70-85%
    Speed: < 2 seconds for 50-100 pieces
    """
    
    def __init__(self, bin_width, bin_height):
        self.bin_width = bin_width
        self.bin_height = bin_height
        self.rectangles = []  # Tracked free spaces
        self.placed = []      # Placed pieces
    
    def pack(self, pieces):
        """
        Input: pieces = [(width, length, qty), ...]
        Output: cutting_plan = {
            'pieces': [{'x': 0, 'y': 0, 'w': 100, 'h': 200, 'id': 'P1'}],
            'waste': [{'x': 100, 'y': 0, 'w': 50, 'h': 200}],
            'utilization': 0.82
        }
        """
        # Sort pieces by area (largest first)
        pieces = sorted(pieces, key=lambda p: p[0]*p[1], reverse=True)
        
        # Initialize with full bin
        self.rectangles = [Rectangle(0, 0, self.bin_width, self.bin_height)]
        
        # Place each piece
        for width, length, qty in pieces:
            for _ in range(qty):
                rect = self.find_best_fit(width, length)
                if not rect:
                    return None  # Cannot fit all pieces
                
                # Place piece
                self.placed.append({
                    'x': rect.x,
                    'y': rect.y,
                    'w': width,
                    'h': length,
                    'area': width * length
                })
                
                # Partition rectangle
                self.partition_rectangle(rect, width, length)
        
        return self.generate_output()
    
    def find_best_fit(self, w, h):
        """Find best rectangle to fit piece."""
        best = None
        for rect in self.rectangles:
            if rect.fits(w, h):
                if not best or rect.residual_space < best.residual_space:
                    best = rect
        return best
    
    def partition_rectangle(self, rect, w, h):
        """Split rectangle into sub-rectangles."""
        self.rectangles.remove(rect)
        
        # Guillotine cut: split horizontally and vertically
        if rect.width > w:
            self.rectangles.append(
                Rectangle(rect.x + w, rect.y, rect.width - w, rect.height)
            )
        
        if rect.height > h:
            self.rectangles.append(
                Rectangle(rect.x, rect.y + h, rect.width, rect.height - h)
            )
    
    def generate_output(self):
        """Calculate output metrics."""
        total_placed_area = sum(p['area'] for p in self.placed)
        total_bin_area = self.bin_width * self.bin_height
        utilization = total_placed_area / total_bin_area
        
        # Calculate waste zones
        waste = self.rectangles  # Remaining free rectangles
        
        return {
            'pieces': self.placed,
            'waste': [{'x': r.x, 'y': r.y, 'w': r.width, 'h': r.height} 
                     for r in waste],
            'utilization': utilization,
            'waste_area': total_bin_area - total_placed_area
        }
```

**Alternative Algorithms (for comparison)**:
1. **First Fit Decreasing**: Fast, simple, 70% utilization
2. **Best Fit Decreasing**: ~75% utilization, 1sec
3. **Maximal Rectangle**: ~85% utilization, 2-5sec
4. **Genetic Algorithm**: ~90% utilization, 5-10sec (future)

---

### 5. DEPLOYMENT & DEVOPS

#### Docker Environment

**docker-compose.yml**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: albel_db
    environment:
      POSTGRES_DB: albel_stock
      POSTGRES_USER: albel_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgresql:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - albel_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U albel_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API Server
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: albel_backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/albel_stock
      SPRING_DATASOURCE_USERNAME: albel_user
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_JPA_HIBERNATE_DDL_AUTO: validate
      JWT_SECRET: ${JWT_SECRET}
      SERVER_PORT: 8080
    volumes:
      - ./backend:/app
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - albel_network
    restart: unless-stopped

  # Frontend (Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: albel_frontend
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - albel_network
    restart: unless-stopped

volumes:
  postgresql:

networks:
  albel_network:
    driver: bridge
```

**Dockerfile (Backend)**
```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy pom.xml and source
COPY pom.xml .
COPY src src

# Build application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy built application from builder
COPY --from=builder /build/target/albelt-api.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Dockerfile (Frontend)**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
```

#### Deployment Instructions

```bash
# 1. Clone repository
git clone <repo-url>
cd albel-stock-management

# 2. Configure environment
cp .env.example .env
# Edit .env with local values

# 3. Build backend (creates Docker image)
docker build -t albel-backend:latest ./backend

# 4. Start services
docker-compose up -d

# 5. Verify health
docker-compose ps
docker-compose logs backend

# 6. Access application
# Frontend: http://localhost
# API:      http://localhost:8080
# API Docs: http://localhost:8080/swagger-ui.html
# DB:       localhost:5432

# 7. Backup database (daily)
docker-compose exec db pg_dump -U albel_user albel_stock > backup_$(date +%Y%m%d).sql

# 8. Stop services
docker-compose down
```

---

### 6. INFRASTRUCTURE REQUIREMENTS

#### Hardware Recommendations
```
CPU:    2+ cores (for nesting calculations & JVM)
RAM:    8-16 GB (PostgreSQL + JVM heap size)
Storage: 100GB (initial, growth depends on history)
Network: 1Gbps LAN (intranet)
```

#### Network Architecture
```
Factory LAN (192.168.x.x)
    ├─ Main Server (Docker Host)
    │   └─ albel-app:80 (Frontend)
    │   └─ albelt-api:3001 (Backend)
    │   └─ postgres:5432 (DB - internal only)
    │
    ├─ Workstation 1 (Browser → http://server-ip)
    ├─ Workstation 2 (Browser → http://server-ip)
    ├─ Workstation N
    │
    └─ Backup Machine (incremental backup daily)
```

---

## Implementation Checklist

### Phase 0: MVP
- [ ] Setup Git repository & CI/CD
- [ ] Configure Docker Compose
- [ ] Design PostgreSQL schema
- [ ] Implement authentication (JWT)
- [ ] Create stock CRUD APIs
- [ ] Implement FIFO selection logic
- [ ] Build Guillotine cutting algorithm
- [ ] Create basic React UI (forms + tables)
- [ ] Deploy to local Docker

### Phase 1: Core Features
- [ ] Add visualization (SVG rendering)
- [ ] Implement waste management
- [ ] Create cutting history
- [ ] Build dashboard + analytics
- [ ] Add PDF/Excel export
- [ ] User management interface
- [ ] Performance optimization

### Phase 2+: Advanced
- [ ] Barcode scanning integration
- [ ] Pre-cutting simulation
- [ ] Alternative algorithms (MaximalRect)
- [ ] Advanced analytics & trends
- [ ] ERP API integration

---

## Technology Justification

| Choice | Why |
|--------|-----|
| **React** | Rich ecosystem for data visualization, large community support |
| **Spring Boot** | Enterprise-grade, type-safe, excellent performance under load |
| **PostgreSQL** | Robust ACID compliance, jsonb for flexibility, great indexing |
| **Docker** | Containerized deployment, reproducible environments, easy scaling |
| **SVG visualization** | Scalable, printable, no external dependencies |
| **Guillotine Algorithm** | Good balance of performance vs utilization for MVP |

---

**This architecture is designed for:**
- ✅ Local intranet deployment
- ✅ Offline-first operation
- ✅ Horizontal scaling (add more workers later)
- ✅ Easy maintenance & updates
- ✅ Clear separation of concerns

