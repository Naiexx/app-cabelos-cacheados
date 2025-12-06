'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function StoreAdminPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    link: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/store/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const body = editingProduct 
        ? { ...formData, id: editingProduct.id, price: parseFloat(formData.price) }
        : { ...formData, price: parseFloat(formData.price) }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        alert(editingProduct ? 'Produto atualizado!' : 'Produto criado!')
        setFormData({ name: '', description: '', price: '', image_url: '', link: '' })
        setEditingProduct(null)
        loadProducts()
      }
    } catch (error) {
      alert('Erro ao salvar produto')
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/store/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url || '',
      link: product.link || ''
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Loja</h1>
          <p className="text-gray-600">Adicione e edite produtos da loja</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div>
              <Label htmlFor="link">Link do Produto</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://loja.com/produto"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-gradient-to-r from-rose-300 to-purple-300">
                <Save className="w-4 h-4 mr-2" />
                {editingProduct ? 'Atualizar' : 'Adicionar'}
              </Button>
              {editingProduct && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(null)
                    setFormData({ name: '', description: '', price: '', image_url: '', link: '' })
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Produtos Cadastrados</h2>
            <Button onClick={loadProducts} variant="outline" size="sm">
              Atualizar Lista
            </Button>
          </div>
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
