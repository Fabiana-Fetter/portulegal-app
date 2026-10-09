'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default function EditarTaxaPage({ params }: PageProps) {
  const { id } = use(params)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [vatApplicable, setVatApplicable] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFee() {
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
          is_active
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setCode(data.code)
      setName(data.name)
      setAmount(String(data.default_amount))
      setVatApplicable(data.vat_applicable)
      setIsActive(data.is_active)
      setLoading(false)
    }

    loadFee()
  }, [id])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')

    const normalizedAmount = Number(
      amount.replace(',', '.')
    )

    if (!code.trim()) {
      setError('Informe o código da taxa.')
      return
    }

    if (!name.trim()) {
      setError('Informe o nome da taxa.')
      return
    }

    if (
      amount.trim() === '' ||
      Number.isNaN(normalizedAmount) ||
      normalizedAmount < 0
    ) {
      setError('Informe um valor válido para a taxa.')
      return
    }

    setSaving(true)

    const { error: rpcError } = await supabase.rpc(
      'rpc_update_fee_catalog',
      {
        p_fee_id: id,
        p_code: code.trim().toUpperCase(),
        p_name: name.trim(),
        p_default_amount: normalizedAmount,
        p_vat_applicable: vatApplicable,
        p_is_active: isActive,
      }
    )

    if (rpcError) {
      setError(rpcError.message)
      setSaving(false)
      return
    }

    window.location.href = '/taxas'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando taxa...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto">

        <button
          type="button"
          onClick={() => {
            window.location.href = '/taxas'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para taxas
        </button>

        <div className="mb-8">
          <p className="text-sm text-slate-500 mb-2">
            Administração
          </p>

          <h1 className="text-3xl font-semibold text-slate-900">
            Editar Taxa
          </h1>

          <p className="text-slate-500 mt-2">
            Altere os dados da taxa central.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white shadow-sm"
        >
          <div className="p-6 space-y-6">

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código interno
              </label>

              <input
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome da taxa
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Valor padrão (€)
              </label>

              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                className="w-full rounded-lg border px-4 py-3"
              />

              <p className="text-xs text-slate-500 mt-2">
                O novo valor será utilizado nas novas vendas.
                Vendas já criadas mantêm o valor histórico.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={vatApplicable}
                onChange={(event) =>
                  setVatApplicable(event.target.checked)
                }
                className="mt-1"
              />

              <div>
                <p className="text-sm font-medium text-slate-900">
                  IVA aplicável à taxa
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Indica se a própria taxa está sujeita a IVA.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(event.target.checked)
                }
                className="mt-1"
              />

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Taxa ativa
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Taxas inativas deixam de ser utilizadas em novas operações.
                </p>
              </div>
            </label>

          </div>

          <div className="border-t bg-slate-50 p-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/taxas'
              }}
              disabled={saving}
              className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium text-slate-700"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

      </div>
    </main>
  )
}