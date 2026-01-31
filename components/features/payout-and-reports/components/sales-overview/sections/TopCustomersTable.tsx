"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Info } from "lucide-react"
import { TopCustomer } from "../../../types/sales-overview.types"

interface TopCustomersTableProps {
  customers: TopCustomer[]
  isLoading?: boolean
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({ customers, isLoading = false }) => {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-[16px] border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 label-1">Top Customers</h3>
            {/* <Info className="h-4 w-4 text-gray-400" /> */}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow>
                <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Supplier</TableHead>
                <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">GMV (₹)</TableHead>
                <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Casacarigar Commission (₹)</TableHead>
                <TableHead className="px-[20px] py-[10px] text-left body-3 font-semibold text-gray-500 whitespace-nowrap">Net Payable (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white ">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell className="px-[20px] py-3">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="px-[20px] py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-[20px] py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-[20px] py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-[20px] py-8 text-center text-gray-500 text-sm">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((cust, idx) => (
                  <TableRow key={`${cust.name}-${idx}`} className="hover:bg-gray-50">
                    <TableCell className="px-[20px] py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 body-3">{cust.name}</span>
                        {cust.phone && <span className="text-xs text-gray-500 body-4">{cust.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-[20px] py-3 text-gray-800 body-3">{cust.gmv}</TableCell>
                    <TableCell className="px-[20px] py-3 text-gray-800 body-3">{cust.commission}</TableCell>
                    <TableCell className="px-[20px] py-3 text-gray-800 body-3">{cust.payable}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

