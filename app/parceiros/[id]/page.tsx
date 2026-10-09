'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Partner = {
  id: string
  name: string
  nif_nipc: string | null
  phone: string | null
  email: string | null
  address: string | null
  iban: string | null
  notes: string | null
  is_active: boolean
}

type Product = {
  id: string
  code: string
  name: string
}

type PartnerProductRule = {
  id: string
  product_id: string
  default_debtor_type: string
  pricing_type: string
  discount_value: number | null
  fixed_price: number | null
  commission_enabled: boolean
  commission_direction: string | null
  commission_calculation_type: string | null
  commission_value: number | null
  notes: string | null
  is_active: boolean
  product_name: string
  product_code: string
}

type PartnerGeneralRule = {
  id: string
  default_debtor_type: string
  pricing_type: string
  discount_value: number | null
  fixed_price: number | null
  commission_enabled: boolean
  commission_direction: string | null
  commission_calculation_type: string | null
  commission_value: number | null
  notes: string | null
  is_active: boolean
}

export default function ParceiroPage() {
  const params = useParams()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
const [products, setProducts] = useState<Product[]>([])
  const [rules, setRules] = useState<PartnerProductRule[]>([])
const [generalRule, setGeneralRule] =
  useState<PartnerGeneralRule | null>(null)

const [editingGeneralRule, setEditingGeneralRule] = useState(false)

const [generalDebtorType, setGeneralDebtorType] = useState('CLIENT')
const [generalPricingType, setGeneralPricingType] = useState('TABLE_PRICE')
const [generalDiscountValue, setGeneralDiscountValue] = useState('')
const [generalFixedPrice, setGeneralFixedPrice] = useState('')

const [generalCommissionEnabled, setGeneralCommissionEnabled] =
  useState(false)

const [generalCommissionDirection, setGeneralCommissionDirection] =
  useState('PAYABLE')

const [
  generalCommissionCalculationType,
  setGeneralCommissionCalculationType,
] = useState('PERCENTAGE')

const [generalCommissionValue, setGeneralCommissionValue] = useState('')
const [generalNotes, setGeneralNotes] = useState('')

const [savingGeneralRule, setSavingGeneralRule] = useState(false)

const [editingProductRule, setEditingProductRule] = useState(false)
const [editingProductRuleId, setEditingProductRuleId] =
  useState<string | null>(null)

const [productRuleProductId, setProductRuleProductId] = useState('')
const [productRuleDebtorType, setProductRuleDebtorType] =
  useState('CLIENT')
const [productRulePricingType, setProductRulePricingType] =
  useState('TABLE_PRICE')
const [productRuleDiscountValue, setProductRuleDiscountValue] =
  useState('')
const [productRuleFixedPrice, setProductRuleFixedPrice] =
  useState('')

const [productRuleCommissionEnabled, setProductRuleCommissionEnabled] =
  useState(false)
const [productRuleCommissionDirection, setProductRuleCommissionDirection] =
  useState('PAYABLE')
const [
  productRuleCommissionCalculationType,
  setProductRuleCommissionCalculationType,
] = useState('PERCENTAGE')
const [productRuleCommissionValue, setProductRuleCommissionValue] =
  useState('')
const [productRuleNotes, setProductRuleNotes] = useState('')

const [savingProductRule, setSavingProductRule] = useState(false)

  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
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
  partnerResult,
  productsResult,
  rulesResult,
  generalRuleResult,
] = await Promise.all([

        supabase
          .from('partners')
          .select(`
            id,
            name,
            nif_nipc,
            phone,
            email,
            address,
            iban,
            notes,
            is_active
          `)
          .eq('id', partnerId)
          .single(),

supabase
  .from('products')
  .select(`
    id,
    code,
    name
  `)
  .eq('is_active', true)
  .order('name', { ascending: true }),

        supabase
          .from('partner_product_rules')
          .select(`
            id,
            product_id,
            default_debtor_type,
            pricing_type,
            discount_value,
            fixed_price,
            commission_enabled,
            commission_direction,
            commission_calculation_type,
            commission_value,
            notes,
            is_active,
            products (
              code,
              name
            )
          `)
          .eq('partner_id', partnerId)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
supabase
  .from('partner_general_rules')
  .select(`
    id,
    default_debtor_type,
    pricing_type,
    discount_value,
    fixed_price,
    commission_enabled,
    commission_direction,
    commission_calculation_type,
    commission_value,
    notes,
    is_active
  `)
  .eq('partner_id', partnerId)
  .eq('is_active', true)
  .maybeSingle(),

      ])

      if (partnerResult.error) {
        setError(partnerResult.error.message)
        setLoading(false)
        return
      }

if (productsResult.error) {
  setError(productsResult.error.message)
  setLoading(false)
  return
}

      if (rulesResult.error) {
        setError(rulesResult.error.message)
        setLoading(false)
        return
      }

if (generalRuleResult.error) {
  setError(generalRuleResult.error.message)
  setLoading(false)
  return
}

      setPartner(partnerResult.data)
setProducts(productsResult.data ?? [])
setGeneralRule(generalRuleResult.data ?? null)


      const normalizedRules = (rulesResult.data ?? []).map(
        (rule: any) => ({
          id: rule.id,
          product_id: rule.product_id,
          default_debtor_type:
            rule.default_debtor_type,
          pricing_type:
            rule.pricing_type,
          discount_value:
            rule.discount_value,
          fixed_price:
            rule.fixed_price,
          commission_enabled:
            rule.commission_enabled,
          commission_direction:
            rule.commission_direction,
          commission_calculation_type:
            rule.commission_calculation_type,
          commission_value:
            rule.commission_value,
          notes:
            rule.notes,
          is_active:
            rule.is_active,
          product_name:
            rule.products?.name ?? 'Produto',
          product_code:
            rule.products?.code ?? '',
        })
      )

      setRules(normalizedRules)
      setLoading(false)
    }

    loadPage()
  }, [partnerId])

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return rules
    }

    return rules.filter((rule) =>
      [
        rule.product_name,
        rule.product_code,
      ].some((value) =>
        value?.toLowerCase().includes(term)
      )
    )
  }, [rules, search])

async function saveGeneralRule() {
  setSavingGeneralRule(true)
  setError('')

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (appUserError) {
      throw appUserError
    }

    const payload = {
      partner_id: partnerId,
      default_debtor_type: generalDebtorType,
      pricing_type: generalPricingType,

      discount_value:
        generalPricingType === 'DISCOUNT_PERCENTAGE' ||
        generalPricingType === 'DISCOUNT_FIXED'
          ? Number(generalDiscountValue || 0)
          : null,

      fixed_price:
        generalPricingType === 'FIXED_PRICE'
          ? Number(generalFixedPrice || 0)
          : null,

      commission_enabled: generalCommissionEnabled,

      commission_direction: generalCommissionEnabled
        ? generalCommissionDirection
        : null,

      commission_calculation_type: generalCommissionEnabled
        ? generalCommissionCalculationType
        : null,

      commission_value: generalCommissionEnabled
        ? Number(generalCommissionValue || 0)
        : null,

      notes: generalNotes.trim() || null,
      is_active: true,
      updated_by: appUser.id,
    }

    if (generalRule) {
      const { data, error } = await supabase
        .from('partner_general_rules')
        .update(payload)
        .eq('id', generalRule.id)
        .select(`
          id,
          default_debtor_type,
          pricing_type,
          discount_value,
          fixed_price,
          commission_enabled,
          commission_direction,
          commission_calculation_type,
          commission_value,
          notes,
          is_active
        `)
        .single()

      if (error) {
        throw error
      }

      setGeneralRule(data)
    } else {
      const { data, error } = await supabase
        .from('partner_general_rules')
        .insert({
          ...payload,
          created_by: appUser.id,
        })
        .select(`
          id,
          default_debtor_type,
          pricing_type,
          discount_value,
          fixed_price,
          commission_enabled,
          commission_direction,
          commission_calculation_type,
          commission_value,
          notes,
          is_active
        `)
        .single()

      if (error) {
        throw error
      }

      setGeneralRule(data)
    }

    setEditingGeneralRule(false)
  } catch (err: any) {
    setError(
      err?.message ||
        'Não foi possível salvar a condição comercial geral.'
    )
  } finally {
    setSavingGeneralRule(false)
  }
}

async function saveProductRule() {
  setSavingProductRule(true)
  setError('')

  try {
    if (!productRuleProductId) {
      throw new Error('Selecione um produto ou serviço.')
    }

    const duplicateRule = rules.find(
      (rule) =>
        rule.product_id === productRuleProductId &&
        rule.id !== editingProductRuleId
    )

    if (duplicateRule) {
      throw new Error(
        'Este produto já possui uma condição específica para este parceiro.'
      )
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (appUserError) {
      throw appUserError
    }

    const payload = {
      partner_id: partnerId,
      product_id: productRuleProductId,
      default_debtor_type: productRuleDebtorType,
      pricing_type: productRulePricingType,

      discount_value:
        productRulePricingType === 'DISCOUNT_PERCENTAGE' ||
        productRulePricingType === 'DISCOUNT_FIXED'
          ? Number(productRuleDiscountValue || 0)
          : null,

      fixed_price:
        productRulePricingType === 'FIXED_PRICE'
          ? Number(productRuleFixedPrice || 0)
          : null,

      commission_enabled: productRuleCommissionEnabled,

      commission_direction: productRuleCommissionEnabled
        ? productRuleCommissionDirection
        : null,

      commission_calculation_type: productRuleCommissionEnabled
        ? productRuleCommissionCalculationType
        : null,

      commission_value: productRuleCommissionEnabled
        ? Number(productRuleCommissionValue || 0)
        : null,

      notes: productRuleNotes.trim() || null,
      is_active: true,
      updated_by: appUser.id,
    }

    let savedRule: any

    if (editingProductRuleId) {
      const { data, error } = await supabase
        .from('partner_product_rules')
        .update(payload)
        .eq('id', editingProductRuleId)
        .select(`
          id,
          product_id,
          default_debtor_type,
          pricing_type,
          discount_value,
          fixed_price,
          commission_enabled,
          commission_direction,
          commission_calculation_type,
          commission_value,
          notes,
          is_active,
          products (
            code,
            name
          )
        `)
        .single()

      if (error) {
        throw error
      }

      savedRule = data
    } else {
      const { data, error } = await supabase
        .from('partner_product_rules')
        .insert({
          ...payload,
          created_by: appUser.id,
        })
        .select(`
          id,
          product_id,
          default_debtor_type,
          pricing_type,
          discount_value,
          fixed_price,
          commission_enabled,
          commission_direction,
          commission_calculation_type,
          commission_value,
          notes,
          is_active,
          products (
            code,
            name
          )
        `)
        .single()

      if (error) {
        throw error
      }

      savedRule = data
    }

    const normalizedRule: PartnerProductRule = {
      id: savedRule.id,
      product_id: savedRule.product_id,
      default_debtor_type: savedRule.default_debtor_type,
      pricing_type: savedRule.pricing_type,
      discount_value: savedRule.discount_value,
      fixed_price: savedRule.fixed_price,
      commission_enabled: savedRule.commission_enabled,
      commission_direction: savedRule.commission_direction,
      commission_calculation_type:
        savedRule.commission_calculation_type,
      commission_value: savedRule.commission_value,
      notes: savedRule.notes,
      is_active: savedRule.is_active,
      product_name: savedRule.products?.name ?? 'Produto',
      product_code: savedRule.products?.code ?? '',
    }

    if (editingProductRuleId) {
      setRules((current) =>
        current.map((rule) =>
          rule.id === editingProductRuleId
            ? normalizedRule
            : rule
        )
      )
    } else {
      setRules((current) => [...current, normalizedRule])
    }

    setEditingProductRule(false)
    setEditingProductRuleId(null)
  } catch (err: any) {
    setError(
      err?.message ||
        'Não foi possível salvar a condição específica.'
    )
  } finally {
    setSavingProductRule(false)
  }
}

  function getPricingDescription(
    rule: PartnerProductRule
  ) {
    if (rule.pricing_type === 'TABLE_PRICE') {
      return 'Preço de tabela'
    }

    if (
      rule.pricing_type ===
      'DISCOUNT_PERCENTAGE'
    ) {
      return `${Number(
        rule.discount_value ?? 0
      ).toFixed(2)}% de desconto`
    }

    if (
      rule.pricing_type ===
      'DISCOUNT_FIXED'
    ) {
      return `${Number(
        rule.discount_value ?? 0
      ).toFixed(2)} € de desconto`
    }

    if (
      rule.pricing_type ===
      'FIXED_PRICE'
    ) {
      return `Preço fixo ${Number(
        rule.fixed_price ?? 0
      ).toFixed(2)} €`
    }

    return rule.pricing_type
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando parceiro...
        </p>
      </main>
    )
  }

  if (error || !partner) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Parceiro
          </h1>

          <p className="text-red-600 mt-3 text-sm">
            Erro: {error || 'Parceiro não encontrado.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">

        <button
          onClick={() => {
            window.location.href = '/parceiros'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para parceiros
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-2">
              Administração
            </p>

            <h1 className="text-3xl font-semibold text-slate-900">
              {partner.name}
            </h1>

            <p className="text-slate-500 mt-2">
              Dados cadastrais e condições comerciais do parceiro.
            </p>
          </div>

          <span
            className={
              partner.is_active
                ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700'
                : 'inline-flex rounded-full bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600'
            }
          >
            {partner.is_active
              ? 'Ativo'
              : 'Inativo'}
          </span>
        </div>

        <div className="space-y-6">

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Dados do parceiro
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Informações cadastrais e de contacto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 text-sm">

              <div>
                <p className="text-slate-500">
                  NIF / NIPC
                </p>

                <p className="font-medium text-slate-900 mt-1">
                  {partner.nif_nipc || '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  Telefone
                </p>

                <p className="font-medium text-slate-900 mt-1">
                  {partner.phone || '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  E-mail
                </p>

                <p className="font-medium text-slate-900 mt-1">
                  {partner.email || '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  IBAN
                </p>

                <p className="font-medium text-slate-900 mt-1">
                  {partner.iban || '—'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-slate-500">
                  Morada
                </p>

                <p className="font-medium text-slate-900 mt-1 whitespace-pre-line">
                  {partner.address || '—'}
                </p>
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <p className="text-slate-500">
                  Observações
                </p>

                <p className="font-medium text-slate-900 mt-1 whitespace-pre-line">
                  {partner.notes || '—'}
                </p>
              </div>

            </div>
          </section>
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Condição comercial geral
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Regra padrão aplicada a todos os produtos deste parceiro,
                  salvo quando existir uma condição específica para determinado produto.
                </p>
              </div>

              <button
  type="button"
  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
  onClick={() => {

    if (generalRule) {
      setGeneralDebtorType(
        generalRule.default_debtor_type || 'CLIENT'
      )

      setGeneralPricingType(
        generalRule.pricing_type || 'TABLE_PRICE'
      )

      setGeneralDiscountValue(
        generalRule.discount_value != null
          ? String(generalRule.discount_value)
          : ''
      )

      setGeneralFixedPrice(
        generalRule.fixed_price != null
          ? String(generalRule.fixed_price)
          : ''
      )

      setGeneralCommissionEnabled(
        generalRule.commission_enabled
      )

      setGeneralCommissionDirection(
        generalRule.commission_direction || 'PAYABLE'
      )

      setGeneralCommissionCalculationType(
        generalRule.commission_calculation_type ||
          'PERCENTAGE'
      )

      setGeneralCommissionValue(
        generalRule.commission_value != null
          ? String(generalRule.commission_value)
          : ''
      )

      setGeneralNotes(generalRule.notes || '')
    } else {
      setGeneralDebtorType('CLIENT')
      setGeneralPricingType('TABLE_PRICE')
      setGeneralDiscountValue('')
      setGeneralFixedPrice('')
      setGeneralCommissionEnabled(false)
      setGeneralCommissionDirection('PAYABLE')
      setGeneralCommissionCalculationType('PERCENTAGE')
      setGeneralCommissionValue('')
      setGeneralNotes('')
    }

    setEditingGeneralRule(true)
  }}
>
  {generalRule
    ? 'Editar condição geral'
    : 'Adicionar condição geral'}
</button>
            </div>

            {editingGeneralRule && (
              <div className="mt-6 rounded-xl border bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-900">
                  {generalRule
                    ? 'Editar condição comercial geral'
                    : 'Nova condição comercial geral'}
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Pagador padrão
                    </label>

                    <select
                      value={generalDebtorType}
                      onChange={(e) =>
                        setGeneralDebtorType(e.target.value)
                      }
                      className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="CLIENT">Cliente</option>
                      <option value="PARTNER">Parceiro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Condição de preço
                    </label>

                    <select
                      value={generalPricingType}
                      onChange={(e) => {
                        setGeneralPricingType(e.target.value)
                        setGeneralDiscountValue('')
                        setGeneralFixedPrice('')
                      }}
                      className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="TABLE_PRICE">
                        Preço de tabela
                      </option>

                      <option value="DISCOUNT_PERCENTAGE">
                        Desconto percentual
                      </option>

                      <option value="DISCOUNT_FIXED">
                        Desconto em valor
                      </option>

                      <option value="FIXED_PRICE">
                        Preço fixo
                      </option>
                    </select>
                  </div>

                  {generalPricingType === 'DISCOUNT_PERCENTAGE' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Percentual de desconto
                      </label>

                      <div className="mt-2 flex">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={generalDiscountValue}
                          onChange={(e) =>
                            setGeneralDiscountValue(e.target.value)
                          }
                          className="w-full rounded-l-lg border bg-white px-3 py-2.5 text-sm"
                        />

                        <span className="rounded-r-lg border border-l-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  {generalPricingType === 'DISCOUNT_FIXED' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Valor do desconto
                      </label>

                      <div className="mt-2 flex">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={generalDiscountValue}
                          onChange={(e) =>
                            setGeneralDiscountValue(e.target.value)
                          }
                          className="w-full rounded-l-lg border bg-white px-3 py-2.5 text-sm"
                        />

                        <span className="rounded-r-lg border border-l-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                          €
                        </span>
                      </div>
                    </div>
                  )}

                  {generalPricingType === 'FIXED_PRICE' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Preço fixo
                      </label>

                      <div className="mt-2 flex">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={generalFixedPrice}
                          onChange={(e) =>
                            setGeneralFixedPrice(e.target.value)
                          }
                          className="w-full rounded-l-lg border bg-white px-3 py-2.5 text-sm"
                        />

                        <span className="rounded-r-lg border border-l-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                          €
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t pt-5">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={generalCommissionEnabled}
                      onChange={(e) =>
                        setGeneralCommissionEnabled(e.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    Este parceiro possui comissão
                  </label>
                </div>

                {generalCommissionEnabled && (
                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Tipo
                      </label>

                      <select
                        value={generalCommissionDirection}
                        onChange={(e) =>
                          setGeneralCommissionDirection(e.target.value)
                        }
                        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="PAYABLE">
                          Portulegal paga ao parceiro
                        </option>

                        <option value="RECEIVABLE">
                          Portulegal recebe do parceiro
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Cálculo
                      </label>

                      <select
                        value={generalCommissionCalculationType}
                        onChange={(e) =>
                          setGeneralCommissionCalculationType(
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="PERCENTAGE">
                          Percentual
                        </option>

                        <option value="FIXED">
                          Valor fixo
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Valor da comissão
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={generalCommissionValue}
                        onChange={(e) =>
                          setGeneralCommissionValue(e.target.value)
                        }
                        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <label className="block text-sm font-medium text-slate-700">
                    Observações
                  </label>

                  <textarea
                    value={generalNotes}
                    onChange={(e) =>
                      setGeneralNotes(e.target.value)
                    }
                    rows={3}
                    className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingGeneralRule(false)}
                    className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={savingGeneralRule}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    onClick={saveGeneralRule}
                  >
                    {savingGeneralRule ? 'Salvando...' : 'Salvar condição'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 border-t pt-5">
              {generalRule ? (
                <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-slate-500">
                      Condição
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {generalRule.pricing_type === 'TABLE_PRICE'
                        ? 'Preço de tabela'
                        : generalRule.pricing_type === 'DISCOUNT_PERCENTAGE'
                        ? `${Number(generalRule.discount_value ?? 0).toFixed(2)}% de desconto`
                        : generalRule.pricing_type === 'DISCOUNT_FIXED'
                        ? `${Number(generalRule.discount_value ?? 0).toFixed(2)} € de desconto`
                        : generalRule.pricing_type === 'FIXED_PRICE'
                        ? `Preço fixo ${Number(generalRule.fixed_price ?? 0).toFixed(2)} €`
                        : generalRule.pricing_type}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Pagador padrão
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {generalRule.default_debtor_type === 'PARTNER'
                        ? 'Parceiro'
                        : 'Cliente'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Comissão
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {generalRule.commission_enabled ? 'Sim' : 'Não'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">
                      Observações
                    </p>

                    <p className="mt-1 font-medium text-slate-900 whitespace-pre-line">
                      {generalRule.notes || '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
                  Nenhuma condição geral configurada para este parceiro.
                  Neste caso, os produtos seguem o preço normal de tabela,
                  salvo quando houver uma condição específica por produto.
                </div>
              )}
            </div>
          </section>


          <section className="rounded-2xl border bg-white shadow-sm">

            <div className="border-b p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Condições comerciais por produto
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Regras específicas aplicadas quando o serviço é realizado através deste parceiro.
                  </p>
                </div>

                <button
  type="button"
  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
  onClick={() => {
    setEditingProductRuleId(null)
    setProductRuleProductId('')
    setProductRuleDebtorType(
      generalRule?.default_debtor_type ?? 'CLIENT'
    )
    setProductRulePricingType('TABLE_PRICE')
    setProductRuleDiscountValue('')
    setProductRuleFixedPrice('')
    setProductRuleCommissionEnabled(false)
    setProductRuleCommissionDirection('PAYABLE')
    setProductRuleCommissionCalculationType('PERCENTAGE')
    setProductRuleCommissionValue('')
    setProductRuleNotes('')
    setEditingProductRule(true)
  }}
>
  Adicionar condição
</button>

              </div>

{editingProductRule && (
  <div className="mt-5 rounded-xl border bg-slate-50 p-5">
    <h3 className="text-base font-semibold text-slate-900">
      {editingProductRuleId
        ? 'Editar condição específica'
        : 'Nova condição específica'}
    </h3>

    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Produto / Serviço
        </label>

        <select
          value={productRuleProductId}
          onChange={(e) => setProductRuleProductId(e.target.value)}
          className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Selecionar produto</option>

          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
              {product.code ? ` — ${product.code}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Pagador
        </label>

        <select
          value={productRuleDebtorType}
          onChange={(e) => setProductRuleDebtorType(e.target.value)}
          className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
        >
          <option value="CLIENT">Cliente</option>
          <option value="PARTNER">Parceiro</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Condição de preço
        </label>

        <select
          value={productRulePricingType}
          onChange={(e) => setProductRulePricingType(e.target.value)}
          className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
        >
          <option value="TABLE_PRICE">Preço de tabela</option>
          <option value="DISCOUNT_PERCENTAGE">
            Desconto percentual
          </option>
          <option value="DISCOUNT_FIXED">
            Desconto em valor
          </option>
          <option value="FIXED_PRICE">Preço fixo</option>
        </select>
      </div>

      {productRulePricingType === 'DISCOUNT_PERCENTAGE' && (
        <div>
          <label className="text-sm font-medium text-slate-700">
            Desconto (%)
          </label>

          <input
            type="number"
            step="0.01"
            value={productRuleDiscountValue}
            onChange={(e) =>
              setProductRuleDiscountValue(e.target.value)
            }
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
          />
        </div>
      )}

      {productRulePricingType === 'DISCOUNT_FIXED' && (
        <div>
          <label className="text-sm font-medium text-slate-700">
            Desconto (€)
          </label>

          <input
            type="number"
            step="0.01"
            value={productRuleDiscountValue}
            onChange={(e) =>
              setProductRuleDiscountValue(e.target.value)
            }
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
          />
        </div>
      )}

      {productRulePricingType === 'FIXED_PRICE' && (
        <div>
          <label className="text-sm font-medium text-slate-700">
            Preço fixo (€)
          </label>

          <input
            type="number"
            step="0.01"
            value={productRuleFixedPrice}
            onChange={(e) =>
              setProductRuleFixedPrice(e.target.value)
            }
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
          />
        </div>
      )}
    </div>

    <div className="mt-5">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={productRuleCommissionEnabled}
          onChange={(e) =>
            setProductRuleCommissionEnabled(e.target.checked)
          }
        />
        Aplicar comissão
      </label>
    </div>

    {productRuleCommissionEnabled && (
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Sentido da comissão
          </label>

          <select
            value={productRuleCommissionDirection}
            onChange={(e) =>
              setProductRuleCommissionDirection(e.target.value)
            }
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
          >
            <option value="PAYABLE">A pagar ao parceiro</option>
            <option value="RECEIVABLE">A receber do parceiro</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Tipo
          </label>

          <select
            value={productRuleCommissionCalculationType}
            onChange={(e) =>
              setProductRuleCommissionCalculationType(e.target.value)
            }
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
          >
            <option value="PERCENTAGE">Percentual</option>
            <option value="FIXED">Valor fixo</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Valor
          </label>

          <input
            type="number"
            step="0.01"
            value={productRuleCommissionValue}
            onChange={(e) =>
              setProductRuleCommissionValue(e.target.value)
            }
            className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
          />
        </div>
      </div>
    )}

    <div className="mt-4">
      <label className="text-sm font-medium text-slate-700">
        Observações
      </label>

      <textarea
        value={productRuleNotes}
        onChange={(e) => setProductRuleNotes(e.target.value)}
        rows={3}
        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 text-sm"
      />
    </div>

    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={() => setEditingProductRule(false)}
        className="rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
      >
        Cancelar
      </button>

    <button
  type="button"
  disabled={savingProductRule}
  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
  onClick={saveProductRule}
>
  {savingProductRule ? 'Salvando...' : 'Salvar condição'}
</button>

    </div>
  </div>
)}

              <div className="mt-5">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Pesquisar produto ou código..."
                  className="w-full md:w-96 rounded-lg border px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {filteredRules.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium text-slate-900">
                  Nenhuma condição comercial cadastrada
                </p>

                <p className="text-sm text-slate-500 mt-2">
                  Adicione produtos para definir preços, descontos, pagador e comissão.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">

                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">
                        Produto / Serviço
                      </th>

                      <th className="px-5 py-3 text-left font-medium">
                        Condição
                      </th>

                      <th className="px-5 py-3 text-left font-medium">
                        Pagador
                      </th>

                      <th className="px-5 py-3 text-left font-medium">
                        Comissão
                      </th>

                      <th className="px-5 py-3 text-right font-medium">
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredRules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {rule.product_name}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {rule.product_code}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {getPricingDescription(rule)}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {rule.default_debtor_type ===
                          'PARTNER'
                            ? 'Parceiro'
                            : 'Cliente'}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {rule.commission_enabled
                            ? 'Sim'
                            : 'Não'}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
  type="button"
  className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
  onClick={() => {
    setEditingProductRuleId(rule.id)
    setProductRuleProductId(rule.product_id)

    setProductRuleDebtorType(
      rule.default_debtor_type
    )

    setProductRulePricingType(
      rule.pricing_type
    )

    setProductRuleDiscountValue(
      rule.discount_value !== null
        ? String(rule.discount_value)
        : ''
    )

    setProductRuleFixedPrice(
      rule.fixed_price !== null
        ? String(rule.fixed_price)
        : ''
    )

    setProductRuleCommissionEnabled(
      rule.commission_enabled
    )

    setProductRuleCommissionDirection(
      rule.commission_direction ?? 'PAYABLE'
    )

    setProductRuleCommissionCalculationType(
      rule.commission_calculation_type ??
        'PERCENTAGE'
    )

    setProductRuleCommissionValue(
      rule.commission_value !== null
        ? String(rule.commission_value)
        : ''
    )

    setProductRuleNotes(rule.notes ?? '')

    setEditingProductRule(true)
  }}
>
  Editar
</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}

          </section>

        </div>
      </div>
    </main>
  )
}