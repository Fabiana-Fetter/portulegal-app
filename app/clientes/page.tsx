'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  name: string
  nif: string | null
  phone: string | null
  email: string | null
  contact: string | null
  created_at: string
}

export default function ClientesPage() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClients() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          nif,
          phone,
          email,
          contact,
          created_at
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setClients(data ?? [])
      setLoading(false)
    }

    loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return clients
    }

    return clients.filter((client) => {
      return [
        client.name,
        client.nif,
        client.phone,
        client.email,
        client.contact,
      ].some((value) =>
        value?.toLowerCase().includes(term)
      )
    })
  }, [clients, search])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Carregando clientes...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-3">Clientes</h1>
          <p className="text-red-600">Erro: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-2">
              Comercial
            </p>

            <h1 className="text-3xl font-semibold text-slate-900">
              Clientes
            </h1>

            <p className="text-slate-500 mt-2">
              Consulte, pesquise e acompanhe a base de clientes da Portulegal.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = '/clientes/novo'
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Novo Cliente
          </button>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Base de clientes
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {filteredClients.length}{' '}
                  {filteredClients.length === 1
                    ? 'cliente encontrado'
                    : 'clientes encontrados'}
                </p>
              </div>

              <div className="w-full md:w-96">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar nome, NIF, telefone ou e-mail..."
                  className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                Nenhum cliente encontrado
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Ajuste a pesquisa ou cadastre um novo cliente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      Nome
                    </th>
                    <th className="px-5 py-3 text-left font-medium">
                      NIF
                    </th>
                    <th className="px-5 py-3 text-left font-medium">
                      Telefone
                    </th>
                    <th className="px-5 py-3 text-left font-medium">
                      E-mail
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {client.name}
                          </p>

                          {client.contact && (
                            <p className="text-xs text-slate-500 mt-1">
                              Contacto: {client.contact}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {client.nif || '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {client.phone || '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {client.email || '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            window.location.href = `/clientes/${client.id}`
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