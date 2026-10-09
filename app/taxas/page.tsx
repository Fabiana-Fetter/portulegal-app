'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type FeeCatalogItem = {
  id: string
  code: string
  name: string
  default_amount: number
  vat_applicable: boolean
  is_active: boolean
  created_at: string
}

export default function TaxasPage() {
  const [fees, setFees] = useState<FeeCatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFees() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('fee_catalog')
        .select(`
          id,
          code,
          name,
          default_amount,
          vat_applicable,
          is_active,
          created_at
        `)
        .order('name', { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setFees(data ?? [])
      setLoading(false)
    }

    loadFees()
  }, [])

  const filteredFees = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return fees
    }

    return fees.filter((fee) =>
      [fee.code, fee.name].some((value) =>
        value.toLowerCase().includes(term)
      )
    )
  }, [fees, search])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando catálogo de taxas...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 p-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Catálogo de Taxas
          </h1>

          <p className="text-sm text-red-600 mt-3">
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
              Catálogo de Taxas
            </h1>

            <p className="text-slate-500 mt-2">
              Gerencie as taxas utilizadas nos produtos e serviços da Portulegal.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = '/taxas/nova'
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Nova Taxa
          </button>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Taxas cadastradas
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {filteredFees.length}{' '}
                  {filteredFees.length === 1
                    ? 'taxa encontrada'
                    : 'taxas encontradas'}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Pesquisar código ou nome..."
                className="w-full md:w-96 rounded-lg border px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {filteredFees.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                Nenhuma taxa cadastrada
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Clique em “Nova Taxa” para cadastrar a primeira.
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
                      Taxa
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Valor
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      IVA
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Estado
                    </th>
<th className="px-5 py-3 text-right font-medium">
  Ações
</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredFees.map((fee) => (
                    <tr
                      key={fee.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {fee.code}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {fee.name}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-900">
                        {Number(fee.default_amount).toFixed(2)} €
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {fee.vat_applicable
                          ? 'Aplicável'
                          : 'Não aplicável'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            fee.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {fee.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
<td className="px-5 py-4 text-right">
  <button
    onClick={() => {
      window.location.href = `/taxas/${fee.id}/editar`
    }}
    className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
  >
    Editar
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