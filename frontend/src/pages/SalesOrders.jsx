import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, EyeIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import Modal from '../components/Modal'

const SalesOrders = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [formData, setFormData] = useState({
    customerId: '',
    notes: '',
    terms: '',
    placeOfSupply: '',
    items: []
  })
  const [currentItem, setCurrentItem] = useState({
    inventoryItemId: '',
    quantity: 1,
    unitPrice: '',
    taxRate: '',
    hsnOrSacCode: ''
  })

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

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/sales-order', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales-orders'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/sales-order/${id}/status/${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales-orders'])
    }
  })

  const resetForm = () => {
    setFormData({
      customerId: '',
      notes: '',
      terms: '',
      placeOfSupply: '',
      items: []
    })
    setCurrentItem({
      inventoryItemId: '',
      quantity: 1,
      unitPrice: '',
      taxRate: '',
      hsnOrSacCode: ''
    })
  }

  const handleAddItem = () => {
    if (!currentItem.inventoryItemId) {
      alert('Please select an inventory item')
      return
    }

    const selectedInventoryItem = inventory?.find(item => item.id === currentItem.inventoryItemId)
    if (!selectedInventoryItem) return

    const unitPrice = currentItem.unitPrice ? 
      Math.round(parseFloat(currentItem.unitPrice) * 100) : 
      selectedInventoryItem.unitPrice

    const taxRate = currentItem.taxRate !== '' ? 
      parseFloat(currentItem.taxRate) : 
      (selectedInventoryItem.taxRate || 0)

    const amount = currentItem.quantity * unitPrice

    const newItem = {
      inventoryItemId: currentItem.inventoryItemId,
      quantity: parseInt(currentItem.quantity),
      unitPrice: unitPrice,
      taxRate: taxRate,
      hsnOrSacCode: currentItem.hsnOrSacCode || selectedInventoryItem.hsnOrSacCode || '',
      amount: amount,
      // For display purposes
      name: selectedInventoryItem.name
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))

    setCurrentItem({
      inventoryItemId: '',
      quantity: 1,
      unitPrice: '',
      taxRate: '',
      hsnOrSacCode: ''
    })
  }

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleInventoryItemChange = (inventoryItemId) => {
    const selectedItem = inventory?.find(item => item.id === inventoryItemId)
    if (selectedItem) {
      setCurrentItem(prev => ({
        ...prev,
        inventoryItemId,
        unitPrice: (selectedItem.unitPrice / 100).toString(),
        taxRate: selectedItem.taxRate?.toString() || '',
        hsnOrSacCode: selectedItem.hsnOrSacCode || ''
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (formData.items.length === 0) {
      alert('Please add at least one item')
      return
    }

    const submitData = {
      customerId: formData.customerId,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined,
      placeOfSupply: formData.placeOfSupply || undefined,
      items: formData.items.map(item => ({
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        hsnOrSacCode: item.hsnOrSacCode
      }))
    }

    createMutation.mutate(submitData)
  }

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

  const formatCurrency = (amount) => {
    return `₹${(amount / 100).toFixed(2)}`
  }

  const calculateTotal = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = formData.items.reduce((sum, item) => sum + (item.amount * item.taxRate / 100), 0)
    return { subTotal, taxAmount, total: subTotal + taxAmount }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
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
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View order"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'accept')}
                            className="text-green-600 hover:text-green-900"
                            title="Accept order"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject order"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders?.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No sales orders found. Create your first order to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Create Sales Order"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer *</label>
            <select
              required
              className="input-field mt-1"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">Select a customer</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Place of Supply</label>
              <input
                type="text"
                className="input-field mt-1"
                value={formData.placeOfSupply}
                onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
                placeholder="e.g., Maharashtra"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Item *</label>
                <select
                  className="input-field mt-1"
                  value={currentItem.inventoryItemId}
                  onChange={(e) => handleInventoryItemChange(e.target.value)}
                >
                  <option value="">Select an item</option>
                  {inventory?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - ₹{(item.unitPrice / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="input-field mt-1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field mt-1"
                  value={currentItem.unitPrice}
                  onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                  placeholder="Auto-filled"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="input-field mt-1"
                  value={currentItem.taxRate}
                  onChange={(e) => setCurrentItem({ ...currentItem, taxRate: e.target.value })}
                  placeholder="Auto-filled"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-primary w-full"
                >
                  Add Item
                </button>
              </div>
            </div>
            
            {/* HSN/SAC Code */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">HSN/SAC Code</label>
              <input
                type="text"
                className="input-field mt-1 max-w-xs"
                value={currentItem.hsnOrSacCode}
                onChange={(e) => setCurrentItem({ ...currentItem, hsnOrSacCode: e.target.value })}
                placeholder="Auto-filled from item"
              />
            </div>
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">HSN/SAC</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.hsnOrSacCode || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.taxRate}%</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Total */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateTotal().subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax:</span>
                  <span>{formatCurrency(calculateTotal().taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal().total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="input-field mt-1"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or notes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Terms</label>
              <textarea
                className="input-field mt-1"
                rows={3}
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Payment terms and conditions"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading || formData.items.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Modal */}
      <Modal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        title={`Sales Order SO-${viewingOrder?.orderNumber?.toString().padStart(5, '0')}`}
        size="lg"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(viewingOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Supply</label>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingOrder.placeOfSupply || '-'}
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">HSN/SAC</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewingOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {inventory?.find(i => i.id === item.inventoryItemId)?.name || 'Unknown Item'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.hsnOrSacCode || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.taxRate || 0}%</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(viewingOrder.subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tax:</span>
                <span>{formatCurrency(viewingOrder.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(viewingOrder.total)}</span>
              </div>
            </div>

            {(viewingOrder.notes || viewingOrder.terms) && (
              <div className="grid grid-cols-1 gap-4">
                {viewingOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingOrder.notes}</p>
                  </div>
                )}
                {viewingOrder.terms && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Terms</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingOrder.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalesOrders