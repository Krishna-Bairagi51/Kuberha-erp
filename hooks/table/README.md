# Unified Table Hook

A consolidated hook for managing table state with built-in pagination and filtering. This module unifies the patterns from `use-inventory-table.ts`, `usePagination.ts`, and various custom pagination/filtering implementations across the codebase.

## Overview

The `useUnifiedTable` hook provides:

- **Search filtering** across multiple fields
- **Category and status filters** with automatic option extraction
- **Custom filters** with flexible matching functions
- **Pagination** with page numbers and navigation handlers
- **URL persistence** for state (optional)
- **TypeScript support** with full generic type inference

## Installation

The hook is available from the main hooks index:

```tsx
import { useUnifiedTable } from '@/hooks/table'
// or
import { useUnifiedTable } from '@/hooks'
```

## Basic Usage

```tsx
const {
  paginatedItems,
  searchTerm,
  setSearchTerm,
  pagination,
  resetFilters,
} = useUnifiedTable({
  items: products,
  searchKeys: ['name', 'sku', 'description'],
  categoryKey: 'category',
  statusKey: 'status',
  initialItemsPerPage: 10,
})
```

## API Reference

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `T[]` | **required** | Array of items to display in the table |
| `searchKeys` | `Array<keyof T>` | `[]` | Keys to search against |
| `categoryKey` | `keyof T` | - | Key for category field |
| `statusKey` | `keyof T` | - | Key for status field |
| `idKey` | `keyof T` | `'id'` | Key for unique identifier |
| `initialSearchTerm` | `string` | `''` | Initial search term |
| `initialCategory` | `string` | `'All'` | Initial category value |
| `initialStatus` | `string` | `'All'` | Initial status value |
| `initialPage` | `number` | `1` | Initial page number |
| `initialItemsPerPage` | `number` | `10` | Initial items per page |
| `itemsPerPageOptions` | `number[]` | `[10, 25, 50, 100]` | Available items per page options |
| `getValue` | `Partial<Record<keyof T, GetValue<T>>>` | `{}` | Custom getter functions for nested values |
| `customFilters` | `CustomFilterConfig<T>[]` | `[]` | Additional custom filters |
| `urlPersistence` | `UrlPersistenceConfig` | - | URL persistence configuration |
| `enableCategoryFilter` | `boolean` | `true` | Enable category filter |
| `enableStatusFilter` | `boolean` | `true` | Enable status filter |
| `allValue` | `string` | `'All'` | Value representing "all" state |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `filteredItems` | `T[]` | All filtered items (before pagination) |
| `paginatedItems` | `T[]` | Paginated items for current page |
| `filteredCount` | `number` | Total count of filtered items |
| `totalCount` | `number` | Total count of all items |
| `searchTerm` | `string` | Current search term |
| `setSearchTerm` | `(term: string) => void` | Set search term |
| `selectedCategory` | `string` | Current category filter |
| `setSelectedCategory` | `(category: string) => void` | Set category filter |
| `categories` | `string[]` | Available categories |
| `selectedStatus` | `string` | Current status filter |
| `setSelectedStatus` | `(status: string) => void` | Set status filter |
| `statuses` | `string[]` | Available statuses |
| `customFilters` | `CustomFilterState` | Custom filter states |
| `pagination` | `PaginationState` | Pagination state and handlers |
| `resetFilters` | `() => void` | Reset all filters |
| `resetPagination` | `() => void` | Reset pagination to page 1 |
| `resetAll` | `() => void` | Reset filters and pagination |
| `idKey` | `keyof T` | Configured ID key |
| `itemsPerPageOptions` | `number[]` | Available items per page options |
| `hasActiveFilters` | `boolean` | Whether any filters are active |

### PaginationState

| Property | Type | Description |
|----------|------|-------------|
| `currentPage` | `number` | Current page number |
| `itemsPerPage` | `number` | Items per page |
| `totalPages` | `number` | Total number of pages |
| `pageNumbers` | `Array<number \| string>` | Page numbers with ellipsis |
| `setCurrentPage` | `(page: number) => void` | Set current page |
| `setItemsPerPage` | `(items: number) => void` | Set items per page |
| `handlePreviousPage` | `() => void` | Go to previous page |
| `handleNextPage` | `() => void` | Go to next page |
| `goToFirstPage` | `() => void` | Go to first page |
| `goToLastPage` | `() => void` | Go to last page |
| `canGoPrevious` | `boolean` | Can navigate to previous |
| `canGoNext` | `boolean` | Can navigate to next |

## Advanced Features

### Custom Value Getters

For nested or formatted values:

```tsx
const { paginatedItems } = useUnifiedTable({
  items: orders,
  searchKeys: ['productName', 'customerName'],
  getValue: {
    productName: (item) => item.orderLine?.[0]?.product?.name ?? '',
    customerName: (item) => `${item.customer?.firstName} ${item.customer?.lastName}`,
  },
})
```

### Custom Filters

Add filters beyond category and status:

```tsx
const { customFilters } = useUnifiedTable({
  items: products,
  customFilters: [
    {
      key: 'supplier',
      initialValue: 'All',
      fieldKey: 'supplierName',
    },
    {
      key: 'priceRange',
      initialValue: 'All',
      matchFn: (item, filterValue) => {
        if (filterValue === 'low') return item.price < 100
        if (filterValue === 'mid') return item.price >= 100 && item.price < 500
        if (filterValue === 'high') return item.price >= 500
        return true
      },
      getOptions: () => ['low', 'mid', 'high'],
    },
  ],
})

// Usage:
// customFilters.supplier.value
// customFilters.supplier.setValue('Vendor A')
// customFilters.supplier.options
```

### URL Persistence

Persist filter and pagination state in URL:

```tsx
const { pagination, searchTerm } = useUnifiedTable({
  items: orders,
  urlPersistence: {
    enabled: true,
    prefix: 'order',
    tabParam: 'tab',
    tabValue: 'order-history',
  },
})
// Results in URL params like: ?orderSearch=test&orderPage=2
```

## Migration Guide

### From `use-inventory-table.ts`

The original `use-inventory-table.ts` is now a backward-compatible wrapper around `useUnifiedTable`. Existing code will continue to work without changes.

For new code, prefer using `useUnifiedTable` directly:

**Before:**
```tsx
import { useInventoryTable } from '../hooks/use-inventory-table'

const {
  searchTerm,
  setSearchTerm,
  currentPage,
  totalPages,
  pageNumbers,
  handlePreviousPage,
  handleNextPage,
  paginatedItems,
} = useInventoryTable({
  items: products,
  searchKeys: ['name'],
  categoryKey: 'category',
})
```

**After:**
```tsx
import { useUnifiedTable } from '@/hooks/table'

const {
  searchTerm,
  setSearchTerm,
  pagination,
  paginatedItems,
} = useUnifiedTable({
  items: products,
  searchKeys: ['name'],
  categoryKey: 'category',
})

// Access pagination via pagination object:
// pagination.currentPage
// pagination.totalPages
// pagination.pageNumbers
// pagination.handlePreviousPage()
// pagination.handleNextPage()
```

### From `usePagination.ts`

**Before:**
```tsx
import { usePagination } from '../hooks/usePagination'

const { currentPage, totalPages, paginatedItems, setCurrentPage } = usePagination({
  itemsPerPage: 10,
  totalItems: data.length,
})
const paginated = paginatedItems(data)
```

**After:**
```tsx
import { useUnifiedTable } from '@/hooks/table'

const { pagination, paginatedItems } = useUnifiedTable({
  items: data,
  initialItemsPerPage: 10,
})
// paginatedItems is already the sliced array
```

### From `use-qc-pagination.ts`

**Before:**
```tsx
import { usePaginationWithData } from '../hooks/use-qc-pagination'

const { currentPage, paginatedData, handlePageChange } = usePaginationWithData(
  filteredData,
  10,
  'pending'
)
```

**After:**
```tsx
import { useUnifiedTable } from '@/hooks/table'

const { pagination, paginatedItems } = useUnifiedTable({
  items: filteredData,
  initialItemsPerPage: 10,
  urlPersistence: {
    enabled: true,
    prefix: 'pendingQc',
    tabParam: 'tab',
    tabValue: 'quality-control',
  },
})
```

## Future Stages

This hook is part of a larger table refactorization effort:

1. ✅ **Stage 1:** Unified table hook (this module)
2. 🔜 **Stage 2:** Reusable table component with standardized pagination UI
3. 🔜 **Stage 3:** `mapApiToTableData` utility function
4. 🔜 **Stage 4:** Migrate existing table implementations

## File Structure

```
hooks/
├── table/
│   ├── index.ts              # Module exports
│   ├── use-unified-table.ts  # Main hook implementation
│   └── README.md             # This documentation
└── index.ts                  # Root hooks exports (includes table hooks)
```
