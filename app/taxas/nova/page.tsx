'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NovaTaxaPage() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [vatApplicable, setVatApplicable] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')

    const normalizedCode = code.trim().toUpperCase()
    const normalizedName = name.trim()
    const normalizedAmount = Number(
      amount.replace(',', '.')
    )

    if (!normalizedCode) {
      setError('Informe o código da taxa.')
      return
    }

    if (!normalizedName) {
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
      'rpc_create_fee_catalog',
      {
        p_code: normalizedCode,
        p_name: normalizedName,
        p_default_amount: normalizedAmount,
        p_vat_applicable: vatApplicable,
      }
    )

    if (rpcError) {
      setError(rpcError.message)
      setSaving(false)
      return
    }

    window.location.href = '/taxas'
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
            Nova Taxa
          </h1>

          <p className="text-slate-500 mt-2">
            Cadastre uma taxa que poderá ser utilizada em um ou mais produtos.
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
                type="text"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
                placeholder="Ex.: TAX-NAC-001"
                className="w-full rounded-lg border px-4 py-3"
              />

              <p className="text-xs text-slate-500 mt-2">
                Código único utilizado internamente pelo sistema.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome da taxa
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ex.: Taxa de Nacionalidade"
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
                placeholder="0,00"
                className="w-full rounded-lg border px-4 py-3"
              />

              <p className="text-xs text-slate-500 mt-2">
                Alterações futuras deste valor serão aplicadas às novas vendas
                dos produtos vinculados a esta taxa.
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
                  Marque somente quando a própria taxa estiver sujeita a IVA.
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
              {saving ? 'Salvando...' : 'Criar Taxa'}
            </button>
          </div>
        </form>

      </div>
    </main>
  )
}