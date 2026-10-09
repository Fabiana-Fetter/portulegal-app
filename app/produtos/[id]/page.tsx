'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type Product = {
  id: string
  code: string
  name: string
  description: string | null
  tracking_level: string
  status_model_id: string | null
  process_model_id: string | null
  category_id: string | null
  is_active: boolean
}

type FeeCatalogItem = {
  id: string
  code: string
  name: string
  default_amount: number
  vat_applicable: boolean
}

type ProductFee = {
  id: string
  fee_catalog_id: string | null
  default_payer: string
  payer_can_be_changed: boolean
  first_installment_required: boolean
  generated_at_status_id: string | null
  is_active: boolean
  fee_name: string
  fee_code: string
  fee_amount: number
  status_name: string | null
}

type StatusStep = {
  id: string
  name: string
  display_order: number
  is_final: boolean
}

type StatusStepField = {
  process_field_id: string | null
  source_type: string
  field_code: string
  field_label: string
  data_type: string
  options: unknown
  is_required: boolean
  prompt_label: string | null
  error_message: string | null
  display_order: number
  input_type: string | null
}

type ProcessFieldCatalogItem = {
  id: string
  code: string
  label: string
  data_type: string
  options: unknown
}

type StatusStepRule = {
  requirement_type: string
  error_message: string | null
}

type FlowStep = StatusStep & {
  fields: StatusStepField[]
  rules: StatusStepRule[]
}

export default function ProdutoPage({ params }: PageProps) {
  const { id } = use(params)

  const [product, setProduct] = useState<Product | null>(null)
  const [catalogFees, setCatalogFees] = useState<FeeCatalogItem[]>([])
  const [productFees, setProductFees] = useState<ProductFee[]>([])
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([])
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([])

const [processFieldCatalog, setProcessFieldCatalog] = useState<ProcessFieldCatalogItem[]>([])

const [addFieldStepId, setAddFieldStepId] = useState<string | null>(null)
const [addFieldProcessFieldId, setAddFieldProcessFieldId] = useState('')
const [addFieldRequired, setAddFieldRequired] = useState(false)
const [addFieldPromptLabel, setAddFieldPromptLabel] = useState('')
const [addFieldErrorMessage, setAddFieldErrorMessage] = useState('')
const [addFieldInputType, setAddFieldInputType] = useState('text')
const [editingFieldStepId, setEditingFieldStepId] = useState<string | null>(null)
const [editingFieldCode, setEditingFieldCode] = useState<string | null>(null)

const [editingStepId, setEditingStepId] = useState<string | null>(null)
const [editingStepName, setEditingStepName] = useState('')
const [newStepName, setNewStepName] = useState('')
const [newStepPosition, setNewStepPosition] = useState('')

const [movingStepId, setMovingStepId] = useState<string | null>(null)
const [movingStepPosition, setMovingStepPosition] = useState('')

  const [selectedFeeId, setSelectedFeeId] = useState('')
  const [defaultPayer, setDefaultPayer] = useState('CLIENT')
  const [payerCanBeChanged, setPayerCanBeChanged] = useState(true)
  const [firstInstallmentRequired, setFirstInstallmentRequired] =
    useState(false)
  const [generatedAtStatusId, setGeneratedAtStatusId] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingFee, setSavingFee] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadPage()
  }, [id])

  async function loadPage() {
    setLoading(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        code,
        name,
        description,
        tracking_level,
        status_model_id,
        process_model_id,
        category_id,
        is_active
      `)
      .eq('id', id)
      .single()

    if (productError) {
      setError(productError.message)
      setLoading(false)
      return
    }

    setProduct(productData)

const { data: processFieldData, error: processFieldError } = await supabase
  .from('process_fields')
  .select(`
    id,
    code,
    label,
    data_type,
    options
  `)
  .eq('is_active', true)
  .order('label', { ascending: true })

if (processFieldError) {
  setError(processFieldError.message)
  setLoading(false)
  return
}

setProcessFieldCatalog(processFieldData ?? [])
    const { data: catalogData, error: catalogError } = await supabase
      .from('fee_catalog')
      .select(`
        id,
        code,
        name,
        default_amount,
        vat_applicable
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (catalogError) {
      setError(catalogError.message)
      setLoading(false)
      return
    }

    setCatalogFees(catalogData ?? [])

    const { data: linkData, error: linkError } = await supabase
      .from('product_fees')
      .select(`
        id,
        fee_catalog_id,
        default_payer,
        payer_can_be_changed,
        first_installment_required,
        generated_at_status_id,
        is_active
      `)
      .eq('product_id', id)
      .eq('is_active', true)

    if (linkError) {
      setError(linkError.message)
      setLoading(false)
      return
    }

        const allProductFeeIds = (linkData ?? []).map((fee) => fee.id)

    let visibleLinkData = linkData ?? []

    if (
      productData.status_model_id &&
      allProductFeeIds.length > 0
    ) {
      const {
        data: feeVersionData,
        error: feeVersionError,
      } = await supabase
        .from('product_fee_status_models')
        .select(`
          product_fee_id,
          status_model_id,
          is_active
        `)
        .in('product_fee_id', allProductFeeIds)

      if (feeVersionError) {
        setError(feeVersionError.message)
        setLoading(false)
        return
      }

      const versionedFeeIds = new Set(
        (feeVersionData ?? []).map(
          (item) => item.product_fee_id
        )
      )

      const activeCurrentVersionFeeIds = new Set(
        (feeVersionData ?? [])
          .filter(
            (item) =>
              item.status_model_id ===
                productData.status_model_id &&
              item.is_active === true
          )
          .map((item) => item.product_fee_id)
      )

      visibleLinkData = (linkData ?? []).filter(
        (fee) =>
          activeCurrentVersionFeeIds.has(fee.id) ||
          !versionedFeeIds.has(fee.id)
      )
    }

    const productFeeIds = visibleLinkData.map(
      (fee) => fee.id
    )

    let feeStatusMap = new Map<string, string>()

    if (
      productData.status_model_id &&
      productFeeIds.length > 0
    ) {
      const { data: feeStatusData, error: feeStatusError } =
        await supabase
          .from('product_fee_status_steps')
          .select(`
            product_fee_id,
            status_step_id
          `)
          .eq('status_model_id', productData.status_model_id)
          .eq('is_active', true)
          .in('product_fee_id', productFeeIds)

      if (feeStatusError) {
        setError(feeStatusError.message)
        setLoading(false)
        return
      }

      feeStatusMap = new Map(
        (feeStatusData ?? []).map((item) => [
          item.product_fee_id,
          item.status_step_id,
        ])
      )
    }

    const feeCatalogMap = new Map(
      (catalogData ?? []).map((fee) => [fee.id, fee])
    )

    let steps: StatusStep[] = []

    if (productData.status_model_id) {
      const { data: stepData, error: stepError } = await supabase
        .from('status_model_steps')
        .select(`
  id,
  name,
  display_order,
  is_final
`)
        .eq('status_model_id', productData.status_model_id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (stepError) {
        setError(stepError.message)
        setLoading(false)
        return
      }

      steps = stepData ?? []
      setStatusSteps(steps)
const flowData: FlowStep[] = []

for (const step of steps) {
  const {
    data: fieldData,
    error: fieldError,
  } = await supabase.rpc(
    'rpc_get_status_step_fields',
    {
      p_status_step_id: step.id,
    }
  )

  if (fieldError) {
    setError(fieldError.message)
    setLoading(false)
    return
  }

  const {
    data: ruleData,
    error: ruleError,
  } = await supabase
    .from('process_status_requirements')
    .select(`
      requirement_type,
      error_message
    `)
    .eq('status_step_id', step.id)
    .eq('is_active', true)
    .not(
      'requirement_type',
      'in',
      '(MODEL_FIELD,EXTERNAL_PROCESS_NUMBER,ACCESS_CODE)'
    )

  if (ruleError) {
    setError(ruleError.message)
    setLoading(false)
    return
  }

  flowData.push({
    ...step,
    fields: fieldData ?? [],
    rules: ruleData ?? [],
  })
}

setFlowSteps(flowData) 
   
} else {
  setStatusSteps([])
  setFlowSteps([])
}

    const statusMap = new Map(
      steps.map((step) => [step.id, step.name])
    )

    const normalizedLinks: ProductFee[] = visibleLinkData.map((link) => {
      const fee = link.fee_catalog_id
        ? feeCatalogMap.get(link.fee_catalog_id)
        : undefined

      return {
        id: link.id,
        fee_catalog_id: link.fee_catalog_id,
        default_payer: link.default_payer,
        payer_can_be_changed: link.payer_can_be_changed,
        first_installment_required: link.first_installment_required,
                generated_at_status_id:
          feeStatusMap.get(link.id) ??
          link.generated_at_status_id,
        is_active: link.is_active,
        fee_name: fee?.name ?? 'Taxa nÃ£o localizada',
        fee_code: fee?.code ?? 'â€”',
        fee_amount: Number(fee?.default_amount ?? 0),
        status_name: feeStatusMap.get(link.id)
          ? statusMap.get(feeStatusMap.get(link.id)!) ?? null
          : link.generated_at_status_id
            ? statusMap.get(link.generated_at_status_id) ?? null
            : null,
      }
    })

    setProductFees(normalizedLinks)
    setLoading(false)
  }

  async function handleLinkFee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFeeId) {
      setError('Selecione uma taxa.')
      return
    }

    setSavingFee(true)
    setError('')
    setSuccess('')

    const { error: rpcError } = await supabase.rpc(
      'rpc_link_fee_to_product',
      {
        p_product_id: id,
        p_fee_catalog_id: selectedFeeId,
        p_default_payer: defaultPayer,
        p_payer_can_be_changed: payerCanBeChanged,
        p_first_installment_required: firstInstallmentRequired,
        p_generated_at_status_id:
          generatedAtStatusId || null,
      }
    )

    if (rpcError) {
      setError(rpcError.message)
      setSavingFee(false)
      return
    }

    setSelectedFeeId('')
    setDefaultPayer('CLIENT')
    setPayerCanBeChanged(true)
    setFirstInstallmentRequired(false)
    setGeneratedAtStatusId('')

    setSuccess('Taxa associada ao produto com sucesso.')
    setSavingFee(false)

    await loadPage()
  }

async function handleCreateStep() {
  const name = newStepName.trim()
  const position = Number(newStepPosition)

  if (!name) {
    setError('Informe o nome da nova etapa.')
    return
  }

  if (!Number.isInteger(position) || position < 1) {
    setError('Informe uma posição válida para a nova etapa.')
    return
  }

  setError('')
  setSuccess('')

  const { error: rpcError } = await supabase.rpc(
    'rpc_create_status_step',
    {
      p_product_id: id,
      p_name: name,
      p_display_order: position,
    }
  )

  if (rpcError) {
    setError(rpcError.message)
    return
  }

  setNewStepName('')
  setNewStepPosition('')

  setSuccess('Nova etapa criada com sucesso.')

  await loadPage()
}

async function handleMoveStep(step: FlowStep) {
  const position = Number(movingStepPosition)

  if (!Number.isInteger(position) || position < 1) {
    setError('Selecione uma posição válida.')
    return
  }

  setError('')
  setSuccess('')

  const { error: rpcError } = await supabase.rpc(
    'rpc_move_status_step',
    {
      p_product_id: id,
      p_status_step_id: step.id,
      p_new_display_order: position,
    }
  )

  if (rpcError) {
    setError(rpcError.message)
    return
  }

  setMovingStepId(null)
  setMovingStepPosition('')

  setSuccess('Etapa reordenada com sucesso.')

  await loadPage()
}

function handleStartEditStep(step: FlowStep) {
  setError('')
  setSuccess('')

  setEditingStepId(step.id)
  setEditingStepName(step.name)
}

async function handleRemoveStep(step: FlowStep) {
  const confirmed = window.confirm(
    `Tem certeza que deseja remover a etapa "${step.name}" deste fluxo?`
  )

  if (!confirmed) {
    return
  }

  setError('')
  setSuccess('')

  const { error: rpcError } = await supabase.rpc(
    'rpc_remove_status_step',
    {
      p_product_id: id,
      p_status_step_id: step.id,
    }
  )

  if (rpcError) {
    setError(rpcError.message)
    return
  }

  setSuccess('Etapa removida com sucesso.')

  await loadPage()
}

async function handleSaveStepName(step: FlowStep) {
  const name = editingStepName.trim()

  if (!name) {
    setError('Informe o nome da etapa.')
    return
  }

  setError('')
  setSuccess('')

  const { error: rpcError } = await supabase.rpc(
    'rpc_update_status_step',
    {
      p_product_id: id,
      p_status_step_id: step.id,
      p_name: name,
    }
  )

  if (rpcError) {
    setError(rpcError.message)
    return
  }

  setEditingStepId(null)
  setEditingStepName('')

  setSuccess('Etapa atualizada com sucesso.')

  await loadPage()
}

async function handleAddField() {
  if (!addFieldStepId) {
    setError('Etapa não selecionada.')
    return
  }

  if (!addFieldProcessFieldId) {
    setError('Selecione um campo.')
    return
  }

  setError('')
  setSuccess('')

  const { error: rpcError } = await supabase.rpc(
    'rpc_add_field_to_status_step',
    {
      p_product_id: id,
      p_status_step_id: addFieldStepId,
      p_process_field_id: addFieldProcessFieldId,
      p_is_required: addFieldRequired,
      p_prompt_label: addFieldPromptLabel || null,
      p_error_message: addFieldErrorMessage || null,
      p_input_type: addFieldInputType || null,
    }
  )

  if (rpcError) {
    setError(rpcError.message)
    return
  }

  const wasEditing = editingFieldStepId !== null

setAddFieldStepId(null)
setAddFieldProcessFieldId('')
setAddFieldRequired(false)
setAddFieldPromptLabel('')
setAddFieldErrorMessage('')
setAddFieldInputType('text')

setEditingFieldStepId(null)
setEditingFieldCode(null)

setSuccess(
  wasEditing
    ? 'Campo atualizado com sucesso.'
    : 'Campo adicionado à etapa com sucesso.'
)

  await loadPage()
}

function handleStartEditField(
  step: FlowStep,
  field: StatusStepField
) {
  if (!field.process_field_id) {
    setError('Este campo não pode ser editado por esta operação.')
    return
  }

  setError('')
  setSuccess('')

  setEditingFieldStepId(step.id)
  setEditingFieldCode(field.field_code)

  setAddFieldStepId(step.id)
  setAddFieldProcessFieldId(field.process_field_id)
  setAddFieldRequired(field.is_required)
  setAddFieldPromptLabel(field.prompt_label || '')
  setAddFieldErrorMessage(field.error_message || '')

  if (field.input_type) {
    setAddFieldInputType(field.input_type)
  } else if (field.data_type === 'DATE') {
    setAddFieldInputType('date')
  } else {
    setAddFieldInputType('text')
  }
}

async function handleRemoveField(
  step: FlowStep,
  field: StatusStepField
) {
  if (!field.process_field_id) {
    setError('Este campo não pode ser removido por esta operação.')
    return
  }

  const confirmed = window.confirm(
    `Remover o campo "${field.prompt_label || field.field_label}" da etapa "${step.name}"?`
  )

  if (!confirmed) {
    return
  }

  setError('')
  setSuccess('')

  const { error: rpcError } = await supabase.rpc(
    'rpc_remove_field_from_status_step',
    {
      p_product_id: id,
      p_status_step_id: step.id,
      p_process_field_id: field.process_field_id,
    }
  )

  if (rpcError) {
    setError(rpcError.message)
    return
  }

  setSuccess('Campo removido da etapa com sucesso.')

  await loadPage()
}

  async function handleUnlinkFee(fee: ProductFee) {
    const confirmed = window.confirm(
      `Remover a taxa "${fee.fee_name}" deste produto?`
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    const { error: rpcError } = await supabase.rpc(
      'rpc_unlink_fee_from_product',
      {
        p_product_fee_id: fee.id,
      }
    )

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setSuccess('Taxa removida do produto com sucesso.')

    await loadPage()
  }


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando produto...
        </p>
      </main>
    )
  }

  if (error && !product) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 p-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      </main>
    )
  }

  if (!product) {
    return null
  }
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto">

        <button
          onClick={() => {
            window.location.href = '/produtos'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para produtos
        </button>

        <div className="mb-8">
          <p className="text-sm text-slate-500">
            {product.code}
          </p>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-3xl font-semibold text-slate-900">
              {product.name}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                product.is_active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {product.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <p className="text-slate-500 mt-2">
            Acompanhamento: {product.tracking_level}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
            <p className="text-sm text-emerald-700">
              {success}
            </p>
          </div>
        )}

<div className="rounded-2xl border bg-white shadow-sm mb-6">
  <div className="border-b p-5">
    <h2 className="font-semibold text-slate-900">
      Configuração do fluxo
    </h2>

    <p className="text-sm text-slate-500 mt-1">
      Etapas e campos atualmente configurados para este produto.
    </p>
  </div>

<div className="border-b bg-slate-50 p-5">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-slate-700">
        Nome da nova etapa
      </label>

      <input
        type="text"
        value={newStepName}
        onChange={(e) => setNewStepName(e.target.value)}
        placeholder="Ex.: Conferência final"
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700">
        Posição
      </label>

      <select
        value={newStepPosition}
        onChange={(e) => setNewStepPosition(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">
          Selecione...
        </option>

        {flowSteps.map((step) => (
          <option
            key={step.id}
            value={step.display_order}
          >
            Antes de {step.display_order}. {step.name}
          </option>
        ))}

        <option value={flowSteps.length + 1}>
          No final
        </option>
      </select>
    </div>
  </div>

  <div className="mt-4 flex justify-end">
    <button
      type="button"
      onClick={handleCreateStep}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      Criar etapa
    </button>
  </div>
</div>

  {flowSteps.length === 0 ? (
    <div className="p-8 text-center">
      <p className="text-sm text-slate-500">
        Nenhum fluxo configurado para este produto.
      </p>
    </div>
  ) : (
    <div className="p-5 space-y-4">
      {flowSteps.map((step) => (
        <div
          key={step.id}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
      {step.display_order}
    </div>

    <div>
  {editingStepId === step.id ? (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={editingStepName}
        onChange={(e) => setEditingStepName(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      />

      <button
        type="button"
        onClick={() => handleSaveStepName(step)}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Guardar
      </button>

      <button
        type="button"
        onClick={() => {
          setEditingStepId(null)
          setEditingStepName('')
        }}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Cancelar
      </button>
    </div>
  ) : (
    <p className="font-medium text-slate-900">
      {step.name}
    </p>
  )}

  <p className="text-xs text-slate-500">
    {step.fields.length === 0
      ? 'Nenhum campo solicitado nesta etapa.'
      : `${step.fields.length} campo(s) configurado(s).`}
  </p>
</div>
  </div>

  <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => handleStartEditStep(step)}
    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    Editar etapa
  </button>

    {!step.is_final && (
      <button
        type="button"
        onClick={() => handleRemoveStep(step)}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Remover etapa
      </button>
    )}

  <button
    type="button"
    onClick={() => {
      setMovingStepId(step.id)
      setMovingStepPosition(String(step.display_order))
    }}
    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    Mover etapa
  </button>

  <button
    type="button"
    onClick={() => setAddFieldStepId(step.id)}
    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    Adicionar campo
  </button>
</div>
  </div>

{movingStepId === step.id && (
  <div className="mt-4 ml-11 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-sm font-medium text-slate-900">
      Mover etapa
    </p>

    <p className="mt-1 text-xs text-slate-500">
      Escolha a nova posição desta etapa no fluxo.
    </p>

    <select
      value={movingStepPosition}
      onChange={(e) => setMovingStepPosition(e.target.value)}
      className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
    >
      {flowSteps
        .filter((item) => item.id !== step.id && !item.is_final)
        .map((item) => (
          <option
            key={item.id}
            value={item.display_order}
          >
            Posição {item.display_order}
          </option>
        ))}
    </select>

    <div className="mt-4 flex justify-end gap-2">
      <button
        type="button"
        onClick={() => {
          setMovingStepId(null)
          setMovingStepPosition('')
        }}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={() => handleMoveStep(step)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Guardar posição
      </button>
    </div>
  </div>
)}

  {addFieldStepId === step.id && (
    <div className="mt-4 ml-11 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-900">
        Adicionar campo à etapa
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Escolha um campo do catálogo global.
      </p>
<select
  value={addFieldProcessFieldId}
 onChange={(e) => {
  const value = e.target.value

  setAddFieldProcessFieldId(value)

  const selectedField = processFieldCatalog.find(
    (field) => field.id === value
  )

  if (selectedField?.data_type === 'DATE') {
    setAddFieldInputType('date')
  } else {
    setAddFieldInputType('text')
  }
}}
  className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
>
  <option value="">
    Selecione um campo...
  </option>

  {processFieldCatalog.map((field) => (
    <option key={field.id} value={field.id}>
      {field.label}
    </option>
     ))}
  </select>

  {addFieldProcessFieldId && (
    <div className="mt-4 space-y-4">
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={addFieldRequired}
          onChange={(e) => setAddFieldRequired(e.target.checked)}
        />
        Campo obrigatório para avançar
      </label>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Texto apresentado ao utilizador
        </label>

        <input
          type="text"
          value={addFieldPromptLabel}
          onChange={(e) => setAddFieldPromptLabel(e.target.value)}
          placeholder="Ex.: Observações da preparação"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Tipo de entrada
        </label>

        <select
          value={addFieldInputType}
          onChange={(e) => setAddFieldInputType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="text">Texto curto</option>
          <option value="textarea">Texto longo</option>
          <option value="date">Data</option>
                </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setAddFieldStepId(null)
            setAddFieldProcessFieldId('')
            setAddFieldRequired(false)
            setAddFieldPromptLabel('')
            setAddFieldErrorMessage('')
            setAddFieldInputType('text')
setEditingFieldStepId(null)
setEditingFieldCode(null)
          }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleAddField}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Guardar campo
        </button>
      </div>
    </div>
  )}

      </div>
    )}

    {step.fields.length > 0 && (
            <div className="mt-4 ml-11 space-y-2">
              {step.fields.map((field) => (
                <div
                  key={`${step.id}-${field.source_type}-${field.field_code}`}
                  className="rounded-lg bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {field.prompt_label || field.field_label}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {field.source_type === 'NATIVE_FIELD'
                          ? 'Campo nativo do processo'
                          : 'Campo global'}
                        {' · '}
                        {field.data_type}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
      field.is_required
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-200 text-slate-600'
    }`}
  >
    {field.is_required
      ? 'Obrigatório'
      : 'Opcional'}
  </span>

  {field.source_type === 'GLOBAL_FIELD' && field.process_field_id && (
    <>
      <button
        type="button"
        onClick={() => handleStartEditField(step, field)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        Editar
      </button>

      <button
        type="button"
        onClick={() => handleRemoveField(step, field)}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        Remover
      </button>
    </>
  )}
</div>
                  </div>
                </div>
              ))}
            </div>
          )}
{step.rules.length > 0 && (
  <div className="mt-4 ml-11 space-y-2">
    {step.rules.map((rule) => (
      <div
        key={`${step.id}-${rule.requirement_type}`}
        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
      >
        <p className="text-sm font-medium text-blue-900">
          Condição para avançar
        </p>

        <p className="text-sm text-blue-700 mt-1">
          {rule.requirement_type === 'FEE_PAID'
            ? 'A taxa deve estar paga ou marcada como paga externamente.'
            : rule.error_message || rule.requirement_type}
        </p>
      </div>
    ))}
  </div>
)}
        </div>
      ))}
    </div>
  )}
</div>
        <div className="rounded-2xl border bg-white shadow-sm mb-6">

          <div className="border-b p-5">
            <h2 className="font-semibold text-slate-900">
              Taxas associadas
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Taxas do catálogo central utilizadas neste produto.
            </p>
          </div>

          {productFees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                Nenhuma taxa associada.
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
                      Valor atual
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Pagador
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Fase de geração
                    </th>
<th className="px-5 py-3 text-right font-medium">
  Ações
</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {productFees.map((fee) => (
                    <tr key={fee.id}>
                      <td className="px-5 py-4 font-medium">
                        {fee.fee_code}
                      </td>

                      <td className="px-5 py-4">
                        {fee.fee_name}
                      </td>

                      <td className="px-5 py-4 text-right font-medium">
                        {fee.fee_amount.toFixed(2)} €
                      </td>

                      <td className="px-5 py-4">
                        {fee.default_payer === 'CLIENT'
                          ? 'Cliente'
                          : fee.default_payer === 'PORTULEGAL'
                          ? 'Portulegal'
                          : 'Parceiro'}
                      </td>

                      <td className="px-5 py-4">
                        {fee.status_name || 'Imediata'}
                      </td>
<td className="px-5 py-4 text-right">
  <button
    type="button"
    onClick={() => handleUnlinkFee(fee)}
    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
  >
    Remover
  </button>
</td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

        <form
          onSubmit={handleLinkFee}
          className="rounded-2xl border bg-white shadow-sm"
        >
          <div className="border-b p-5">
            <h2 className="font-semibold text-slate-900">
              Associar nova taxa
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Escolha uma taxa já cadastrada no catálogo central.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Taxa
              </label>

              <select
                value={selectedFeeId}
                onChange={(event) =>
                  setSelectedFeeId(event.target.value)
                }
                className="w-full rounded-lg border bg-white px-4 py-3"
              >
                <option value="">
                  Selecione...
                </option>

                {catalogFees
  .filter(
    (fee) =>
      !productFees.some(
        (productFee) =>
          productFee.fee_catalog_id === fee.id
      )
  )
  .map((fee) => (
    <option
      key={fee.id}
      value={fee.id}
    >
      {fee.code} — {fee.name} —{' '}
      {Number(fee.default_amount).toFixed(2)} €
    </option>
  ))}

              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pagador padrão
              </label>

              <select
                value={defaultPayer}
                onChange={(event) =>
                  setDefaultPayer(event.target.value)
                }
                className="w-full rounded-lg border bg-white px-4 py-3"
              >
                <option value="CLIENT">
                  Cliente
                </option>

                <option value="PORTULEGAL">
                  Portulegal
                </option>

                <option value="PARTNER">
                  Parceiro
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fase de geração
              </label>

              <select
                value={generatedAtStatusId}
                onChange={(event) =>
                  setGeneratedAtStatusId(event.target.value)
                }
                className="w-full rounded-lg border bg-white px-4 py-3"
              >
                <option value="">
                  Imediata / sem fase específica
                </option>

                {statusSteps.map((step) => (
                  <option
                    key={step.id}
                    value={step.id}
                  >
                    {step.display_order}. {step.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={payerCanBeChanged}
                onChange={(event) =>
                  setPayerCanBeChanged(event.target.checked)
                }
                className="mt-1"
              />

              <div>
                <p className="text-sm font-medium">
                  Permitir alterar pagador
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Permite alterar quem suporta a taxa na venda.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={firstInstallmentRequired}
                onChange={(event) =>
                  setFirstInstallmentRequired(event.target.checked)
                }
                className="mt-1"
              />

              <div>
                <p className="text-sm font-medium">
                  Exigir na primeira prestação
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  A taxa deverá integrar a primeira cobrança do cliente.
                </p>
              </div>
            </label>

          </div>

          <div className="border-t bg-slate-50 p-5 flex justify-end">
            <button
              type="submit"
              disabled={savingFee || !selectedFeeId}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {savingFee
                ? 'Associando...'
                : 'Associar Taxa'}
            </button>
          </div>
        </form>

      </div>
    </main>
  )
}