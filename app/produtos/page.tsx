'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ProductRow = {
  id: string
  code: string
  name: string
  product_type: string
  tracking_level: string
  is_active: boolean
  category_name: string | null
  gross_service_price: number | null
  vat_rate: number | null
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          code,
          name,
          product_type,
          tracking_level,
          is_active,
          product_categories (
            name
          ),
          product_prices (
            gross_service_price,
            vat_rate,
            is_active
          )
        `)
        .order('name', { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const normalized = (data ?? []).map((product: any) => {
        const activePrice = Array.isArray(product.product_prices)
          ? product.product_prices.find(
              (price: any) => price.is_active === true
            )
          : null

        return {
          id: product.id,
          code: product.code,
          name: product.name,
          product_type: product.product_type,
          tracking_level: product.tracking_level,
          is_active: product.is_active,
          category_name:
            product.product_categories?.name ?? null,
          gross_service_price:
            activePrice?.gross_service_price ?? null,
          vat_rate:
            activePrice?.vat_rate ?? null,
        }
      })

      setProducts(normalized)
      setLoading(false)
    }

    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return products
    }

    return products.filter((product) =>
      [
        product.code,
        product.name,
        product.category_name,
      ].some((value) =>
        value?.toLowerCase().includes(term)
      )
    )
  }, [products, search])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando catálogo...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Produtos e Serviços
          </h1>

          <p className="text-red-600 mt-3 text-sm">
            Erro: {error}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-2">
              Administração
            </p>

            <h1 className="text-3xl font-semibold text-slate-900">
              Produtos e Serviços
            </h1>

            <p className="text-slate-500 mt-2">
              Catálogo comercial da Portulegal.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = '/produtos/novo'
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Novo Produto / Serviço
          </button>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Catálogo
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {filteredProducts.length}{' '}
                  {filteredProducts.length === 1
                    ? 'item encontrado'
                    : 'itens encontrados'}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Pesquisar código, nome ou categoria..."
                className="w-full md:w-96 rounded-lg border px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                Nenhum produto ou serviço encontrado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">

                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      Código
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Produto / Serviço
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Categoria
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Acompanhamento
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Preço
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      IVA
                    </th>
<th className="px-5 py-3 text-right font-medium">
  Ações
</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {product.code}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {product.name}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {product.is_active
                            ? 'Ativo'
                            : 'Inativo'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.category_name || '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {product.tracking_level === 'NONE'
                          ? 'Nenhum'
                          : product.tracking_level === 'SIMPLIFIED'
                          ? 'Simplificado'
                          : 'Completo'}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-900">
                        {product.gross_service_price !== null
                          ? `${Number(
                              product.gross_service_price
                            ).toFixed(2)} €`
                          : '—'}
                      </td>

                      <td className="px-5 py-4 text-right text-slate-600">
                        {product.vat_rate !== null
                          ? `${Number(
                              product.vat_rate
                            ).toFixed(2)}%`
                          : '—'}
                      </td>
<td className="px-5 py-4 text-right">
  <button
    onClick={() => {
      window.location.href = `/produtos/${product.id}`
    }}
    className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
  >
    Abrir
  </button>
</td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}