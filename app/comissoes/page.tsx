'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CommissionRow = {
  id: string
  partner_id: string
  sale_id: string | null
  sale_item_id: string | null
  direction: string
  calculation_type: string
  base_amount: number | null
  percentage: number | null
  commission_amount: number
  trigger_event: string | null
  status: string
  confirmed_at: string | null
  finance_entry_id: string | null
  finance_status: string | null
  partner: {
    name: string
  } | null

  sale: {
    sale_number: string
  } | null

  sale_item: {
    product_name_snapshot: string | null
  } | null
}

export default function ComissoesPage() {
  const [commissions, setCommissions] = useState<
    CommissionRow[]
  >([])

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] =
    useState<string | null>(null)

  useEffect(() => {
    loadCommissions()
  }, [])

  async function loadCommissions() {
    setLoading(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data, error } = await supabase
      .from('commissions')
      .select(`
        id,
        partner_id,
        sale_id,
        sale_item_id,
        direction,
        calculation_type,
        base_amount,
        percentage,
        commission_amount,
        trigger_event,
        status,
        confirmed_at,
        partner:partners (
          name
        ),
        sale:sales (
          sale_number
        ),
        sale_item:sale_items (
          product_name_snapshot
        )
      `)
      .order('status', { ascending: true })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const baseCommissions =
  (data ?? []) as unknown as CommissionRow[]

const commissionIds = baseCommissions.map(
  (commission) => commission.id
)

const [
  receivablesResult,
  payablesResult,
] = await Promise.all([
  supabase
    .from('receivables')
    .select('id, source_id, status')
    .eq('source_type', 'PARTNER_COMMISSION')
    .in('source_id', commissionIds),

  supabase
    .from('payables')
    .select('id, source_id, payment_status')
    .eq('source_type', 'PARTNER_COMMISSION')
    .in('source_id', commissionIds),
])

const receivables =
  receivablesResult.data ?? []

const payables =
  payablesResult.data ?? []

const commissionsWithFinance =
  baseCommissions.map((commission) => {
    if (commission.direction === 'RECEIVABLE') {
      const receivable = receivables.find(
        (item) =>
          item.source_id === commission.id
      )

      return {
        ...commission,
        finance_entry_id:
          receivable?.id ?? null,
        finance_status:
          receivable?.status ?? null,
      }
    }

    if (commission.direction === 'PAYABLE') {
      const payable = payables.find(
        (item) =>
          item.source_id === commission.id
      )

      return {
        ...commission,
        finance_entry_id:
          payable?.id ?? null,
        finance_status:
          payable?.payment_status ?? null,
      }
    }

    return {
      ...commission,
      finance_entry_id: null,
      finance_status: null,
    }
  })

setCommissions(commissionsWithFinance)

setLoading(false)
  }

  async function confirmCommission(
    commissionId: string
  ) {
    setConfirmingId(commissionId)
    setError('')

    const { error } = await supabase.rpc(
      'rpc_confirm_commission',
      {
        p_commission_id: commissionId,
      }
    )

    if (error) {
      setError(error.message)
      setConfirmingId(null)
      return
    }

    await loadCommissions()

setConfirmingId(null)
  }

  const filteredCommissions = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return commissions
    }

    return commissions.filter((commission) =>
      [
        commission.partner?.name,
        commission.sale?.sale_number,
        commission.sale_item
          ?.product_name_snapshot,
        commission.direction,
        commission.status,
      ].some((value) =>
        value?.toLowerCase().includes(term)
      )
    )
  }, [commissions, search])

  function formatCurrency(value: number | null) {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(value || 0))
  }

  function directionLabel(direction: string) {
    if (direction === 'RECEIVABLE') {
      return 'A receber'
    }

    if (direction === 'PAYABLE') {
      return 'A pagar'
    }

    return direction
  }

  function statusLabel(
  status: string,
  direction: string
) {
  if (status === 'EXPECTED') {
    return 'Prevista'
  }

  if (status === 'CONFIRMED') {
    return 'Confirmada'
  }

  if (status === 'TO_INVOICE') {
    return 'A faturar'
  }

  if (status === 'INVOICED') {
    return 'Faturada'
  }

  if (status === 'PAID_RECEIVED') {
    return direction === 'RECEIVABLE'
      ? 'Recebida'
      : 'Paga'
  }

  if (status === 'CANCELLED') {
    return 'Cancelada'
  }

  return status
}

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando comissões...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <p className="text-sm text-slate-500 mb-2">
            Financeiro
          </p>

          <h1 className="text-3xl font-semibold text-slate-900">
            Comissões
          </h1>

          <p className="text-slate-500 mt-2">
            Gestão das comissões a receber e a pagar aos parceiros.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erro: {error}
          </div>
        )}

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Comissões registadas
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {filteredCommissions.length}{' '}
                  {filteredCommissions.length === 1
                    ? 'comissão encontrada'
                    : 'comissões encontradas'}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Pesquisar parceiro, venda, serviço ou estado..."
                className="w-full md:w-96 rounded-lg border px-4 py-2.5 text-sm"
              />

            </div>
          </div>

          {filteredCommissions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                Nenhuma comissão encontrada
              </p>

              <p className="text-sm text-slate-500 mt-2">
                As comissões geradas pelos serviços aparecerão aqui.
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
                      Venda
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Serviço
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Sentido
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Base
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Comissão
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

                  {filteredCommissions.map(
                    (commission) => (
                      <tr
                        key={commission.id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {commission.partner?.name ||
                              '—'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {commission.sale
                            ?.sale_number || '—'}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {commission.sale_item
                            ?.product_name_snapshot ||
                            '—'}
                        </td>

                        <td className="px-5 py-4">
                          {directionLabel(
                            commission.direction
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-600">
                          {formatCurrency(
                            commission.base_amount
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="font-medium text-slate-900">
                            {formatCurrency(
                              commission.commission_amount
                            )}
                          </p>

                          {commission.calculation_type ===
                            'PERCENTAGE' &&
                            commission.percentage !==
                              null && (
                              <p className="text-xs text-slate-500 mt-1">
                                {Number(
                                  commission.percentage
                                ).toFixed(2)}
                                %
                              </p>
                            )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
  commission.status === 'PAID_RECEIVED'
    ? 'inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'
    : commission.status === 'CONFIRMED'
      ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700'
      : commission.status === 'EXPECTED'
        ? 'inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700'
        : 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'
}
                          >
                            {statusLabel(
  commission.status,
  commission.direction
)}
                          </span>
{commission.status !== 'EXPECTED' && (
  <p className="mt-1 text-xs text-slate-500">
    {commission.finance_entry_id
      ? commission.finance_status === 'PAID'
        ? 'Financeiro liquidado'
        : commission.finance_status ===
            'PARTIALLY_PAID'
          ? 'Financeiro parcialmente liquidado'
          : commission.finance_status ===
                'OVERDUE'
            ? 'Financeiro vencido'
            : 'Financeiro pendente'
      : 'Sem lançamento financeiro'}
  </p>
)}
                        </td>

                        <td className="px-5 py-4 text-right">

                          {commission.status ===
                          'EXPECTED' ? (
                            <button
                              type="button"
                              disabled={
                                confirmingId ===
                                commission.id
                              }
                              onClick={() =>
                                confirmCommission(
                                  commission.id
                                )
                              }
                              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                            >
                              {confirmingId ===
                              commission.id
                                ? 'Confirmando...'
                                : 'Confirmar'}
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400">
                              —
                            </span>
                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            </div>
          )}

        </div>

      </div>
    </main>
  )
}