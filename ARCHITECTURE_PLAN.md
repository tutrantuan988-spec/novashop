# Clean Architecture Restructuring Plan

## Current Structure
```
Website/
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── server/
│   ├── email.js
│   ├── index.js
│   ├── jobs/
│   ├── middleware/
│   ├── utils/
│   └── swagger.js
└── public/
```

## Target Clean Architecture
```
Website/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── public/
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── shared/
│   └── types/
└── docker-compose.yml
```

## Migration Steps

### Step 1: Create folder structure
- Create /frontend directory
- Create /backend directory
- Create /shared directory

### Step 2: Move frontend code
- Move src/ to frontend/src/
- Move public/ to frontend/public/
- Move vite.config.js to frontend/
- Move index.html to frontend/
- Update package.json for frontend-only

### Step 3: Move backend code
- Move server/ to backend/src/
- Restructure backend to clean architecture:
  - server/index.js → backend/src/index.js
  - server/middleware/ → backend/src/middleware/
  - server/jobs/ → backend/src/services/jobs/
  - server/utils/ → backend/src/utils/
  - server/email.js → backend/src/services/email.js
  - server/swagger.js → backend/src/config/swagger.js
- Create backend/src/config/ for configuration
- Create backend/src/controllers/ for route handlers
- Create backend/src/models/ for data models
- Create backend/src/routes/ for route definitions
- Create backend/package.json for backend-only

### Step 4: Update imports
- Update all frontend imports to new structure
- Update all backend imports to new structure
- Update vite.config.js paths
- Update .env paths

### Step 5: Update deployment configs
- Update netlify.toml for frontend-only
- Update render.yaml for backend
- Update railway.toml for backend
