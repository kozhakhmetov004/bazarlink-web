# Supplier Management Web App (SvelteKit)

A modern Supplier Management Web Application built with SvelteKit, TypeScript, and Tailwind CSS. The application enables suppliers to manage their catalog, orders, team members, and link requests from buyers with a focus on performance, maintainability, and user experience.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Architectural Patterns](#key-architectural-patterns)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Routing & Navigation](#routing--navigation)
- [Internationalization](#internationalization)
- [UI Components](#ui-components)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)

## Overview

This frontend application is a single-page application (SPA) that provides a comprehensive supplier management interface. It features role-based access control, real-time data synchronization, multi-language support, and a responsive design optimized for desktop and tablet devices.

### Key Features

- **Authentication & Authorization**: Secure login system with role-based access control (Owner, Manager, Sales Representative)
- **Dashboard**: Real-time analytics and metrics overview with performance tracking
- **Catalog Management**: Complete product and category management system
- **Order Management**: Full order lifecycle management from creation to completion
- **Link Requests**: Buyer connection request approval workflow
- **Team Management**: User and role management for suppliers
- **Complaints & Incidents**: Issue tracking and resolution system
- **Settings**: Supplier profile and configuration management
- **Multi-language Support**: English, Russian, and Kazakh language support

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Components  │  │    Stores    │      │
│  │  (Pages)     │→ │  (UI/Logic)  │→ │  (State)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │   API Client    │                         │
│                  │   (HTTP Layer)  │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Backend API Server                         │
│              (http://localhost:8000/api/v1)                   │
└───────────────────────────────────────────────────────────────┘
```

### Component Architecture

The application follows a **component-based architecture** with clear separation of concerns:

1. **Presentation Layer**: Svelte components in `src/lib/components/`
2. **Business Logic Layer**: API services in `src/lib/api/`
3. **State Management Layer**: Svelte stores in `src/lib/stores/`
4. **Routing Layer**: SvelteKit file-based routing in `src/routes/`
5. **Type System**: TypeScript interfaces in `src/lib/types/`

### Data Flow

```
User Action → Component → Store → API Client → Backend API
                ↓                                    ↓
            UI Update ← Store Update ← Response Data
```

## Tech Stack

### Core Framework
- **SvelteKit 2.0+**: Full-stack framework with SSR capabilities
- **Svelte 4.2+**: Reactive UI framework
- **TypeScript 5.0+**: Type-safe development

### Build Tools
- **Vite 5.0+**: Fast build tool and dev server
- **SvelteKit Adapter Auto**: Automatic adapter selection for deployment

### Styling
- **Tailwind CSS 3.4+**: Utility-first CSS framework
- **PostCSS**: CSS processing
- **Autoprefixer**: Automatic vendor prefixing

### State Management
- **Svelte Stores**: Built-in reactive state management
- **svelte-i18n**: Internationalization store

### UI Libraries
- **Lucide Svelte**: Icon library
- **clsx & tailwind-merge**: Conditional class name utilities

### Development Tools
- **svelte-check**: Type checking for Svelte components
- **TypeScript**: Static type checking

## Project Structure

```
frontend/
├── src/
│   ├── lib/                          # Shared library code
│   │   ├── api/                      # API client and services
│   │   │   ├── client.ts            # Base HTTP client with auth
│   │   │   ├── auth.ts              # Authentication API
│   │   │   ├── products.ts          # Products API
│   │   │   ├── orders.ts            # Orders API
│   │   │   ├── links.ts             # Link requests API
│   │   │   ├── suppliers.ts         # Suppliers API
│   │   │   ├── users.ts             # Users API
│   │   │   ├── categories.ts        # Categories API
│   │   │   ├── complaints.ts        # Complaints API
│   │   │   ├── incidents.ts         # Incidents API
│   │   │   ├── consumers.ts         # Consumers API
│   │   │   ├── messages.ts          # Messages API
│   │   │   └── index.ts             # API module exports
│   │   │
│   │   ├── components/              # Reusable components
│   │   │   ├── ui/                  # Base UI component library
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Dialog.svelte
│   │   │   │   ├── Alert.svelte
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── Dashboard.svelte     # Dashboard component
│   │   │   ├── Layout.svelte        # Main app layout
│   │   │   ├── LoginLayout.svelte   # Login page layout
│   │   │   ├── LoginForm.svelte     # Login form
│   │   │   ├── CatalogManager.svelte
│   │   │   ├── OrdersManager.svelte
│   │   │   ├── LinkRequests.svelte
│   │   │   ├── TeamManager.svelte
│   │   │   ├── SettingsManager.svelte
│   │   │   ├── LanguageSwitcher.svelte
│   │   │   └── ...
│   │   │
│   │   ├── stores/                  # State management
│   │   │   ├── auth.ts              # Authentication store
│   │   │   └── i18n.ts              # Internationalization store
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   │   └── index.ts             # Shared types and interfaces
│   │   │
│   │   ├── i18n/                    # Internationalization
│   │   │   ├── index.ts             # i18n initialization
│   │   │   └── locales/             # Translation files
│   │   │       ├── en.json
│   │   │       ├── ru.json
│   │   │       └── kz.json
│   │   │
│   │   ├── utils/                   # Utility functions
│   │       ├── mappers.ts           # Data transformation utilities
│   │       └── utils.ts             # General utilities
│   │   
│   │   
│   │
│   ├── routes/                      # SvelteKit file-based routing
│   │   ├── +layout.svelte           # Root layout with auth guard
│   │   ├── +page.svelte             # Home/landing page
│   │   ├── login/
│   │   │   └── +page.svelte         # Login page
│   │   ├── dashboard/
│   │   │   └── +page.svelte         # Dashboard page
│   │   ├── catalog/
│   │   │   └── +page.svelte         # Catalog management
│   │   ├── orders/
│   │   │   ├── +page.svelte         # Orders list
│   │   │   └── [id]/
│   │   │       └── +page.svelte     # Order details
│   │   ├── links/
│   │   │   └── +page.svelte         # Link requests
│   │   ├── team/
│   │   │   └── +page.svelte         # Team management
│   │   ├── settings/
│   │   │   └── +page.svelte         # Settings
│   │   ├── complaints/
│   │   │   ├── +page.svelte         # Complaints list
│   │   │   └── [id]/
│   │   │       └── +page.svelte     # Complaint details
│   │   └── incidents/
│   │       └── +page.svelte         # Incidents management
│   │
│   ├── styles/
│   │   └── globals.css               # Global styles
│   │
│   ├── app.css                      # App-level styles
│   ├── app.html                     # HTML template
│   └── app.d.ts                     # TypeScript declarations
│
├── public/                          # Static assets
├── node_modules/                    # Dependencies
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── svelte.config.js                 # SvelteKit configuration
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
└── README.md                        # This file

```

## Key Architectural Patterns

### 1. Component-Based Architecture

The application uses a **hierarchical component structure**:

- **Layout Components**: `Layout.svelte`, `LoginLayout.svelte` - Provide page structure
- **Feature Components**: `Dashboard.svelte`, `CatalogManager.svelte` - Implement business logic
- **UI Components**: `Button.svelte`, `Card.svelte` - Reusable presentational components
- **Modal Components**: `AddProductModal.svelte`, `EditCategoryModal.svelte` - Dialog overlays

### 2. Service Layer Pattern

API calls are abstracted into service modules:

```typescript
// Example: src/lib/api/products.ts
export const productsApi = {
  getProducts: (params) => apiClient.get('/products', { params }),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`)
};
```

### 3. Store Pattern (State Management)

Centralized state management using Svelte stores:

- **Auth Store**: Manages user authentication and supplier data
- **i18n Store**: Manages internationalization state
- **Derived Stores**: Computed values from base stores

### 4. Repository Pattern

API services act as repositories, providing a clean interface to backend resources:

- Each resource (products, orders, links) has its own API module
- Consistent interface across all API modules
- Centralized error handling in the API client

### 5. Route Guards

Authentication and authorization handled at the layout level:

- `+layout.svelte` checks authentication status
- Redirects unauthenticated users to login
- Role-based access control in components

## State Management

### Authentication Store (`src/lib/stores/auth.ts`)

The authentication store manages user session and supplier information:

```typescript
interface AuthState {
  user: User | null;
  supplier: Supplier | null;
}
```

**Features:**
- Persistent state via localStorage
- Automatic token refresh on page load
- Derived stores for `user` and `supplier`
- Methods: `login()`, `logout()`, `register()`, `refresh()`, `updateSupplier()`

**Usage:**
```typescript
import { user, supplier, authStore } from '$lib/stores/auth';

// Reactive access
$: isOwner = $user?.role === 'owner';

// Actions
await authStore.login(email, password);
authStore.logout();
```

### Internationalization Store (`src/lib/stores/i18n.ts`)

Manages language preferences:

- Persists locale to localStorage
- Syncs with `svelte-i18n` library
- Supports: `en`, `ru`, `kz`

## API Layer

### API Client (`src/lib/api/client.ts`)

Centralized HTTP client with the following features:

- **Base URL Configuration**: Configurable via `VITE_API_BASE_URL` environment variable
- **Authentication**: Automatic Bearer token injection from localStorage
- **Request/Response Interception**: Error handling and logging
- **Type Safety**: Full TypeScript support
- **Query Parameters**: Built-in URL parameter handling

**Configuration:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
```

**Methods:**
- `get<T>(endpoint, options?)`: GET request
- `post<T>(endpoint, data?, options?)`: POST request
- `put<T>(endpoint, data?, options?)`: PUT request
- `delete<T>(endpoint, options?)`: DELETE request

### API Services

Each domain has its own API service module:

- **auth.ts**: Authentication endpoints
- **products.ts**: Product CRUD operations
- **orders.ts**: Order management
- **links.ts**: Link request management
- **suppliers.ts**: Supplier information
- **users.ts**: User management
- **categories.ts**: Category management
- **complaints.ts**: Complaint handling
- **incidents.ts**: Incident management
- **consumers.ts**: Consumer information
- **messages.ts**: Messaging system

**Example Usage:**
```typescript
import { productsApi } from '$lib/api/products';

// Fetch products
const products = await productsApi.getProducts({ supplier_id: 123 });

// Create product
const newProduct = await productsApi.createProduct({
  name: 'Product Name',
  price: 1000,
  // ...
});
```

## Routing & Navigation

### File-Based Routing

SvelteKit uses file-based routing in the `src/routes/` directory:

- `+page.svelte`: Page component
- `+layout.svelte`: Layout wrapper
- `[id]/`: Dynamic route parameter
- `+page.svelte` in subdirectories: Nested routes

### Route Structure

```
/                    → Home/landing page
/login               → Login page
/dashboard           → Dashboard (protected)
/catalog             → Catalog management (protected)
/orders              → Orders list (protected)
/orders/[id]         → Order details (protected)
/links               → Link requests (protected)
/team                → Team management (protected)
/settings            → Settings (protected, owner only)
/complaints           → Complaints list (protected)
/complaints/[id]      → Complaint details (protected)
/incidents            → Incidents (protected, manager only)
```

### Navigation Guard

The root `+layout.svelte` implements authentication guard:

```typescript
$: if (mounted && !isAuthenticated && currentPath !== '/login') {
  goto('/login');
}
```

### Role-Based Access

Components check user roles for conditional rendering:

```typescript
$: canViewAnalytics = $user?.role === 'owner' || $user?.role === 'manager';
```

## Internationalization

### Setup

The application uses `svelte-i18n` for internationalization:

- **Supported Languages**: English (en), Russian (ru), Kazakh (kz)
- **Locale Persistence**: Saved to localStorage
- **Browser Detection**: Automatically detects browser language

### Usage

```svelte
<script>
  import { _ } from 'svelte-i18n';
</script>

<h1>{$_('dashboard.title')}</h1>
<p>{$_('dashboard.welcome')}</p>
```

### Translation Files

Located in `src/lib/i18n/locales/`:
- `en.json`: English translations
- `ru.json`: Russian translations
- `kz.json`: Kazakh translations

### Language Switcher

The `LanguageSwitcher` component allows users to change language:
- Updates both store and localStorage
- Immediately reflects changes across the app

## UI Components

### Component Library

Base UI components in `src/lib/components/ui/`:

- **Button**: Primary, secondary, outline variants
- **Card**: Container with header, content, footer
- **Input**: Text input with label
- **Dialog**: Modal overlay
- **Alert**: Notification messages
- **Badge**: Status indicators

### Design System

- **Color Scheme**: Green primary color with gray neutrals
- **Typography**: System font stack with clear hierarchy
- **Spacing**: Consistent spacing scale (Tailwind defaults)
- **Shadows**: Subtle elevation system
- **Animations**: Smooth transitions and hover effects

### Responsive Design

- **Desktop First**: Optimized for desktop and tablet
- **Breakpoints**: Tailwind default breakpoints
- **Grid System**: CSS Grid and Flexbox layouts

## Getting Started

### Prerequisites

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn/pnpm)
- **Backend API**: Running backend server (default: `http://localhost:8000`)

### Installation

1. **Clone the repository** (if not already done):
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables** (optional):
Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to `http://localhost:3000`

### Demo Credentials

For testing purposes, you can use these credentials (if backend supports them):
- **Owner**: `owner@supplier.com` (any password)
- **Manager**: `manager@supplier.com` (any password)
- **Sales Representative**: `sales@supplier.com` (any password)

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm run check`: Type-check the application
- `npm run check:watch`: Type-check in watch mode

### Development Workflow

1. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes**:
   - Add/modify components in `src/lib/components/`
   - Add/modify routes in `src/routes/`
   - Update API services in `src/lib/api/`
   - Update types in `src/lib/types/`

3. **Type check**:
```bash
npm run check
```

4. **Test locally**:
```bash
npm run dev
```

5. **Build and preview**:
```bash
npm run build
npm run preview
```

### Code Style Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Keep components focused and reusable
- **Naming**: Use PascalCase for components, camelCase for functions
- **Imports**: Group imports (Svelte, stores, components, utils)
- **Formatting**: Use consistent indentation (tabs or spaces)

### File Organization

- **One component per file**: Each `.svelte` file contains one component
- **Co-location**: Keep related files together
- **Barrel exports**: Use `index.ts` for module exports

## Building for Production

### Build Process

1. **Build the application**:
```bash
npm run build
```

2. **Output location**:
The built application will be in the `.svelte-kit` directory (for SvelteKit adapter).

3. **Preview production build**:
```bash
npm run preview
```

### Environment Variables

Set production environment variables:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Deployment

The application uses `@sveltejs/adapter-auto` which automatically selects the appropriate adapter based on your deployment target:

- **Vercel**: Automatically detected
- **Netlify**: Automatically detected
- **Node.js**: Use `@sveltejs/adapter-node`
- **Static**: Use `@sveltejs/adapter-static`

For custom deployment, configure the adapter in `svelte.config.js`.

### Performance Optimization

- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Unused code automatically removed
- **Asset Optimization**: Images and assets optimized during build
- **Lazy Loading**: Components loaded on demand
