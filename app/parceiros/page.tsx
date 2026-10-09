'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PartnerRow = {
  id: string
  name: string
  nif_nipc: string | null
  phone: string | null
  email: string | null
  iban: string | null
  is_active: boolean
}

export default function ParceirosPage() {
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPartners() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('partners')
        .select(`
          id,
          name,
          nif_nipc,
          phone,
          email,
          iban,
          is_active
        `)
        .order('name', { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setPartners(data ?? [])
      setLoading(false)
    }

    loadPartners()
  }, [])

  const filteredPartners = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return partners
    }

    return partners.filter((partner) =>
      [
        partner.name,
        partner.nif_nipc,
        partner.phone,
        partner.email,
      ].some((value) =>
        value?.toLowerCase().includes(term)
      )
    )
  }, [partners, search])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando parceiros...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Parceiros
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
              Parceiros
            </h1>

            <p className="text-slate-500 mt-2">
              Cadastro e gestão das relações comerciais da Portulegal.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = '/parceiros/novo'
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Novo Parceiro
          </button>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Parceiros cadastrados
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {filteredPartners.length}{' '}
                  {filteredPartners.length === 1
                    ? 'parceiro encontrado'
                    : 'parceiros encontrados'}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Pesquisar nome, NIF/NIPC, telefone ou e-mail..."
                className="w-full md:w-96 rounded-lg border px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {filteredPartners.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                Nenhum parceiro encontrado
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Cadastre o primeiro parceiro para começar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">

                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      Parceiro
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      NIF / NIPC
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Telefone
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      E-mail
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
                  {filteredPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {partner.name}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {partner.nif_nipc || '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {partner.phone || '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {partner.email || '—'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            partner.is_active
                              ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700'
                              : 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500'
                          }
                        >
                          {partner.is_active
                            ? 'Ativo'
                            : 'Inativo'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            window.location.href = `/parceiros/${partner.id}`
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