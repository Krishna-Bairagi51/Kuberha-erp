# Shared Table Components

Unified table components with built-in pagination and state handling. This module is part of the table refactorization effort (Stage 2).

## Overview

This module provides:

- **DataTable**: Main table component with integrated pagination and state handling
- **TablePagination**: Standalone pagination controls
- **TableSkeleton**: Loading skeleton during data fetch
- **TableEmptyState**: Empty state when no data matches filters
- **TableErrorState**: Error state when data fetch fails
- **TableStateWrapper**: Wrapper that handles loading/empty/error states automatically

## Installation

Import from the shared components:

```tsx
import { DataTable, TablePagination, TableEmptyState } from '@/components/shared/table'
// or
import { DataTable } from '@/components/shared'
```

## DataTable Component

The main table component that wraps the base Table UI with integrated pagination and state handling.

### Basic Usage

```tsx
import { DataTable } from '@/components/shared/table'

const columns = [
  { id: 'name', header: 'Name', accessor: 'name' },
  { id: 'price', header: 'Price', cell: (item) => `₹${item.price}` },
  { id: 'status', header: 'Status', accessor: 'status' },
]

<DataTable
  items={products}
  columns={columns}
  getRowKey={(item) => item.id}
/>
```

### With useUnifiedTable Hook

```tsx
import { DataTable } from '@/components/shared/table'
import { useUnifiedTable } from '@/hooks/table'

const {
  paginatedItems,
  pagination,
  filteredCount,
  searchTerm,
  setSearchTerm,
} = useUnifiedTable({
  items: products,
  searchKeys: ['name', 'sku'],
  categoryKey: 'category',
})

<DataTable
  items={paginatedItems}
  columns={columns}
  getRowKey={(item) => item.id}
  pagination={pagination}
  totalItems={filteredCount}
  searchTerm={searchTerm}
  onClearSearch={() => setSearchTerm('')}
  isLoading={isLoading}
  error={error}
  onRetry={refetch}
/>
```

### With Card Wrapper

```tsx
<DataTable
  items={products}
  columns={columns}
  getRowKey={(item) => item.id}
  withCard
  cardTitle="All Products"
  cardHeaderActions={<Button>Add Product</Button>}
  toolbar={<FiltersBar ... />}
/>
```

### Column Definition

```tsx
interface DataTableColumn<T> {
  id: string                                    // Unique identifier
  header: React.ReactNode | (() => ReactNode)  // Header content
  accessor?: keyof T                            // Data field key
  cell?: (item: T, index: number) => ReactNode // Custom cell renderer
  width?: string                                // Tailwind width class
  align?: 'left' | 'center' | 'right'          // Text alignment
  headerClassName?: string                      // Header cell class
  cellClassName?: string                        // Body cell class
  hidden?: boolean                              // Hide column
}
```

### Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | **required** | Array of items to display |
| `columns` | `DataTableColumn<T>[]` | **required** | Column definitions |
| `getRowKey` | `(item, index) => string \| number` | **required** | Row key accessor |
| `pagination` | `PaginationState` | - | Pagination from useUnifiedTable |
| `totalItems` | `number` | - | Total items count |
| `itemsPerPageOptions` | `number[]` | `[10, 25, 50, 100]` | Items per page options |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `isLoading` | `boolean` | `false` | Loading state |
| `error` | `string \| Error \| null` | `null` | Error state |
| `onRetry` | `() => void` | - | Retry callback |
| `searchTerm` | `string` | - | Current search term |
| `onClearSearch` | `() => void` | - | Clear search callback |
| `emptyTitle` | `string` | - | Custom empty state title |
| `emptyDescription` | `string` | - | Custom empty state description |
| `withCard` | `boolean` | `false` | Wrap in Card component |
| `cardTitle` | `ReactNode` | - | Card header title |
| `cardHeaderActions` | `ReactNode` | - | Card header actions |
| `toolbar` | `ReactNode` | - | Content above table |
| `rowClassName` | `string \| ((item, index) => string)` | - | Row class name |
| `onRowClick` | `(item, index) => void` | - | Row click handler |
| `renderRow` | `(item, index) => ReactNode` | - | Custom row renderer |
| `skeletonRows` | `number` | `5` | Loading skeleton rows |

## TablePagination Component

Standalone pagination controls that can be used independently or with the DataTable.

### Basic Usage

```tsx
import { TablePagination } from '@/components/shared/table'

<TablePagination
  currentPage={1}
  totalPages={10}
  itemsPerPage={10}
  onPageChange={(page) => setPage(page)}
  onItemsPerPageChange={(items) => setItemsPerPage(items)}
/>
```

### With useUnifiedTable Hook

```tsx
import { TablePaginationFromHook } from '@/components/shared/table'

const { pagination, filteredCount } = useUnifiedTable({ items, ... })

<TablePaginationFromHook
  pagination={pagination}
  totalItems={filteredCount}
/>
```

### Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | **required** | Current page (1-indexed) |
| `totalPages` | `number` | **required** | Total pages |
| `itemsPerPage` | `number` | **required** | Items per page |
| `totalItems` | `number` | - | Total items count |
| `pageNumbers` | `Array<number \| string>` | - | Pre-computed page numbers |
| `onPageChange` | `(page: number) => void` | **required** | Page change callback |
| `onItemsPerPageChange` | `(items: number) => void` | **required** | Items per page callback |
| `onPrevious` | `() => void` | - | Previous button callback |
| `onNext` | `() => void` | - | Next button callback |
| `itemsPerPageOptions` | `number[]` | `[10, 25, 50, 100]` | Available options |
| `rowsPerPageLabel` | `string` | `'Rows per page'` | Label text |
| `showEntriesSuffix` | `boolean` | `false` | Show "Entries" suffix |
| `variant` | `'default' \| 'compact'` | `'default'` | Style variant |
| `disabled` | `boolean` | `false` | Disable all controls |
| `hideRowsPerPage` | `boolean` | `false` | Hide rows selector |
| `hidePageNumbers` | `boolean` | `false` | Hide page numbers |

## Table State Components

### TableSkeleton

Loading skeleton for tables during data fetch.

```tsx
import { TableSkeleton } from '@/components/shared/table'

<TableBody>
  {isLoading ? (
    <TableSkeleton rows={5} columns={4} />
  ) : (
    items.map(item => <TableRow key={item.id}>...</TableRow>)
  )}
</TableBody>
```

### TableEmptyState

Empty state when no data matches filters.

```tsx
import { TableEmptyState } from '@/components/shared/table'

<TableBody>
  {items.length === 0 ? (
    <TableEmptyState
      title="No products found"
      description="Try adjusting your search or filters"
      searchTerm={searchTerm}
      onClearSearch={() => setSearchTerm('')}
      colSpan={6}
    />
  ) : (
    items.map(...)
  )}
</TableBody>
```

### TableErrorState

Error state when data fetch fails.

```tsx
import { TableErrorState } from '@/components/shared/table'

<TableBody>
  {error ? (
    <TableErrorState
      error={error}
      onRetry={() => refetch()}
      colSpan={6}
    />
  ) : (
    items.map(...)
  )}
</TableBody>
```

### TableStateWrapper

Wrapper that handles loading, error, and empty states automatically.

```tsx
import { TableStateWrapper } from '@/components/shared/table'

<TableBody>
  <TableStateWrapper
    isLoading={isLoading}
    error={error}
    hasItems={items.length > 0}
    columns={6}
    searchTerm={searchTerm}
    onClearSearch={() => setSearchTerm('')}
    onRetry={() => refetch()}
  >
    {items.map(item => (
      <TableRow key={item.id}>...</TableRow>
    ))}
  </TableStateWrapper>
</TableBody>
```

## Migration Guide

### From `table-pagination.tsx` (orders)

**Before:**
```tsx
import { TablePagination } from '@/components/features/orders/components/shared/table-pagination'

<TablePagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  itemsPerPage={pagination.itemsPerPage}
  totalItems={totalItems}
  onPageChange={pagination.setCurrentPage}
  onItemsPerPageChange={pagination.setItemsPerPage}
/>
```

**After:**
```tsx
import { TablePaginationFromHook } from '@/components/shared/table'

<TablePaginationFromHook
  pagination={pagination}
  totalItems={totalItems}
/>
```

### From `pagination-controls.tsx` (inventory)

**Before:**
```tsx
import PaginationControls from './shared/pagination-controls'

<PaginationControls
  currentPage={currentPage}
  totalPages={totalPages}
  pageNumbers={pageNumbers}
  onPageChange={setCurrentPage}
  onPrevious={handlePreviousPage}
  onNext={handleNextPage}
  itemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
/>
```

**After:**
```tsx
import { TablePaginationFromHook } from '@/components/shared/table'

<TablePaginationFromHook pagination={pagination} />
```

### From inline empty/loading states

**Before:**
```tsx
<TableBody>
  {isLoading ? (
    <TableRow>
      <TableCell colSpan={6}>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </TableCell>
    </TableRow>
  ) : items.length === 0 ? (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-12">
        No items found
      </TableCell>
    </TableRow>
  ) : (
    items.map(...)
  )}
</TableBody>
```

**After:**
```tsx
import { TableStateWrapper } from '@/components/shared/table'

<TableBody>
  <TableStateWrapper
    isLoading={isLoading}
    hasItems={items.length > 0}
    columns={6}
  >
    {items.map(...)}
  </TableStateWrapper>
</TableBody>
```

## File Structure

```
components/shared/table/
├── index.ts              # Module exports
├── data-table.tsx        # Main DataTable component
├── table-pagination.tsx  # Pagination controls
├── table-states.tsx      # Loading, empty, error states
└── README.md             # This documentation
```

## Related

- [useUnifiedTable Hook](/hooks/table/README.md) - Stage 1 of table refactorization
- Stage 3 (upcoming): `mapApiToTableData` utility function
- Stage 4 (upcoming): Migration of existing table implementations