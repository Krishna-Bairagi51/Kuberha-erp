# Map API to Table Data Utility

A utility that normalizes API responses for table consumption. Handles various response formats and supports custom field mapping and transformation.

## Overview

This module is part of the table refactorization effort (Stage 3) and provides:

- **Data extraction** from various API response wrapper keys (`record`, `result`, `data`, etc.)
- **Field mapping** with support for nested paths and transformations
- **Type conversion** utilities for common data types
- **Pre-built transformers** for formatting currencies, dates, and more
- **Full TypeScript support** with generics

## Installation

Import from the table utils module:

```tsx
import { mapApiToTableData } from '@/lib/utils/table'
// or individual utilities
import { extractArrayFromResponse, transformers, toNumber } from '@/lib/utils/table'
```

## Quick Start

```tsx
// Simple extraction - automatically detects array in response
const { data } = mapApiToTableData(response)

// With field mappings
const { data } = mapApiToTableData(response, {
  mappings: {
    id: 'product_id',
    name: 'product_name',
    price: 'unit_price',
  }
})

// With transformations
const { data } = mapApiToTableData(response, {
  transform: (item) => ({
    ...item,
    displayPrice: `₹${item.price.toLocaleString('en-IN')}`,
  })
})
```

## API Reference

### `mapApiToTableData<TInput, TOutput>(response, options?)`

Main utility function to map API response to table data.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `response` | `any` | API response object or array |
| `options` | `MapApiToTableDataOptions` | Optional configuration |

#### Options

```tsx
interface MapApiToTableDataOptions<TInput, TOutput> {
  // Field mappings from API fields to table fields
  mappings?: FieldMappings<TOutput>
  
  // Transform function applied to each item after field mapping
  transform?: (item: TInput, index: number) => TOutput
  
  // Filter function to exclude items
  filter?: (item: TInput, index: number) => boolean
  
  // Sort function to order items
  sort?: (a: TOutput, b: TOutput) => number
  
  // Options for data extraction
  extractOptions?: {
    dataKey?: string           // Specific key to extract from
    additionalKeys?: string[]  // Additional keys to check
    returnEmptyOnError?: boolean
  }
}
```

#### Return Value

```tsx
interface MapApiToTableDataResult<T> {
  data: T[]              // Extracted and transformed data array
  totalCount?: number    // Total count from API response
  success: boolean       // Whether extraction was successful
  error?: string         // Error message if failed
  meta?: {               // Response metadata
    statusCode?: number
    message?: string
  }
}
```

### `extractArrayFromResponse<T>(response, options?)`

Extract array data from an API response, automatically detecting common wrapper keys.

```tsx
// All these return the array:
extractArrayFromResponse({ record: [1, 2, 3] })    // => [1, 2, 3]
extractArrayFromResponse({ data: [1, 2, 3] })      // => [1, 2, 3]
extractArrayFromResponse({ result: [1, 2, 3] })    // => [1, 2, 3]
extractArrayFromResponse([1, 2, 3])                // => [1, 2, 3]

// With specific key
extractArrayFromResponse(response, { dataKey: 'items' })
```

### Field Mappings

Field mappings support simple string paths or full configuration objects:

```tsx
// Simple string mapping
mappings: {
  id: 'product_id',
  name: 'product_name',
}

// Full configuration
mappings: {
  id: 'product_id',
  price: {
    from: 'unit_price',
    transform: (value) => `₹${value.toLocaleString('en-IN')}`,
    defaultValue: 0,
  },
  // Nested path access
  categoryName: {
    from: 'category.name',
    defaultValue: 'Uncategorized',
  },
}
```

### `getNestedValue(obj, path, defaultValue?)`

Get a nested value from an object using dot notation:

```tsx
getNestedValue({ a: { b: { c: 1 } } }, 'a.b.c')  // => 1
getNestedValue({ items: [{ name: 'test' }] }, 'items.0.name')  // => 'test'
getNestedValue({ a: 1 }, 'b.c', 'default')  // => 'default'
```

## Type Conversion Utilities

### `toNumber(value, fallback?)`

Convert value to number with optional fallback:

```tsx
toNumber('123')        // => 123
toNumber('₹1,234')     // => 1234 (strips non-numeric)
toNumber(null, 0)      // => 0
```

### `toString(value, fallback?)`

Convert value to string with optional fallback:

```tsx
toString(123)          // => '123'
toString(null, '-')    // => '-'
```

### `toBoolean(value)`

Convert value to boolean:

```tsx
toBoolean('true')      // => true
toBoolean('yes')       // => true
toBoolean(1)           // => true
toBoolean('false')     // => false
```

### `toDate(value)`

Convert value to Date object:

```tsx
toDate('2024-01-15')   // => Date object
toDate(null)           // => null
```

## Pre-built Transformers

The `transformers` object provides common transformation functions:

```tsx
import { transformers } from '@/lib/utils/table'

// Indian currency formatting
transformers.toIndianCurrency(1234567)  // => '₹12,34,567'

// Indian number formatting
transformers.toIndianNumber(1234567)    // => '12,34,567'

// Date formatting
transformers.toLocaleDateString('2024-01-15')  // => '15/1/2024'
transformers.toLocaleDateTimeString('2024-01-15T10:30:00')  // => '15/1/2024, 10:30:00 am'

// Order ID formatting
transformers.toOrderId('IDO')(5)        // => 'IDO05'
transformers.toOrderId('ORD')(123)      // => 'ORD123'

// Text utilities
transformers.capitalize('hello')        // => 'Hello'
transformers.truncate(20)('Long text...') // => 'Long text...'

// Array utilities
transformers.joinArray(', ')(['a', 'b'])  // => 'a, b'
transformers.firstOrValue([1, 2, 3])      // => 1

// Status mapping
const statusMap = { active: 'Active', inactive: 'Inactive' }
transformers.statusToDisplay(statusMap)('active')  // => 'Active'
```

## Complete Examples

### Example 1: Sales Data Table

```tsx
import { mapApiToTableData, transformers } from '@/lib/utils/table'

interface ApiSalesRecord {
  order_id: number
  date: string
  customer_name: string
  vendor_name: string
  gross_amount: number
  net_payable: number
}

interface SalesRow {
  orderId: string
  date: string
  customerName: string
  supplierName: string
  grossAmount: string
  netPayable: string
}

const { data, totalCount, success } = mapApiToTableData<ApiSalesRecord, SalesRow>(
  response,
  {
    mappings: {
      orderId: {
        from: 'order_id',
        transform: transformers.toOrderId('IDO'),
      },
      date: {
        from: 'date',
        transform: transformers.toLocaleDateString,
      },
      customerName: 'customer_name',
      supplierName: 'vendor_name',
      grossAmount: {
        from: 'gross_amount',
        transform: transformers.toIndianCurrency,
      },
      netPayable: {
        from: 'net_payable',
        transform: transformers.toIndianCurrency,
      },
    },
  }
)
```

### Example 2: Products with Filtering and Sorting

```tsx
const { data } = mapApiToTableData(response, {
  // Only include active products
  filter: (item) => item.status === 'active',
  
  // Sort by date (newest first)
  sort: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  
  // Transform each item
  transform: (item) => ({
    id: item.id,
    name: item.product_name,
    price: `₹${item.price.toLocaleString('en-IN')}`,
    inStock: item.quantity > 0,
  }),
})
```

### Example 3: Integration with useUnifiedTable

```tsx
import { useUnifiedTable } from '@/hooks/table'
import { mapApiToTableData } from '@/lib/utils/table'
import { useQuery } from '@tanstack/react-query'

function ProductsTable() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  // Normalize API response
  const { data: products } = mapApiToTableData(response, {
    extractOptions: { dataKey: 'record' },
    mappings: {
      id: 'product_id',
      name: 'product_name',
      category: 'category_name',
      status: 'product_status',
    },
  })

  // Use with unified table hook
  const table = useUnifiedTable({
    items: products,
    searchKeys: ['name', 'category'],
    categoryKey: 'category',
    statusKey: 'status',
  })

  return (
    <DataTable
      items={table.paginatedItems}
      pagination={table.pagination}
      // ...
    />
  )
}
```

### Example 4: Handling Nested Data

```tsx
const { data } = mapApiToTableData(response, {
  mappings: {
    id: 'id',
    productName: 'order_line.0.product_name',
    customerName: 'customer.full_name',
    customerEmail: {
      from: 'customer.contact.email',
      defaultValue: 'N/A',
    },
    sellerNames: {
      from: 'order_line',
      transform: (lines) => lines.map(l => l.seller_name).join(', '),
    },
  },
})
```

## Migration Guide

### From inline response handling

**Before:**
```tsx
const data = response?.record || response?.data || []
const mappedData = data.map(item => ({
  orderId: `IDO${String(item.order_id).padStart(2, '0')}`,
  customerName: item.customer_name,
  amount: `₹${item.amount.toLocaleString('en-IN')}`,
}))
```

**After:**
```tsx
const { data } = mapApiToTableData(response, {
  mappings: {
    orderId: { from: 'order_id', transform: transformers.toOrderId('IDO') },
    customerName: 'customer_name',
    amount: { from: 'amount', transform: transformers.toIndianCurrency },
  },
})
```

### From extractRecords utility

**Before:**
```tsx
const extractRecords = (response: any): any[] => {
  if (Array.isArray(response?.record)) return response.record
  if (Array.isArray(response?.result)) return response.result
  if (Array.isArray(response?.data)) return response.data
  return []
}
const data = extractRecords(response)
```

**After:**
```tsx
import { extractArrayFromResponse } from '@/lib/utils/table'
const data = extractArrayFromResponse(response)
```

## Supported Response Formats

The utility automatically handles these common response structures:

```tsx
// Direct array
[{ id: 1 }, { id: 2 }]

// record wrapper (most common in this codebase)
{ status_code: 200, record: [{ id: 1 }] }

// result wrapper
{ status_code: 200, result: [{ id: 1 }] }

// data wrapper
{ success: true, data: [{ id: 1 }] }

// Nested data
{ status_code: 200, data: { records: [{ id: 1 }] } }

// Custom wrapper (specify with dataKey)
{ items: [{ id: 1 }] }
```

## File Structure

```
lib/utils/table/
├── index.ts                    # Module exports
├── map-api-to-table-data.ts    # Main utility implementation
└── README.md                   # This documentation
```

## Related

- [useUnifiedTable Hook](/hooks/table/README.md) - Stage 1 of table refactorization
- [DataTable Component](/components/shared/table/README.md) - Stage 2 of table refactorization
- Stage 4 (upcoming): Migration of existing table implementations