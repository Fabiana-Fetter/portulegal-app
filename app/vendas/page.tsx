'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Sale = {
  sale_id: string
  sale_number: string
  sale_date: string
  sale_status: string
  client_id: string
  client_name: string
  sold_by_name: string | null
  partner_name: string | null
  item_count: number
  gross_after_discount: number
  vat_amount: number
  gross_margin_amount: number
}

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSales() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('dashboard_sales_summary')
        .select(`
          sale_id,
          sale_number,
          sale_date,
          sale_status,
          client_id,
          client_name,
          sold_by_name,
          partner_name,
          item_count,
          gross_after_discount,
          vat_amount,
          gross_margin_amount
        `)
        .order('sale_date', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSales(data ?? [])
      setLoading(false)
    }

    loadSales()
  }, [])

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return sales
    }

    return sales.filter((sale) =>
      [
        sale.sale_number,
        sale.client_name,
        sale.sold_by_name,
        sale.partner_name,
      ].some((value) =>
        value?.toLowerCase().includes(term)
      )
    )
  }, [sales, search])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando vendas...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Vendas
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
              Comercial
            </p>

            <h1 className="text-3xl font-semibold text-slate-900">
              Vendas
            </h1>

            <p className="text-slate-500 mt-2">
              Consulte e acompanhe as vendas da Portulegal.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = '/vendas/nova'
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Nova Venda
          </button>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Vendas cadastradas
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {filteredSales.length}{' '}
                  {filteredSales.length === 1
                    ? 'venda encontrada'
                    : 'vendas encontradas'}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Pesquisar venda, cliente ou vendedor..."
                className="w-full md:w-96 rounded-lg border px-4 py-2.5 text-sm"
              />

            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                Nenhuma venda encontrada
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">

                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      Venda
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Cliente
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Data
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Serviços
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Total
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.sale_id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {sale.sale_number}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {sale.sale_status}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {sale.client_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {new Date(
                          `${sale.sale_date}T00:00:00`
                        ).toLocaleDateString('pt-PT')}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {sale.item_count}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-900">
                        {Number(
                          sale.gross_after_discount || 0
                        ).toFixed(2)} €
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            window.location.href =
                              `/vendas/${sale.sale_id}`
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
