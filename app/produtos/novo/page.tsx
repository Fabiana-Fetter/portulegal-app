'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Category = {
  id: string
  code: string
  name: string
}

type Subcategory = {
  id: string
  category_id: string
  code: string
  name: string
}

type StatusModel = {
  id: string
  name: string
}

type ProcessModel = {
  id: string
  code: string
  name: string
  category_id: string | null
}
type WorkflowStep = {
  id: string
  name: string
  actionType: string
  actionConfig: Record<string, unknown>
}
export default function NovoProdutoPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [statusModels, setStatusModels] = useState<StatusModel[]>([])
  const [processModels, setProcessModels] = useState<ProcessModel[]>([])

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')

  const [trackingLevel, setTrackingLevel] = useState('NONE')
  const [statusModelId, setStatusModelId] = useState('')
  const [processModelId, setProcessModelId] = useState('')

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [grossPrice, setGrossPrice] = useState('')
  const [vatRate, setVatRate] = useState('23')

  const [validFrom, setValidFrom] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [validUntil, setValidUntil] = useState('')

  const [discountAllowed, setDiscountAllowed] = useState(true)
  const [minimumMargin, setMinimumMargin] = useState('20')
  const [adminExceptionAllowed, setAdminExceptionAllowed] = useState(true)
  const [commercialMode, setCommercialMode] = useState('STANDARD')

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

      const [
        categoriesResult,
        subcategoriesResult,
        statusModelsResult,
        processModelsResult,
      ] = await Promise.all([
        supabase
          .from('product_categories')
          .select('id, code, name')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),

        supabase
          .from('product_subcategories')
          .select('id, category_id, code, name')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),

        supabase
  .from('current_status_models')
  .select('id, name')
  .order('name', { ascending: true }),

        supabase
          .from('process_models')
          .select('id, code, name, category_id')
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ])

      if (categoriesResult.error) {
        setError(categoriesResult.error.message)
        setLoading(false)
        return
      }

      if (subcategoriesResult.error) {
        setError(subcategoriesResult.error.message)
        setLoading(false)
        return
      }

      if (statusModelsResult.error) {
        setError(statusModelsResult.error.message)
        setLoading(false)
        return
      }

      if (processModelsResult.error) {
        setError(processModelsResult.error.message)
        setLoading(false)
        return
      }

      setCategories(categoriesResult.data ?? [])
      setSubcategories(subcategoriesResult.data ?? [])
      setStatusModels(statusModelsResult.data ?? [])
      setProcessModels(processModelsResult.data ?? [])

      setLoading(false)
    }

    loadPage()
  }, [])

  const filteredSubcategories = useMemo(() => {
    if (!categoryId) {
      return []
    }

    return subcategories.filter(
      (subcategory) => subcategory.category_id === categoryId
    )
  }, [subcategories, categoryId])

  const filteredProcessModels = useMemo(() => {
    if (!categoryId) {
      return processModels
    }

    return processModels.filter(
      (model) =>
        !model.category_id ||
        model.category_id === categoryId
    )
  }, [processModels, categoryId])

async function loadWorkflowSteps(statusModelId: string) {
  if (!statusModelId) {
    setWorkflowSteps([])
    return
  }

  const { data, error } = await supabase
    .from('status_model_steps')
    .select(`
      id,
      name,
      display_order,
      is_final,
      action_type,
      action_config
    `)
    .eq('status_model_id', statusModelId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    setError(error.message)
    return
  }

  const editableSteps: WorkflowStep[] = (data ?? [])
    .filter((step) => !step.is_final)
    .map((step) => ({
      id: crypto.randomUUID(),
      name: step.name,
      actionType: step.action_type ?? 'NORMAL',
      actionConfig: step.action_config ?? {},
    }))

  setWorkflowSteps(editableSteps)
}
  const grossPriceNumber = Number(grossPrice) || 0
  const vatRateNumber = Number(vatRate) || 0

  const netPrice =
    vatRateNumber > 0
      ? grossPriceNumber / (1 + vatRateNumber / 100)
      : grossPriceNumber

  const vatAmount = grossPriceNumber - netPrice

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!code.trim()) {
      setError('Informe o código interno.')
      return
    }

    if (!name.trim()) {
      setError('Informe o nome do produto ou serviço.')
      return
    }

    if (grossPriceNumber < 0) {
      setError('O preço não pode ser negativo.')
      return
    }

    if (
      validUntil &&
      validFrom &&
      validUntil < validFrom
    ) {
      setError(
        'A data final do preço não pode ser anterior à data inicial.'
      )
      return
    }

    setSaving(true)
    setError('')

    const { data, error } = await supabase.rpc(
      'rpc_create_product_with_price',
      {
        p_code: code.trim(),
        p_name: name.trim(),
        p_product_type: 'SERVICE',
        p_category_id: categoryId || null,
        p_subcategory_id: subcategoryId || null,
        p_description: description.trim() || null,
        p_currency: 'EUR',
        p_tracking_level: trackingLevel,
        p_status_model_id: statusModelId || null,
        p_process_model_id: processModelId || null,
        p_gross_service_price: grossPriceNumber,
        p_vat_rate: vatRateNumber,
        p_valid_from: validFrom,
        p_valid_until: validUntil || null,
        p_discount_allowed: discountAllowed,
        p_minimum_margin_percent:
          minimumMargin === ''
            ? null
            : Number(minimumMargin),
        p_admin_exception_allowed: adminExceptionAllowed,
        p_commercial_mode_default: commercialMode,
      }
    )

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    const created = Array.isArray(data) ? data[0] : data

    if (!created?.product_id) {
      setError(
        'O produto foi criado, mas o identificador não foi retornado.'
      )
      setSaving(false)
      return
    }

    window.location.href = '/produtos'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando cadastro de produtos...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => {
            window.location.href = '/produtos'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para produtos
        </button>

        <div className="mb-8">
          <p className="text-sm text-slate-500 mb-2">
            Administração
          </p>

          <h1 className="text-3xl font-semibold text-slate-900">
            Novo Produto / Serviço
          </h1>

          <p className="text-slate-500 mt-2">
            Cadastre o serviço, preço e regras comerciais da Portulegal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Identificação
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Informações principais do serviço.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Código interno *
                </label>

                <input
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder="Ex.: NIF"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do serviço *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Ex.: Atribuição de NIF"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Categoria
                </label>

                <select
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value)
                    setSubcategoryId('')
                    setProcessModelId('')
                  }}
                  className="w-full rounded-lg border bg-white px-4 py-3"
                >
                  <option value="">
                    Sem categoria
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subcategoria
                </label>

                <select
                  value={subcategoryId}
                  onChange={(event) =>
                    setSubcategoryId(event.target.value)
                  }
                  disabled={!categoryId}
                  className="w-full rounded-lg border bg-white px-4 py-3 disabled:bg-slate-100"
                >
                  <option value="">
                    Sem subcategoria
                  </option>

                  {filteredSubcategories.map((subcategory) => (
                    <option
                      key={subcategory.id}
                      value={subcategory.id}
                    >
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Descrição
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Descrição interna do serviço..."
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Acompanhamento
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Defina como o serviço será acompanhado no sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <div>
                <label className="block text-sm font-medium mb-2">
  Fluxo operacional
</label>

                <select
  value={trackingLevel}
  onChange={(event) => {
    const value = event.target.value

    setTrackingLevel(value)

    if (value === 'NONE') {
      setStatusModelId('')
    }
  }}
  className="w-full rounded-lg border bg-white px-4 py-3"
>
                  <option value="NONE">
  Sem fluxo
</option>

<option value="SIMPLIFIED">
  Fluxo simples
</option>

<option value="FULL">
  Fluxo complexo
</option>
                </select>
              </div>

              <div>
  <label className="block text-sm font-medium mb-2">
    Etapas do fluxo
  </label>

  {trackingLevel === 'NONE' ? (
    <div className="w-full rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-600">
      Não iniciado → Concluído
    </div>
  ) : (
    <select
  value={statusModelId}
  onChange={async (event) => {
    const value = event.target.value

    setStatusModelId(value)

    if (value) {
      await loadWorkflowSteps(value)
    } else {
      setWorkflowSteps([])
    }
  }}
  className="w-full rounded-lg border bg-white px-4 py-3"
>
      <option value="">
        Criar novo fluxo
      </option>

      {statusModels.map((model) => (
        <option
          key={model.id}
          value={model.id}
        >
          Copiar: {model.name}
        </option>
      ))}
    </select>
  )}
</div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Modelo de processo
                </label>

                <select
                  value={processModelId}
                  onChange={(event) =>
                    setProcessModelId(event.target.value)
                  }
                  className="w-full rounded-lg border bg-white px-4 py-3"
                >
                  <option value="">
                    Sem processo
                  </option>

                  {filteredProcessModels.map((model) => (
                    <option
                      key={model.id}
                      value={model.id}
                    >
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="mt-5 rounded-xl bg-slate-50 border p-4">
              <p className="text-sm text-slate-600">
                <strong>Nenhum:</strong> serviços simples, sem acompanhamento operacional.
              </p>

              <p className="text-sm text-slate-600 mt-2">
                <strong>Simplificado:</strong> serviços com acompanhamento básico de estado.
              </p>

              <p className="text-sm text-slate-600 mt-2">
                <strong>Completo:</strong> processos com status, documentos, tarefas e histórico detalhado.
              </p>
            </div>
{trackingLevel === 'SIMPLIFIED' && statusModelId === '' && (
  <div className="mt-5 rounded-xl border p-5">
    <div className="flex items-center justify-between gap-4 mb-4">
      <div>
        <h3 className="font-semibold text-slate-900">
          Etapas do fluxo simples
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          Adicione até 5 etapas de acompanhamento. A conclusão será criada automaticamente.
        </p>
      </div>

      <button
        type="button"
        disabled={workflowSteps.length >= 5}
        onClick={() => {
          if (workflowSteps.length >= 5) return

          setWorkflowSteps([
            ...workflowSteps,
            {
              id: crypto.randomUUID(),
              name: '',
              actionType: 'NORMAL',
              actionConfig: {},
            },
          ])
        }}
        className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        + Adicionar etapa
      </button>
    </div>

    <div className="space-y-3">
      {workflowSteps.map((step, index) => (
        <div
          key={step.id}
          className="flex items-center gap-3 rounded-lg bg-slate-50 border p-3"
        >
          <div className="w-8 text-center text-sm font-semibold text-slate-500">
            {index + 1}
          </div>

          <input
            type="text"
            value={step.name}
            placeholder={`Nome da etapa ${index + 1}`}
            onChange={(event) => {
              const value = event.target.value

              setWorkflowSteps((current) =>
                current.map((currentStep) =>
                  currentStep.id === step.id
                    ? { ...currentStep, name: value }
                    : currentStep
                )
              )
            }}
            className="flex-1 rounded-lg border bg-white px-4 py-2"
          />

          <button
            type="button"
            onClick={() =>
              setWorkflowSteps((current) =>
                current.filter(
                  (currentStep) => currentStep.id !== step.id
                )
              )
            }
            className="rounded-lg border px-3 py-2 text-sm text-red-600"
          >
            Remover
          </button>
        </div>
      ))}

      {workflowSteps.length === 0 && (
        <div className="rounded-lg border border-dashed p-5 text-center text-sm text-slate-500">
          Nenhuma etapa de acompanhamento adicionada.
        </div>
      )}

      <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3">
        <div className="w-8 text-center text-sm font-semibold text-slate-500">
          {workflowSteps.length + 1}
        </div>

        <div className="flex-1 px-4 py-2 font-medium text-slate-700">
          Concluído
        </div>

        <span className="text-xs text-slate-500">
          Etapa final automática
        </span>
      </div>
    </div>
  </div>
)}
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Preço
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                O preço informado já inclui IVA.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Preço ao cliente (€) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={grossPrice}
                  onChange={(event) =>
                    setGrossPrice(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  IVA (%)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={vatRate}
                  onChange={(event) =>
                    setVatRate(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Preço válido desde
                </label>

                <input
                  type="date"
                  value={validFrom}
                  onChange={(event) =>
                    setValidFrom(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Válido até
                </label>

                <input
                  type="date"
                  value={validUntil}
                  onChange={(event) =>
                    setValidUntil(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">

              <PreviewCard
                label="Preço final"
                value={`${grossPriceNumber.toFixed(2)} €`}
              />

              <PreviewCard
                label="Base sem IVA"
                value={`${netPrice.toFixed(2)} €`}
              />

              <PreviewCard
                label="IVA"
                value={`${vatAmount.toFixed(2)} €`}
              />

            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Regras comerciais
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Modo comercial padrão
                </label>

                <select
                  value={commercialMode}
                  onChange={(event) =>
                    setCommercialMode(event.target.value)
                  }
                  className="w-full rounded-lg border bg-white px-4 py-3"
                >
                  <option value="STANDARD">
                    Padrão
                  </option>

                  <option value="COURTESY">
                    Cortesia
                  </option>

                  <option value="PARTNER_NO_FEE">
                    Parceiro sem honorários
                  </option>

                  <option value="INTERNAL">
                    Interno
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Margem mínima (%)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumMargin}
                  onChange={(event) =>
                    setMinimumMargin(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

            </div>

            <div className="mt-5 space-y-4">

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discountAllowed}
                  onChange={(event) =>
                    setDiscountAllowed(event.target.checked)
                  }
                  className="h-4 w-4"
                />

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Permitir desconto
                  </p>

                  <p className="text-xs text-slate-500">
                    O desconto continuará sujeito à margem mínima.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminExceptionAllowed}
                  onChange={(event) =>
                    setAdminExceptionAllowed(event.target.checked)
                  }
                  className="h-4 w-4"
                />

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Permitir exceção do administrador
                  </p>

                  <p className="text-xs text-slate-500">
                    Administradores podem autorizar operação abaixo da margem mínima.
                  </p>
                </div>
              </label>

            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pb-10">

            <button
              type="button"
              onClick={() => {
                window.location.href = '/produtos'
              }}
              className="rounded-lg border bg-white px-5 py-3 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving
                ? 'Salvando...'
                : 'Salvar Produto / Serviço'}
            </button>

          </div>

        </form>
      </div>
    </main>
  )
}

function PreviewCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="text-xl font-semibold text-slate-900 mt-2">
        {value}
      </p>
    </div>
  )
}