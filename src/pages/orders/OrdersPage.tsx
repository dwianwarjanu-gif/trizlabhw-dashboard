import React, { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

import { ordersApi } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import OrderStatusBadge from '@/components/orders/OrderStatusBadge'
import OrderFilters from '@/components/orders/OrderFilters'
import { cn } from '@/utils/cn'

const OrdersPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    marketplaceAccountId: '',
    startDate: '',
    endDate: '',
    sortBy: 'orderDate',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }

  const {
    data: queryData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', page, search, filters],
    queryFn: async () => {
      const res = await ordersApi.getAll({
        page,
        limit: 20,
        search,
        ...filters
      })

      console.log('FULL RES:', res.data)

      const payload = res.data?.data ?? res.data ?? {}
      const orders = Array.isArray(payload.orders) ? payload.orders : []
      const pagination = payload.pagination ?? null

      return { orders, pagination }
    },
    placeholderData: keepPreviousData
  })

  const orders = Array.isArray(queryData?.orders) ? queryData.orders : []
  const pagination = queryData?.pagination ?? null

  console.log('QUERY DATA:', queryData)
  console.log('ORDERS:', orders, Array.isArray(orders))
  console.log('PAGINATION:', pagination) 

  return (
    <div className="space-y-6">
      {/* ...sisanya tetap... */}

      <div className="divide-y divide-gray-200">
        {Array.isArray(orders) &&
          orders.map((order: any) => (
            <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
              ...
            </div>
          ))}
       </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}

export default OrdersPage