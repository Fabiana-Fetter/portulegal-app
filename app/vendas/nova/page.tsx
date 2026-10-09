'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  name: string
}

export default function NovaVendaPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPage() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const params = new URLSearchParams(window.location.search)
      const clientFromUrl = params.get('client')

      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setClients(data ?? [])

      if (clientFromUrl) {
        setClientId(clientFromUrl)
      }

      setLoading(false)
    }

    loadPage()
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!clientId) {
      setError('Selecione um cliente.')
      return
    }

    setSaving(true)
    setError('')

    const { data, error } = await supabase.rpc('rpc_create_sale', {
      p_client_id: clientId,
      p_partner_id: null,
      p_debtor_type: 'CLIENT',
      p_debtor_id: clientId,
      p_origin_channel_id: null,
      p_management_mode: 'INDIVIDUAL',
      p_commercial_notes: notes || null,
      p_sold_by_user_id: null,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    const sale = Array.isArray(data) ? data[0] : data

    if (!sale?.sale_id) {
      setError('A venda foi criada, mas o identificador não foi retornado.')
      setSaving(false)
      return
    }

    window.location.href = `/vendas/${sale.sale_id}`
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => {
            window.location.href = clientId
              ? `/clientes/${clientId}`
              : '/clientes'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">
            Nova Venda
          </h1>

          <p className="text-slate-500 mt-2">
            Crie a venda e depois adicione os serviços contratados.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-6 shadow-sm space-y-6"
        >

          <div>
            <label className="block text-sm font-medium mb-2">
              Cliente *
            </label>

            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              required
              className="w-full rounded-lg border px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">
                Selecione o cliente
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Observações comerciais
            </label>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Informações relevantes sobre esta venda..."
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = clientId
                  ? `/clientes/${clientId}`
                  : '/clientes'
              }}
              className="rounded-lg border px-5 py-3 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Criando...' : 'Criar Venda'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}