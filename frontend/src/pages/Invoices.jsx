import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, EyeIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import Modal from '../components/Modal'

const Invoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [invoiceType, setInvoiceType] = useState('direct') // 'direct' or 'from-order'
  const [formData, setFormData] = useState({
    customerId: '',
    salesOrderId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: '',
    items: []
  })
  const [currentItem, setCurrentItem] = useState({
    inventoryItemId: '',
    quantity: 1,
    unitPrice: '',
    taxRate: ''
  })

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

  const { data: salesOrders } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => api.get('/sales-order').then(res => res.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/invoice', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/invoice/${id}/status/${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
    }
  })

  const resetForm = () => {
    setFormData({
      customerId: '',
      salesOrderId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      terms: '',
      items: []
    })
    setCurrentItem({
      inventoryItemId: '',
      quantity: 1,
      unitPrice: '',
      taxRate: ''
    })
    setInvoiceType('direct')
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

    const newItem = {
      inventoryItemId: currentItem.inventoryItemId,
      quantity: parseInt(currentItem.quantity),
      unitPrice: unitPrice,
      taxRate: taxRate,
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
      taxRate: ''
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
        taxRate: selectedItem.taxRate?.toString() || ''
      }))
    }
  }

  const handleSalesOrderChange = (salesOrderId) => {
    const selectedOrder = salesOrders?.find(order => order.id === salesOrderId)
    if (selectedOrder) {
      setFormData(prev => ({
        ...prev,
        salesOrderId,
        customerId: selectedOrder.customerId
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    let submitData = {
      customerId: formData.customerId,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined
    }

    if (invoiceType === 'from-order') {
      if (!formData.salesOrderId) {
        alert('Please select a sales order')
        return
      }
      submitData.salesOrderId = formData.salesOrderId
    } else {
      if (formData.items.length === 0) {
        alert('Please add at least one item')
        return
      }
      submitData.items = formData.items.map(item => ({
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate
      }))
    }

    createMutation.mutate(submitData)
  }

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

  const formatCurrency = (amount) => {
    return `₹${(amount / 100).toFixed(2)}`
  }

  const calculateInvoiceTotal = (items) => {
    if (!items || items.length === 0) return 0
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const calculateDirectTotal = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = formData.items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice) * item.taxRate / 100), 0)
    return { subTotal, taxAmount, total: subTotal + taxAmount }
  }

  // Filter accepted sales orders
  const acceptedSalesOrders = salesOrders?.filter(order => order.status === 'ACCEPTED') || []

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
                    {formatCurrency(calculateInvoiceTotal(invoice.items))}
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
                        title="View invoice"
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
              {invoices?.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No invoices found. Create your first invoice to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="Create Invoice"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Invoice Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="invoiceType"
                  value="direct"
                  checked={invoiceType === 'direct'}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="mr-2"
                />
                Direct Invoice
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="invoiceType"
                  value="from-order"
                  checked={invoiceType === 'from-order'}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="mr-2"
                />
                From Sales Order
              </label>
            </div>
          </div>

          {/* Sales Order Selection (if from-order) */}
          {invoiceType === 'from-order' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Sales Order *</label>
              <select
                required
                className="input-field mt-1"
                value={formData.salesOrderId}
                onChange={(e) => handleSalesOrderChange(e.target.value)}
              >
                <option value="">Select a sales order</option>
                {acceptedSalesOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    SO-{order.orderNumber.toString().padStart(5, '0')} - {customers?.find(c => c.id === order.customerId)?.name} - {formatCurrency(order.total)}
                  </option>
                ))}
              </select>
              {acceptedSalesOrders.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">No accepted sales orders available</p>
              )}
            </div>
          )}

          {/* Customer Selection (if direct invoice or auto-filled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer *</label>
            <select
              required
              className="input-field mt-1"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              disabled={invoiceType === 'from-order' && formData.salesOrderId}
            >
              <option value="">Select a customer</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date *</label>
              <input
                type="date"
                required
                className="input-field mt-1"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date *</label>
              <input
                type="date"
                required
                className="input-field mt-1"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={formData.issueDate}
              />
            </div>
          </div>

          {/* Direct Invoice Items */}
          {invoiceType === 'direct' && (
            <>
              {/* Add Item Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn-primary w-full"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
                
                {/* Tax Rate */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input-field mt-1 max-w-xs"
                    value={currentItem.taxRate}
                    onChange={(e) => setCurrentItem({ ...currentItem, taxRate: e.target.value })}
                    placeholder="Auto-filled from item"
                  />
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Invoice Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
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
                            <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{item.taxRate}%</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.quantity * item.unitPrice)}</td>
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

                  {/* Invoice Total */}
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateDirectTotal().subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tax:</span>
                      <span>{formatCurrency(calculateDirectTotal().taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateDirectTotal().total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
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
                placeholder="Any additional notes for the invoice"
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
              disabled={createMutation.isLoading || (invoiceType === 'direct' && formData.items.length === 0)}
              className="btn-primary disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title={`Invoice INV-${viewingInvoice?.invoiceNumber?.toString().padStart(5, '0')}`}
        size="lg"
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

            {viewingInvoice.salesOrderId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Related Sales Order</label>
                <p className="mt-1 text-sm text-gray-900">
                  SO-{salesOrders?.find(o => o.id === viewingInvoice.salesOrderId)?.orderNumber?.toString().padStart(5, '0') || 'Unknown'}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {viewingInvoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {inventory?.find(i => i.id === item.inventoryItemId)?.name || 'Unknown Item'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.taxRate || 0}%</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>{formatCurrency(calculateInvoiceTotal(viewingInvoice.items))}</span>
              </div>
            </div>

            {(viewingInvoice.notes || viewingInvoice.terms) && (
              <div className="grid grid-cols-1 gap-4">
                {viewingInvoice.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingInvoice.notes}</p>
                  </div>
                )}
                {viewingInvoice.terms && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Terms</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingInvoice.terms}</p>
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

export default Invoices