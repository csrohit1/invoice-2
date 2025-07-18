import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, EyeIcon, CheckIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import Modal from '../components/Modal'

const Invoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState(null)

  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoice').then(res => res.data.data)
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
    mutationFn: ({ id, status }) => api.patch(`/invoice/${id}/status/${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
    }
  })

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
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
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Invoice
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">Invoice #</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Issue Date</th>
                <th className="px-6 py-3 text-left">Due Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices?.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    INV-{invoice.invoiceNumber.toString().padStart(5, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customers?.find(c => c.id === invoice.customerId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{((invoice.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingInvoice(invoice)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {invoice.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Paid"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Invoice Modal */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title={`Invoice INV-${viewingInvoice?.invoiceNumber?.toString().padStart(5, '0')}`}
      >
        {viewingInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <p className="mt-1 text-sm text-gray-900">
                  {customers?.find(c => c.id === viewingInvoice.customerId)?.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(viewingInvoice.status)}`}>
                  {viewingInvoice.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(viewingInvoice.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(viewingInvoice.dueDate).toLocaleDateString()}
                </p>
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
                    {viewingInvoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {inventory?.find(i => i.id === item.inventoryItemId)?.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">₹{(item.unitPrice / 100).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">₹{(item.quantity * item.unitPrice / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>₹{((viewingInvoice.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0) / 100).toFixed(2)}</span>
              </div>
            </div>

            {viewingInvoice.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{viewingInvoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Invoices