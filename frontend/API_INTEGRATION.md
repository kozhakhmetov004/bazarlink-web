# Frontend-Backend Integration

The frontend has been connected to the backend API. All mock data has been replaced with real API calls.

## API Client

The API client is located in `src/lib/api/client.ts` and handles:
- Authentication token management
- Request/response handling
- Error handling
- Base URL configuration

## API Modules

All API endpoints are organized in `src/lib/api/`:
- `auth.ts` - Authentication (login, register, get current user)
- `links.ts` - Link requests management
- `products.ts` - Product management
- `orders.ts` - Order management
- `suppliers.ts` - Supplier information
- `users.ts` - User management

## Configuration

Set the backend API URL via environment variable:

```bash
# .env file
VITE_API_BASE_URL=http://localhost:8000
```

Default is `http://localhost:8000` if not set.

## Updated Components

### Authentication (`src/lib/stores/auth.ts`)
- ✅ Login uses real API
- ✅ Registration uses real API
- ✅ Token stored in localStorage
- ✅ Auto-fetches user and supplier data on login

### Link Requests (`src/lib/components/LinkRequests.svelte`)
- ✅ Fetches links from API
- ✅ Approve/reject/block actions use API
- ✅ Loading and error states

### Catalog Manager (`src/lib/components/CatalogManager.svelte`)
- ✅ Fetches products from API
- ✅ Filters by supplier
- ✅ Categories extracted from products

### Orders Manager (`src/lib/components/OrdersManager.svelte`)
- ✅ Fetches orders from API
- ✅ Accept/reject/complete actions use API
- ✅ Fetches product names for order items

## Type Mappers

Type mappers in `src/lib/utils/mappers.ts` convert backend API responses to frontend types:
- `mapUser()` - Backend UserResponse → Frontend User
- `mapSupplier()` - Backend SupplierResponse → Frontend Supplier
- `mapProduct()` - Backend ProductResponse → Frontend Product
- `mapLink()` - Backend LinkResponse → Frontend LinkRequest
- `mapOrder()` - Backend OrderResponse → Frontend Order

## Removed Mock Data

All imports from `mockData.ts` have been removed. The file still exists but is no longer used.

## Next Steps

1. Set up environment variable for API URL
2. Test all endpoints with real backend
3. Handle edge cases and errors gracefully
4. Add loading states where needed
5. Update Dashboard component to use real data (optional)

