'use client'

import { use, useEffect, useMemo, useState } from 'react'
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
  product_type: string
  currency_default: string
}

type ProductPrice = {
  product_id: string
  gross_service_price: number
  vat_rate: number
  net_service_price: number
  vat_amount: number
  currency: string
}

type CommercialRule = {
  product_id: string
  discount_allowed: boolean
  minimum_margin_percent: number | null
  admin_exception_allowed: boolean
  commercial_mode_default: string | null
}
type ProductFee = {
  id: string
  product_id: string
  fee_catalog_id: string
  generated_at_status_id: string | null
  fee_code: string
  fee_name: string
  fee_amount: number
  default_payer: string
  generation_step_name: string | null
}
type AppUser = {
  id: string
  name: string
  access_level: number
}

type Partner = {
  id: string
  name: string
}

type PartnerProductRule = {
  id: string
  partner_id: string
  product_id: string
  default_debtor_type: string
  pricing_type: string
  discount_value: number | null
  fixed_price: number | null
  commission_enabled: boolean
}

type PartnerGeneralRule = {
  id: string
  partner_id: string
  default_debtor_type: string
  pricing_type: string
  discount_value: number | null
  fixed_price: number | null
  commission_enabled: boolean
}

export default function AdicionarServicoPage({ params }: PageProps) {
  const { id } = use(params)

  const [products, setProducts] = useState<Product[]>([])
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const [rules, setRules] = useState<CommercialRule[]>([])
  const [productFees, setProductFees] = useState<ProductFee[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
const [partners, setPartners] = useState<Partner[]>([])
const [partnerProductRules, setPartnerProductRules] =
  useState<PartnerProductRule[]>([])

const [partnerGeneralRules, setPartnerGeneralRules] =
  useState<PartnerGeneralRule[]>([])

  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [discountType, setDiscountType] = useState('NONE')
  const [discountValue, setDiscountValue] = useState('0')
  const [responsibleUserId, setResponsibleUserId] = useState('')

const [commercialOrigin, setCommercialOrigin] = useState('DIRECT')
const [partnerId, setPartnerId] = useState('')
const [debtorType, setDebtorType] = useState('CLIENT')

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

      const today = new Date().toISOString().slice(0, 10)

      const [
  productsResult,
  pricesResult,
  rulesResult,
  feesResult,
  usersResult,
  partnersResult,
  partnerRulesResult,
  partnerGeneralRulesResult,
] = await Promise.all([

        supabase
          .from('products')
          .select(`
            id,
            code,
            name,
            product_type,
            currency_default
          `)
          .eq('is_active', true)
          .order('name', { ascending: true }),

        supabase
          .from('product_prices')
          .select(`
            product_id,
            gross_service_price,
            vat_rate,
            net_service_price,
            vat_amount,
            currency
          `)
          .eq('is_active', true)
          .lte('valid_from', today)
          .or(`valid_until.is.null,valid_until.gte.${today}`),

        supabase
          .from('product_commercial_rules')
          .select(`
            product_id,
            discount_allowed,
            minimum_margin_percent,
            admin_exception_allowed,
            commercial_mode_default
          `),
        supabase
          .from('product_fees')
          .select(`
            id,
            product_id,
            fee_catalog_id,
            default_payer,
            generated_at_status_id,
            fee_catalog (
              code,
              name,
              default_amount
            ),
            status_model_steps (
              name
            )
          `)
          .eq('is_active', true),
        supabase
          .from('app_users')
          .select(`
  id,
  name,
  access_level,
  auth_user_id
`)
          .eq('is_active', true)
          .order('name', { ascending: true }),
supabase
  .from('partners')
  .select(`
    id,
    name
  `)
  .eq('is_active', true)
  .order('name', { ascending: true }),
supabase
  .from('partner_product_rules')
  .select(`
    id,
    partner_id,
    product_id,
    default_debtor_type,
    pricing_type,
    discount_value,
    fixed_price,
    commission_enabled
  `)
  .eq('is_active', true),

supabase
  .from('partner_general_rules')
  .select(`
    id,
    partner_id,
    default_debtor_type,
    pricing_type,
    discount_value,
    fixed_price,
    commission_enabled
  `)
  .eq('is_active', true),

      ])

      if (productsResult.error) {
        setError(productsResult.error.message)
        setLoading(false)
        return
      }

      if (pricesResult.error) {
        setError(pricesResult.error.message)
        setLoading(false)
        return
      }

      if (rulesResult.error) {
        setError(rulesResult.error.message)
        setLoading(false)
        return
      }
if (feesResult.error) {
  setError(feesResult.error.message)
  setLoading(false)
  return
}
      if (usersResult.error) {
        setError(usersResult.error.message)
        setLoading(false)
        return
      }

if (partnersResult.error) {
  setError(partnersResult.error.message)
  setLoading(false)
  return
}
if (partnerRulesResult.error) {
  setError(partnerRulesResult.error.message)
  setLoading(false)
  return
}

if (partnerGeneralRulesResult.error) {
  setError(partnerGeneralRulesResult.error.message)
  setLoading(false)
  return
}
      setProducts(productsResult.data ?? [])
      setPrices(pricesResult.data ?? [])
      setRules(rulesResult.data ?? [])
setProductFees(
  (feesResult.data ?? []).map((fee: any) => ({
    id: fee.id,
    product_id: fee.product_id,
    fee_catalog_id: fee.fee_catalog_id,
    generated_at_status_id: fee.generated_at_status_id,
    fee_code: fee.fee_catalog?.code ?? '—',
    fee_name: fee.fee_catalog?.name ?? 'Taxa',
    fee_amount: Number(fee.fee_catalog?.default_amount ?? 0),
    default_payer: fee.default_payer,
    generation_step_name:
      fee.status_model_steps?.name ?? null,
  }))
)
      setUsers(usersResult.data ?? [])

setPartners(partnersResult.data ?? [])
setPartnerProductRules(partnerRulesResult.data ?? [])
setPartnerGeneralRules(partnerGeneralRulesResult.data ?? [])

const loggedUser = (usersResult.data ?? []).find(
  (user) => user.auth_user_id === session.user.id
)

if (loggedUser) {
  setResponsibleUserId(loggedUser.id)
}

setPartners(partnersResult.data ?? [])
setPartnerProductRules(partnerRulesResult.data ?? [])
      setLoading(false)
    }

    loadPage()
  }, [])

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId]
  )

  const selectedPrice = useMemo(
    () => prices.find((price) => price.product_id === productId),
    [prices, productId]
  )

  const selectedRule = useMemo(
    () => rules.find((rule) => rule.product_id === productId),
    [rules, productId]
  )
const selectedSpecificPartnerRule = useMemo(
  () =>
    commercialOrigin === 'PARTNER'
      ? partnerProductRules.find(
          (rule) =>
            rule.partner_id === partnerId &&
            rule.product_id === productId
        )
      : undefined,
  [
    partnerProductRules,
    commercialOrigin,
    partnerId,
    productId,
  ]
)

const selectedGeneralPartnerRule = useMemo(
  () =>
    commercialOrigin === 'PARTNER'
      ? partnerGeneralRules.find(
          (rule) => rule.partner_id === partnerId
        )
      : undefined,
  [
    partnerGeneralRules,
    commercialOrigin,
    partnerId,
  ]
)

const selectedPartnerRule =
  selectedSpecificPartnerRule ?? selectedGeneralPartnerRule

useEffect(() => {
  if (commercialOrigin !== 'PARTNER') {
    return
  }

  if (!selectedPartnerRule) {
    setDiscountType('NONE')
    setDiscountValue('0')
    setDebtorType('CLIENT')
    return
  }

  setDebtorType(selectedPartnerRule.default_debtor_type)

  if (
    selectedPartnerRule.pricing_type ===
    'DISCOUNT_PERCENTAGE'
  ) {
    setDiscountType('PERCENTAGE')
    setDiscountValue(
      String(selectedPartnerRule.discount_value ?? 0)
    )
    return
  }

  if (
    selectedPartnerRule.pricing_type ===
    'DISCOUNT_FIXED'
  ) {
    setDiscountType('FIXED')
    setDiscountValue(
      String(selectedPartnerRule.discount_value ?? 0)
    )
    return
  }

if (
  selectedPartnerRule.pricing_type ===
  'FIXED_PRICE'
) {
  setDiscountType('NONE')
  setDiscountValue('0')
  return
}

  if (
    selectedPartnerRule.pricing_type ===
    'TABLE_PRICE'
  ) {
    setDiscountType('NONE')
    setDiscountValue('0')
  }
}, [
  commercialOrigin,
  selectedPartnerRule,
])

const selectedFees = useMemo(
  () =>
    productFees.filter(
      (fee) => fee.product_id === productId
    ),
  [productFees, productId]
)

const totalFees = selectedFees.reduce(
  (sum, fee) => sum + Number(fee.fee_amount || 0),
  0
)
  const quantityNumber = Math.max(Number(quantity) || 1, 1)

  const tableGrossBeforeDiscount =
  Number(selectedPrice?.gross_service_price || 0) * quantityNumber

const hasPartnerFixedPrice =
  commercialOrigin === 'PARTNER' &&
  selectedPartnerRule?.pricing_type === 'FIXED_PRICE'

const partnerFixedGross =
  hasPartnerFixedPrice
    ? Number(selectedPartnerRule?.fixed_price || 0) * quantityNumber
    : null

const grossBeforeDiscount = tableGrossBeforeDiscount

let estimatedDiscount =
  hasPartnerFixedPrice && partnerFixedGross !== null
    ? Math.max(
        tableGrossBeforeDiscount - partnerFixedGross,
        0
      )
    : 0

  if (discountType === 'PERCENTAGE') {
    estimatedDiscount =
      grossBeforeDiscount * ((Number(discountValue) || 0) / 100)
  }

  if (discountType === 'FIXED') {
    estimatedDiscount = Number(discountValue) || 0
  }

  estimatedDiscount = Math.min(
    Math.max(estimatedDiscount, 0),
    grossBeforeDiscount
  )

  const estimatedAfterDiscount =
    grossBeforeDiscount - estimatedDiscount
const estimatedClientTotal =
  estimatedAfterDiscount + totalFees
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!productId) {
      setError('Selecione um produto ou serviço.')
      return
    }

    if (!selectedPrice) {
      setError('Este produto não possui preço vigente.')
      return
    }

    if (
      discountType !== 'NONE' &&
      selectedRule?.discount_allowed === false
    ) {
      setError('Este produto não permite desconto.')
      return
    }

    setSaving(true)
setError('')

if (
  commercialOrigin === 'PARTNER' &&
  !partnerId
) {
  setError('Selecione o parceiro relacionado a este serviço.')
  setSaving(false)
  return
}

const commercialMode =
  selectedRule?.commercial_mode_default || 'STANDARD'

const effectiveDiscountType =
  hasPartnerFixedPrice
    ? 'FIXED'
    : discountType === 'NONE'
      ? null
      : discountType

const effectiveDiscountValue =
  hasPartnerFixedPrice
    ? Math.max(
        tableGrossBeforeDiscount -
          Number(selectedPartnerRule?.fixed_price || 0) *
            quantityNumber,
        0
      )
    : discountType === 'NONE'
      ? null
      : Number(discountValue) || 0

if (
  hasPartnerFixedPrice &&
  Number(selectedPartnerRule?.fixed_price || 0) >
    Number(selectedPrice.gross_service_price || 0)
) {
  setError(
    'O preço fixo do parceiro não pode ser superior ao preço de tabela.'
  )
  setSaving(false)
  return
}

const { data, error } = await supabase.rpc(
  'rpc_add_sale_item',
  {
    p_sale_id: id,
    p_product_id: productId,
    p_quantity: quantityNumber,
    p_discount_type: effectiveDiscountType,
    p_discount_value: effectiveDiscountValue,
    p_commercial_mode: commercialMode,
    p_responsible_user_id:
      responsibleUserId || null,
    p_partner_id:
      commercialOrigin === 'PARTNER'
        ? partnerId || null
        : null,
    p_debtor_type:
      commercialOrigin === 'PARTNER'
        ? debtorType
        : 'CLIENT',
  }
)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    if (!data) {
      setError('O serviço não foi adicionado.')
      setSaving(false)
      return
    }

   const saleItemId = data[0]?.sale_item_id

if (saleItemId) {
  const { error: commissionError } = await supabase.rpc(
    'rpc_generate_commission_for_sale_item',
    {
      p_sale_item_id: saleItemId,
    }
  )

  if (commissionError) {
    console.error(
      'Erro ao gerar comissão:',
      commissionError
    )
  }
}

window.location.href = `/vendas/${id}`
}

if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando catálogo...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => {
            window.location.href = `/vendas/${id}`
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para venda
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">
            Adicionar Serviço
          </h1>

          <p className="text-slate-500 mt-2">
            Selecione um produto ou serviço do catálogo da Portulegal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900 mb-5">
              Serviço
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Produto / Serviço *
                </label>

                <select
                  value={productId}
                  onChange={(event) => {
                    setProductId(event.target.value)
                    setDiscountType('NONE')
                    setDiscountValue('0')
                  }}
                  required
                  className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">
                    Selecione...
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {product.code
                        ? ` — ${product.code}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantidade
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Responsável
                </label>

                <select
                  value={responsibleUserId}
                  onChange={(event) =>
                    setResponsibleUserId(event.target.value)
                  }
                  className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">
                    Sem responsável definido
                  </option>

                  {users.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">
              Relação comercial
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Origem do serviço
                </label>

                <select
                  value={commercialOrigin}
                  onChange={(event) => {
                    const value = event.target.value
                    setCommercialOrigin(value)

                    if (value === 'DIRECT') {
                      setPartnerId('')
                      setDebtorType('CLIENT')
                    }
                  }}
                  className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="DIRECT">
                    Direto
                  </option>

                  <option value="PARTNER">
                    Parceiro
                  </option>
                </select>
              </div>

              {commercialOrigin === 'PARTNER' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Parceiro *
                  </label>

                  <select
                    value={partnerId}
                    onChange={(event) =>
                      setPartnerId(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">
                      Selecione...
                    </option>

                    {partners.map((partner) => (
                      <option
                        key={partner.id}
                        value={partner.id}
                      >
                        {partner.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Quem paga o serviço
                </label>

                <select
                  value={debtorType}
                  onChange={(event) =>
                    setDebtorType(event.target.value)
                  }
                  className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="CLIENT">
                    Cliente
                  </option>

                  {commercialOrigin === 'PARTNER' && (
                    <option value="PARTNER">
                      Parceiro
                    </option>
                  )}
                </select>
              </div>

                       </div>
          </div>

          {selectedProduct && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <h2 className="text-lg font-semibold text-slate-900 mb-5">
                Valores
              </h2>

              {!selectedPrice ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    Este produto não possui preço vigente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

                    <ValueCard
                      label="Preço de tabela"
                      value={`${Number(
                        selectedPrice.gross_service_price
                      ).toFixed(2)} €`}
                    />

                    <ValueCard
                      label="IVA incluído"
                      value={`${Number(
                        selectedPrice.vat_amount
                      ).toFixed(2)} €`}
                    />

                    <ValueCard
                      label="Taxa de IVA"
                      value={`${Number(
                        selectedPrice.vat_rate
                      ).toFixed(2)}%`}
                    />

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tipo de desconto
                      </label>

                      <select
                        value={discountType}
                        disabled={
                          selectedRule?.discount_allowed === false
                        }
                        onChange={(event) => {
                          setDiscountType(event.target.value)
                          setDiscountValue('0')
                        }}
                        className="w-full rounded-lg border bg-white px-4 py-3 disabled:bg-slate-100"
                      >
                        <option value="NONE">
                          Sem desconto
                        </option>

                        <option value="PERCENTAGE">
                          Percentual (%)
                        </option>

                        <option value="FIXED">
                          Valor (€)
                        </option>
                      </select>

                      {selectedRule?.discount_allowed === false && (
                        <p className="text-xs text-slate-500 mt-2">
                          Este produto não permite desconto.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Valor do desconto
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountValue}
                        disabled={discountType === 'NONE'}
                        onChange={(event) =>
                          setDiscountValue(event.target.value)
                        }
                        className="w-full rounded-lg border px-4 py-3 disabled:bg-slate-100"
                      />
                    </div>

                  </div>

              <div className="mt-6 rounded-xl bg-slate-50 border p-5">

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        Honorários após desconto
      </p>

      <p className="text-2xl font-semibold text-slate-900 mt-2">
        {estimatedAfterDiscount.toFixed(2)} €
      </p>

      {estimatedDiscount > 0 && (
        <p className="text-xs text-slate-500 mt-1">
          Desconto: {estimatedDiscount.toFixed(2)} €
        </p>
      )}
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        Taxas associadas
      </p>

      <p className="text-2xl font-semibold text-slate-900 mt-2">
        {totalFees.toFixed(2)} €
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {selectedFees.length}{' '}
        {selectedFees.length === 1
          ? 'taxa'
          : 'taxas'}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        Total previsto para o cliente
      </p>

      <p className="text-3xl font-semibold text-slate-900 mt-2">
        {estimatedClientTotal.toFixed(2)} €
      </p>
    </div>

  </div>

  {selectedFees.length > 0 && (
    <div className="mt-5 border-t pt-4">

      <p className="text-sm font-medium text-slate-900 mb-3">
        Detalhamento das taxas
      </p>

      <div className="space-y-3">
        {selectedFees.map((fee) => (
          <div
            key={fee.id}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {fee.fee_name}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {fee.fee_code}
                {fee.generation_step_name
                  ? ` · Geração: ${fee.generation_step_name}`
                  : ' · Geração imediata'}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {fee.fee_amount.toFixed(2)} €
            </p>
          </div>
        ))}
      </div>
    </div>
  )}

  <p className="text-xs text-slate-400 mt-4">
    O desconto incide apenas sobre os honorários. As taxas são apresentadas separadamente e integram o total previsto para o cliente.
  </p>
</div>
                </>
              )}

            </div>
          )}

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
                window.location.href = `/vendas/${id}`
              }}
              className="rounded-lg border bg-white px-5 py-3 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !productId ||
                !selectedPrice
              }
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving
                ? 'Adicionando...'
                : 'Adicionar Serviço'}
            </button>

          </div>
        </form>

      </div>
    </main>
  )
}

function ValueCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="text-xl font-semibold text-slate-900 mt-2">
        {value}
      </p>
    </div>
  )
}