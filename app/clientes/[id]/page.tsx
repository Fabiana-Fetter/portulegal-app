'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  name: string
  nif: string | null
  phone: string | null
  email: string | null
  contact: string | null
  birth_date: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

type ClientSale = {
  sale_id: string
  sale_number: string
  sale_date: string
  sale_status: string
  item_count: number
  gross_after_discount: number
  vat_amount: number
}

type PageProps = {
  params: Promise<{
    id: string
  }>
}

const tabs = [
  'Dados',
  'Vendas',
  'Serviços',
  'Processos',
  'Documentos',
  'Financeiro',
  'Histórico',
]

export default function ClientePage({ params }: PageProps) {
  const { id } = use(params)

const [client, setClient] = useState<Client | null>(null)
const [sales, setSales] = useState<ClientSale[]>([])
const [activeTab, setActiveTab] = useState('Dados')
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

  useEffect(() => {
    async function loadClient() {
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
          birth_date,
          address,
          notes,
          is_active,
          created_at
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setClient(data)

const { data: salesData, error: salesError } = await supabase
  .from('dashboard_sales_summary')
  .select(`
    sale_id,
    sale_number,
    sale_date,
    sale_status,
    item_count,
    gross_after_discount,
    vat_amount
  `)
  .eq('client_id', id)
  .order('sale_date', { ascending: false })

if (salesError) {
  setError(salesError.message)
  setLoading(false)
  return
}

setSales(salesData ?? [])
setLoading(false)
    }

    loadClient()
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando cliente...
        </p>
      </main>
    )
  }

  if (error || !client) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 p-8">
        <div className="max-w-lg w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Não foi possível abrir o cliente
          </h1>

          <p className="text-red-600 text-sm mt-3">
            {error || 'Cliente não encontrado.'}
          </p>

          <button
            onClick={() => {
              window.location.href = '/clientes'
            }}
            className="mt-6 rounded-lg border px-4 py-2 text-sm"
          >
            Voltar para clientes
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">

        <button
          onClick={() => {
            window.location.href = '/clientes'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para clientes
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-900">
                {client.name}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  client.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {client.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-slate-500">
              {client.nif && (
                <span>NIF: {client.nif}</span>
              )}

              {client.phone && (
                <span>{client.phone}</span>
              )}

              {client.email && (
                <span>{client.email}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                window.location.href = `/clientes/${client.id}/editar`
              }}
              className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium"
            >
              Editar Cliente
            </button>

            <button
              onClick={() => {
                window.location.href = `/vendas/nova?client=${client.id}`
              }}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Nova Venda
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

          <div className="border-b overflow-x-auto">
            <div className="flex min-w-max px-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-4 text-sm border-b-2 transition ${
                    activeTab === tab
                      ? 'border-slate-900 text-slate-900 font-medium'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">

            {activeTab === 'Dados' ? (
  <div>
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Dados do cliente
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Informações principais cadastradas na Portulegal.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

      <InfoCard
        label="Nome completo"
        value={client.name}
      />

      <InfoCard
        label="NIF"
        value={client.nif}
      />

      <InfoCard
        label="Data de nascimento"
        value={
          client.birth_date
            ? new Date(
                `${client.birth_date}T00:00:00`
              ).toLocaleDateString('pt-PT')
            : null
        }
      />

      <InfoCard
        label="Telefone"
        value={client.phone}
      />

      <InfoCard
        label="E-mail"
        value={client.email}
      />

      <InfoCard
        label="Contacto / responsável"
        value={client.contact}
      />

    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">

      <div className="rounded-xl border p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Morada
        </p>

        <p className="text-sm text-slate-900 mt-2 whitespace-pre-wrap">
          {client.address || 'Não informada'}
        </p>
      </div>

      <div className="rounded-xl border p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Observações
        </p>

        <p className="text-sm text-slate-900 mt-2 whitespace-pre-wrap">
          {client.notes || 'Nenhuma observação cadastrada.'}
        </p>
      </div>

    </div>

    <p className="text-xs text-slate-400 mt-6">
      Cliente cadastrado em{' '}
      {new Date(client.created_at).toLocaleString('pt-PT')}
    </p>
  </div>
) : activeTab === 'Vendas' ? (
  <div>
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Vendas
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Histórico comercial deste cliente.
        </p>
      </div>

      <button
        onClick={() => {
          window.location.href = `/vendas/nova?client=${client.id}`
        }}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
      >
        Nova Venda
      </button>
    </div>

    {sales.length === 0 ? (
      <div className="rounded-xl border p-8 text-center">
        <p className="font-medium text-slate-900">
          Nenhuma venda cadastrada
        </p>

        <p className="text-sm text-slate-500 mt-2">
          Este cliente ainda não possui vendas.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">

          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">
                Venda
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
            {sales.map((sale) => (
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
) : (
  <EmptyTab
    title={activeTab}
    clientName={client.name}
  />
)}
        

          </div>
        </div>
      </div>
    </main>
  )
}

function InfoCard({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-xl border p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="text-sm font-medium text-slate-900 mt-2">
        {value || '—'}
      </p>
    </div>
  )
}

function EmptyTab({
  title,
  clientName,
}: {
  title: string
  clientName: string
}) {
  return (
    <div className="py-12 text-center">
      <h2 className="text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        Em breve esta área mostrará os dados de {title.toLowerCase()} de{' '}
        {clientName}.
      </p>
    </div>
  )
}