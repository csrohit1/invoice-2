import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import Modal from '../components/Modal'

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitPrice: '',
    taxRate: '',
    quantity: ''
  })

  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory-item').then(res => res.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/inventory-item', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/inventory-item/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory'])
      setIsModalOpen(false)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/inventory-item/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory'])
    }
  })

  const resetForm = () => {
    setFormData({ name: '', description: '', unitPrice: '', taxRate: '', quantity: '' })
    setEditingItem(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      unitPrice: parseInt(formData.unitPrice),
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
      quantity: parseInt(formData.quantity) || 0
    }
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      unitPrice: item.unitPrice.toString(),
      taxRate: item.taxRate?.toString() || '',
      quantity: item.quantity?.toString() || '0'
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Item
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">Unit Price</th>
                <th className="px-6 py-3 text-left">Tax Rate</th>
                <th className="px-6 py-3 text-left">Quantity</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{(item.unitPrice / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.taxRate || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="input-field mt-1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="input-field mt-1"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="input-field mt-1"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="input-field mt-1"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              min="0"
              className="input-field mt-1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
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
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn-primary"
            >
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Inventory