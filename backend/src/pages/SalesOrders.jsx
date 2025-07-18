import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import Modal from '../components/Modal'

const SalesOrders = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState(null)

  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => api.get('/sales-order').then(res => res.data.data)
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data.data)
  })

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory-item').then(res => res.data.data)
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/sales-order/${id}/status/${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales-orders'])
    }
  })

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const handleStatusUpdate = (id, status) => {
    updateStatusMutation.mutate({ id, status })
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Order
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">Order #</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    SO-{order.orderNumber.toString().padStart(5, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customers?.find(c => c.id === order.customerId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{(order.total / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'accept')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order Modal */}
      <Modal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        title={`Sales Order SO-${viewingOrder?.orderNumber?.toString().padStart(5, '0')}`}
      >
        {viewingOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <p className="mt-1 text-sm text-gray-900">
                  {customers?.find(c => c.id === viewingOrder.customerId)?.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(viewingOrder.status)}`}>
                  {viewingOrder.status}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewingOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {inventory?.find(i => i.id === item.inventoryItemId)?.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">₹{(item.unitPrice / 100).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">₹{(item.amount / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{(viewingOrder.subTotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₹{(viewingOrder.taxAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>₹{(viewingOrder.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalesOrders