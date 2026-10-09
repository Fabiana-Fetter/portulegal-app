'use client'

import { use, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type Sale = {
  sale_id: string
  sale_number: string
  sale_date: string
  sale_status: string
  client_id: string
  client_name: string
  sold_by_user_id: string | null
  sold_by_name: string | null
  partner_id: string | null
  partner_name: string | null
  item_count: number
  gross_service_amount: number
  discount_amount: number
  gross_after_discount: number
  net_service_amount: number
  vat_amount: number
  operating_cost_amount: number
  gross_margin_amount: number
  completed_items: number
  cancelled_items: number
}

type SaleItem = {
  sale_item_id: string
  item_number: number
  payment_plan_type: string | null
  product_id: string
  status_model_id: string | null
  product_name: string
  product_code: string
  product_name_snapshot: string
  responsible_user_name: string | null
  general_status: string
  operational_status_id: string | null
  operational_status_name: string | null
process_internal_reference: string | null
  quantity: number
  gross_service_amount: number
  discount_amount: number
  gross_after_discount: number
  net_service_amount: number
  vat_amount: number
  operating_cost_amount: number
  gross_margin_amount: number
  gross_margin_percent: number
}

type SaleItemFee = {
  id: string
  sale_item_id: string
  fee_name_snapshot: string
  amount: number
  payer_type: string
  status: string
  generated_at: string | null
  paid_at: string | null
}

type SaleInstallment = {
  id: string
  sale_item_id: string | null
  installment_number: number
  expected_amount: number
  due_date: string | null
  status: string
}

type StatusStep = {
  id: string
  status_model_id: string
  name: string
  display_order: number
  general_status: string
  is_final: boolean
}

type ProductWorkflow = {
  product_id: string
  tracking_level: string
  status_model_id: string | null
}

type SaleItemHistory = {
  id: string
  entity_id: string
  event_time: string
  action: string
  old_value: {
    name?: string
    display_order?: number
    general_status?: string
  } | null
  new_value: {
    name?: string
    display_order?: number
    general_status?: string
  } | null
  reason: string | null
  user_name: string | null
}
export default function VendaPage({ params }: PageProps) {
  const { id } = use(params)

 const [sale, setSale] = useState<Sale | null>(null)
const [items, setItems] = useState<SaleItem[]>([])
const [fees, setFees] = useState<SaleItemFee[]>([])
const [statusSteps, setStatusSteps] = useState<StatusStep[]>([])
const [productWorkflows, setProductWorkflows] = useState<ProductWorkflow[]>([])
const [history, setHistory] = useState<SaleItemHistory[]>([])
const [changingStatusId, setChangingStatusId] = useState<string | null>(null)

const [paymentPlanOpen, setPaymentPlanOpen] = useState(false)

const [paymentPlanSaleItemId, setPaymentPlanSaleItemId] =
  useState<string | null>(null)

const [paymentPlanType, setPaymentPlanType] =
  useState<
    'UPFRONT' |
    'ON_COMPLETION' |
    'FIFTY_FIFTY' |
    'INSTALLMENTS'
  >('UPFRONT')

const [paymentInstallmentCount, setPaymentInstallmentCount] = useState('2')
const [paymentInstallments, setPaymentInstallments] = useState<
  {
    amount: string
    due_date: string
    due_trigger: 'IMMEDIATE' | 'FIXED_DATE' | 'ON_COMPLETION'
  }[]
>([])

const [savingPaymentPlan, setSavingPaymentPlan] = useState(false)
const [paymentPlanError, setPaymentPlanError] = useState('')

const [existingPaymentInstallments, setExistingPaymentInstallments] =
  useState<SaleInstallment[]>([])

const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [statusError, setStatusError] = useState('')

const [statusModalOpen, setStatusModalOpen] = useState(false)
const [statusModalTitle, setStatusModalTitle] = useState('')
const [statusModalLabel, setStatusModalLabel] = useState('')
const [statusModalValue, setStatusModalValue] = useState('')
const [statusModalType, setStatusModalType] = useState<'text' | 'date' | 'textarea'>('text')
const [statusModalRequired, setStatusModalRequired] = useState(true)
const statusModalResolver = useRef<
  ((value: string | null) => void) | null
>(null)
function getWorkflowForItem(item: SaleItem) {
  return productWorkflows.find(
    (workflow) => workflow.product_id === item.product_id
  )
}

function getNextStep(item: SaleItem) {
  const workflowStatusModelId = item.status_model_id

  if (!workflowStatusModelId) {
    return null
  }

  const steps = statusSteps
    .filter(
      (step) => step.status_model_id === workflowStatusModelId
    )
    .sort((a, b) => a.display_order - b.display_order)
  if (steps.length === 0) {
    return null
  }

  if (!item.operational_status_id) {
    return steps[0]
  }

  const currentIndex = steps.findIndex(
    (step) => step.id === item.operational_status_id
  )

  if (currentIndex === -1) {
    return steps[0]
  }

  return steps[currentIndex + 1] ?? null
}

function getPreviousStep(item: SaleItem) {
  const workflowStatusModelId = item.status_model_id

  if (!workflowStatusModelId) {
    return null
  }

  const steps = statusSteps
    .filter(
      (step) => step.status_model_id === workflowStatusModelId
    )
    .sort((a, b) => a.display_order - b.display_order)

  if (steps.length === 0 || !item.operational_status_id) {
    return null
  }

  const currentIndex = steps.findIndex(
    (step) => step.id === item.operational_status_id
  )

  if (currentIndex <= 0) {
    return null
  }

  return steps[currentIndex - 1]
}

async function loadFeesForItems(saleItemIds: string[]) {
  if (saleItemIds.length === 0) {
    setFees([])
    return
  }
  const { data: feeData, error: feeError } = await supabase
    .from('sale_item_fees')
    .select(`
      id,
      sale_item_id,
      fee_name_snapshot,
      amount,
      payer_type,
      status,
      generated_at,
      paid_at
    `)
    .in('sale_item_id', saleItemIds)
    .order('generated_at', { ascending: true })

  if (feeError) {
    setStatusError(feeError.message)
    return
  }

  setFees(feeData ?? [])
}
async function loadHistoryForItems(saleItemIds: string[]) {
  if (saleItemIds.length === 0) {
    setHistory([])
    return
  }

  const { data: historyData, error: historyError } = await supabase
    .from('audit_log')
    .select(`
      id,
      entity_id,
      event_time,
      action,
      old_value,
      new_value,
      reason,
      app_users (
        name
      )
    `)
    .eq('entity_type', 'SALE_ITEM')
    .in('field_name', [
      'operational_status_id',
      'general_status',
    ])
    .in('entity_id', saleItemIds)
    .order('event_time', { ascending: false })

  if (historyError) {
    setStatusError(historyError.message)
    return
  }

  const normalizedHistory: SaleItemHistory[] = (historyData ?? []).map(
    (entry: any) => ({
      id: entry.id,
      entity_id: entry.entity_id,
      event_time: entry.event_time,
      action: entry.action,
      old_value: entry.old_value,
      new_value: entry.new_value,
      reason: entry.reason,
      user_name: entry.app_users?.name ?? null,
    })
  )

  setHistory(normalizedHistory)
}
function openStatusModal({
  title,
  label,
  type = 'text',
  required = true,
  defaultValue = '',
}: {
  title: string
  label: string
  type?: 'text' | 'date' | 'textarea'
  required?: boolean
  defaultValue?: string
}) {
  setStatusModalTitle(title)
  setStatusModalLabel(label)
  setStatusModalType(type)
  setStatusModalRequired(required)
  setStatusModalValue(defaultValue)
  setStatusModalOpen(true)
}
function requestStatusInput({
  title,
  label,
  type = 'text',
  required = true,
  defaultValue = '',
}: {
  title: string
  label: string
  type?: 'text' | 'date' | 'textarea'
  required?: boolean
  defaultValue?: string
}) {
  return new Promise<string | null>((resolve) => {
    statusModalResolver.current = resolve

    openStatusModal({
      title,
      label,
      type,
      required,
      defaultValue,
    })
  })
}

function confirmStatusModal() {
  if (
    statusModalRequired &&
    !statusModalValue.trim()
  ) {
    return
  }

  const resolve = statusModalResolver.current

  statusModalResolver.current = null
  setStatusModalOpen(false)

  if (resolve) {
    resolve(statusModalValue)
  }
}

function cancelStatusModal() {
  const resolve = statusModalResolver.current

  statusModalResolver.current = null
  setStatusModalOpen(false)

  if (resolve) {
    resolve(null)
  }
}
useEffect(() => {
    async function loadSale() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data: saleData, error: saleError } = await supabase
        .from('dashboard_sales_summary')
        .select('*')
        .eq('sale_id', id)
        .single()

      if (saleError) {
        setError(saleError.message)
        setLoading(false)
        return
      }

      const { data: itemData, error: itemError } = await supabase
  .from('dashboard_service_items')
.select(`
    sale_item_id,
    item_number,
    payment_plan_type,
    product_id,
    product_name,
    product_code,
    product_name_snapshot,
    responsible_user_name,
    general_status,
    operational_status_id,
    operational_status_name,
    quantity,
    gross_service_amount,
    discount_amount,
    gross_after_discount,
    net_service_amount,
    vat_amount,
    operating_cost_amount,
    gross_margin_amount,
    gross_margin_percent
  `)
  .eq('sale_id', id)
  .order('created_at', { ascending: true })

      if (itemError) {
        setError(itemError.message)
        setLoading(false)
        return
      }

    setSale(saleData)

const { data: installmentData, error: installmentError } = await supabase
  .from('installments')
.select(`
    id,
    sale_item_id,
    installment_number,
    expected_amount,
    due_date,
    status
  `)

  .eq('sale_id', id)
  .order('installment_number', { ascending: true })

if (installmentError) {
  setError(installmentError.message)
  setLoading(false)
  return
}

setExistingPaymentInstallments(installmentData ?? [])

const currentItems = itemData ?? []

const currentSaleItemIds = currentItems.map(
  (item) => item.sale_item_id
)

let itemStatusModels: {
  id: string
  status_model_id: string | null
}[] = []

if (currentSaleItemIds.length > 0) {
  const {
    data: itemStatusModelData,
    error: itemStatusModelError,
  } = await supabase
    .from('sale_items')
    .select(`
      id,
      status_model_id
    `)
    .in('id', currentSaleItemIds)

  if (itemStatusModelError) {
    setError(itemStatusModelError.message)
    setLoading(false)
    return
  }

  itemStatusModels = itemStatusModelData ?? []
}
let processReferences: {
  sale_item_id: string
  internal_reference: string
}[] = []

if (currentSaleItemIds.length > 0) {
  const {
    data: processReferenceData,
    error: processReferenceError,
  } = await supabase
    .from('processes')
    .select(`
      sale_item_id,
      internal_reference
    `)
    .in('sale_item_id', currentSaleItemIds)

  if (processReferenceError) {
    setError(processReferenceError.message)
    setLoading(false)
    return
  }

  processReferences = processReferenceData ?? []
}

const normalizedItems: SaleItem[] = currentItems.map((item) => {
  const processReference = processReferences.find(
    (process) =>
      process.sale_item_id === item.sale_item_id
  )

const itemStatusModel = itemStatusModels.find(
  (statusItem) =>
    statusItem.id === item.sale_item_id
)
  return {
    ...item,
status_model_id: itemStatusModel?.status_model_id ?? null,
    process_internal_reference:
      processReference?.internal_reference ?? null,
  }
})

setItems(normalizedItems)

const productIds = Array.from(
  new Set((itemData ?? []).map((item) => item.product_id))
)

if (productIds.length > 0) {
  const { data: workflowData, error: workflowError } = await supabase
    .from('products')
    .select(`
      id,
      tracking_level,
      status_model_id
    `)
    .in('id', productIds)

  if (workflowError) {
    setError(workflowError.message)
    setLoading(false)
    return
  }

  const normalizedWorkflows: ProductWorkflow[] = (workflowData ?? []).map(
    (product) => ({
      product_id: product.id,
      tracking_level: product.tracking_level,
      status_model_id: product.status_model_id,
    })
  )

  setProductWorkflows(normalizedWorkflows)

  const statusModelIds = Array.from(
  new Set(
    normalizedItems
      .map((item) => item.status_model_id)
      .filter((value): value is string => Boolean(value))
  )
)

  if (statusModelIds.length > 0) {
    const { data: stepsData, error: stepsError } = await supabase
      .from('status_model_steps')
      .select(`
        id,
        status_model_id,
        name,
        display_order,
        general_status,
        is_final
      `)
      .in('status_model_id', statusModelIds)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (stepsError) {
      setError(stepsError.message)
      setLoading(false)
      return
    }

    setStatusSteps(stepsData ?? [])
  }
}
const saleItemIds = (itemData ?? []).map(
  (item) => item.sale_item_id
)

await loadFeesForItems(saleItemIds)
await loadHistoryForItems(saleItemIds)

setLoading(false)
    }

    loadSale()
  }, [id])

function preparePaymentInstallments(
  count?: number,
  planType = paymentPlanType
) {
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]

  const serviceAmount = paymentPlanServiceAmount
  const feesAmount = collectibleClientFeeTotal

  /*
    PAGAMENTO ANTECIPADO

    Cobra imediatamente:
    - honorários do serviço
    - taxas do cliente ainda EXPECTED
  */
  if (planType === 'UPFRONT') {
    setPaymentInstallments([
      {
        amount: (serviceAmount + feesAmount).toFixed(2),
        due_date: todayString,
        due_trigger: 'IMMEDIATE',
      },
    ])

    return
  }

  /*
    PAGAMENTO APÓS CONCLUSÃO

    Se houver taxa oficial:
    - taxa é cobrada imediatamente
    - honorários ficam para a conclusão

    Se não houver taxa:
    - todo o valor fica para a conclusão
  */
  if (planType === 'ON_COMPLETION') {
    if (feesAmount > 0) {
      setPaymentInstallments([
        {
          amount: feesAmount.toFixed(2),
          due_date: todayString,
          due_trigger: 'IMMEDIATE',
        },
        {
          amount: serviceAmount.toFixed(2),
          due_date: '',
          due_trigger: 'ON_COMPLETION',
        },
      ])
    } else {
      setPaymentInstallments([
        {
          amount: serviceAmount.toFixed(2),
          due_date: '',
          due_trigger: 'ON_COMPLETION',
        },
      ])
    }

    return
  }

  /*
    50% / 50%

    Primeira cobrança:
    - 50% dos honorários
    - 100% das taxas

    Segunda cobrança:
    - restantes 50% dos honorários
    - vencimento na conclusão
  */
  if (planType === 'FIFTY_FIFTY') {
    const firstHalf =
      Math.round((serviceAmount / 2) * 100) / 100

    const secondHalf =
      Math.round((serviceAmount - firstHalf) * 100) / 100

    setPaymentInstallments([
      {
        amount: (firstHalf + feesAmount).toFixed(2),
        due_date: todayString,
        due_trigger: 'IMMEDIATE',
      },
      {
        amount: secondHalf.toFixed(2),
        due_date: '',
        due_trigger: 'ON_COMPLETION',
      },
    ])

    return
  }

  /*
    PARCELADO

    Neste caso a utilizadora define:
    - quantidade de parcelas
    - valores
    - datas

    A primeira parcela é imediata.
    As seguintes têm data fixa.
  */
  const installmentCount =
    count ?? Number(paymentInstallmentCount)

  if (!installmentCount || installmentCount < 1) {
    setPaymentInstallments([])
    return
  }

  const drafts = Array.from(
    { length: installmentCount },
    (_, index) => {
      const dueDate = new Date(today)

      dueDate.setDate(
        today.getDate() + index * 30
      )

      return {
        amount: '',
        due_date:
          dueDate.toISOString().split('T')[0],
        due_trigger:
          index === 0
            ? ('IMMEDIATE' as const)
            : ('FIXED_DATE' as const),
      }
    }
  )

  setPaymentInstallments(drafts)
}

async function handleSavePaymentPlan() {
  if (
    !sale ||
    !paymentPlanSaleItemId ||
    !paymentPlanIsValid
  ) {
    return
  }

  setSavingPaymentPlan(true)
  setPaymentPlanError('')

  const installmentsPayload = paymentInstallments.map(
    (installment) => ({
      amount: Number(installment.amount),
      due_date:
        installment.due_trigger === 'ON_COMPLETION'
          ? null
          : installment.due_date,
      due_trigger: installment.due_trigger,
    })
  )

  const { error: savePaymentPlanError } =
    await supabase.rpc(
      'rpc_create_sale_item_payment_plan',
      {
        p_sale_item_id: paymentPlanSaleItemId,
        p_payment_plan_type: paymentPlanType,
        p_installments: installmentsPayload,
      }
    )

  if (savePaymentPlanError) {
    setPaymentPlanError(savePaymentPlanError.message)
    setSavingPaymentPlan(false)
    return
  }

  /*
    Recarrega todas as parcelas da venda.

    Mantemos todas no estado porque cada serviço
    filtra depois as suas próprias parcelas através
    de sale_item_id.
  */
  const {
    data: createdInstallments,
    error: reloadInstallmentsError,
  } = await supabase
    .from('installments')
    .select(`
      id,
      sale_item_id,
      installment_number,
      expected_amount,
      due_date,
      status
    `)
    .eq('sale_id', sale.sale_id)
    .order('installment_number', { ascending: true })

  if (reloadInstallmentsError) {
    setPaymentPlanError(
      reloadInstallmentsError.message
    )
    setSavingPaymentPlan(false)
    return
  }

  setExistingPaymentInstallments(
    createdInstallments ?? []
  )

  /*
    Atualiza também o payment_plan_type do serviço
    no estado local, para a interface refletir
    imediatamente a modalidade gravada.
  */
  setItems((currentItems) =>
    currentItems.map((item) =>
      item.sale_item_id === paymentPlanSaleItemId
        ? {
            ...item,
            payment_plan_type: paymentPlanType,
          }
        : item
    )
  )

  setPaymentInstallments([])
  setSavingPaymentPlan(false)
}


async function handleMarkFeePaidExternally(fee: SaleItemFee) {
  const confirmed = window.confirm(
`Confirma que a taxa "${fee.fee_name_snapshot}" no valor de ${Number(
  fee.amount
).toFixed(2)} € foi paga externamente, sem saída financeira da Portulegal?`
  )

  if (!confirmed) {
    return
  }

  setStatusError('')

  const { error: feeError } = await supabase.rpc(
    'rpc_mark_fee_paid_externally',
    {
      p_sale_item_fee_id: fee.id,
      p_paid_at: new Date().toISOString(),
    }
  )

  if (feeError) {
    setStatusError(feeError.message)
    return
  }

  setFees((currentFees) =>
    currentFees.map((currentFee) =>
      currentFee.id === fee.id
        ? {
            ...currentFee,
            status: 'PAID_EXTERNALLY',
            paid_at: new Date().toISOString(),
          }
        : currentFee
    )
  )
}

async function handlePayFeeByPortulegal(fee: SaleItemFee) {
  const confirmed = window.confirm(
    `Confirma que a taxa "${fee.fee_name_snapshot}" no valor de ${Number(
      fee.amount
    ).toFixed(2)} € será paga pela Portulegal?`
  )

  if (!confirmed) {
    return
  }

  setStatusError('')

  const { error: responsibilityError } = await supabase.rpc(
    'rpc_set_fee_payment_responsibility',
    {
      p_sale_item_fee_id: fee.id,
      p_payment_responsibility: 'PORTULEGAL',
    }
  )

  if (responsibilityError) {
    setStatusError(responsibilityError.message)
    return
  }

  /*
   * Recarrega as taxas para que a interface
   * reflita imediatamente a nova definição.
   */
  await loadFeesForItems(
    items.map((item) => item.sale_item_id)
  )
}

async function handleCancelSaleItem(item: SaleItem) {
  const reason = await requestStatusInput({
    title: 'Cancelar serviço',
    label: 'Motivo do cancelamento',
    type: 'textarea',
    required: true,
  })

  if (reason === null) {
    return
  }

  if (!reason.trim()) {
    setStatusError('Informe o motivo do cancelamento.')
    return
  }

  setChangingStatusId(item.sale_item_id)
  setStatusError('')

  const { error: cancelError } = await supabase.rpc(
    'rpc_cancel_sale_item',
    {
      p_sale_item_id: item.sale_item_id,
      p_reason: reason.trim(),
    }
  )

  if (cancelError) {
    setStatusError(cancelError.message)
    setChangingStatusId(null)
    return
  }

  setItems((currentItems) =>
    currentItems.map((currentItem) =>
      currentItem.sale_item_id === item.sale_item_id
        ? {
            ...currentItem,
            general_status: 'CANCELLED',
          }
        : currentItem
    )
  )

  await loadFeesForItems(
    items.map((currentItem) => currentItem.sale_item_id)
  )

  await loadHistoryForItems(
    items.map((currentItem) => currentItem.sale_item_id)
  )

  setChangingStatusId(null)
}

async function handleAdvanceStatus(
  item: SaleItem,
  nextStep: StatusStep
) {

console.log('HANDLE ADVANCE CHAMADO', {
  saleItem: item.sale_item_id,
  stepId: nextStep.id,
  stepName: nextStep.name,
})

  if (!nextStep) {
    return
  }

  setChangingStatusId(item.sale_item_id)
  setStatusError('')

  const {
    data: processData,
    error: processError,
  } = await supabase
    .from('processes')
    .select('id')
    .eq('sale_item_id', item.sale_item_id)
    .maybeSingle()

  if (processError) {
    setStatusError(processError.message)
    setChangingStatusId(null)
    return
  }

  const {
    data: stepFields,
    error: stepFieldsError,
  } = await supabase.rpc(
    'rpc_get_status_step_fields',
    {
      p_status_step_id: nextStep.id,
    }
  )

  if (stepFieldsError) {
    setStatusError(stepFieldsError.message)
    setChangingStatusId(null)
    return
  }

  if (stepFields && stepFields.length > 0) {
    if (!processData) {
      setStatusError('Processo não encontrado.')
      setChangingStatusId(null)
      return
    }
console.log('STEP FIELDS RECEBIDOS', stepFields)
    for (const field of stepFields) {
      let inputType: 'text' | 'date' | 'textarea' =
  field.input_type || 'text'

if (!field.input_type && field.data_type === 'DATE') {
  inputType = 'date'
}

      const value = await requestStatusInput({
        title: `Avançar para ${nextStep.name}`,
        label: field.prompt_label || field.field_label,
        type: inputType,
        required: field.is_required,
      })

      if (value === null) {
        setChangingStatusId(null)
        return
      }

      if (field.is_required && !value.trim()) {
        setStatusError(
          field.error_message ||
            `Para avançar para ${nextStep.name}, informe ${field.field_label}.`
        )
        setChangingStatusId(null)
        return
      }

      if (value.trim()) {
  let fieldError = null

  if (field.source_type === 'NATIVE_FIELD') {
    const { error } = await supabase.rpc(
      'rpc_set_process_native_text_field',
      {
        p_process_id: processData.id,
        p_field_code: field.field_code,
        p_value: value.trim(),
      }
    )

    fieldError = error
  } else {
    const { error } = await supabase.rpc(
      'rpc_set_process_field_value',
      {
        p_process_id: processData.id,
        p_field_code: field.field_code,
        p_value_text:
          field.data_type === 'TEXT'
            ? value.trim()
            : null,
        p_value_date:
          field.data_type === 'DATE'
            ? value.trim()
            : null,
        p_value_number: null,
        p_value_boolean: null,
      }
    )

    fieldError = error
  }

  if (fieldError) {
    setStatusError(fieldError.message)
    setChangingStatusId(null)
    return
  }
}
    }
  }

  
    const { error } = await supabase.rpc(
    'rpc_change_service_status',
    {
      p_sale_item_id: item.sale_item_id,
      p_status_id: nextStep.id,
    }
  )

  if (error) {
    setStatusError(error.message)
    setChangingStatusId(null)
    return
  }

  setItems((currentItems) =>
    currentItems.map((currentItem) =>
      currentItem.sale_item_id === item.sale_item_id
        ? {
            ...currentItem,
            operational_status_id: nextStep.id,
            operational_status_name: nextStep.name,
            general_status: nextStep.general_status,
          }
        : currentItem
    )
  )
await loadFeesForItems(
  items.map((currentItem) => currentItem.sale_item_id)
)

await loadHistoryForItems(
  items.map((currentItem) => currentItem.sale_item_id)
)

setChangingStatusId(null)
}

async function handlePreviousStatus(item: SaleItem) {  const previousStep = getPreviousStep(item)

  if (!previousStep) {
    return
  }

  setChangingStatusId(item.sale_item_id)
  setStatusError('')

  const { error } = await supabase.rpc(
    'rpc_change_service_status',
    {
      p_sale_item_id: item.sale_item_id,
      p_status_id: previousStep.id,
    }
  )

  if (error) {
    setStatusError(error.message)
    setChangingStatusId(null)
    return
  }

    setItems((currentItems) =>
    currentItems.map((currentItem) =>
      currentItem.sale_item_id === item.sale_item_id
        ? {
            ...currentItem,
            operational_status_id: previousStep.id,
            operational_status_name: previousStep.name,
            general_status: previousStep.general_status,
          }
        : currentItem
    )
  )

  await loadFeesForItems(
    items.map((currentItem) => currentItem.sale_item_id)
  )

  await loadHistoryForItems(
    items.map((currentItem) => currentItem.sale_item_id)
  )

  setChangingStatusId(null)
}
const clientFeeTotal = fees
  .filter((fee) => {
    const saleItem = items.find(
      (item) => item.sale_item_id === fee.sale_item_id
    )

    return (
      fee.payer_type === 'CLIENT' &&
      fee.status !== 'CANCELLED' &&
      saleItem?.general_status !== 'CANCELLED'
    )
  })
  .reduce(
    (total, fee) => total + Number(fee.amount || 0),
    0
  )

const estimatedClientTotal =
  Number(sale?.gross_after_discount || 0) +
  clientFeeTotal

const paymentPlanSaleItem = items.find(
  (item) => item.sale_item_id === paymentPlanSaleItemId
)

const collectibleClientFeeTotal = fees
  .filter(
    (fee) =>
      fee.sale_item_id === paymentPlanSaleItemId &&
      fee.payer_type === 'CLIENT' &&
      fee.status === 'EXPECTED'
  )
  .reduce(
    (total, fee) => total + Number(fee.amount || 0),
    0
  )

const paymentPlanServiceAmount =
  Number(paymentPlanSaleItem?.gross_after_discount || 0)

const paymentPlanTotal =
  paymentPlanServiceAmount +
  collectibleClientFeeTotal

const paymentInstallmentsTotal = paymentInstallments.reduce(
  (total, installment) =>
    total + Number(installment.amount || 0),
  0
)

const paymentPlanDifference =
  paymentPlanTotal - paymentInstallmentsTotal

const firstPaymentInstallmentAmount =
  Number(paymentInstallments[0]?.amount || 0)

const firstPaymentInstallmentCoversFees =
  firstPaymentInstallmentAmount >= collectibleClientFeeTotal

const paymentPlanIsValid =
  paymentInstallments.length > 0 &&
  paymentInstallments.every(
    (installment) =>
      Number(installment.amount || 0) > 0 &&
      (
        installment.due_trigger === 'ON_COMPLETION' ||
        Boolean(installment.due_date)
      )
  ) &&
  Math.abs(paymentPlanDifference) < 0.01 &&
  firstPaymentInstallmentCoversFees

function getInstallmentsForSaleItem(saleItemId: string) {
  return existingPaymentInstallments.filter(
    (installment) =>
      installment.sale_item_id === saleItemId
  )
}

function openPaymentPlanForItem(item: SaleItem) {
  const itemInstallments =
    getInstallmentsForSaleItem(item.sale_item_id)

  /*
    Se clicarmos no mesmo serviço que já está aberto,
    apenas fechamos o painel.
  */
  if (
    paymentPlanOpen &&
    paymentPlanSaleItemId === item.sale_item_id
  ) {
    setPaymentPlanOpen(false)
    return
  }

  /*
    Seleciona o serviço cujo plano queremos visualizar
    ou configurar.
  */
  setPaymentPlanSaleItemId(item.sale_item_id)

  /*
    Recupera a modalidade já gravada no serviço.
    Serviços antigos podem ainda estar sem modalidade.
  */
  const existingPlanType =
    item.payment_plan_type === 'UPFRONT' ||
    item.payment_plan_type === 'ON_COMPLETION' ||
    item.payment_plan_type === 'FIFTY_FIFTY' ||
    item.payment_plan_type === 'INSTALLMENTS'
      ? item.payment_plan_type
      : 'UPFRONT'

  setPaymentPlanType(existingPlanType)
  setPaymentPlanError('')

  /*
    Se o serviço ainda não possui parcelas,
    limpamos os rascunhos.

    A geração do novo plano será feita depois
    que o serviço selecionado estiver no estado.
  */
  if (itemInstallments.length === 0) {
    setPaymentInstallments([])
  }

  setPaymentPlanOpen(true)
}



  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Carregando venda...</p>
      </main>
    )
  }

  if (error || !sale) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 p-8">
        <div className="max-w-lg w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Não foi possível abrir a venda
          </h1>

          <p className="text-red-600 text-sm mt-3">
            {error || 'Venda não encontrada.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
{statusError && (
  <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-amber-900">
          Não foi possível alterar a fase
        </p>

        <p className="text-sm text-amber-800 mt-1">
          {statusError}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setStatusError('')}
        className="text-sm text-amber-700 hover:text-amber-900"
      >
        Fechar
      </button>
    </div>
  </div>
)}
        <button
          onClick={() => {
            window.location.href = `/clientes/${sale.client_id}`
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para cliente
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-sm text-slate-500">
              Venda
            </p>

            <h1 className="text-3xl font-semibold text-slate-900 mt-1">
              {sale.sale_number}
            </h1>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-slate-500">
              <span>{sale.client_name}</span>

              <span>
                {new Date(sale.sale_date).toLocaleDateString('pt-PT')}
              </span>

              <span>
                {sale.sale_status}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href = `/vendas/${sale.sale_id}/adicionar-servico`
            }}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Adicionar Serviço
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
  <SummaryCard
    label="Serviços"
    value={sale.item_count}
  />

  <SummaryCard
    label="Honorários c/ IVA"
    value={`${Number(
      sale.gross_after_discount || 0
    ).toFixed(2)} €`}
  />

  <SummaryCard
    label="IVA incluído"
    value={`${Number(
      sale.vat_amount || 0
    ).toFixed(2)} €`}
  />

  <SummaryCard
    label="Taxas do cliente"
    value={`${clientFeeTotal.toFixed(2)} €`}
  />

  <SummaryCard
    label="Total previsto ao cliente"
    value={`${estimatedClientTotal.toFixed(2)} €`}
  />

  <SummaryCard
    label="Margem"
    value={`${Number(
      sale.gross_margin_amount || 0
    ).toFixed(2)} €`}
  />
</div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold text-slate-900">
              Serviços da venda
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Serviços e produtos contratados pelo cliente.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-900">
                Nenhum serviço adicionado
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Clique em “Adicionar Serviço” para incluir o primeiro serviço desta venda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      Serviço
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Estado
                    </th>

<th className="px-5 py-3 text-left font-medium">
  Próxima ação
</th>
                    <th className="px-5 py-3 text-left font-medium">
                      Responsável
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Honorários
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      IVA
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                 {items
  .filter((item) => item.general_status !== 'CANCELLED')
  .map((item) => (
                    <tr
                      key={item.sale_item_id}
                      className="hover:bg-slate-50"
                    >
                     <td className="px-5 py-4">
<p className="font-medium text-slate-900">
  {item.product_name_snapshot}
</p>

<p className="text-xs text-slate-500 mt-1">
  {sale.sale_number}.{item.item_number}
  {' · '}
  {item.product_code}
</p>

{item.process_internal_reference && (
  <p className="text-xs text-slate-500 mt-1">
    Processo interno: {item.process_internal_reference}
  </p>
)}
  <ServiceFlow
    item={item}
    statusSteps={statusSteps}
    productWorkflows={productWorkflows}
  />

{fees
  .filter((fee) => fee.sale_item_id === item.sale_item_id)
  .map((fee) => (
    <div
      key={fee.id}
      className="mt-4 rounded-xl border bg-slate-50 p-4"
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Taxa
          </p>

          <p className="text-sm font-medium text-slate-900 mt-1">
            {fee.fee_name_snapshot}
          </p>

          <p className="text-lg font-semibold text-slate-900 mt-1">
            {Number(fee.amount).toFixed(2)} €
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium">
            {fee.status === 'EXPECTED'
              ? 'Prevista'
              : fee.status === 'GENERATED'
              ? 'Gerada'
              : fee.status === 'PAID'
              ? 'Paga'
              : fee.status === 'PAID_EXTERNALLY'
              ? 'Paga externamente'
              : fee.status === 'CANCELLED'
              ? 'Cancelada'
              : fee.status}
          </span>

	<span className="text-xs text-slate-500">
 	  Responsável pela taxa:{' '}
 	  {fee.payer_type === 'CLIENT'
  	  ? 'Cliente'
  	  : fee.payer_type === 'PORTULEGAL'
  	  ? 'Portulegal'
  	  : fee.payer_type === 'PARTNER'
  	  ? 'Cliente'
  	  : fee.payer_type}
	</span>
        </div>

{fee.status === 'GENERATED' && (
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => handleMarkFeePaidExternally(fee)}
      className="rounded-lg border bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100"
    >
      Paga pelo Cliente
    </button>

    <button
      type="button"
      onClick={() => handlePayFeeByPortulegal(fee)}
      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
    >
      Paga pela Portulegal
    </button>
  </div>
)}

        {fee.paid_at && (
          <p className="text-xs text-slate-500">
            Pago em:{' '}
            {new Date(fee.paid_at).toLocaleDateString('pt-PT')}
          </p>
        )}
      </div>
    </div>
  ))}
{(() => {
  const itemClientFeeTotal = fees
    .filter(
      (fee) =>
        fee.sale_item_id === item.sale_item_id &&
        fee.payer_type === 'CLIENT' &&
        fee.status !== 'CANCELLED'
    )
    .reduce(
      (total, fee) => total + Number(fee.amount || 0),
      0
    )

  const itemEstimatedTotal =
    Number(item.gross_after_discount || 0) +
    itemClientFeeTotal

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border bg-white p-4">

      <div>
        <p className="text-xs text-slate-400">
          Honorários c/ IVA
        </p>

        <p className="text-sm font-semibold text-slate-900 mt-1 whitespace-nowrap">
          {Number(
            item.gross_after_discount || 0
          ).toFixed(2)} €
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Taxas do cliente
        </p>

        <p className="text-sm font-semibold text-slate-900 mt-1 whitespace-nowrap">
          {itemClientFeeTotal.toFixed(2)} €
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Total previsto
        </p>

        <p className="text-sm font-semibold text-slate-900 mt-1 whitespace-nowrap">
          {itemEstimatedTotal.toFixed(2)} €
        </p>
      </div>

    </div>
  )
})()}

{(() => {
  const itemInstallments =
    getInstallmentsForSaleItem(item.sale_item_id)

  const isThisPaymentPlanOpen =
    paymentPlanOpen &&
    paymentPlanSaleItemId === item.sale_item_id

  const paymentPlanLabel =
    item.payment_plan_type === 'UPFRONT'
      ? 'Antecipado'
      : item.payment_plan_type === 'ON_COMPLETION'
        ? 'Após conclusão'
        : item.payment_plan_type === 'FIFTY_FIFTY'
          ? '50% / 50%'
          : item.payment_plan_type === 'INSTALLMENTS'
            ? 'Parcelado'
            : itemInstallments.length > 0
              ? 'Plano existente'
              : 'Não definido'

  return (
    <div className="mt-4 rounded-xl border bg-slate-50 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Pagamento
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {paymentPlanLabel}
          </p>

          {itemInstallments.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {itemInstallments.length}{' '}
              {itemInstallments.length === 1
                ? 'parcela'
                : 'parcelas'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => openPaymentPlanForItem(item)}
          className="w-fit rounded-lg border bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100"
        >
          {isThisPaymentPlanOpen
            ? 'Fechar'
            : itemInstallments.length > 0
              ? 'Ver plano'
              : 'Definir plano'}
        </button>
      </div>

      {itemInstallments.length > 0 && (
        <div className="mt-3 space-y-2">
          {itemInstallments.map((installment) => (
            <div
              key={installment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2"
            >
              <span className="text-xs text-slate-600">
                P{installment.installment_number}
              </span>

              <span className="text-xs font-semibold text-slate-900">
                {Number(
                  installment.expected_amount || 0
                ).toFixed(2)} €
              </span>

              <span className="text-xs text-slate-500">
                {installment.due_date ?? 'Conclusão'}
              </span>

              <span className="text-xs text-slate-500">
                {installment.status === 'PAID'
                  ? 'Pago'
                  : installment.status === 'PARTIALLY_PAID'
                    ? 'Parcialmente pago'
                    : installment.status === 'OVERDUE'
                      ? 'Em atraso'
                      : installment.status === 'CANCELLED'
                        ? 'Cancelado'
                        : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      )}

      {isThisPaymentPlanOpen &&
        itemInstallments.length === 0 && (
          <div className="mt-4 border-t pt-4">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Modalidade
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    value: 'UPFRONT',
                    label: 'Antecipado',
                  },
                  {
                    value: 'ON_COMPLETION',
                    label: 'Após conclusão',
                  },
                  {
                    value: 'FIFTY_FIFTY',
                    label: '50% / 50%',
                  },
                  {
                    value: 'INSTALLMENTS',
                    label: 'Parcelado',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const nextType =
                        option.value as
                          | 'UPFRONT'
                          | 'ON_COMPLETION'
                          | 'FIFTY_FIFTY'
                          | 'INSTALLMENTS'

                      setPaymentPlanType(nextType)

if (nextType === 'INSTALLMENTS') {
  const count = Number(paymentInstallmentCount)

  if (count > 0) {
    preparePaymentInstallments(
      count,
      'INSTALLMENTS'
    )
  } else {
    setPaymentInstallments([])
  }

  return
}

                      /*
                        O serviço já está selecionado neste momento.
                        Como este clique ocorre depois da abertura
                        do painel, os valores financeiros do serviço
                        já foram recalculados.
                      */
                      preparePaymentInstallments(
                        undefined,
                        nextType
                      )
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium text-left ${
                      paymentPlanType === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentPlanType === 'INSTALLMENTS' && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de parcelas
                </label>

                <input
                  type="number"
                  min="1"
                  value={paymentInstallmentCount}
                  onChange={(event) => {
                    const value = event.target.value

                    setPaymentInstallmentCount(value)

                    const count = Number(value)

                    if (count > 0) {
                      preparePaymentInstallments(
                        count,
                        'INSTALLMENTS'
                      )
                    } else {
                      setPaymentInstallments([])
                    }
                  }}
                  className="w-full max-w-xs rounded-lg border bg-white px-3 py-2"
                />
              </div>
            )}

            {paymentInstallments.length > 0 && (
              <>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-white p-3">
                    <p className="text-xs text-slate-500">
                      Total deste serviço
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {paymentPlanTotal.toFixed(2)} €
                    </p>
                  </div>

                  <div className="rounded-lg border bg-white p-3">
                    <p className="text-xs text-slate-500">
                      Taxas incluídas
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {collectibleClientFeeTotal.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {paymentInstallments.map(
                    (installment, index) => (
                      <div
                        key={index}
                        className="rounded-lg border bg-white p-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Parcela {index + 1} — Valor
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={installment.amount}
                              onChange={(event) => {
                                const drafts = [
                                  ...paymentInstallments,
                                ]

                                drafts[index] = {
                                  ...drafts[index],
                                  amount: event.target.value,
                                }

                                setPaymentInstallments(
                                  drafts
                                )
                              }}
                              className="w-full rounded-lg border px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Vencimento
                            </label>

                            {installment.due_trigger ===
                            'ON_COMPLETION' ? (
                              <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                Na conclusão do serviço
                              </div>
                            ) : installment.due_trigger ===
                              'IMMEDIATE' ? (
                              <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                Imediato
                              </div>
                            ) : (
                              <input
                                type="date"
                                value={
                                  installment.due_date
                                }
                                onChange={(event) => {
                                  const drafts = [
                                    ...paymentInstallments,
                                  ]

                                  drafts[index] = {
                                    ...drafts[index],
                                    due_date:
                                      event.target.value,
                                  }

                                  setPaymentInstallments(
                                    drafts
                                  )
                                }}
                                className="w-full rounded-lg border px-3 py-2"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-4 rounded-lg border bg-white p-3">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-600">
                      Total das parcelas
                    </span>

                    <span className="font-semibold">
                      {paymentInstallmentsTotal.toFixed(2)} €
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between gap-4 text-sm">
                    <span className="text-slate-600">
                      {paymentPlanDifference >= 0
                        ? 'Falta distribuir'
                        : 'Excesso'}
                    </span>

                    <span className="font-semibold">
                      {Math.abs(
                        paymentPlanDifference
                      ).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {collectibleClientFeeTotal > 0 &&
                  firstPaymentInstallmentAmount > 0 &&
                  !firstPaymentInstallmentCoversFees && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-700">
                        A 1.ª parcela deve ser de pelo
                        menos{' '}
                        {collectibleClientFeeTotal.toFixed(
                          2
                        )}{' '}
                        € para cobrir as taxas.
                      </p>
                    </div>
                  )}

                {paymentPlanError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-700">
                      {paymentPlanError}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePaymentPlan}
                    disabled={
                      !paymentPlanIsValid ||
                      savingPaymentPlan
                    }
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingPaymentPlan
                      ? 'A guardar...'
                      : 'Guardar plano'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
    </div>
  )
})()}

</td>


                      <td className="px-5 py-4">
  <div>
    <p className="font-medium text-slate-900">
      {item.operational_status_name || item.general_status}
    </p>

    <p className="text-xs text-slate-500 mt-1">
      Fase atual
    </p>
  </div>
</td>

<td className="px-5 py-4">
  {(() => {
    const previousStep = getPreviousStep(item)
    const nextStep = getNextStep(item)

    return (
      <div className="flex flex-col gap-2 min-w-52">

  {nextStep ? (
    <button
      type="button"
      onClick={() => handleAdvanceStatus(item, nextStep)}
      disabled={changingStatusId === item.sale_item_id}
      className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
    >
      {changingStatusId === item.sale_item_id
        ? 'Atualizando...'
        : `Avançar para ${nextStep.name} →`}
    </button>
  ) : (
    <span className="text-sm text-emerald-700 font-medium">
      Concluído
    </span>
  )}

  {previousStep && (
    <button
      type="button"
      onClick={() => handlePreviousStatus(item)}
      disabled={changingStatusId === item.sale_item_id}
      className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
    >
      {changingStatusId === item.sale_item_id
        ? 'Atualizando...'
        : `← Voltar para ${previousStep.name}`}
    </button>
  )}
  

  {item.general_status !== 'COMPLETED' &&
    item.general_status !== 'CANCELLED' && (
      <button
        type="button"
        onClick={() => handleCancelSaleItem(item)}
        disabled={changingStatusId === item.sale_item_id}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Cancelar serviço
      </button>
    )}

</div>
          
    )
  })()}
</td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.responsible_user_name || '—'}
                      </td>

                      <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
  {Number(item.gross_after_discount || 0).toFixed(2)} €
</td>

                     <td className="px-5 py-4 text-right text-slate-600 whitespace-nowrap">
  {Number(item.vat_amount || 0).toFixed(2)} €
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                    )}
        </div>

        <div className="rounded-2xl border bg-white shadow-sm mt-6 overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold text-slate-900">
              Histórico dos serviços
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Alterações de fase realizadas nos serviços desta venda.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                Nenhuma alteração de fase registrada.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {history.map((entry) => {
                const item = items.find(
                  (saleItem) => saleItem.sale_item_id === entry.entity_id
                )

           const isCancellation = entry.action === 'CANCEL'

return (
  <div
    key={entry.id}
    className={
      isCancellation
        ? 'p-5 bg-red-50'
        : 'p-5'
    }
  >
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
      <div>
        <p
          className={
            isCancellation
              ? 'font-medium text-red-800'
              : 'font-medium text-slate-900'
          }
        >
          {item?.product_name_snapshot || 'Serviço'}
        </p>

        {isCancellation ? (
          <>
            <p className="text-sm font-semibold text-red-700 mt-1">
              Serviço cancelado
            </p>

            <p className="text-sm text-red-700 mt-2">
              Motivo: {entry.reason || 'Motivo não informado'}
            </p>

            {entry.user_name && (
              <p className="text-xs text-red-600 mt-2">
                Cancelado por {entry.user_name}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600 mt-1">
              {entry.old_value?.name || 'Sem fase'}
              {' → '}
              <span className="font-medium">
                {entry.new_value?.name || 'Sem fase'}
              </span>
            </p>

            <p className="text-xs text-slate-500 mt-2">
              {entry.reason || 'Alteração de fase'}
              {entry.user_name
                ? ` · ${entry.user_name}`
                : ''}
            </p>
          </>
        )}
      </div>

      <p
        className={
          isCancellation
            ? 'text-xs text-red-500 whitespace-nowrap'
            : 'text-xs text-slate-400 whitespace-nowrap'
        }
      >
        {new Date(entry.event_time).toLocaleString('pt-PT')}
      </p>
        </div>
  </div>
)
              })}
            </div>
          )}
        </div>

        {statusModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

              <div className="border-b p-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  {statusModalTitle}
                </h2>
              </div>

              <div className="p-5">
                <label className="block text-sm font-medium mb-2">
                  {statusModalLabel}
                  {statusModalRequired ? ' *' : ''}
                </label>

                {statusModalType === 'textarea' ? (
                  <textarea
                    value={statusModalValue}
                    onChange={(event) =>
                      setStatusModalValue(event.target.value)
                    }
                    rows={6}
                    className="w-full rounded-lg border px-4 py-3"
                  />
                ) : (
                  <input
                    type={statusModalType}
                    value={statusModalValue}
                    onChange={(event) =>
                      setStatusModalValue(event.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3"
                  />
                )}
              </div>

              <div className="border-t bg-slate-50 p-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelStatusModal}
                  className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmStatusModal}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
                >
                  Confirmar
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="text-xl xl:text-2xl font-semibold text-slate-900 mt-3 whitespace-nowrap">
  {value}
</p>
    </div>
  )
}

function ServiceFlow({
  item,
  statusSteps,
  productWorkflows,
}: {
  item: SaleItem
  statusSteps: StatusStep[]
  productWorkflows: ProductWorkflow[]
}) {
  const workflowStatusModelId = item.status_model_id

if (!workflowStatusModelId) {
  return null
}

const steps = statusSteps
  .filter(
    (step) => step.status_model_id === workflowStatusModelId
  )
  .sort((a, b) => a.display_order - b.display_order)

  if (steps.length === 0) {
    return null
  }

  const currentIndex = steps.findIndex(
    (step) => step.id === item.operational_status_id
  )

    return (
    <div className="mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-x-4 gap-y-6">

        {steps.map((step, index) => {
          const completed =
            currentIndex >= 0 && index < currentIndex

          const current =
            step.id === item.operational_status_id

          const finalCompleted =
            current &&
            step.is_final &&
            item.general_status === 'COMPLETED'

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center text-center"
            >
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                  completed || finalCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : current
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {completed || finalCompleted
                  ? '✓'
                  : index + 1}
              </div>

              <p
                className={`text-xs mt-2 leading-4 ${
                  current
                    ? 'font-semibold text-slate-900'
                    : completed
                    ? 'text-emerald-700'
                    : 'text-slate-500'
                }`}
              >
                {step.name}
              </p>
            </div>
          )
        })}

    
      </div>
    </div>
  )
}
