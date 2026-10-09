'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ReceivableRow = {
  id: string
  debtor_type: string
  debtor_id: string | null
  source_type: string
  source_id: string | null
  amount: number
  received_amount: number
  outstanding_amount: number
  currency: string
  due_date: string | null
  status: string
  debtor_name: string | null
  source_name: string | null
  sale_number: string | null
  installment_number: number | null
}

type PayableRow = {
  id: string
  creditor_type: string
  creditor_id: string | null
  source_type: string
  source_id: string | null
  sale_id: string | null
  sale_item_id: string | null
  sale_number: string | null
  item_number: number | null
  client_name: string | null
  expense_category_id: string | null
  description: string
  amount: number
  paid_amount: number
  outstanding_amount: number
  currency: string
  due_date: string | null
  due_status: string
  cost_status: string
  payment_status: string
  creditor_name: string | null
}

type PayableInstallmentRow = {
  id: string
  payable_id: string
  installment_number: number
  amount: number
  paid_amount: number
  outstanding_amount: number
  currency: string
  due_date: string
  payment_status: string
  due_status: string
}

type OutgoingPaymentRow = {
  id: string
  payable_id: string
  payable_installment_id: string | null
  allocated_amount: number
  payment_date: string
  amount: number
  currency: string
  confirmation_status: string
  confirmation_notes: string | null
  financial_account_id: string
  payment_method_id: string
  notes: string | null
}

type ReceivablePaymentHistoryRow = {
  payment_id: string
  payment_number: string
  payment_date: string
  confirmation_status: string
  cancellation_reason: string | null
  cancelled_at: string | null
  settled_amount: number
  currency: string
  payment_method_id: string | null
  financial_account_id: string | null
  gross_amount: number | null
}

type FinancialAccountBalanceRow = {
  financial_account_id: string
  code: string
  name: string
  account_type: string
  currency: string
  opening_balance: number
  movement_balance: number
  current_balance: number
  movement_count: number
  parent_account_id: string | null
  responsible_user_id: string | null
  is_active: boolean
  }

type RecurringExpenseRuleRow = {
  id: string
  description: string
  category_id: string | null
  supplier_partner_id: string | null
  frequency: string
  amount_mode: string
  default_amount: number | null
  estimated_amount: number | null
  currency: string
  start_date: string
  end_date: string | null
  due_day: number | null
  notes: string | null
  is_active: boolean
}

type FinancialMovementRow = {
  id: string
  financial_account_id: string
  movement_type: string
  nature: string | null
  amount: number
  currency: string
  movement_date: string
  notes: string | null
  source_type: string | null
  source_id: string | null
  created_at: string
}

type FinancialMovementDescription = {
  financial_movement_id: string
  description: string
}

export default function FinanceiroPage() {

  const [loading, setLoading] = useState(true)

const [receivables, setReceivables] = useState<
  ReceivableRow[]
>([])

 const [payables, setPayables] = useState<
    PayableRow[]
  >([])

const [outgoingPayments, setOutgoingPayments] = useState<
  OutgoingPaymentRow[]
>([])

const [payableInstallments, setPayableInstallments] = useState<
  PayableInstallmentRow[]
>([])

const [error, setError] = useState('')

const [
  selectedReceivable,
  setSelectedReceivable,
] = useState<ReceivableRow | null>(null)

const [
  selectedReceivableHistory,
  setSelectedReceivableHistory,
] = useState<ReceivableRow | null>(null)

const [
  receivablePaymentHistory,
  setReceivablePaymentHistory,
] = useState<ReceivablePaymentHistoryRow[]>([])

const [
  loadingReceivablePaymentHistory,
  setLoadingReceivablePaymentHistory,
] = useState(false)

const [
  selectedPaymentToReverse,
  setSelectedPaymentToReverse,
] = useState<ReceivablePaymentHistoryRow | null>(null)

const [
  receivableReversalReason,
  setReceivableReversalReason,
] = useState('')

const [
  reversingReceivablePayment,
  setReversingReceivablePayment,
] = useState(false)

const [
  selectedPayable,
  setSelectedPayable,
] = useState<PayableRow | null>(null)

const [
  selectedPayableInstallment,
  setSelectedPayableInstallment,
] = useState<PayableInstallmentRow | null>(null)

const [showPayableInstallmentPlan, setShowPayableInstallmentPlan] =
  useState(false)

const [payableInstallmentCount, setPayableInstallmentCount] =
  useState('3')

const [payableInstallmentDrafts, setPayableInstallmentDrafts] =
  useState<
    {
      number: number
      amount: string
      due_date: string
    }[]
  >([])

const [
  selectedPayableHistory,
  setSelectedPayableHistory,
] = useState<PayableRow | null>(null)

const [
  selectedOutgoingPayment,
  setSelectedOutgoingPayment,
] = useState<OutgoingPaymentRow | null>(null)

const [reversalReason, setReversalReason] = useState('')
const [reversingPayment, setReversingPayment] = useState(false)

const [payableAmount, setPayableAmount] = useState('')
const [payablePaymentMethodId, setPayablePaymentMethodId] =
  useState('')
const [payableFinancialAccountId, setPayableFinancialAccountId] =
  useState('')
const [payableDate, setPayableDate] = useState('')
const [savingPayable, setSavingPayable] = useState(false)

const [receiptAmount, setReceiptAmount] = useState('')
const [receiptPaymentMethodId, setReceiptPaymentMethodId] =
  useState('')
const [receiptFinancialAccountId, setReceiptFinancialAccountId] =
  useState('')
const [receiptDate, setReceiptDate] = useState('')
const [savingReceipt, setSavingReceipt] = useState(false)

const [
  receiptFeeWarning,
  setReceiptFeeWarning,
] = useState<{
  receivedAmount: number
  pendingOfficialFees: number
} | null>(null)

const [paymentMethods, setPaymentMethods] = useState<
  { id: string; name: string }[]
>([])

const [financialAccounts, setFinancialAccounts] = useState<
  { id: string; name: string; currency: string }[]
>([])

const [
  financialAccountBalances,
  setFinancialAccountBalances,
] = useState<FinancialAccountBalanceRow[]>([])

const [financialUserProfile, setFinancialUserProfile] = useState<{ access_level: number; is_active: boolean } | null>(null)
const [canManageFinancialAccounts, setCanManageFinancialAccounts] = useState(false)

const [
  selectedFinancialAccountStatement,
  setSelectedFinancialAccountStatement,
] = useState<FinancialAccountBalanceRow | null>(null)

const [
  accountStatementMovements,
  setAccountStatementMovements,
] = useState<FinancialMovementRow[]>([])

const [
  accountStatementMode,
  setAccountStatementMode,
] = useState<'LAST_100' | 'PERIOD'>('LAST_100')

const [
  accountStatementDateFrom,
  setAccountStatementDateFrom,
] = useState('')

const [
  accountStatementDateTo,
  setAccountStatementDateTo,
] = useState('')

const [
  loadingAccountStatement,
  setLoadingAccountStatement,
] = useState(false)

const [
  financialMovements,
  setFinancialMovements,
] = useState<FinancialMovementRow[]>([])

const [
  financialMovementDescriptions,
  setFinancialMovementDescriptions,
] = useState<FinancialMovementDescription[]>([])

const [showFinancialMovements, setShowFinancialMovements] =
  useState(false)

const [financialMovementSearch, setFinancialMovementSearch] =
  useState('')

const [
  financialMovementAccountFilter,
  setFinancialMovementAccountFilter,
] = useState('ALL')

const [
  financialMovementTypeFilter,
  setFinancialMovementTypeFilter,
] = useState('ALL')

const [
  financialMovementDateFrom,
  setFinancialMovementDateFrom,
] = useState('')

const [
  financialMovementDateTo,
  setFinancialMovementDateTo,
] = useState('')

const [showFinancialAccounts, setShowFinancialAccounts] =
  useState(false)

const [showReceivables, setShowReceivables] =
  useState(false)

const [showCreateFinancialAccount, setShowCreateFinancialAccount] = useState(false)
const [newAccountCode, setNewAccountCode] = useState('')
const [newAccountName, setNewAccountName] = useState('')
const [newAccountType, setNewAccountType] = useState<'BANK' | 'CASH'>('BANK')
const [newAccountCurrency, setNewAccountCurrency] = useState('EUR')
const [newAccountOpeningBalance, setNewAccountOpeningBalance] = useState('0')
const [newAccountIsMiniCash, setNewAccountIsMiniCash] = useState(false)
const [newAccountParentId, setNewAccountParentId] = useState('')
const [newAccountResponsibleUserId, setNewAccountResponsibleUserId] = useState('')
const [financialAccountUsers, setFinancialAccountUsers] = useState<{ id: string; name: string }[]>([])
const [creatingFinancialAccount, setCreatingFinancialAccount] = useState(false)

const [showNewIncome, setShowNewIncome] = useState(false)

const [incomeCategories, setIncomeCategories] = useState<{ id: string; name: string }[]>([])

const [incomeClients, setIncomeClients] = useState<{ id: string; name: string }[]>([])

const [incomePartners, setIncomePartners] = useState<{ id: string; name: string }[]>([])

const [newIncomeDescription, setNewIncomeDescription] = useState('')

const [newIncomeAmount, setNewIncomeAmount] = useState('')

const [newIncomeCurrency, setNewIncomeCurrency] = useState('EUR')

const [newIncomeDueDate, setNewIncomeDueDate] = useState('')

const [newIncomeReferenceDate, setNewIncomeReferenceDate] = useState('')

const [newIncomeCategoryId, setNewIncomeCategoryId] = useState('')

const [newIncomeDebtorType, setNewIncomeDebtorType] = useState<'CLIENT' | 'PARTNER' | 'OTHER'>('OTHER')

const [newIncomeClientId, setNewIncomeClientId] = useState('')

const [newIncomePartnerId, setNewIncomePartnerId] = useState('')

const [newIncomeOtherDebtorName, setNewIncomeOtherDebtorName] = useState('')

const [newIncomeNotes, setNewIncomeNotes] = useState('')

const [savingNewIncome, setSavingNewIncome] = useState(false)

const [editingIncomeReceivable, setEditingIncomeReceivable] =
  useState<ReceivableRow | null>(null)

const [editIncomeDescription, setEditIncomeDescription] =
  useState('')

const [editIncomeAmount, setEditIncomeAmount] =
  useState('')

const [editIncomeCurrency, setEditIncomeCurrency] =
  useState('EUR')

const [editIncomeDueDate, setEditIncomeDueDate] =
  useState('')

const [editIncomeReferenceDate, setEditIncomeReferenceDate] =
  useState('')

const [editIncomeCategoryId, setEditIncomeCategoryId] =
  useState('')

const [editIncomeDebtorType, setEditIncomeDebtorType] =
  useState<'CLIENT' | 'PARTNER' | 'OTHER'>('OTHER')

const [editIncomeClientId, setEditIncomeClientId] =
  useState('')

const [editIncomePartnerId, setEditIncomePartnerId] =
  useState('')

const [
  editIncomeOtherDebtorName,
  setEditIncomeOtherDebtorName,
] = useState('')

const [editIncomeNotes, setEditIncomeNotes] =
  useState('')

const [savingEditIncome, setSavingEditIncome] =
  useState(false)

const [
  cancellingIncomeReceivable,
  setCancellingIncomeReceivable,
] = useState<ReceivableRow | null>(null)

const [
  incomeCancellationReason,
  setIncomeCancellationReason,
] = useState('')

const [
  savingIncomeCancellation,
  setSavingIncomeCancellation,
] = useState(false)

const [showPayables, setShowPayables] =
  useState(false)

const [showNewPayable, setShowNewPayable] =
  useState(false)

const [
  showNewRecurringExpense,
  setShowNewRecurringExpense,
] = useState(false)

const [recurringExpenseRules, setRecurringExpenseRules] =
  useState<RecurringExpenseRuleRow[]>([])

const [
  showRecurringExpenseRules,
  setShowRecurringExpenseRules,
] = useState(false)

const [
  editingRecurringExpenseRule,
  setEditingRecurringExpenseRule,
] = useState<RecurringExpenseRuleRow | null>(null)

const [
  editRecurringDescription,
  setEditRecurringDescription,
] = useState('')

const [
  editRecurringCategoryId,
  setEditRecurringCategoryId,
] = useState('')

const [
  editRecurringSupplierId,
  setEditRecurringSupplierId,
] = useState('')

const [
  editRecurringFrequency,
  setEditRecurringFrequency,
] = useState('MONTHLY')

const [
  editRecurringAmountMode,
  setEditRecurringAmountMode,
] = useState('FIXED')

const [
  editRecurringAmount,
  setEditRecurringAmount,
] = useState('')

const [
  editRecurringCurrency,
  setEditRecurringCurrency,
] = useState('EUR')

const [
  editRecurringEndDate,
  setEditRecurringEndDate,
] = useState('')

const [
  editRecurringDueDay,
  setEditRecurringDueDay,
] = useState('')

const [
  editRecurringNotes,
  setEditRecurringNotes,
] = useState('')

const [
  savingRecurringRuleEdit,
  setSavingRecurringRuleEdit,
] = useState(false)

const [
  recurringExpenseDescription,
  setRecurringExpenseDescription,
] = useState('')

const [
  recurringExpenseCategoryId,
  setRecurringExpenseCategoryId,
] = useState('')

const [
  recurringExpenseSupplierId,
  setRecurringExpenseSupplierId,
] = useState('')

const [
  recurringExpenseFrequency,
  setRecurringExpenseFrequency,
] = useState('MONTHLY')

const [
  recurringExpenseAmountMode,
  setRecurringExpenseAmountMode,
] = useState('FIXED')

const [
  recurringExpenseAmount,
  setRecurringExpenseAmount,
] = useState('')

const [
  recurringExpenseCurrency,
  setRecurringExpenseCurrency,
] = useState('EUR')

const [
  recurringExpenseStartDate,
  setRecurringExpenseStartDate,
] = useState('')

const [
  recurringExpenseEndDate,
  setRecurringExpenseEndDate,
] = useState('')

const [
  recurringExpenseDueDay,
  setRecurringExpenseDueDay,
] = useState('')

const [
  recurringExpenseNotes,
  setRecurringExpenseNotes,
] = useState('')

const [
  savingRecurringExpense,
  setSavingRecurringExpense,
] = useState(false)

const [newPayableDescription, setNewPayableDescription] =
  useState('')

const [newPayableAmount, setNewPayableAmount] =
  useState('')

const [newPayableDueDate, setNewPayableDueDate] =
  useState('')

const [newPayableCurrency, setNewPayableCurrency] =
  useState('EUR')

const [newPayableCreditorType, setNewPayableCreditorType] =
  useState<'SUPPLIER' | 'PARTNER' | 'OTHER'>('OTHER')

const [suppliers, setSuppliers] = useState<
  { id: string; name: string }[]
>([])

const [allSuppliers, setAllSuppliers] = useState<
  {
    id: string
    name: string
    nif_nipc: string | null
    phone: string | null
    email: string | null
    address: string | null
    iban: string | null
    notes: string | null
    is_active: boolean
  }[]
>([])

const [showSuppliers, setShowSuppliers] =
  useState(false)

const [editingSupplier, setEditingSupplier] =
  useState<{
    id: string
    name: string
    nif_nipc: string | null
    phone: string | null
    email: string | null
    address: string | null
    iban: string | null
    notes: string | null
    is_active: boolean
  } | null>(null)

const [editSupplierName, setEditSupplierName] =
  useState('')

const [editSupplierNif, setEditSupplierNif] =
  useState('')

const [editSupplierPhone, setEditSupplierPhone] =
  useState('')

const [editSupplierEmail, setEditSupplierEmail] =
  useState('')

const [editSupplierAddress, setEditSupplierAddress] =
  useState('')

const [editSupplierIban, setEditSupplierIban] =
  useState('')

const [editSupplierNotes, setEditSupplierNotes] =
  useState('')


const [expenseCategories, setExpenseCategories] = useState<
  { id: string; name: string }[]
>([])

const [allExpenseCategories, setAllExpenseCategories] = useState<
  { id: string; name: string; is_active: boolean }[]
>([])

const [showExpenseCategories, setShowExpenseCategories] =
  useState(false)

const [newExpenseCategoryName, setNewExpenseCategoryName] =
  useState('')

const [editingExpenseCategory, setEditingExpenseCategory] =
  useState<{ id: string; name: string } | null>(null)

const [editExpenseCategoryName, setEditExpenseCategoryName] =
  useState('')

const [newPayableCategoryId, setNewPayableCategoryId] =
  useState('')

const [newPayableSupplierId, setNewPayableSupplierId] =
  useState('')

const [showNewSupplier, setShowNewSupplier] =
  useState(false)

const [newSupplierName, setNewSupplierName] =
  useState('')

const [newSupplierNif, setNewSupplierNif] =
  useState('')

const [savingNewSupplier, setSavingNewSupplier] =
  useState(false)

const [savingNewPayable, setSavingNewPayable] =
  useState(false)

const [confirmingEstimatedPayable, setConfirmingEstimatedPayable] =
  useState<PayableRow | null>(null)

const [estimatedActualAmount, setEstimatedActualAmount] = useState('')

const [savingEstimatedConfirmation, setSavingEstimatedConfirmation] =
  useState(false)

const [editingExpensePayable, setEditingExpensePayable] =
  useState<PayableRow | null>(null)

const [editExpenseDescription, setEditExpenseDescription] =
  useState('')

const [editExpenseAmount, setEditExpenseAmount] =
  useState('')

const [editExpenseDueDate, setEditExpenseDueDate] =
  useState('')

const [editExpenseCategoryId, setEditExpenseCategoryId] =
  useState('')

const [editExpenseSupplierId, setEditExpenseSupplierId] =
  useState('')

const [savingExpenseEdit, setSavingExpenseEdit] =
  useState(false)

const [receivablesFilter, setReceivablesFilter] =
  useState<'OPEN' | 'PAID' | 'CANCELLED' | 'ALL'>('OPEN')

const [payablesFilter, setPayablesFilter] =
  useState<'OPEN' | 'PAID' | 'CANCELLED' | 'ALL'>('OPEN')

const [showFuturePayables, setShowFuturePayables] =
  useState(false)

const [payablesTypeFilter, setPayablesTypeFilter] =
  useState<
    'ALL' |
    'SALE_ITEM_FEE' |
    'PARTNER_COMMISSION' |
    'EXPENSE'
  >('ALL')

const [showTransferForm, setShowTransferForm] = useState(false)
const [showAccountManagement, setShowAccountManagement] = useState(false)

const [transferFromAccountId, setTransferFromAccountId] = useState('')
const [transferToAccountId, setTransferToAccountId] = useState('')
const [transferAmount, setTransferAmount] = useState('')
const [showInsufficientBalanceWarning, setShowInsufficientBalanceWarning] =
  useState(false)

const pendingReceivables = receivables.filter(
  (item) =>
    item.status !== 'PAID' &&
    item.status !== 'CANCELLED'
)

const pendingReceivablesTotal =
  pendingReceivables.reduce(
    (total, item) =>
      total + Number(item.outstanding_amount || 0),
    0
  )

const filteredReceivables = receivables.filter((item) => {
  if (receivablesFilter === 'PAID') {
    return item.status === 'PAID'
  }

  if (receivablesFilter === 'CANCELLED') {
    return item.status === 'CANCELLED'
  }

  if (receivablesFilter === 'ALL') {
    return true
  }

  return (
    item.status !== 'PAID' &&
    item.status !== 'CANCELLED'
  )
})

const pendingPayables = payables.filter(
  (item) =>
    item.payment_status !== 'PAID' &&
    item.cost_status !== 'CANCELLED'
)

const pendingPayablesTotal =
  pendingPayables.reduce(
    (total, item) =>
      total + Number(item.outstanding_amount || 0),
    0
  )

const filteredPayables = payables.filter((item) => {
  /*
    Filtro pela situação financeira.
  */
  let matchesStatus = false

  if (payablesFilter === 'PAID') {
    matchesStatus =
      item.payment_status === 'PAID'
  } else if (payablesFilter === 'CANCELLED') {
    matchesStatus =
      item.cost_status === 'CANCELLED'
  } else if (payablesFilter === 'ALL') {
    matchesStatus = true
  } else {
    matchesStatus =
      item.payment_status !== 'PAID' &&
      item.cost_status !== 'CANCELLED'
  }

  if (!matchesStatus) {
    return false
  }

  /*
    Filtro pela natureza da obrigação.
  */
  if (payablesTypeFilter === 'ALL') {
    return true
  }

  return item.source_type === payablesTypeFilter
})

const currentMonthEnd = (() => {
  const today = new Date()

  return new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  )
})()

const currentPayables = filteredPayables.filter(
  (item) => {
    /*
      Taxas, comissões e outras obrigações sem
      vencimento permanecem sempre entre as
      obrigações atuais.
    */
    if (item.source_type !== 'EXPENSE') {
      return true
    }

    /*
      Despesa sem vencimento também exige
      atenção atual.
    */
    if (!item.due_date) {
      return true
    }

    const dueDate = new Date(
      `${item.due_date}T23:59:59`
    )

    return dueDate <= currentMonthEnd
  }
)

const futurePayables = filteredPayables.filter(
  (item) => {
    if (
      item.source_type !== 'EXPENSE' ||
      !item.due_date
    ) {
      return false
    }

    const dueDate = new Date(
      `${item.due_date}T23:59:59`
    )

    return dueDate > currentMonthEnd
  }
)

const displayedPayables =
  payablesFilter === 'OPEN'
    ? showFuturePayables
      ? [...currentPayables, ...futurePayables]
      : currentPayables
    : filteredPayables

const filteredFinancialMovements =
  financialMovements.filter((movement) => {
    const search = financialMovementSearch
      .trim()
      .toLowerCase()

    if (
      financialMovementAccountFilter !== 'ALL' &&
      movement.financial_account_id !==
        financialMovementAccountFilter
    ) {
      return false
    }

if (
  financialMovementTypeFilter !== 'ALL' &&
  movement.movement_type !== financialMovementTypeFilter
) {
  return false
}

const movementDate =
  movement.movement_date.slice(0, 10)

if (
  financialMovementDateFrom &&
  movementDate < financialMovementDateFrom
) {
  return false
}

if (
  financialMovementDateTo &&
  movementDate > financialMovementDateTo
) {
  return false
}

    if (!search) {
      return true
    }

    const description =
      financialMovementDescriptions.find(
        (item) =>
          item.financial_movement_id === movement.id
      )?.description ||
      movement.notes ||
      movement.source_type ||
      ''

    const accountName =
      getFinancialAccountName(
        movement.financial_account_id
      )

    return (
      description.toLowerCase().includes(search) ||
      accountName.toLowerCase().includes(search)
    )
  })
  .sort((a, b) => {
    const dayA = a.movement_date.slice(0, 10)
    const dayB = b.movement_date.slice(0, 10)

    if (dayA !== dayB) {
      return dayB.localeCompare(dayA)
    }

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    )
  })

const selectedAccountStatementRows = (() => {
  if (!selectedFinancialAccountStatement) {
    return []
  }

const accountMovements = [...accountStatementMovements]
  .sort((a, b) => {

      const dateComparison =
        new Date(b.movement_date).getTime() -
        new Date(a.movement_date).getTime()

      if (dateComparison !== 0) {
        return dateComparison
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      )
    })

  let runningBalance = Number(
    selectedFinancialAccountStatement.current_balance
  )

  return accountMovements.map((movement) => {
    const balanceAfterMovement = runningBalance
    const amount = Number(movement.amount)

    const isInflow =
      movement.movement_type === 'INFLOW' ||
      movement.source_type ===
        'ACCOUNT_TRANSFER_DESTINATION'

    const isOutflow =
      movement.movement_type === 'OUTFLOW' ||
      movement.source_type ===
        'ACCOUNT_TRANSFER_SOURCE'

    if (isInflow) {
      runningBalance -= amount
    }

    if (isOutflow) {
      runningBalance += amount
    }

    return {
      ...movement,
      statement_inflow: isInflow ? amount : 0,
      statement_outflow: isOutflow ? amount : 0,
      statement_balance: balanceAfterMovement,
    }
  })
})()


const activeFinancialAccountBalances =
  financialAccountBalances.filter(
    (account) => account.is_active
  )

const manageableFinancialAccounts = financialAccountBalances.filter((account) => account.account_type !== 'TRANSIT')

const mainFinancialAccounts =
  activeFinancialAccountBalances.filter(
    (account) => account.parent_account_id === null
  )

const miniCashAccounts =
  activeFinancialAccountBalances.filter(
    (account) => account.parent_account_id !== null
  )

const cashAccounts =
  mainFinancialAccounts.filter(
    (account) => account.account_type === 'CASH'
  )

const bankAccounts =
  mainFinancialAccounts.filter(
    (account) => account.account_type === 'BANK'
  )

const transitAccounts =
  mainFinancialAccounts.filter(
    (account) => account.account_type === 'TRANSIT'
  )

const transferFromAccount =
  activeFinancialAccountBalances.find(
    (account) =>
      account.financial_account_id === transferFromAccountId
  )

const transferToAccount =
  activeFinancialAccountBalances.find(
    (account) =>
      account.financial_account_id === transferToAccountId
  )

const totalPhysicalCash = activeFinancialAccountBalances
  .filter(
    (account) =>
      account.account_type === 'CASH' &&
      account.currency === 'EUR'
  )
  .reduce(
    (total, account) =>
      total + Number(account.current_balance || 0),
    0
  )

function getFinancialAccountName(accountId: string) {
  const account = financialAccountBalances.find(
    (item) => item.financial_account_id === accountId
  )

  if (!account) {
    return 'Conta não identificada'
  }

  if (
    account.account_type === 'CASH' &&
    account.parent_account_id === null
  ) {
    return 'Caixa principal'
  }

  return account.name
}

function getPaymentMethodName(paymentMethodId: string) {
  const method = paymentMethods.find(
    (item) => item.id === paymentMethodId
  )

  return method?.name ?? 'Forma não identificada'
}

function getPayablePayments(payableId: string) {
  return outgoingPayments.filter(
    (item) => item.payable_id === payableId
  )
}

function getPayableInstallments(payableId: string) {
  return payableInstallments.filter(
    (item) => item.payable_id === payableId
  )
}

async function loadFinanceiro() {

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data: profileData, error: profileError } = await supabase.from('current_user_profile').select('access_level, is_active').single()
    if (profileError || !profileData || !profileData.is_active) {
      setError(profileError?.message ?? 'Utilizador sem acesso ativo.')
      setLoading(false)
      return
    }
    setFinancialUserProfile(profileData)

    const { data: canManageAccounts, error: accountsPermissionError } = await supabase.rpc('has_permission', { p_code: 'manage_financial_accounts' })
    setCanManageFinancialAccounts(!accountsPermissionError && canManageAccounts === true)
    if (!accountsPermissionError && canManageAccounts === true) {
      const { data: accountUsers, error: accountUsersError } = await supabase
        .from('app_users')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (accountUsersError) console.error('Erro ao carregar colaboradores:', accountUsersError)
      setFinancialAccountUsers(accountUsersError ? [] : (accountUsers ?? []))
    } else {
      setFinancialAccountUsers([])
    }

    await supabase.rpc(
      'rpc_maintain_recurring_expense_forecast'
    )

    const { data: supplierData } = await supabase
      .from('partners')
      .select('id, name')
      .eq('is_supplier', true)
      .eq('is_active', true)
      .order('name')

    setSuppliers(supplierData ?? [])

    const { data: allSupplierData } = await supabase
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
      .eq('is_supplier', true)
      .order('name')

    setAllSuppliers(allSupplierData ?? [])


    const { data: incomeCategoryData } = await supabase
      .from('income_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    setIncomeCategories(incomeCategoryData ?? [])

    const { data: incomeClientData } = await supabase
      .from('clients')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    setIncomeClients(incomeClientData ?? [])

    const { data: incomePartnerData } = await supabase
      .from('partners')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    setIncomePartners(incomePartnerData ?? [])

    const { data: expenseCategoryData } = await supabase
      .from('expense_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    setExpenseCategories(expenseCategoryData ?? [])

    const { data: allExpenseCategoryData } = await supabase
      .from('expense_categories')
      .select('id, name, is_active')
      .order('name')

    setAllExpenseCategories(
      allExpenseCategoryData ?? []
    )

    const { data: recurringExpenseRuleData } = await supabase
      .from('recurring_expense_rules')
      .select(`
        id,
        description,
        category_id,
        supplier_partner_id,
        frequency,
        amount_mode,
        default_amount,
        estimated_amount,
        currency,
        start_date,
        end_date,
        due_day,
        notes,
        is_active
      `)
      .order('description')

    setRecurringExpenseRules(
      recurringExpenseRuleData ?? []
    )

    const { data, error } = await supabase
      .from('receivables')
      .select(`
        id,
        debtor_type,
        debtor_id,
        source_type,
        source_id,
        amount,
        currency,
        due_date,
        status
      `)
      .order('due_date', { ascending: true })

    if (error) {
  setError(error.message)
  setLoading(false)
  return
}

const {
  data: receivableBalancesData,
  error: receivableBalancesError,
} = await supabase
  .from('dashboard_receivables')
  .select(`
    receivable_id,
    received_amount,
    outstanding_amount
  `)

if (receivableBalancesError) {
  setError(receivableBalancesError.message)
  setLoading(false)
  return
}

const baseReceivables =
  (data ?? []).map((item) => {
    const balance = receivableBalancesData?.find(
      (row) => row.receivable_id === item.id
    )

    return {
      ...item,
      received_amount: Number(
        balance?.received_amount ?? 0
      ),
      outstanding_amount: Number(
        balance?.outstanding_amount ?? item.amount
      ),
    }
  }) as Omit<
    ReceivableRow,
    'debtor_name'
  >[]

const installmentIds = Array.from(
  new Set(
    baseReceivables
      .filter(
        (item) =>
          item.source_type === 'CLIENT_INSTALLMENT' &&
          item.source_id
      )
      .map((item) => item.source_id as string)
  )
)

let receivableInstallments: {
  installment_id: string
  sale_number: string
  installment_number: number
}[] = []

if (installmentIds.length > 0) {
  const {
    data: installmentData,
    error: installmentError,
  } = await supabase
    .from('dashboard_installments')
    .select(`
      installment_id,
      sale_number,
      installment_number
    `)
    .in('installment_id', installmentIds)

  if (installmentError) {
    setError(installmentError.message)
    setLoading(false)
    return
  }

  receivableInstallments =
    installmentData ?? []
}


const clientIds = Array.from(
  new Set(
    baseReceivables
      .filter(
        (item) =>
          item.debtor_type === 'CLIENT' &&
          item.debtor_id
      )
      .map((item) => item.debtor_id as string)
  )
)

const partnerIds = Array.from(
  new Set(
    baseReceivables
      .filter(
        (item) =>
          item.debtor_type === 'PARTNER' &&
          item.debtor_id
      )
      .map((item) => item.debtor_id as string)
  )
)

const incomeIds = Array.from(
  new Set(
    baseReceivables
      .filter(
        (item) =>
          item.source_type === 'INCOME' &&
          item.source_id
      )
      .map((item) => item.source_id as string)
  )
)

let receivableClients: {
  id: string
  name: string
}[] = []

let partners: {
  id: string
  name: string
}[] = []

let incomeSources: {
  id: string
  other_debtor_name: string | null
  category_id: string | null
}[] = []

if (clientIds.length > 0) {
  const { data: clientData } = await supabase
    .from('clients')
    .select('id, name')
    .in('id', clientIds)

  receivableClients = clientData ?? []
}

if (partnerIds.length > 0) {
  const { data: partnerData } = await supabase
    .from('partners')
    .select('id, name')
    .in('id', partnerIds)

  partners = partnerData ?? []
}

if (incomeIds.length > 0) {
  const { data: incomeData } = await supabase
    .from('incomes')
    .select('id, other_debtor_name, category_id')
    .in('id', incomeIds)

  incomeSources = incomeData ?? []
}

const enrichedReceivables =
  baseReceivables.map((item) => {
    const client =
      item.debtor_type === 'CLIENT'
        ? receivableClients.find(
            (client) =>
              client.id === item.debtor_id
          )
        : null

    const partner =
      item.debtor_type === 'PARTNER'
        ? partners.find(
            (partner) =>
              partner.id === item.debtor_id
          )
        : null

    const income =
      item.source_type === 'INCOME'
        ? incomeSources.find(
            (income) =>
              income.id === item.source_id
          )
        : null

const incomeCategory =
  income?.category_id
    ? (incomeCategoryData ?? []).find(
        (category) =>
          category.id === income.category_id
      )
    : null

const installment =
  item.source_type === 'CLIENT_INSTALLMENT' &&
  item.source_id
    ? receivableInstallments.find(
        (row) =>
          row.installment_id === item.source_id
      )
    : null

    return {
      ...item,
      debtor_name:
        client?.name ??
        partner?.name ??
        income?.other_debtor_name ??
        null,
      source_name:
        item.source_type === 'INCOME'
          ? incomeCategory?.name ?? 'Receita'
          : null,

sale_number:
  installment?.sale_number ?? null,

installment_number:
  installment?.installment_number ?? null,

    }
  })

setReceivables(enrichedReceivables)

const {
  data: payableData,
  error: payableError,
} = await supabase
  .from('payables')
  .select(`
    id,
    creditor_type,
    creditor_id,
    source_type,
    source_id,
    sale_id,
    sale_item_id,
    description,
    amount,
    currency,
    due_date,
    cost_status,
    payment_status
  `)
   .order('due_date', { ascending: true })

if (payableError) {
  setError(payableError.message)
  setLoading(false)
  return
}

const {
  data: payableBalancesData,
  error: payableBalancesError,
} = await supabase
  .from('dashboard_payables')
  .select(`
    payable_id,
    paid_amount,
    outstanding_amount,
    due_date,
    due_status
  `)

if (payableBalancesError) {
  setError(payableBalancesError.message)
  setLoading(false)
  return
}

const basePayables =
  (payableData ?? []).map((item) => {
    const balance = payableBalancesData?.find(
      (row) => row.payable_id === item.id
    )

return {
  ...item,
  paid_amount: Number(balance?.paid_amount ?? 0),
  outstanding_amount: Number(
    balance?.outstanding_amount ?? item.amount
  ),
  due_date: balance?.due_date ?? item.due_date,
  due_status: balance?.due_status ?? 'OPEN',

  sale_number: null,
  item_number: null,
  client_name: null,
}

  }) as Omit<
    PayableRow,
    'creditor_name'
  >[]

const expenseIds = Array.from(
  new Set(
    basePayables
      .filter(
        (item) =>
          item.source_type === 'EXPENSE' &&
          item.source_id
      )
      .map((item) => item.source_id as string)
  )
)

let payableExpenses: {
  id: string
  category_id: string | null
}[] = []

if (expenseIds.length > 0) {
  const { data: payableExpenseData } =
    await supabase
      .from('expenses')
      .select('id, category_id')
      .in('id', expenseIds)

  payableExpenses = payableExpenseData ?? []
}

basePayables.forEach((item) => {
  const expense =
    item.source_type === 'EXPENSE'
      ? payableExpenses.find(
          (expense) =>
            expense.id === item.source_id
        )
      : null

  item.expense_category_id =
    expense?.category_id ?? null
})

/*
  Carrega a origem comercial das contas a pagar
  vinculadas a vendas.
*/
const payableSaleIds = Array.from(
  new Set(
    basePayables
      .filter((item) => item.sale_id)
      .map((item) => item.sale_id as string)
  )
)

const payableSaleItemIds = Array.from(
  new Set(
    basePayables
      .filter((item) => item.sale_item_id)
      .map((item) => item.sale_item_id as string)
  )
)

let payableSales: {
  id: string
  sale_number: string
  client_id: string | null
}[] = []

if (payableSaleIds.length > 0) {
  const { data: payableSaleData, error: payableSaleError } =
    await supabase
      .from('sales')
      .select('id, sale_number, client_id')
      .in('id', payableSaleIds)

  if (payableSaleError) {
    setError(payableSaleError.message)
    setLoading(false)
    return
  }

  payableSales = payableSaleData ?? []
}

let payableSaleItems: {
  id: string
  item_number: number
}[] = []

if (payableSaleItemIds.length > 0) {
  const {
    data: payableSaleItemData,
    error: payableSaleItemError,
  } = await supabase
    .from('sale_items')
    .select('id, item_number')
    .in('id', payableSaleItemIds)

  if (payableSaleItemError) {
    setError(payableSaleItemError.message)
    setLoading(false)
    return
  }

  payableSaleItems = payableSaleItemData ?? []
}

/*
  A partir das vendas encontradas, reúne os
  clientes necessários em uma única consulta.
*/
const payableClientIds = Array.from(
  new Set(
    payableSales
      .filter((sale) => sale.client_id)
      .map((sale) => sale.client_id as string)
  )
)

let payableClients: {
  id: string
  name: string
}[] = []

if (payableClientIds.length > 0) {
  const {
    data: payableClientData,
    error: payableClientError,
  } = await supabase
    .from('clients')
    .select('id, name')
    .in('id', payableClientIds)

  if (payableClientError) {
    setError(payableClientError.message)
    setLoading(false)
    return
  }

  payableClients = payableClientData ?? []
}

/*
  Enriquece cada conta a pagar com:
  número da venda, número do item e cliente.
*/
basePayables.forEach((item) => {
  const sale = item.sale_id
    ? payableSales.find(
        (sale) => sale.id === item.sale_id
      )
    : null

  const saleItem = item.sale_item_id
    ? payableSaleItems.find(
        (saleItem) =>
          saleItem.id === item.sale_item_id
      )
    : null

  const client = sale?.client_id
    ? payableClients.find(
        (client) => client.id === sale.client_id
      )
    : null

  item.sale_number =
    sale?.sale_number ?? null

  item.item_number =
    saleItem?.item_number ?? null

  item.client_name =
    client?.name ?? null
})

const payablePartnerIds = Array.from(
  new Set(
    basePayables
      .filter(
  (item) =>
    (item.creditor_type === 'PARTNER' ||
      item.creditor_type === 'SUPPLIER') &&
    item.creditor_id
)
      .map((item) => item.creditor_id as string)
  )
)

let payablePartners: {
  id: string
  name: string
}[] = []

if (payablePartnerIds.length > 0) {
  const { data: payablePartnerData } =
    await supabase
      .from('partners')
      .select('id, name')
      .in('id', payablePartnerIds)

  payablePartners = payablePartnerData ?? []
}

const enrichedPayables =
  basePayables.map((item) => {
    const partner =
  item.creditor_type === 'PARTNER' ||
  item.creditor_type === 'SUPPLIER'
    ? payablePartners.find(
        (partner) =>
          partner.id === item.creditor_id
      )
    : null

    return {
      ...item,
creditor_name:
  partner?.name ??
  (item.source_type === 'SALE_ITEM_FEE'
    ? 'Organismo oficial'
    : item.source_type === 'EXPENSE'
      ? 'Sem fornecedor'
      : null),

    }
  })

setPayables(enrichedPayables)

const {
  data: payableAllocationsData,
  error: payableAllocationsError,
} = await supabase
  .from('payable_payment_allocations')
  .select(`
    payable_id,
    payable_installment_id,
    outgoing_payment_id,
    allocated_amount,
    currency
  `)

if (payableAllocationsError) {
  setError(payableAllocationsError.message)
  setLoading(false)
  return
}

const outgoingPaymentIds = Array.from(
  new Set(
    (payableAllocationsData ?? []).map(
      (item) => item.outgoing_payment_id
    )
  )
)

let outgoingPaymentsData: {
  id: string
  payment_date: string
  amount: number
  currency: string
  confirmation_status: string
  confirmation_notes: string | null
  financial_account_id: string
  payment_method_id: string
  notes: string | null
}[] = []

if (outgoingPaymentIds.length > 0) {
  const {
    data: outgoingData,
    error: outgoingError,
  } = await supabase
    .from('outgoing_payments')
    .select(`
      id,
      payment_date,
      amount,
      currency,
      confirmation_status,
      confirmation_notes,
      financial_account_id,
      payment_method_id,
      notes
    `)
    .in('id', outgoingPaymentIds)

  if (outgoingError) {
    setError(outgoingError.message)
    setLoading(false)
    return
  }

  outgoingPaymentsData = outgoingData ?? []
}

const enrichedOutgoingPayments =
  (payableAllocationsData ?? [])
    .map((allocation) => {
      const payment = outgoingPaymentsData.find(
        (item) =>
          item.id === allocation.outgoing_payment_id
      )

      if (!payment) {
        return null
      }

      return {
        ...payment,
        payable_id: allocation.payable_id,
        payable_installment_id:
          allocation.payable_installment_id,
        allocated_amount: Number(
          allocation.allocated_amount
        ),
      }
    })
    .filter(
      (item): item is OutgoingPaymentRow =>
        item !== null
    )

setOutgoingPayments(enrichedOutgoingPayments)

const {
  data: payableInstallmentsData,
  error: payableInstallmentsError,
} = await supabase
  .from('dashboard_payable_installments')
  .select(`
    installment_id,
    payable_id,
    installment_number,
    amount,
    paid_amount,
    outstanding_amount,
    currency,
    due_date,
    payment_status,
    due_status
  `)
  .order('installment_number', {
    ascending: true,
  })

if (payableInstallmentsError) {
  setError(payableInstallmentsError.message)
  setLoading(false)
  return
}

setPayableInstallments(
  (payableInstallmentsData ?? []).map((item) => ({
    id: item.installment_id,
    payable_id: item.payable_id,
    installment_number: item.installment_number,
    amount: Number(item.amount),
    paid_amount: Number(item.paid_amount),
    outstanding_amount: Number(item.outstanding_amount),
    currency: item.currency,
    due_date: item.due_date,
    payment_status: item.payment_status,
    due_status: item.due_status,
  }))
)

const {
  data: paymentMethodsData,
  error: paymentMethodsError,
} = await supabase
  .from('payment_methods')
  .select('id, name')
  .eq('is_active', true)
  .order('name', { ascending: true })

if (paymentMethodsError) {
  setError(paymentMethodsError.message)
  setLoading(false)
  return
}

setPaymentMethods(paymentMethodsData ?? [])

const {
  data: financialAccountsData,
  error: financialAccountsError,
} = await supabase
  .from('financial_accounts')
  .select('id, name, currency')
  .eq('is_active', true)
  .order('name', { ascending: true })

if (financialAccountsError) {
  setError(financialAccountsError.message)
  setLoading(false)
  return
}

setFinancialAccounts(financialAccountsData ?? [])

const {
  data: financialAccountBalancesData,
  error: financialAccountBalancesError,
} = await supabase
  .from('dashboard_account_balances')
  .select(`
    financial_account_id,
    code,
    name,
    account_type,
    currency,
    opening_balance,
    movement_balance,
    current_balance,
    movement_count,
    parent_account_id,
    responsible_user_id,
    is_active
  `)
  .order('name', { ascending: true })

if (financialAccountBalancesError) {
  setError(financialAccountBalancesError.message)
  setLoading(false)
  return
}

setFinancialAccountBalances(
  (financialAccountBalancesData ?? []) as FinancialAccountBalanceRow[]
)

const {
  data: financialMovementsData,
  error: financialMovementsError,
} = await supabase
  .from('financial_movements')
  .select(`
    id,
    financial_account_id,
    movement_type,
    nature,
    amount,
    currency,
    movement_date,
    notes,
    source_type,
    source_id,
    created_at
  `)
  .order('movement_date', { ascending: false })
  .limit(100)

if (financialMovementsError) {
  setError(financialMovementsError.message)
  setLoading(false)
  return
}

setFinancialMovements(
  (financialMovementsData ?? []) as FinancialMovementRow[]
)

const {
  data: financialMovementDescriptionsData,
  error: financialMovementDescriptionsError,
} = await supabase.rpc(
  'get_financial_movement_descriptions'
)

if (financialMovementDescriptionsError) {
  setError(financialMovementDescriptionsError.message)
  setLoading(false)
  return
}

setFinancialMovementDescriptions(
  (financialMovementDescriptionsData ?? []) as FinancialMovementDescription[]
)

setLoading(false)
}

useEffect(() => {
  void loadFinanceiro()
}, [])


async function loadAccountStatement(

  account: FinancialAccountBalanceRow,
  mode: 'LAST_100' | 'PERIOD' = 'LAST_100',
  dateFrom = '',
  dateTo = ''
) {
  setLoadingAccountStatement(true)
  setError('')

  try {
    let query = supabase
      .from('financial_movements')
      .select(`
        id,
        financial_account_id,
        movement_type,
        nature,
        amount,
        currency,
        movement_date,
        notes,
        source_type,
        source_id,
        created_at
      `)
      .eq(
        'financial_account_id',
        account.financial_account_id
      )
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (mode === 'PERIOD') {
      if (dateFrom) {
        query = query.gte(
          'movement_date',
          `${dateFrom}T00:00:00`
        )
      }

      if (dateTo) {
        query = query.lte(
          'movement_date',
          `${dateTo}T23:59:59.999`
        )
      }
    } else {
      query = query.limit(100)
    }

    const {
      data,
      error: statementError,
    } = await query

    if (statementError) {
      setError(statementError.message)
      setAccountStatementMovements([])
      return
    }

    setAccountStatementMovements(
      (data ?? []) as FinancialMovementRow[]
    )
  } finally {
    setLoadingAccountStatement(false)
  }
}

async function loadReceivablePaymentHistory(
  receivable: ReceivableRow
) {
  setError('')
  setLoadingReceivablePaymentHistory(true)
  setSelectedReceivableHistory(receivable)
  setReceivablePaymentHistory([])

  const {
    data: allocationsData,
    error: allocationsError,
  } = await supabase
    .from('payment_allocations')
    .select(`
      payment_id,
      settled_amount,
      settled_currency
    `)
    .eq('receivable_id', receivable.id)

  if (allocationsError) {
    setError(allocationsError.message)
    setLoadingReceivablePaymentHistory(false)
    return
  }

  const allocations = allocationsData ?? []

  if (allocations.length === 0) {
    setLoadingReceivablePaymentHistory(false)
    return
  }

  const paymentIds = Array.from(
    new Set(
      allocations.map(
        (allocation) => allocation.payment_id
      )
    )
  )

  const {
    data: paymentsData,
    error: paymentsError,
  } = await supabase
    .from('payments')
    .select(`
      id,
      payment_number,
      payment_date,
      confirmation_status,
      cancellation_reason,
      cancelled_at
    `)
    .in('id', paymentIds)
    .order('payment_date', { ascending: false })

  if (paymentsError) {
    setError(paymentsError.message)
    setLoadingReceivablePaymentHistory(false)
    return
  }

  const {
    data: movementsData,
    error: movementsError,
  } = await supabase
    .from('payment_movements')
    .select(`
      payment_id,
      payment_method_id,
      financial_account_id,
      gross_amount,
      currency
    `)
    .in('payment_id', paymentIds)

  if (movementsError) {
    setError(movementsError.message)
    setLoadingReceivablePaymentHistory(false)
    return
  }

  const history =
    (paymentsData ?? []).map((payment) => {
      const allocation = allocations.find(
        (item) =>
          item.payment_id === payment.id
      )

      const movement = (movementsData ?? []).find(
        (item) =>
          item.payment_id === payment.id
      )

      return {
        payment_id: payment.id,
        payment_number: payment.payment_number,
        payment_date: payment.payment_date,
        confirmation_status:
          payment.confirmation_status,
        cancellation_reason:
          payment.cancellation_reason,
        cancelled_at: payment.cancelled_at,
        settled_amount: Number(
          allocation?.settled_amount ?? 0
        ),
        currency:
          allocation?.settled_currency ??
          movement?.currency ??
          receivable.currency,
        payment_method_id:
          movement?.payment_method_id ?? null,
        financial_account_id:
          movement?.financial_account_id ?? null,
        gross_amount:
          movement?.gross_amount != null
            ? Number(movement.gross_amount)
            : null,
      }
    }) as ReceivablePaymentHistoryRow[]

  setReceivablePaymentHistory(history)
  setLoadingReceivablePaymentHistory(false)
}


async function executeReceiptPayment(
  amount: number,
  warningData?: {
    pendingOfficialFees: number
    installmentId: string
  }
) {

  if (!selectedReceivable) {
    return
  }

  setSavingReceipt(true)

  const paymentDate = new Date(
    `${receiptDate}T12:00:00`
  ).toISOString()

  const { data, error: paymentError } =
    await supabase.rpc('rpc_record_payment', {
      p_received_amount: amount,
      p_received_currency:
        selectedReceivable.currency || 'EUR',
      p_payment_method_id:
        receiptPaymentMethodId,
      p_financial_account_id:
        receiptFinancialAccountId,
      p_payer_type:
        selectedReceivable.debtor_type,
      p_payer_id:
        selectedReceivable.debtor_id,
      p_client_id: null,
      p_sale_id: null,
      p_allocations: [
        {
          receivable_id:
            selectedReceivable.id,
          received_amount: amount,
          settled_amount: amount,
        },
      ],
      p_processing_fee_amount: 0,
      p_confirmation_notes: null,
      p_confirm_now: true,
      p_payment_date: paymentDate,
    })

if (paymentError) {
  setError(paymentError.message)
  setSavingReceipt(false)
  return
}

console.log(
  'Recebimento registrado:',
  data
)

if (warningData) {
  const paymentId = data?.[0]?.payment_id

  if (!paymentId) {
    setError(
      'O recebimento foi registrado, mas não foi possível identificar o pagamento para registrar o histórico.'
    )
    setSavingReceipt(false)
    return
  }

  const { error: auditError } = await supabase.rpc(
    'rpc_log_payment_below_official_fees',
    {
      p_payment_id: paymentId,
      p_receivable_id: selectedReceivable.id,
      p_installment_id: warningData.installmentId,
      p_received_amount: amount,
      p_official_fees_pending:
        warningData.pendingOfficialFees,
    }
  )

  if (auditError) {
    setError(
      `O recebimento foi registrado, mas houve erro ao registrar o histórico: ${auditError.message}`
    )
    setSavingReceipt(false)
    return
  }
}

  setReceiptFeeWarning(null)
  setSelectedReceivable(null)
  setReceiptAmount('')
  setReceiptDate('')
  setReceiptPaymentMethodId('')
  setReceiptFinancialAccountId('')

  await loadFinanceiro()

  if (selectedFinancialAccountStatement) {
    await loadAccountStatement(
      selectedFinancialAccountStatement,
      accountStatementMode,
      accountStatementDateFrom,
      accountStatementDateTo
    )
  }

  setSavingReceipt(false)
}

async function handleReverseReceivablePayment() {
  if (
    !selectedPaymentToReverse ||
    !selectedReceivableHistory
  ) {
    return
  }

  const reason = receivableReversalReason.trim()

  if (reason.length < 3) {
    setError(
      'Informe o motivo da reversão com pelo menos 3 caracteres.'
    )
    return
  }

  setError('')
  setReversingReceivablePayment(true)

  const { error: reversalError } =
    await supabase.rpc('rpc_reverse_payment', {
      p_payment_id:
        selectedPaymentToReverse.payment_id,
      p_reason: reason,
    })

  if (reversalError) {
    setError(reversalError.message)
    setReversingReceivablePayment(false)
    return
  }

  setSelectedPaymentToReverse(null)
  setReceivableReversalReason('')
  setSelectedReceivableHistory(null)
  setReversingReceivablePayment(false)

  window.location.reload()
}

async function handleConfirmReceipt() {
  if (!selectedReceivable) {
    return
  }

  setError('')

  const amount = Number(receiptAmount)

  if (!amount || amount <= 0) {
    setError('Informe um valor recebido válido.')
    return
  }

  if (
  amount >
  Number(selectedReceivable.outstanding_amount)
) {
  setError(
    'O valor recebido não pode ser superior ao valor pendente.'
  )
  return
}

  if (!receiptDate) {
    setError('Informe a data do recebimento.')
    return
  }

  if (!receiptPaymentMethodId) {
    setError('Selecione a forma de pagamento.')
    return
  }

if (!receiptFinancialAccountId) {
  setError('Selecione a conta de destino.')
  return
}


if (
  selectedReceivable.source_type === 'CLIENT_INSTALLMENT' &&
  selectedReceivable.source_id
) {
  const { data: officialFeeBalance, error: officialFeeError } =
    await supabase.rpc('get_installment_official_fee_balance', {
      p_installment_id: selectedReceivable.source_id,
    })

  if (officialFeeError) {
    setError(
      `Não foi possível verificar as taxas oficiais pendentes: ${officialFeeError.message}`
    )
    return
  }

  const pendingOfficialFees = Number(officialFeeBalance ?? 0)

if (
  pendingOfficialFees > 0 &&
  amount < pendingOfficialFees
) {
  setReceiptFeeWarning({
    receivedAmount: amount,
    pendingOfficialFees,
  })

  return
}

}

await executeReceiptPayment(amount)

}

async function handleConfirmPayable() {
  if (!selectedPayable) {
    return
  }

  setError('')

const installments = getPayableInstallments(
  selectedPayable.id
)

if (
  installments.length > 0 &&
  !selectedPayableInstallment
) {
  setError('Selecione a parcela que está sendo paga.')
  return
}

   const amount = Number(payableAmount)

  if (!amount || amount <= 0) {
    setError('Informe um valor pago válido.')
    return
  }

  if (!payableDate) {
    setError('Informe a data do pagamento.')
    return
  }

  if (!payablePaymentMethodId) {
    setError('Selecione a forma de pagamento.')
    return
  }

  if (!payableFinancialAccountId) {
    setError('Selecione a conta de saída.')
    return
  }

  setSavingPayable(true)

  const paymentDate = new Date(
    `${payableDate}T12:00:00`
  ).toISOString()

  const { data, error: paymentError } =
    await supabase.rpc('rpc_record_outgoing_payment', {
      p_payable_id: selectedPayable.id,
      p_amount: amount,
      p_currency: selectedPayable.currency || 'EUR',
      p_payment_method_id: payablePaymentMethodId,
      p_financial_account_id: payableFinancialAccountId,
      p_payment_date: paymentDate,
      p_notes: null,
      p_confirm_now: true,
      p_payable_installment_id:
        selectedPayableInstallment?.id ?? null,
    })

  if (paymentError) {
    setError(paymentError.message)
    setSavingPayable(false)
    return
  }

  console.log('Pagamento registrado:', data)

  setSelectedPayable(null)
  setPayableAmount('')
  setPayableDate('')
  setPayablePaymentMethodId('')
  setPayableFinancialAccountId('')

  await loadFinanceiro()

  if (selectedFinancialAccountStatement) {
    await loadAccountStatement(
      selectedFinancialAccountStatement,
      accountStatementMode,
      accountStatementDateFrom,
      accountStatementDateTo
    )
  }

  setSavingPayable(false)
}

async function handleCreateExpensePayable() {
  setError('')

  const description = newPayableDescription.trim()
  const amount = Number(newPayableAmount)

  if (description.length < 3) {
    setError('Informe a descrição da despesa.')
    return
  }

  if (!amount || amount <= 0) {
    setError('Informe um valor superior a zero.')
    return
  }

  setSavingNewPayable(true)

  const { error: createError } = await supabase.rpc(
    'rpc_create_expense_payable',
    {
      p_description: description,
      p_amount: amount,
      p_currency: newPayableCurrency,
      p_due_date: newPayableDueDate || null,
            p_category_id: newPayableCategoryId || null,
            p_supplier_partner_id:
        newPayableSupplierId || null,
      p_notes: null,
    }
  )

  if (createError) {
    setError(createError.message)
    setSavingNewPayable(false)
    return
  }

  setNewPayableDescription('')
  setNewPayableAmount('')
  setNewPayableDueDate('')
  setNewPayableCurrency('EUR')
  setNewPayableCategoryId('')
  setNewPayableSupplierId('')
  setShowNewPayable(false)
  setSavingNewPayable(false)

  window.location.reload()
}

async function handleEditIncomeReceivable(
  receivable: ReceivableRow
) {
  if (
    receivable.source_type !== 'INCOME' ||
    !receivable.source_id
  ) {
    return
  }

  setError('')

  const { data: income, error: incomeError } =
    await supabase
      .from('incomes')
      .select(`
        id,
        category_id,
        description,
        debtor_type,
        client_id,
        partner_id,
        other_debtor_name,
        expected_amount,
        currency,
        due_date,
        reference_date,
        notes
      `)
      .eq('id', receivable.source_id)
      .single()

  if (incomeError || !income) {
    setError(
      incomeError?.message ??
        'Não foi possível carregar a receita.'
    )
    return
  }

  setEditingIncomeReceivable(receivable)

  setEditIncomeDescription(
    income.description ?? ''
  )

  setEditIncomeAmount(
    String(income.expected_amount ?? '')
  )

  setEditIncomeCurrency(
    income.currency ?? 'EUR'
  )

  setEditIncomeDueDate(
    income.due_date ?? ''
  )

  setEditIncomeReferenceDate(
    income.reference_date ?? ''
  )

  setEditIncomeCategoryId(
    income.category_id ?? ''
  )

  setEditIncomeDebtorType(
    income.debtor_type as
      | 'CLIENT'
      | 'PARTNER'
      | 'OTHER'
  )

  setEditIncomeClientId(
    income.client_id ?? ''
  )

  setEditIncomePartnerId(
    income.partner_id ?? ''
  )

  setEditIncomeOtherDebtorName(
    income.other_debtor_name ?? ''
  )

  setEditIncomeNotes(
    income.notes ?? ''
  )
}


async function handleSaveEditIncome() {
  if (
    !editingIncomeReceivable ||
    !editingIncomeReceivable.source_id
  ) {
    return
  }

  setError('')

  const description = editIncomeDescription.trim()
  const amount = Number(editIncomeAmount)

  if (description.length < 3) {
    setError('Informe a descrição da receita.')
    return
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setError('Informe um valor superior a zero.')
    return
  }

  if (!editIncomeCurrency) {
    setError('Informe a moeda.')
    return
  }

  if (
    editIncomeDebtorType === 'CLIENT' &&
    !editIncomeClientId
  ) {
    setError('Selecione o cliente devedor.')
    return
  }

  if (
    editIncomeDebtorType === 'PARTNER' &&
    !editIncomePartnerId
  ) {
    setError('Selecione o parceiro devedor.')
    return
  }

  if (
    editIncomeDebtorType === 'OTHER' &&
    editIncomeOtherDebtorName.trim().length < 2
  ) {
    setError('Informe o nome do devedor.')
    return
  }

  setSavingEditIncome(true)

  const { error: updateError } = await supabase.rpc(
    'rpc_update_income_receivable',
    {
      p_income_id:
        editingIncomeReceivable.source_id,

      p_description: description,

      p_amount: amount,

      p_currency: editIncomeCurrency,

      p_due_date:
        editIncomeDueDate || null,

      p_category_id:
        editIncomeCategoryId || null,

      p_debtor_type:
        editIncomeDebtorType,

      p_client_id:
        editIncomeDebtorType === 'CLIENT'
          ? editIncomeClientId
          : null,

      p_partner_id:
        editIncomeDebtorType === 'PARTNER'
          ? editIncomePartnerId
          : null,

      p_other_debtor_name:
        editIncomeDebtorType === 'OTHER'
          ? editIncomeOtherDebtorName.trim()
          : null,

      p_reference_date:
        editIncomeReferenceDate || null,

      p_notes:
        editIncomeNotes.trim() || null,
    }
  )

  if (updateError) {
    setError(updateError.message)
    setSavingEditIncome(false)
    return
  }

  setEditingIncomeReceivable(null)

  setEditIncomeDescription('')
  setEditIncomeAmount('')
  setEditIncomeCurrency('EUR')
  setEditIncomeDueDate('')
  setEditIncomeReferenceDate('')
  setEditIncomeCategoryId('')
  setEditIncomeDebtorType('OTHER')
  setEditIncomeClientId('')
  setEditIncomePartnerId('')
  setEditIncomeOtherDebtorName('')
  setEditIncomeNotes('')
  setSavingEditIncome(false)

  window.location.reload()
}


async function handleCreateIncomeReceivable() {
  setError('')

  const description = newIncomeDescription.trim()
  const amount = Number(newIncomeAmount)

  if (description.length < 3) {
    setError('Informe a descrição da receita.')
    return
  }

  if (!amount || amount <= 0) {
    setError('Informe um valor superior a zero.')
    return
  }

  if (newIncomeDebtorType === 'CLIENT' && !newIncomeClientId) {
    setError('Selecione o cliente devedor.')
    return
  }

  if (newIncomeDebtorType === 'PARTNER' && !newIncomePartnerId) {
    setError('Selecione o parceiro devedor.')
    return
  }

  if (
    newIncomeDebtorType === 'OTHER' &&
    newIncomeOtherDebtorName.trim().length < 2
  ) {
    setError('Informe o nome do devedor.')
    return
  }

  setSavingNewIncome(true)

  const { error: createError } = await supabase.rpc(
    'rpc_create_income_receivable',
    {
      p_description: description,
      p_amount: amount,
      p_currency: newIncomeCurrency,
      p_due_date: newIncomeDueDate || null,
      p_category_id: newIncomeCategoryId || null,
      p_debtor_type: newIncomeDebtorType,
      p_client_id:
        newIncomeDebtorType === 'CLIENT'
          ? newIncomeClientId
          : null,
      p_partner_id:
        newIncomeDebtorType === 'PARTNER'
          ? newIncomePartnerId
          : null,
      p_other_debtor_name:
        newIncomeDebtorType === 'OTHER'
          ? newIncomeOtherDebtorName.trim()
          : null,
      p_reference_date: newIncomeReferenceDate || null,
      p_notes: newIncomeNotes.trim() || null,
    }
  )

  if (createError) {
    setError(createError.message)
    setSavingNewIncome(false)
    return
  }

  setNewIncomeDescription('')
  setNewIncomeAmount('')
  setNewIncomeCurrency('EUR')
  setNewIncomeDueDate('')
  setNewIncomeReferenceDate('')
  setNewIncomeCategoryId('')
  setNewIncomeDebtorType('OTHER')
  setNewIncomeClientId('')
  setNewIncomePartnerId('')
  setNewIncomeOtherDebtorName('')
  setNewIncomeNotes('')
  setShowNewIncome(false)
  setSavingNewIncome(false)

  window.location.reload()
}

async function handleCancelIncomeReceivable() {
  if (!cancellingIncomeReceivable) {
    return
  }

  setError('')

  const reason = incomeCancellationReason.trim()

  if (reason.length < 3) {
    setError('Informe o motivo do cancelamento.')
    return
  }

  if (!cancellingIncomeReceivable.source_id) {
    setError('Receita de origem não identificada.')
    return
  }

  setSavingIncomeCancellation(true)

  const { error: cancelError } = await supabase.rpc(
    'rpc_cancel_income_receivable',
    {
      p_income_id: cancellingIncomeReceivable.source_id,
      p_reason: reason,
    }
  )

  if (cancelError) {
    setError(cancelError.message)
    setSavingIncomeCancellation(false)
    return
  }

  setCancellingIncomeReceivable(null)
  setIncomeCancellationReason('')
  setSavingIncomeCancellation(false)

  window.location.reload()
}

function handlePreparePayableInstallments() {
  if (!selectedPayable) {
    return
  }

  const count = Number(payableInstallmentCount)

  if (!Number.isInteger(count) || count < 2) {
    setError('Informe pelo menos duas parcelas.')
    return
  }

  const outstanding =
    Number(selectedPayable.outstanding_amount)

  const baseAmount =
    Math.floor((outstanding / count) * 100) / 100

  const drafts = Array.from(
    { length: count },
    (_, index) => {
      const isLast = index === count - 1

      const amount = isLast
        ? outstanding - baseAmount * (count - 1)
        : baseAmount

      return {
        number: index + 1,
        amount: amount.toFixed(2),
        due_date: '',
      }
    }
  )

  setPayableInstallmentDrafts(drafts)
  setError('')
}

async function handleCreatePayableInstallmentPlan() {
  setError('')

  if (!selectedPayable) {
    setError('Valor a pagar não identificado.')
    return
  }

  if (payableInstallmentDrafts.length < 2) {
    setError('Gere pelo menos duas parcelas.')
    return
  }

  if (
    payableInstallmentDrafts.some(
      (item) =>
        !item.due_date ||
        !item.amount ||
        Number(item.amount) <= 0
    )
  ) {
    setError(
      'Informe o valor e o vencimento de todas as parcelas.'
    )
    return
  }

  const { error: installmentError } =
    await supabase.rpc(
      'rpc_create_payable_installment_plan',
      {
        p_payable_id: selectedPayable.id,
        p_installments:
          payableInstallmentDrafts.map((item) => ({
            number: item.number,
            amount: Number(item.amount),
            due_date: item.due_date,
          })),
      }
    )

  if (installmentError) {
    setError(installmentError.message)
    return
  }

  setPayableInstallmentDrafts([])
  setShowPayableInstallmentPlan(false)

  window.alert(
    'Parcelamento criado com sucesso.'
  )

  window.location.reload()
}


async function handleUpdateExpensePayable() {
  setError('')

  if (
    !editingExpensePayable ||
    !editingExpensePayable.source_id
  ) {
    setError('Despesa não identificada.')
    return
  }

  const description = editExpenseDescription.trim()
  const amount = Number(editExpenseAmount)

  if (description.length < 3) {
    setError('Informe a descrição da despesa.')
    return
  }

  if (!amount || amount <= 0) {
    setError('Informe um valor superior a zero.')
    return
  }

  setSavingExpenseEdit(true)

  const { error: updateError } = await supabase.rpc(
    'rpc_update_expense_payable',
    {
      p_expense_id: editingExpensePayable.source_id,
      p_description: description,
      p_amount: amount,
      p_due_date: editExpenseDueDate || null,
      p_category_id: editExpenseCategoryId || null,
      p_supplier_partner_id:
        editExpenseSupplierId || null,
    }
  )

  if (updateError) {
    setError(updateError.message)
    setSavingExpenseEdit(false)
    return
  }

  setEditingExpensePayable(null)
  setSavingExpenseEdit(false)

  window.location.reload()

}

async function handleCancelExpensePayable() {
  setError('')

  if (
    !editingExpensePayable ||
    !editingExpensePayable.source_id
  ) {
    setError('Despesa não identificada.')
    return
  }

  const { error: cancelError } = await supabase.rpc(
    'rpc_cancel_expense_payable',
    {
      p_expense_id: editingExpensePayable.source_id,
    }
  )

  if (cancelError) {
    setError(cancelError.message)
    return
  }

  setEditingExpensePayable(null)

  window.location.reload()
}

async function handleCreateRecurringExpenseRule(
  description: string,
  categoryId: string,
  supplierPartnerId: string,
  frequency: string,
  amountMode: string,
  amount: number,
  currency: string,
  startDate: string,
  endDate: string,
  dueDay: number | null,
  notes: string
) {
  setError('')

  const { data: ruleId, error: ruleError } =
    await supabase.rpc(
      'rpc_create_recurring_expense_rule',
      {
        p_description: description,
        p_category_id: categoryId || null,
        p_supplier_partner_id:
          supplierPartnerId || null,
        p_frequency: frequency,
        p_amount_mode: amountMode,
        p_amount: amount,
        p_currency: currency,
        p_start_date: startDate,
        p_end_date: endDate || null,
        p_due_day: dueDay,
        p_notes: notes || null,
      }
    )

  if (ruleError) {
    setError(ruleError.message)
    return null
  }

  return ruleId
}

async function handleSaveRecurringExpense() {
  setError('')

  const description =
    recurringExpenseDescription.trim()

  const amount =
    Number(recurringExpenseAmount)

  const dueDay =
    recurringExpenseDueDay.trim() === ''
      ? null
      : Number(recurringExpenseDueDay)

  if (description.length < 3) {
    setError(
      'Informe a descrição da despesa recorrente.'
    )
    return
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    setError(
      'Informe um valor superior a zero.'
    )
    return
  }

  if (!recurringExpenseStartDate) {
    setError(
      'Informe a data inicial da despesa recorrente.'
    )
    return
  }

  if (
    recurringExpenseEndDate &&
    recurringExpenseEndDate <
      recurringExpenseStartDate
  ) {
    setError(
      'A data final não pode ser anterior à data inicial.'
    )
    return
  }

  if (
    dueDay !== null &&
    (
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 31
    )
  ) {
    setError(
      'O dia de vencimento deve estar entre 1 e 31.'
    )
    return
  }

  setSavingRecurringExpense(true)

  const ruleId =
    await handleCreateRecurringExpenseRule(
      description,
      recurringExpenseCategoryId,
      recurringExpenseSupplierId,
      recurringExpenseFrequency,
      recurringExpenseAmountMode,
      amount,
      recurringExpenseCurrency,
      recurringExpenseStartDate,
      recurringExpenseEndDate,
      dueDay,
      recurringExpenseNotes
    )

  if (!ruleId) {
    setSavingRecurringExpense(false)
    return
  }

  const {
    error: generationError,
  } = await supabase.rpc(
    'rpc_generate_recurring_expenses',
    {
      p_rule_id: ruleId,
      p_horizon_months: 12,
    }
  )

  if (generationError) {
    setError(generationError.message)
    setSavingRecurringExpense(false)
    return
  }

  setSavingRecurringExpense(false)
  setShowNewRecurringExpense(false)

  window.location.reload()

}

async function handleUpdateRecurringExpenseRule() {
  setError('')

  if (!editingRecurringExpenseRule) {
    return
  }

  const description =
    editRecurringDescription.trim()

  const amount =
    Number(editRecurringAmount)

  const dueDay =
    editRecurringDueDay.trim() === ''
      ? null
      : Number(editRecurringDueDay)

  if (description.length < 3) {
    setError(
      'Informe a descrição da despesa recorrente.'
    )
    return
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    setError(
      'Informe um valor superior a zero.'
    )
    return
  }

  if (
    dueDay !== null &&
    (
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 31
    )
  ) {
    setError(
      'O dia de vencimento deve estar entre 1 e 31.'
    )
    return
  }

  if (
    editRecurringEndDate &&
    editRecurringEndDate <
      editingRecurringExpenseRule.start_date
  ) {
    setError(
      'A data final não pode ser anterior à data inicial.'
    )
    return
  }

  setSavingRecurringRuleEdit(true)

  const { error: updateError } =
    await supabase.rpc(
      'rpc_update_recurring_expense_rule',
      {
        p_rule_id:
          editingRecurringExpenseRule.id,
        p_description: description,
        p_category_id:
          editRecurringCategoryId || null,
        p_supplier_partner_id:
          editRecurringSupplierId || null,
        p_amount_mode:
          editRecurringAmountMode,
        p_amount: amount,
        p_currency:
          editRecurringCurrency,
        p_end_date:
          editRecurringEndDate || null,
        p_due_day: dueDay,
        p_notes:
          editRecurringNotes.trim() || null,
      }
    )

  if (updateError) {
    setError(updateError.message)
    setSavingRecurringRuleEdit(false)
    return
  }

  setSavingRecurringRuleEdit(false)
  setEditingRecurringExpenseRule(null)

  window.location.reload()
}

async function handleDeactivateRecurringExpenseRule(
  rule: RecurringExpenseRuleRow
) {
  setError('')

  const confirmed = window.confirm(
    `Deseja inativar a despesa recorrente "${rule.description}"? As ocorrências futuras ainda não consolidadas serão canceladas.`
  )

  if (!confirmed) {
    return
  }

  const { error: deactivateError } =
    await supabase.rpc(
      'rpc_deactivate_recurring_expense_rule',
      {
        p_rule_id: rule.id,
      }
    )

  if (deactivateError) {
    setError(deactivateError.message)
    return
  }

  window.location.reload()
}


async function handleConfirmEstimatedExpense() {
  setError('')

  if (!confirmingEstimatedPayable) {
    return
  }

  const actualAmount =
    Number(estimatedActualAmount)

  if (
    !Number.isFinite(actualAmount) ||
    actualAmount <= 0
  ) {
    setError(
      'Informe um valor real superior a zero.'
    )
    return
  }

  if (!confirmingEstimatedPayable.source_id) {
    setError(
      'Não foi possível identificar a despesa.'
    )
    return
  }

  setSavingEstimatedConfirmation(true)

  const { error: confirmationError } =
    await supabase.rpc(
      'rpc_confirm_estimated_expense',
      {
        p_expense_id:
          confirmingEstimatedPayable.source_id,
        p_actual_amount: actualAmount,
      }
    )

  if (confirmationError) {
    setError(confirmationError.message)
    setSavingEstimatedConfirmation(false)
    return
  }

  setSavingEstimatedConfirmation(false)
  setConfirmingEstimatedPayable(null)
  setEstimatedActualAmount('')

  await loadFinanceiro()
}

async function handleCreateSupplier() {
  setError('')

  const supplierName = newSupplierName.trim()
  const supplierNif = newSupplierNif.trim()

  if (supplierName.length < 2) {
    setError('Informe o nome do fornecedor.')
    return
  }

  setSavingNewSupplier(true)

  const { data, error: supplierError } =
    await supabase.rpc('rpc_create_supplier', {
      p_name: supplierName,
      p_nif_nipc: supplierNif || null,
    })

  if (supplierError) {
    setError(supplierError.message)
    setSavingNewSupplier(false)
    return
  }

  const supplierId = data as string

  setSuppliers((current) => {
    const alreadyExists = current.some(
      (supplier) => supplier.id === supplierId
    )

    if (alreadyExists) {
      return current
    }

    return [
      ...current,
      {
        id: supplierId,
        name: supplierName,
      },
    ].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  })

  setNewPayableSupplierId(supplierId)
  setNewSupplierName('')
  setNewSupplierNif('')
  setShowNewSupplier(false)
  setSavingNewSupplier(false)
}

async function handleUpdateSupplier() {
  if (!editingSupplier) {
    return
  }

  setError('')

  const supplierName = editSupplierName.trim()

  if (supplierName.length < 2) {
    setError('Informe o nome do fornecedor.')
    return
  }

  const { error: supplierError } =
    await supabase.rpc(
      'rpc_update_supplier',
      {
        p_supplier_id: editingSupplier.id,
        p_name: supplierName,
        p_nif_nipc:
          editSupplierNif.trim() || null,
        p_phone:
          editSupplierPhone.trim() || null,
        p_email:
          editSupplierEmail.trim() || null,
        p_address:
          editSupplierAddress.trim() || null,
        p_iban:
          editSupplierIban.trim() || null,
        p_notes:
          editSupplierNotes.trim() || null,
      }
    )

  if (supplierError) {
    setError(supplierError.message)
    return
  }

  setEditingSupplier(null)
  setEditSupplierName('')
  setEditSupplierNif('')
  setEditSupplierPhone('')
  setEditSupplierEmail('')
  setEditSupplierAddress('')
  setEditSupplierIban('')
  setEditSupplierNotes('')

  window.location.reload()
}


async function handleCreateExpenseCategory() {
  setError('')

  const categoryName =
    newExpenseCategoryName.trim()

  if (categoryName.length < 2) {
    setError('Informe o nome da categoria.')
    return
  }

  const { error: categoryError } =
    await supabase.rpc(
      'rpc_create_expense_category',
      {
        p_name: categoryName,
      }
    )

  if (categoryError) {
    setError(categoryError.message)
    return
  }

  setNewExpenseCategoryName('')

  window.location.reload()
}

async function handleDeactivateSupplier(
  supplier: { id: string; name: string }
) {
  setError('')

  const confirmed = window.confirm(
    `Deseja inativar o fornecedor "${supplier.name}"? Ele deixará de aparecer nos novos lançamentos, mas o histórico será preservado.`
  )

  if (!confirmed) {
    return
  }

  const { error: supplierError } =
    await supabase.rpc(
      'rpc_deactivate_supplier',
      {
        p_supplier_id: supplier.id,
      }
    )

  if (supplierError) {
    setError(supplierError.message)
    return
  }

  window.location.reload()
}

async function handleReactivateSupplier(
  supplier: { id: string; name: string }
) {
  setError('')

  const confirmed = window.confirm(
    `Deseja reativar o fornecedor "${supplier.name}"?`
  )

  if (!confirmed) {
    return
  }

  const { error: supplierError } =
    await supabase.rpc(
      'rpc_reactivate_supplier',
      {
        p_supplier_id: supplier.id,
      }
    )

  if (supplierError) {
    setError(supplierError.message)
    return
  }

  window.location.reload()
}


async function handleUpdateExpenseCategory() {
  if (!editingExpenseCategory) {
    return
  }

  setError('')

  const categoryName =
    editExpenseCategoryName.trim()

  if (categoryName.length < 2) {
    setError('Informe o nome da categoria.')
    return
  }

  const { error: categoryError } =
    await supabase.rpc(
      'rpc_update_expense_category',
      {
        p_category_id:
          editingExpenseCategory.id,
        p_name: categoryName,
      }
    )

  if (categoryError) {
    setError(categoryError.message)
    return
  }

  setEditingExpenseCategory(null)
  setEditExpenseCategoryName('')

  window.location.reload()
}

async function handleDeactivateExpenseCategory(
  category: { id: string; name: string }
) {
  setError('')

  const confirmed = window.confirm(
    `Deseja inativar a categoria "${category.name}"? Ela deixará de aparecer nos novos lançamentos, mas o histórico será preservado.`
  )

  if (!confirmed) {
    return
  }

  const { error: categoryError } =
    await supabase.rpc(
      'rpc_deactivate_expense_category',
      {
        p_category_id: category.id,
      }
    )

  if (categoryError) {
    setError(categoryError.message)
    return
  }

  window.location.reload()
}

async function handleReactivateExpenseCategory(
  category: { id: string; name: string }
) {
  setError('')

  const confirmed = window.confirm(
    `Deseja reativar a categoria "${category.name}"? Ela voltará a aparecer nos novos lançamentos.`
  )

  if (!confirmed) {
    return
  }

  const { error: categoryError } =
    await supabase.rpc(
      'rpc_reactivate_expense_category',
      {
        p_category_id: category.id,
      }
    )

  if (categoryError) {
    setError(categoryError.message)
    return
  }

  window.location.reload()
}



async function handleReverseOutgoingPayment() {
  if (!selectedOutgoingPayment) {
    return
  }

  setError('')

  const reason = reversalReason.trim()

  if (reason.length < 3) {
    setError('Informe o motivo da reversão.')
    return
  }

  setReversingPayment(true)

  const { error: reversalError } =
    await supabase.rpc('rpc_reverse_outgoing_payment', {
      p_outgoing_payment_id: selectedOutgoingPayment.id,
      p_reason: reason,
    })

  if (reversalError) {
    setError(reversalError.message)
    setReversingPayment(false)
    return
  }

  setSelectedOutgoingPayment(null)
  setSelectedPayableHistory(null)
  setReversalReason('')
  setReversingPayment(false)

  window.location.reload()
}

async function handleConfirmTransfer(
  allowInsufficientBalance = false
) {

  if (!transferFromAccount || !transferToAccount) {
    setError('Selecione as contas de origem e destino.')
    return
  }

  const amount = Number(transferAmount)

  if (!amount || amount <= 0) {
    setError('Informe um valor válido para a transferência.')
    return
  }

  if (
    transferFromAccount.financial_account_id ===
    transferToAccount.financial_account_id
  ) {
    setError(
      'A conta de origem e a conta de destino devem ser diferentes.'
    )
    return
  }

if (
  amount > Number(transferFromAccount.current_balance) &&
  !allowInsufficientBalance
) {
  setShowInsufficientBalanceWarning(true)
  return
}

  if (
    transferFromAccount.currency !==
    transferToAccount.currency
  ) {
    setError(
      'Transferências entre moedas diferentes ainda não estão disponíveis.'
    )
    return
  }

  const { error: transferError } = await supabase
    .from('account_transfers')
    .insert({
      from_account_id:
        transferFromAccount.financial_account_id,
      to_account_id:
        transferToAccount.financial_account_id,
      source_amount: amount,
      source_currency: transferFromAccount.currency,
      destination_amount: amount,
      destination_currency: transferToAccount.currency,
      fee_amount: 0,
      status: 'COMPLETED',
      transfer_date: new Date().toISOString(),
      notes: 'Transferência interna',
    })

  if (transferError) {
    setError(transferError.message)
    return
  }

setFinancialAccountBalances((currentAccounts) =>
  currentAccounts.map((account) => {
    if (
      account.financial_account_id ===
      transferFromAccount.financial_account_id
    ) {
      return {
        ...account,
        movement_balance:
          Number(account.movement_balance) - amount,
        current_balance:
          Number(account.current_balance) - amount,
      }
    }

    if (
      account.financial_account_id ===
      transferToAccount.financial_account_id
    ) {
      return {
        ...account,
        movement_balance:
          Number(account.movement_balance) + amount,
        current_balance:
          Number(account.current_balance) + amount,
      }
    }

    return account
  })
)

  setTransferFromAccountId('')
  setTransferToAccountId('')
  setTransferAmount('')
  setShowInsufficientBalanceWarning(false)
  setShowTransferForm(false)

const {
  data: updatedBalances,
  error: updatedBalancesError,
} = await supabase
  .from('dashboard_account_balances')
  .select(`
    financial_account_id,
    code,
    name,
    account_type,
    currency,
    opening_balance,
    movement_balance,
    current_balance,
    movement_count,
    parent_account_id,
    responsible_user_id,
    is_active
  `)
  .order('name', { ascending: true })

if (updatedBalancesError) {
  setError(updatedBalancesError.message)
  return
}

setFinancialAccountBalances(
  (updatedBalances ?? []) as FinancialAccountBalanceRow[]
)}

async function handleCreateFinancialAccount() {
  if (!canManageFinancialAccounts || creatingFinancialAccount) return
  setError('')
  const code = newAccountCode.trim().toUpperCase()
  const name = newAccountName.trim()
  const openingBalance = Number(newAccountOpeningBalance)
  const isMiniCash = newAccountType === 'CASH' && newAccountIsMiniCash
  if (!code || !name) {
    setError('Informe o codigo e o nome da conta.')
    return
  }
  if (!newAccountOpeningBalance.trim() || !Number.isFinite(openingBalance) || openingBalance < 0) {
    setError('Informe um saldo inicial valido e nao negativo.')
    return
  }
  if (isMiniCash && (!newAccountParentId || !newAccountResponsibleUserId)) {
    setError('Selecione a caixa principal e o colaborador responsavel.')
    return
  }
  if (isMiniCash && !mainFinancialAccounts.some((account) => account.financial_account_id === newAccountParentId && account.account_type === 'CASH' && account.currency === newAccountCurrency)) {
    setError('A caixa principal deve estar ativa e utilizar a mesma moeda.')
    return
  }
  if (isMiniCash && openingBalance !== 0) {
    setError('A minicaixa deve iniciar com saldo zero. Utilize uma transferencia da caixa principal.')
    return
  }
  setCreatingFinancialAccount(true)
  try {
    const { error: createError } = await supabase.rpc('rpc_create_financial_account', {
      p_code: code,
      p_name: name,
      p_account_type: newAccountType,
      p_currency: newAccountCurrency,
      p_opening_balance: openingBalance,
      p_parent_account_id: isMiniCash ? newAccountParentId : null,
      p_responsible_user_id: isMiniCash ? newAccountResponsibleUserId : null,
    })
    if (createError) {
      setError(createError.message)
      return
    }
    const { data: refreshedAccounts, error: refreshError } = await supabase.from('dashboard_account_balances').select('*').order('name', { ascending: true })
    if (refreshError) {
      setError('Conta criada, mas nao foi possivel atualizar a lista: ' + refreshError.message)
      return
    }
    setFinancialAccountBalances((refreshedAccounts ?? []) as FinancialAccountBalanceRow[])
    setNewAccountCode('')
    setNewAccountName('')
    setNewAccountType('BANK')
    setNewAccountCurrency('EUR')
    setNewAccountOpeningBalance('0')
    setNewAccountIsMiniCash(false)
    setNewAccountParentId('')
    setNewAccountResponsibleUserId('')
    setShowCreateFinancialAccount(false)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
  } finally {
    setCreatingFinancialAccount(false)
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">
          Carregando financeiro...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">

        <button
          type="button"
          onClick={() => {
            window.location.href = '/'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-6"
        >
          ← Voltar ao Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Financeiro
          </h1>

          <p className="text-slate-500 mt-1">
            Gestão financeira da Portulegal.
          </p>
        </div>


        <div className="mt-8 rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between gap-4">
  <div>
    <h2 className="text-lg font-semibold text-slate-900">
      Contas e caixas
    </h2>

    <p className="text-sm text-slate-500 mt-1">
      Saldos das contas financeiras e caixas operacionais.
    </p>
  </div>

  <button
  type="button"
  onClick={() =>
    setShowFinancialAccounts(!showFinancialAccounts)
  }
  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
>
  {showFinancialAccounts
    ? 'Fechar contas'
    : 'Ver contas'}
</button>
</div>

{showFinancialAccounts && (
  <>

<div className="px-6 py-4 border-b flex justify-end gap-3">
  {canManageFinancialAccounts && (
    <button type="button" onClick={() => setShowAccountManagement(!showAccountManagement)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
      {showAccountManagement ? 'Fechar gestão' : 'Gerir contas'}
    </button>
  )}
  <button
    type="button"
    onClick={() => setShowTransferForm(!showTransferForm)}
    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
  >
    {showTransferForm
      ? 'Fechar transferência'
      : 'Transferir'}
  </button>
</div>

{canManageFinancialAccounts && showAccountManagement && (
  <div className="px-6 py-5 border-b bg-slate-50">
    <h3 className="font-semibold text-slate-900">Gestão de contas e caixas</h3>
    <p className="mt-1 text-sm text-slate-500">Consulta das contas ativas e suspensas.</p>
    <div className="mt-4 mb-4">
      <button type="button" onClick={() => setShowCreateFinancialAccount(!showCreateFinancialAccount)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        {showCreateFinancialAccount ? 'Fechar formulario' : 'Nova conta ou caixa'}
      </button>
    </div>
    <div className="mt-4 space-y-3">
    {showCreateFinancialAccount && (
      <div className="mb-4 rounded-lg border bg-white p-4">
        <h4 className="mb-3 font-medium text-slate-900">Criar conta ou caixa</h4>
        <label className="block text-sm font-medium text-slate-700">Codigo da conta</label>
        <input type="text" value={newAccountCode} onChange={(e) => setNewAccountCode(e.target.value.toUpperCase())} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Ex.: BANCO_02" />
        <label className="mt-3 block text-sm font-medium text-slate-700">Nome da conta ou caixa</label>
        <input type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Ex.: Novo Banco" />
        <label className="mt-3 block text-sm font-medium text-slate-700">Tipo de conta</label>
        <select value={newAccountType} onChange={(e) => setNewAccountType(e.target.value as 'BANK' | 'CASH')} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
          <option value="BANK">Banco</option>
          <option value="CASH">Caixa</option>
        </select>
        <label className="mt-3 block text-sm font-medium text-slate-700">Moeda</label>
        <select value={newAccountCurrency} onChange={(e) => setNewAccountCurrency(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
          <option value="EUR">Euro (EUR)</option>
          <option value="BRL">Real brasileiro (BRL)</option>
        </select>
        <label className="mt-3 block text-sm font-medium text-slate-700">Saldo inicial</label>
        <input type="number" min="0" step="0.01" value={newAccountOpeningBalance} onChange={(e) => setNewAccountOpeningBalance(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-slate-500">Utilize zero para contas novas sem saldo anterior.</p>
        {newAccountType === 'CASH' && (
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={newAccountIsMiniCash} onChange={(e) => setNewAccountIsMiniCash(e.target.checked)} />
            Esta conta e uma minicaixa
          </label>
        )}
        {newAccountType === 'CASH' && newAccountIsMiniCash && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">Caixa principal</label>
            <select value={newAccountParentId} onChange={(e) => setNewAccountParentId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Selecione a caixa principal</option>
              {mainFinancialAccounts.filter((account) => account.account_type === 'CASH' && account.currency === newAccountCurrency).map((account) => (
                <option key={account.financial_account_id} value={account.financial_account_id}>{account.name}</option>
              ))}
            </select>
            <label className="mt-3 block text-sm font-medium text-slate-700">Colaborador responsavel</label>
            <select value={newAccountResponsibleUserId} onChange={(e) => setNewAccountResponsibleUserId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Selecione o colaborador</option>
              {financialAccountUsers.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        )}
        <button type="button" onClick={handleCreateFinancialAccount} disabled={creatingFinancialAccount} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
          {creatingFinancialAccount ? 'A criar conta...' : 'Criar conta ou caixa'}
        </button>
      </div>
    )}
      {manageableFinancialAccounts.map((account) => (
        <div key={account.financial_account_id} className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-900">{account.name}</span>
            <span className="text-sm text-slate-600">{account.is_active ? 'Ativa' : 'Suspensa'}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{account.code} | {account.account_type} | {account.currency}</p>
          <p className="mt-1 text-sm text-slate-600">Saldo: {account.current_balance} {account.currency}</p>
          {account.parent_account_id && <p className="mt-1 text-xs text-slate-500">Minicaixa vinculada a conta principal</p>}
        </div>
      ))}
    </div>
  </div>
)}

{showTransferForm && (<div className="px-6 py-5 border-b bg-slate-50">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h3 className="font-medium text-slate-900">
        Transferência entre contas
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        Movimente valores entre contas e caixas da empresa.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
  setShowTransferForm(false)
  setTransferFromAccountId('')
  setTransferToAccountId('')
  setTransferAmount('')
  setShowInsufficientBalanceWarning(false)
  setError('')
}}
      className="text-sm text-slate-500 hover:text-slate-900"
    >
      Fechar
    </button>
  </div>

  <div className="mt-5">
    <label className="block text-sm font-medium text-slate-700 mb-2">
      Conta de origem
    </label>

    <select
  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
  value={transferFromAccountId}
 onChange={(e) => {
  setTransferFromAccountId(e.target.value)
  setTransferToAccountId('')
  setShowInsufficientBalanceWarning(false)
}}
>
      <option value="" disabled>
        Selecione a conta de origem
      </option>

      {activeFinancialAccountBalances
        .filter((account) => account.parent_account_id === null)
        .map((account) => (
          <option
            key={account.financial_account_id}
            value={account.financial_account_id}
          >
            {account.account_type === 'CASH'
              ? 'Caixa principal'
              : account.name}{' '}
            —{' '}
            {Number(account.current_balance).toLocaleString('pt-PT', {
              style: 'currency',
              currency: account.currency,
            })}
          </option>
        ))}

      {miniCashAccounts.map((account) => (
        <option
          key={account.financial_account_id}
          value={account.financial_account_id}
        >
          {account.name} —{' '}
          {Number(account.current_balance).toLocaleString('pt-PT', {
            style: 'currency',
            currency: account.currency,
          })}
        </option>
      ))}
    </select>
  </div>

<div className="mt-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Conta de destino
  </label>

  <select
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
    value={transferToAccountId}
    onChange={(e) => {
  setTransferToAccountId(e.target.value)
  setShowInsufficientBalanceWarning(false)
}}
  >
    <option value="" disabled>
      Selecione a conta de destino
    </option>

    {activeFinancialAccountBalances
      .filter(
        (account) =>
          account.parent_account_id === null &&
          account.financial_account_id !== transferFromAccountId
      )
      .map((account) => (
        <option
          key={account.financial_account_id}
          value={account.financial_account_id}
        >
          {account.account_type === 'CASH'
            ? 'Caixa principal'
            : account.name}{' '}
          —{' '}
          {Number(account.current_balance).toLocaleString('pt-PT', {
            style: 'currency',
            currency: account.currency,
          })}
        </option>
      ))}

    {miniCashAccounts
      .filter(
        (account) =>
          account.financial_account_id !== transferFromAccountId
      )
      .map((account) => (
        <option
          key={account.financial_account_id}
          value={account.financial_account_id}
        >
          {account.name} —{' '}
          {Number(account.current_balance).toLocaleString('pt-PT', {
            style: 'currency',
            currency: account.currency,
          })}
        </option>
      ))}
  </select>
</div>

<div className="mt-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Valor da transferência
  </label>

  <input
    type="number"
    min="0"
    step="0.01"
    value={transferAmount}
    onChange={(e) => {
  setTransferAmount(e.target.value)
  setShowInsufficientBalanceWarning(false)
}}
    placeholder="0,00"
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
    />
</div>

{transferFromAccount &&
  transferToAccount &&
  transferFromAccount.currency !== transferToAccount.currency && (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-800">
        Transferência entre moedas diferentes
      </p>

      <p className="text-sm text-amber-700 mt-1">
        Esta transferência exige conversão de{' '}
        {transferFromAccount.currency} para{' '}
        {transferToAccount.currency}.
      </p>
    </div>
  )}

{showInsufficientBalanceWarning &&
  transferFromAccount &&
  transferToAccount && (
    <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-4">
      <p className="text-sm font-semibold text-amber-900">
        Saldo insuficiente no sistema
      </p>

      <p className="mt-2 text-sm text-amber-800">
        O saldo registado em {transferFromAccount.name} é{' '}
        {Number(
          transferFromAccount.current_balance
        ).toLocaleString('pt-PT', {
          style: 'currency',
          currency: transferFromAccount.currency,
        })}
        .
      </p>

      <p className="mt-1 text-sm text-amber-800">
        Após esta transferência, o saldo ficará em{' '}
        <strong>
          {(
            Number(transferFromAccount.current_balance) -
            Number(transferAmount)
          ).toLocaleString('pt-PT', {
            style: 'currency',
            currency: transferFromAccount.currency,
          })}
        </strong>
        .
      </p>

      <p className="mt-2 text-sm text-amber-800">
        Deseja continuar mesmo assim?
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() =>
            setShowInsufficientBalanceWarning(false)
          }
          className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => handleConfirmTransfer(true)}
          className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Continuar mesmo assim
        </button>
      </div>
    </div>
  )}
<div className="mt-5 flex justify-end">
  <button
    type="button"
onClick={() => handleConfirmTransfer(false)}
    disabled={
      !transferFromAccountId ||
      !transferToAccountId ||
      !transferAmount ||
      Number(transferAmount) <= 0 ||
      transferFromAccount?.currency !== transferToAccount?.currency
    }
    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
  >
    Confirmar transferência
  </button>
</div>

</div>
)}

          <div className="divide-y">
  {[
  ...cashAccounts,
  ...bankAccounts,
  ...transitAccounts,
].map((account) => {
    const childCashAccounts = miniCashAccounts.filter(
      (miniCash) =>
        miniCash.parent_account_id ===
        account.financial_account_id
    )

    return (
      <div key={account.financial_account_id}>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-slate-900">
  {account.account_type === 'CASH' &&
  account.parent_account_id === null
    ? 'Caixa principal'
    : account.name}
</p>

            <p className="text-sm text-slate-500 mt-1">
  {account.account_type === 'CASH'
    ? `Total em dinheiro: ${totalPhysicalCash.toLocaleString(
        'pt-PT',
        {
          style: 'currency',
          currency: 'EUR',
        }
      )}`
    : account.account_type === 'BANK'
      ? 'Conta bancária'
      : 'Conta transitória'}
</p>

          </div>

<div className="flex items-center gap-4">
  <div className="text-right">
    <p
      className={`text-lg font-semibold ${
        Number(account.current_balance) < 0
          ? 'text-red-600'
          : 'text-slate-900'
      }`}
    >
      {Number(account.current_balance).toLocaleString(
        'pt-PT',
        {
          style: 'currency',
          currency: account.currency,
        }
      )}
    </p>

    <button
      type="button"
onClick={() => {
  setSelectedFinancialAccountStatement(account)
  setAccountStatementMode('LAST_100')
  setAccountStatementDateFrom('')
  setAccountStatementDateTo('')
  setAccountStatementMovements([])

  void loadAccountStatement(
    account,
    'LAST_100'
  )
}}

      className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-900"
    >
      Ver extrato
    </button>
  </div>
</div>
        </div>

        {childCashAccounts.map((miniCash) => (
          <div
            key={miniCash.financial_account_id}
            className="ml-8 mr-6 mb-4 rounded-xl bg-slate-50 px-5 py-3 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">
                {miniCash.name}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Mini caixa
              </p>
            </div>

<div className="text-right">
  <p
    className={`font-semibold ${
      Number(miniCash.current_balance) < 0
        ? 'text-red-600'
        : 'text-slate-800'
    }`}
  >
    {Number(miniCash.current_balance).toLocaleString(
      'pt-PT',
      {
        style: 'currency',
        currency: miniCash.currency,
      }
    )}
  </p>

  <button
    type="button"
onClick={() => {
  setSelectedFinancialAccountStatement(miniCash)
  setAccountStatementMode('LAST_100')
  setAccountStatementDateFrom('')
  setAccountStatementDateTo('')
  setAccountStatementMovements([])

  void loadAccountStatement(
    miniCash,
    'LAST_100'
  )
}}

    className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-900"
  >
    Ver extrato
  </button>
</div>
          </div>
               ))}
      </div>
    )
  })}
</div>

  </>
)}

        </div>


{selectedFinancialAccountStatement && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Extrato do caixa
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedFinancialAccountStatement.account_type === 'CASH' &&
            selectedFinancialAccountStatement.parent_account_id === null
              ? 'Caixa principal'
              : selectedFinancialAccountStatement.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedFinancialAccountStatement(null)
          }
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Fechar
        </button>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Saldo atual
        </p>

        <p
          className={`mt-1 text-2xl font-semibold ${
            Number(
              selectedFinancialAccountStatement.current_balance
            ) < 0
              ? 'text-red-600'
              : 'text-slate-900'
          }`}
        >
          {Number(
            selectedFinancialAccountStatement.current_balance
          ).toLocaleString('pt-PT', {
            style: 'currency',
            currency:
              selectedFinancialAccountStatement.currency,
          })}
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                Data
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Descrição
              </th>

              <th className="px-4 py-3 text-right font-medium">
                Entrada
              </th>

              <th className="px-4 py-3 text-right font-medium">
                Saída
              </th>

	      <th className="px-4 py-3 text-right font-medium">
  		Saldo
	      </th>

            </tr>
          </thead>

<tbody className="divide-y">
  {selectedAccountStatementRows.map((movement) => (
    <tr key={movement.id}>
      <td className="px-4 py-3 text-slate-600">
        {new Date(
          movement.movement_date
        ).toLocaleDateString('pt-PT')}
      </td>

      <td className="px-4 py-3 text-slate-600">
        {financialMovementDescriptions.find(
          (item) =>
            item.financial_movement_id ===
            movement.id
        )?.description ||
          movement.notes ||
          movement.source_type ||
          '—'}
      </td>

      <td className="px-4 py-3 text-right font-medium text-slate-900">
        {movement.statement_inflow > 0
          ? movement.statement_inflow.toLocaleString(
              'pt-PT',
              {
                style: 'currency',
                currency: movement.currency,
              }
            )
          : '—'}
      </td>

      <td className="px-4 py-3 text-right font-medium text-slate-900">
        {movement.statement_outflow > 0
          ? movement.statement_outflow.toLocaleString(
              'pt-PT',
              {
                style: 'currency',
                currency: movement.currency,
              }
            )
          : '—'}
      </td>

      <td
        className={`px-4 py-3 text-right font-semibold ${
          movement.statement_balance < 0
            ? 'text-red-600'
            : 'text-slate-900'
        }`}
      >
        {movement.statement_balance.toLocaleString(
          'pt-PT',
          {
            style: 'currency',
            currency: movement.currency,
          }
        )}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>

    </div>
  </div>
)}


        <div className="mt-8 rounded-2xl bg-white border shadow-sm overflow-hidden">
  <div className="px-6 py-5 border-b flex items-center justify-between gap-6">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Contas a receber
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Lançamentos financeiros pendentes de recebimento.
      </p>
    </div>

    <div className="flex items-center gap-5">
      <div className="text-right">
        <p className="text-xl font-semibold text-slate-900">
          {pendingReceivablesTotal.toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR',
          })}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {pendingReceivables.length}{' '}
          {pendingReceivables.length === 1
            ? 'valor pendente'
            : 'valores pendentes'}
        </p>
      </div>


      <button
        type="button"
        onClick={() =>
          setShowReceivables(!showReceivables)
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {showReceivables
          ? 'Fechar valores'
          : 'Ver valores'}
      </button>
    </div>
  </div>
{showNewIncome && (
  <div className="border-b bg-slate-50 p-6">
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Nova receita
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Registe um valor a receber que não tenha origem numa venda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewIncome(false)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Fechar
        </button>
      </div>
    </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Categoria
          </label>
          <select
            value={newIncomeCategoryId}
            onChange={(e) => setNewIncomeCategoryId(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="">Sem categoria</option>
            {incomeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Tipo de devedor
          </label>
          <select
            value={newIncomeDebtorType}
            onChange={(e) => {
              const value = e.target.value as 'CLIENT' | 'PARTNER' | 'OTHER'
              setNewIncomeDebtorType(value)
              setNewIncomeClientId('')
              setNewIncomePartnerId('')
              setNewIncomeOtherDebtorName('')
            }}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="CLIENT">Cliente</option>
            <option value="PARTNER">Parceiro</option>
            <option value="OTHER">Outro</option>
          </select>
        </div>

        {newIncomeDebtorType === 'CLIENT' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Cliente
            </label>
            <select
              value={newIncomeClientId}
              onChange={(e) => setNewIncomeClientId(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Selecione o cliente</option>
              {incomeClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {newIncomeDebtorType === 'PARTNER' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Parceiro
            </label>
            <select
              value={newIncomePartnerId}
              onChange={(e) => setNewIncomePartnerId(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Selecione o parceiro</option>
              {incomePartners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {newIncomeDebtorType === 'OTHER' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Nome do devedor
            </label>
            <input
              type="text"
              value={newIncomeOtherDebtorName}
              onChange={(e) => setNewIncomeOtherDebtorName(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Descrição
          </label>
          <input
            type="text"
            value={newIncomeDescription}
            onChange={(e) => setNewIncomeDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Valor
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={newIncomeAmount}
            onChange={(e) => setNewIncomeAmount(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Moeda
          </label>
          <select
            value={newIncomeCurrency}
            onChange={(e) => setNewIncomeCurrency(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="EUR">EUR</option>
            <option value="BRL">BRL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Vencimento
          </label>
          <input
            type="date"
            value={newIncomeDueDate}
            onChange={(e) => setNewIncomeDueDate(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Data de referência
          </label>
          <input
            type="date"
            value={newIncomeReferenceDate}
            onChange={(e) => setNewIncomeReferenceDate(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Observações
          </label>
          <textarea
            rows={3}
            value={newIncomeNotes}
            onChange={(e) => setNewIncomeNotes(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={savingNewIncome}
          onClick={handleCreateIncomeReceivable}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {savingNewIncome ? 'A guardar...' : 'Guardar receita'}
        </button>
      </div>
  </div>
)}

{showReceivables && (
  <>

    <div className="flex flex-wrap gap-3 border-b bg-white px-6 py-4">
      <button
        type="button"
        onClick={() => {
          setError('')
          setShowNewIncome(!showNewIncome)
        }}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Nova receita
      </button>
    </div>

<div className="px-6 py-4 border-b bg-slate-50">
  <div className="flex flex-wrap gap-2">
    {[
      ['OPEN', 'Em aberto'],
      ['PAID', 'Pagas'],
      ['CANCELLED', 'Canceladas'],
      ['ALL', 'Todas'],
    ].map(([value, label]) => (
      <button
        key={value}
        type="button"
        onClick={() =>
          setReceivablesFilter(
            value as
              | 'OPEN'
              | 'PAID'
              | 'CANCELLED'
              | 'ALL'
          )
        }
        className={`rounded-lg px-3 py-2 text-sm font-medium ${
          receivablesFilter === value
            ? 'bg-slate-900 text-white'
            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>

	    {filteredReceivables.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum valor pendente a receber.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
		<th className="px-5 py-3 text-left font-medium">
		  Devedor
		</th>

		<th className="px-5 py-3 text-left font-medium">
		  Venda
		</th>

		<th className="px-5 py-3 text-left font-medium">
		  Origem
		</th>
                    <th className="px-5 py-3 text-left font-medium">
                      Vencimento
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Valor
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Recebido
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Pendente
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredReceivables.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {item.debtor_name ||
                            item.debtor_type}
                        </p>
                      </td>

<td className="px-5 py-4 text-slate-600 whitespace-nowrap">
  {item.sale_number
    ? `${item.sale_number}${
        item.installment_number
          ? ` · P${item.installment_number}`
          : ''
      }`
    : '—'}
</td>

                      <td className="px-5 py-4 text-slate-600">
  {item.source_type === 'PARTNER_COMMISSION'
    ? 'Comissão de parceiro'
    : item.source_type === 'CLIENT_INSTALLMENT'
      ? 'Parcela de cliente'
      : item.source_type === 'PARTNER_SERVICE'
        ? 'Serviço de parceiro'
        : item.source_type === 'INCOME'
          ? item.source_name ?? 'Receita'
          : 'Outro'}

</td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.due_date
                          ? new Date(
                              item.due_date
                            ).toLocaleDateString('pt-PT')
                          : '—'}
                      </td>


                      <td className="px-5 py-4 text-right font-medium text-slate-900">
                        {Number(
                          item.amount
                        ).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency:
                            item.currency || 'EUR',
                        })}
                      </td>

<td className="px-5 py-4 text-right text-slate-600">
  {Number(
    item.received_amount
  ).toLocaleString('pt-PT', {
    style: 'currency',
    currency:
      item.currency || 'EUR',
  })}
</td>

<td className="px-5 py-4 text-right font-medium text-slate-900">
  {Number(
    item.outstanding_amount
  ).toLocaleString('pt-PT', {
    style: 'currency',
    currency:
      item.currency || 'EUR',
  })}
</td>

                      <td className="px-5 py-4">
                        <span
className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
  item.status === 'PAID'
    ? 'bg-green-50 text-green-700'
    : item.status === 'CANCELLED'
      ? 'bg-slate-100 text-slate-600'
      : item.status === 'PARTIALLY_PAID'
        ? 'bg-amber-50 text-amber-700'
        : item.status === 'OVERDUE'
          ? 'bg-red-50 text-red-700'
          : 'bg-slate-100 text-slate-700'
}`}

>
{item.status === 'PAID'
  ? 'Recebido'
  : item.status === 'CANCELLED'
    ? 'Cancelado'
    : item.status === 'PARTIALLY_PAID'
      ? 'Parcialmente recebido'
      : item.status === 'OVERDUE'
        ? 'Vencido'
        : 'Pendente'}

                        </span>
                      </td>

<td className="px-5 py-4 text-right">
  <div className="flex justify-end gap-2">

{item.source_type === 'INCOME' &&
  item.status !== 'CANCELLED' && (
    <button
      type="button"
      onClick={() =>
        handleEditIncomeReceivable(item)
      }
      className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
    >
      Editar
    </button>
  )}

    {item.status !== 'PAID' &&
      item.status !== 'CANCELLED' && (
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={() => {
            setSelectedReceivable(item)

            setReceiptAmount(
              String(item.outstanding_amount)
            )

            const today = new Date()
            const localToday = new Date(
              today.getTime() -
                today.getTimezoneOffset() * 60000
            )
              .toISOString()
              .split('T')[0]

            setReceiptDate(localToday)
            setReceiptPaymentMethodId('')
            setReceiptFinancialAccountId('')
          }}
        >
          Receber
        </button>
      )}

    {item.status === 'PARTIALLY_PAID' && (
      <button
        type="button"
        onClick={() =>
          loadReceivablePaymentHistory(item)
        }
        className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Ver histórico
      </button>
    )}

    {item.status === 'PAID' && (
      <button
        type="button"
        onClick={() =>
          loadReceivablePaymentHistory(item)
        }
        className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Ver recebimento
      </button>
    )}

    {item.status === 'CANCELLED' && (
      <span className="py-2 text-slate-400">
        —
      </span>
    )}
  </div>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                     )}
   
{editingIncomeReceivable && (
  <div
    className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4"
    onClick={() => {
      if (!savingEditIncome) {
        setEditingIncomeReceivable(null)
      }
    }}
  >
    <div
      className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Editar receita
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Altere os dados da conta a receber.
          </p>
        </div>

        <button
          type="button"
          disabled={savingEditIncome}
          onClick={() =>
            setEditingIncomeReceivable(null)
          }
          className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50"
        >
          Fechar
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Descrição
          </label>

          <input
            type="text"
            value={editIncomeDescription}
            onChange={(e) =>
              setEditIncomeDescription(e.target.value)
            }
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Categoria
          </label>

          <select
            value={editIncomeCategoryId}
            onChange={(e) =>
              setEditIncomeCategoryId(e.target.value)
            }
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          >
            <option value="">Sem categoria</option>

            {incomeCategories.map((category) => (
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
          <label className="block text-sm font-medium text-slate-700">
            Tipo de devedor
          </label>

          <select
            value={editIncomeDebtorType}
            onChange={(e) => {
              const value = e.target.value as
                | 'CLIENT'
                | 'PARTNER'
                | 'OTHER'

              setEditIncomeDebtorType(value)
              setEditIncomeClientId('')
              setEditIncomePartnerId('')
              setEditIncomeOtherDebtorName('')
            }}
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          >
            <option value="CLIENT">Cliente</option>
            <option value="PARTNER">Parceiro</option>
            <option value="OTHER">Outro</option>
          </select>
        </div>

        {editIncomeDebtorType === 'CLIENT' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Cliente
            </label>

            <select
              value={editIncomeClientId}
              onChange={(e) =>
                setEditIncomeClientId(e.target.value)
              }
              disabled={savingEditIncome}
              className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
            >
              <option value="">
                Selecione...
              </option>

              {incomeClients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {editIncomeDebtorType === 'PARTNER' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Parceiro
            </label>

            <select
              value={editIncomePartnerId}
              onChange={(e) =>
                setEditIncomePartnerId(e.target.value)
              }
              disabled={savingEditIncome}
              className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
            >
              <option value="">
                Selecione...
              </option>

              {incomePartners.map((partner) => (
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

        {editIncomeDebtorType === 'OTHER' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Nome do devedor
            </label>

            <input
              type="text"
              value={editIncomeOtherDebtorName}
              onChange={(e) =>
                setEditIncomeOtherDebtorName(
                  e.target.value
                )
              }
              disabled={savingEditIncome}
              className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Valor
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={editIncomeAmount}
            onChange={(e) =>
              setEditIncomeAmount(e.target.value)
            }
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Moeda
          </label>

          <select
            value={editIncomeCurrency}
            onChange={(e) =>
              setEditIncomeCurrency(e.target.value)
            }
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          >
            <option value="EUR">EUR</option>
            <option value="BRL">BRL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Vencimento
          </label>

          <input
            type="date"
            value={editIncomeDueDate}
            onChange={(e) =>
              setEditIncomeDueDate(e.target.value)
            }
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Data de referência
          </label>

          <input
            type="date"
            value={editIncomeReferenceDate}
            onChange={(e) =>
              setEditIncomeReferenceDate(
                e.target.value
              )
            }
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Observações
          </label>

          <textarea
            rows={3}
            value={editIncomeNotes}
            onChange={(e) =>
              setEditIncomeNotes(e.target.value)
            }
            disabled={savingEditIncome}
            className="mt-2 w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
          />
        </div>
      </div>

<div className="mt-6 flex items-center justify-between gap-3">
  <div>
    {editingIncomeReceivable.status !== 'PAID' &&
      editingIncomeReceivable.status !== 'CANCELLED' && (
        <button
          type="button"
          disabled={savingEditIncome || savingIncomeCancellation}
          onClick={() => {
            setError('')
            setCancellingIncomeReceivable(editingIncomeReceivable)
            setIncomeCancellationReason('')
          }}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Cancelar receita
        </button>
      )}
  </div>

  <div className="flex gap-3">
    <button
      type="button"
      disabled={savingEditIncome || savingIncomeCancellation}
      onClick={() =>
        setEditingIncomeReceivable(null)
      }
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      Fechar
    </button>

    <button
      type="button"
      disabled={savingEditIncome || savingIncomeCancellation}
      onClick={handleSaveEditIncome}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
    >
      {savingEditIncome
        ? 'A guardar...'
        : 'Guardar alterações'}
    </button>
  </div>
</div>
    </div>
  </div>
)}

{cancellingIncomeReceivable && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
    onClick={() => {
      if (!savingIncomeCancellation) {
        setCancellingIncomeReceivable(null)
        setIncomeCancellationReason('')
        setError('')
      }
    }}
  >
    <div
      className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Cancelar receita
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Esta operação deixará de constar como valor pendente a receber.
          </p>
        </div>

        <button
          type="button"
          disabled={savingIncomeCancellation}
          onClick={() => {
            setCancellingIncomeReceivable(null)
            setIncomeCancellationReason('')
            setError('')
          }}
          className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50"
        >
          Fechar
        </button>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Receita
        </p>

        <p className="mt-1 font-medium text-slate-900">
          {editIncomeDescription}
        </p>

        <p className="mt-1 text-sm text-slate-600">
          {Number(
            cancellingIncomeReceivable.amount
          ).toLocaleString('pt-PT', {
            style: 'currency',
            currency:
              cancellingIncomeReceivable.currency || 'EUR',
          })}
        </p>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-700">
          Motivo do cancelamento
        </label>

        <textarea
          value={incomeCancellationReason}
          onChange={(event) =>
            setIncomeCancellationReason(event.target.value)
          }
          disabled={savingIncomeCancellation}
          rows={3}
          placeholder="Informe o motivo do cancelamento"
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={savingIncomeCancellation}
          onClick={() => {
            setCancellingIncomeReceivable(null)
            setIncomeCancellationReason('')
            setError('')
          }}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Voltar
        </button>

        <button
          type="button"
          disabled={savingIncomeCancellation}
          onClick={handleCancelIncomeReceivable}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {savingIncomeCancellation
            ? 'A cancelar...'
            : 'Confirmar cancelamento'}
        </button>
      </div>
    </div>
  </div>
)}

{selectedReceivable && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onClick={() => {
      if (!savingReceipt) {
        setSelectedReceivable(null)
      }
    }}
  >
    <div
      className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Registrar recebimento
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedReceivable.debtor_name ||
                    selectedReceivable.debtor_type}
                </p>

{selectedReceivable.sale_number && (
  <p className="mt-1 text-sm text-slate-500">
    Venda:{' '}
    <span className="font-medium text-slate-700">
      {selectedReceivable.sale_number}
      {selectedReceivable.installment_number
        ? ` · Parcela ${selectedReceivable.installment_number}`
        : ''}
    </span>
  </p>
)}

              </div>

              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-900"
                onClick={() => setSelectedReceivable(null)}
              >
                Fechar
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-500">
                Valor pendente
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {Number(
                  selectedReceivable.outstanding_amount
                ).toLocaleString('pt-PT', {
                  style: 'currency',
                  currency:
                    selectedReceivable.currency || 'EUR',
                })}
              </p>
            </div>

<div className="mt-6 grid gap-4 md:grid-cols-2">
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Valor recebido
    </label>

    <input
      type="number"
      step="0.01"
      min="0"
      value={receiptAmount}
      onChange={(e) =>
        setReceiptAmount(e.target.value)
      }
      placeholder={String(selectedReceivable.outstanding_amount)}
      className="mt-2 w-full rounded-lg border px-3 py-2"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700">
      Data do recebimento
    </label>

    <input
      type="date"
      value={receiptDate}
      onChange={(e) =>
        setReceiptDate(e.target.value)
      }
      className="mt-2 w-full rounded-lg border px-3 py-2"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700">
      Forma de pagamento
    </label>

    <select
  value={receiptPaymentMethodId}
  onChange={(e) =>
    setReceiptPaymentMethodId(e.target.value)
  }
  className="mt-2 w-full rounded-lg border px-3 py-2"
>
  <option value="">
    Selecione...
  </option>

  {paymentMethods.map((method) => (
    <option
      key={method.id}
      value={method.id}
    >
      {method.name}
    </option>
  ))}
</select>
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700">
      Conta de destino
    </label>

    <select
  value={receiptFinancialAccountId}
  onChange={(e) =>
    setReceiptFinancialAccountId(e.target.value)
  }
  className="mt-2 w-full rounded-lg border px-3 py-2"
>
  <option value="">
    Selecione...
  </option>

  {financialAccounts.map((account) => (
    <option
      key={account.id}
      value={account.id}
    >
      {account.name}
      {account.currency
        ? ` - ${account.currency}`
        : ''}
    </option>
  ))}
</select>
  </div>
</div>

<div className="mt-6 flex justify-end">
  <button
    type="button"
    disabled={savingReceipt}
onClick={handleConfirmReceipt}
    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
  >
    {savingReceipt
      ? 'Registrando...'
      : 'Confirmar recebimento'}
  </button>
</div>

    </div>
  </div>
)}

{receiptFeeWarning && selectedReceivable && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    onClick={() => setReceiptFeeWarning(null)}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-semibold text-slate-900">
        Atenção
      </h3>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        O valor recebido{' '}
        <strong>
          {receiptFeeWarning.receivedAmount.toLocaleString('pt-PT', {
            style: 'currency',
            currency: selectedReceivable.currency || 'EUR',
          })}
        </strong>{' '}
        é inferior ao valor das taxas oficiais ainda pendentes{' '}
        <strong>
          {receiptFeeWarning.pendingOfficialFees.toLocaleString('pt-PT', {
            style: 'currency',
            currency: selectedReceivable.currency || 'EUR',
          })}
        </strong>
        .
      </p>

      <p className="mt-3 text-sm font-medium text-slate-700">
        Deseja registrar o recebimento mesmo assim?
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setReceiptFeeWarning(null)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>

<button
  type="button"
  disabled={savingReceipt}
  onClick={async () => {
  if (
    !receiptFeeWarning ||
    !selectedReceivable.source_id
  ) {
    return
  }

  const amount =
    receiptFeeWarning.receivedAmount

  const warningData = {
    pendingOfficialFees:
      receiptFeeWarning.pendingOfficialFees,
    installmentId:
      selectedReceivable.source_id,
  }

  setReceiptFeeWarning(null)

  await executeReceiptPayment(
    amount,
    warningData
  )
}}

  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
>
  {savingReceipt ? 'Registrando...' : 'Continuar'}
</button>

      </div>
    </div>
  </div>
)}

{selectedReceivableHistory && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onClick={() =>
      setSelectedReceivableHistory(null)
    }
  >
    <div
      className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {selectedReceivableHistory.status === 'PAID'
              ? 'Recebimentos'
              : 'Histórico de recebimentos'}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedReceivableHistory.debtor_name ||
              selectedReceivableHistory.debtor_type}
          </p>
        </div>

        <button
          type="button"
          className="text-sm text-slate-500 hover:text-slate-900"
          onClick={() =>
            setSelectedReceivableHistory(null)
          }
        >
          Fechar
        </button>
      </div>

      <div className="mt-6">
        {loadingReceivablePaymentHistory ? (
          <div className="py-8 text-center text-sm text-slate-500">
            A carregar recebimentos...
          </div>
        ) : receivablePaymentHistory.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Nenhum recebimento encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Data
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Nº
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Valor
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Forma
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Conta
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Estado
                  </th>
		  
		  <th className="px-4 py-3 text-right font-medium">
		    Ação
		  </th>
                
		</tr>
              </thead>

              <tbody className="divide-y">
                {receivablePaymentHistory.map(
                  (payment) => {
                    const paymentMethod =
                      paymentMethods.find(
                        (method) =>
                          method.id ===
                          payment.payment_method_id
                      )

                    const financialAccount =
                      financialAccounts.find(
                        (account) =>
                          account.id ===
                          payment.financial_account_id
                      )

                    return (
                      <tr key={payment.payment_id}>
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(
                            payment.payment_date
                          ).toLocaleDateString('pt-PT')}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {payment.payment_number}
                        </td>

                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {Number(
                            payment.settled_amount
                          ).toLocaleString('pt-PT', {
                            style: 'currency',
                            currency:
                              payment.currency || 'EUR',
                          })}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {paymentMethod?.name ?? '—'}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {financialAccount?.name ?? '—'}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              payment.confirmation_status ===
                              'CONFIRMED'
                                ? 'bg-green-50 text-green-700'
                                : payment.confirmation_status ===
                                    'CANCELLED'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {payment.confirmation_status ===
                            'CONFIRMED'
                              ? 'Confirmado'
                              : payment.confirmation_status ===
                                  'CANCELLED'
                                ? 'Revertido'
                                : payment.confirmation_status}
                          </span>
                        </td>

<td className="px-4 py-3 text-right">
  {payment.confirmation_status === 'CONFIRMED' ? (
    <button
      type="button"
      onClick={() => {
        setSelectedPaymentToReverse(payment)
        setReceivableReversalReason('')
        setError('')
      }}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
    >
      Reverter recebimento
    </button>
  ) : (
    <span className="text-slate-400">
      —
    </span>
  )}
</td>

                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
)}
 
{selectedPaymentToReverse && (
  <div
    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
    onClick={() => {
      if (!reversingReceivablePayment) {
        setSelectedPaymentToReverse(null)
        setReceivableReversalReason('')
      }
    }}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-semibold text-slate-900">
        Reverter recebimento
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        O recebimento de{' '}
        <strong>
          {Number(
            selectedPaymentToReverse.settled_amount
          ).toLocaleString('pt-PT', {
            style: 'currency',
            currency:
              selectedPaymentToReverse.currency || 'EUR',
          })}
        </strong>{' '}
        será revertido.
      </p>

      <p className="mt-2 text-sm text-slate-500">
        O registro permanecerá no histórico como revertido.
      </p>

      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-700">
          Motivo da reversão
        </label>

        <textarea
          value={receivableReversalReason}
          onChange={(e) =>
            setReceivableReversalReason(e.target.value)
          }
          rows={3}
          disabled={reversingReceivablePayment}
          placeholder="Informe o motivo..."
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100"
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={reversingReceivablePayment}
          onClick={() => {
            setSelectedPaymentToReverse(null)
            setReceivableReversalReason('')
          }}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={
            reversingReceivablePayment ||
            receivableReversalReason.trim().length < 3
          }
          onClick={handleReverseReceivablePayment}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {reversingReceivablePayment
            ? 'Revertendo...'
            : 'Confirmar reversão'}
        </button>
      </div>
    </div>
  </div>
)}

  </>
)}

        </div>

        <div className="mt-8 rounded-2xl bg-white border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between gap-6">
  <div>
    <h2 className="text-lg font-semibold text-slate-900">
      Contas a pagar
    </h2>

    <p className="text-sm text-slate-500 mt-1">
      Lançamentos financeiros pendentes de pagamento.
    </p>
  </div>

  <div className="flex items-center gap-5">
  <div className="text-right">
    <p className="text-xl font-semibold text-slate-900">
      {pendingPayablesTotal.toLocaleString(
        'pt-PT',
        {
          style: 'currency',
          currency: 'EUR',
        }
      )}
    </p>

   <p className="text-sm text-slate-500 mt-1">
  {pendingPayables.length}{' '}
  {pendingPayables.length === 1
    ? 'valor pendente'
    : 'valores pendentes'}
</p>
  </div>

   <button
    type="button"
    onClick={() =>
     setShowPayables(!showPayables)
    }
    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    {showPayables
      ? 'Fechar valores'
      : 'Ver valores'}
  </button>
</div>
</div>

{showNewPayable && (
  <div className="border-b bg-slate-50 p-6">
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Novo valor a pagar
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Registe uma despesa ou obrigação da Portulegal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewPayable(false)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Fechar
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Categoria
          </label>

          <select
            value={newPayableCategoryId}
            onChange={(e) =>
              setNewPayableCategoryId(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="">Selecione a categoria</option>

            {expenseCategories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Fornecedor
          </label>

          <select
            value={newPayableSupplierId}
            onChange={(e) =>
              setNewPayableSupplierId(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="">Sem fornecedor</option>

            {suppliers.map((supplier) => (
              <option
                key={supplier.id}
                value={supplier.id}
              >
                {supplier.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              setShowNewSupplier(!showNewSupplier)
            }
            className="mt-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            + Novo fornecedor
          </button>

          {showNewSupplier && (
            <div className="mt-3 rounded-lg border bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Nome do fornecedor
                  </label>

                  <input
                    type="text"
                    value={newSupplierName}
                    onChange={(e) =>
                      setNewSupplierName(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border bg-white px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    NIF/NIPC
                  </label>

                  <input
                    type="text"
                    value={newSupplierNif}
                    onChange={(e) =>
                      setNewSupplierNif(e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border bg-white px-3 py-2"
                  />
                </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateSupplier}
                  disabled={savingNewSupplier}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingNewSupplier
                    ? 'A guardar...'
                    : 'Guardar fornecedor'}
                </button>
              </div>

              </div>
            </div>
          )} 

        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Descrição
          </label>

          <input
            type="text"
            value={newPayableDescription}
            onChange={(e) =>
              setNewPayableDescription(e.target.value)
            }
            placeholder="Ex.: Renda do escritório - outubro/2026"
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Valor
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={newPayableAmount}
            onChange={(e) =>
              setNewPayableAmount(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Moeda
          </label>

          <select
            value={newPayableCurrency}
            onChange={(e) =>
              setNewPayableCurrency(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="EUR">EUR</option>
            <option value="BRL">BRL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Vencimento
          </label>

          <input
            type="date"
            value={newPayableDueDate}
            onChange={(e) =>
              setNewPayableDueDate(e.target.value)
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

  <div className="md:col-span-2 flex justify-end">
    <button
      type="button"
      onClick={handleCreateExpensePayable}
      disabled={savingNewPayable}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {savingNewPayable
        ? 'A guardar...'
        : 'Guardar valor a pagar'}
    </button>
  </div>

      </div>

    </div>
  </div>
)}

{showNewRecurringExpense && (
  <div className="border-b bg-slate-50 p-6">
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Nova despesa recorrente
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Crie uma regra para gerar automaticamente os valores a pagar futuros.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowNewRecurringExpense(false)
          }
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Fechar
                </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Descrição
          </label>

          <input
            type="text"
            value={recurringExpenseDescription}
            onChange={(e) =>
              setRecurringExpenseDescription(
                e.target.value
              )
            }
            placeholder="Ex.: Renda mensal do escritório"
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Categoria
          </label>

          <select
            value={recurringExpenseCategoryId}
            onChange={(e) =>
              setRecurringExpenseCategoryId(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="">Sem categoria</option>

            {expenseCategories.map((category) => (
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
          <label className="block text-sm font-medium text-slate-700">
            Fornecedor
          </label>

          <select
            value={recurringExpenseSupplierId}
            onChange={(e) =>
              setRecurringExpenseSupplierId(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="">Sem fornecedor</option>

            {suppliers.map((supplier) => (
              <option
                key={supplier.id}
                value={supplier.id}
              >
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Periodicidade
          </label>

          <select
            value={recurringExpenseFrequency}
            onChange={(e) =>
              setRecurringExpenseFrequency(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="MONTHLY">Mensal</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="SEMIANNUAL">Semestral</option>
            <option value="ANNUAL">Anual</option>
            
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Tipo de valor
          </label>

          <select
            value={recurringExpenseAmountMode}
            onChange={(e) =>
              setRecurringExpenseAmountMode(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="FIXED">Fixo</option>
            <option value="ESTIMATED">
              Previsto / estimado
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Valor
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={recurringExpenseAmount}
            onChange={(e) =>
              setRecurringExpenseAmount(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Moeda
          </label>

          <select
            value={recurringExpenseCurrency}
            onChange={(e) =>
              setRecurringExpenseCurrency(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          >
            <option value="EUR">EUR</option>
            <option value="BRL">BRL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Data inicial
          </label>

          <input
            type="date"
            value={recurringExpenseStartDate}
            onChange={(e) =>
              setRecurringExpenseStartDate(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />

          <p className="mt-1 text-xs text-slate-500">
            Primeira competência da despesa recorrente.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Data final
          </label>

          <input
            type="date"
            value={recurringExpenseEndDate}
            onChange={(e) =>
              setRecurringExpenseEndDate(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />

          <p className="mt-1 text-xs text-slate-500">
            Opcional. Deixe em branco se não houver data prevista para terminar.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Dia de vencimento
          </label>

          <input
            type="number"
            min="1"
            max="31"
            value={recurringExpenseDueDay}
            onChange={(e) =>
              setRecurringExpenseDueDay(
                e.target.value
              )
            }
            placeholder="Ex.: 8"
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />

          <p className="mt-1 text-xs text-slate-500">
            Dia habitual de vencimento, entre 1 e 31.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Observações
          </label>

          <textarea
            value={recurringExpenseNotes}
            onChange={(e) =>
              setRecurringExpenseNotes(
                e.target.value
              )
            }
            rows={3}
            placeholder="Informações adicionais sobre esta despesa recorrente."
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveRecurringExpense}
            disabled={savingRecurringExpense}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingRecurringExpense
              ? 'A guardar...'
              : 'Guardar despesa recorrente'}
          </button>
        </div>

      </div>
    </div>
  </div>
)}

{showPayables && (
  <>

    <div className="flex flex-wrap gap-3 border-b bg-white px-6 py-4">
      <button
        type="button"
        onClick={() =>
          setShowNewPayable(!showNewPayable)
        }
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Novo valor a pagar
      </button>

        <button
        type="button"
        onClick={() =>
          setShowNewRecurringExpense(
            !showNewRecurringExpense
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        + Nova despesa recorrente
      </button>
      <button
        type="button"
        onClick={() =>
          setShowRecurringExpenseRules(
            !showRecurringExpenseRules
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Gerir despesas recorrentes
      </button>

      <button
        type="button"
        onClick={() =>
          setShowExpenseCategories(
            !showExpenseCategories
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Gerir categorias
      </button>

      <button
        type="button"
        onClick={() =>
          setShowSuppliers(
            !showSuppliers
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Gerir fornecedores
      </button>

    </div>

    {showSuppliers && (
      <div className="border-b bg-slate-50 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Fornecedores
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {allSuppliers.length} fornecedores cadastrados.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border bg-white">
          {allSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {supplier.name}
                </div>

                {supplier.nif_nipc && (
                  <div className="mt-1 text-xs text-slate-500">
                    NIF/NIPC: {supplier.nif_nipc}
                  </div>
                )}
              </div>

                            <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    supplier.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {supplier.is_active ? 'Ativo' : 'Inativo'}
                </span>

                {supplier.is_active && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier(supplier)
                      setEditSupplierName(
                        supplier.name
                      )
                      setEditSupplierNif(
                        supplier.nif_nipc ?? ''
                      )
                      setEditSupplierPhone(
                        supplier.phone ?? ''
                      )
                      setEditSupplierEmail(
                        supplier.email ?? ''
                      )
                      setEditSupplierAddress(
                        supplier.address ?? ''
                      )
                      setEditSupplierIban(
                        supplier.iban ?? ''
                      )
                      setEditSupplierNotes(
                        supplier.notes ?? ''
                      )
                    }}
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Editar
                  </button>
                )}

                {supplier.is_active && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeactivateSupplier(
                        supplier
                      )
                    }
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Inativar
                  </button>
                )}

                {!supplier.is_active && (
                  <button
                    type="button"
                    onClick={() =>
                      handleReactivateSupplier(
                        supplier
                      )
                    }
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Reativar
                  </button>
                )}

              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {editingSupplier && (
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Editar fornecedor
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              type="text"
              value={editSupplierName}
              onChange={(event) =>
                setEditSupplierName(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              NIF/NIPC
            </label>
            <input
              type="text"
              value={editSupplierNif}
              onChange={(event) =>
                setEditSupplierNif(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Telefone
            </label>
            <input
              type="text"
              value={editSupplierPhone}
              onChange={(event) =>
                setEditSupplierPhone(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              value={editSupplierEmail}
              onChange={(event) =>
                setEditSupplierEmail(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Morada
            </label>
            <input
              type="text"
              value={editSupplierAddress}
              onChange={(event) =>
                setEditSupplierAddress(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              IBAN
            </label>
            <input
              type="text"
              value={editSupplierIban}
              onChange={(event) =>
                setEditSupplierIban(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Notas
            </label>
            <textarea
              value={editSupplierNotes}
              onChange={(event) =>
                setEditSupplierNotes(event.target.value)
              }
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingSupplier(null)
              setEditSupplierName('')
              setEditSupplierNif('')
              setEditSupplierPhone('')
              setEditSupplierEmail('')
              setEditSupplierAddress('')
              setEditSupplierIban('')
              setEditSupplierNotes('')
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleUpdateSupplier}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Salvar
          </button>
        </div>
      </div>
    )}


    {showExpenseCategories && (
      <div className="border-b bg-slate-50 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Categorias de despesas
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {allExpenseCategories.length} categorias cadastradas.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700">
              Nova categoria
            </label>

            <input
              type="text"
              value={newExpenseCategoryName}
              onChange={(event) =>
                setNewExpenseCategoryName(
                  event.target.value
                )
              }
              placeholder="Nome da categoria"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <button
            type="button"
            onClick={handleCreateExpenseCategory}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Adicionar
          </button>
        </div>


        <div className="mt-4 overflow-hidden rounded-xl border bg-white">
          {allExpenseCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <span className="text-sm font-medium text-slate-900">
                {category.name}
              </span>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    category.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {category.is_active ? 'Ativa' : 'Inativa'}
                </span>

                {category.is_active && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpenseCategory(category)
                      setEditExpenseCategoryName(
                        category.name
                      )
                    }}
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Editar
                  </button>
                )}

                {category.is_active && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeactivateExpenseCategory(
                        category
                      )
                    }
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Inativar
                  </button>
                )}

                {!category.is_active && (
                  <button
                    type="button"
                    onClick={() =>
                      handleReactivateExpenseCategory(
                        category
                      )
                    }
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    Reativar
                  </button>
                )}


              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {editingExpenseCategory && (
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Editar categoria
        </h3>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">
            Nome da categoria
          </label>

          <input
            type="text"
            value={editExpenseCategoryName}
            onChange={(event) =>
              setEditExpenseCategoryName(
                event.target.value
              )
            }
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingExpenseCategory(null)
              setEditExpenseCategoryName('')
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleUpdateExpenseCategory}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Salvar
          </button>
        </div>
      </div>
    )}


    {showRecurringExpenseRules && (
      <div className="border-b bg-slate-50 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Despesas recorrentes
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {recurringExpenseRules.length} regras cadastradas.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowRecurringExpenseRules(false)
            }
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {recurringExpenseRules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {rule.description}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {rule.frequency}
                    {' · '}
                    {rule.amount_mode === 'FIXED'
                      ? 'Valor fixo'
                      : 'Valor previsto'}
                    {' · '}
                    {Number(
                      rule.amount_mode === 'FIXED'
                        ? rule.default_amount
                        : rule.estimated_amount
                    ).toLocaleString('pt-PT', {
                      style: 'currency',
                      currency: rule.currency || 'EUR',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      rule.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rule.is_active ? 'Ativa' : 'Inativa'}
                  </span>

                  {rule.is_active && (

                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecurringExpenseRule(rule)
                      setEditRecurringDescription(rule.description)
                      setEditRecurringCategoryId(
                        rule.category_id ?? ''
                      )
                      setEditRecurringSupplierId(
                        rule.supplier_partner_id ?? ''
                      )
                      setEditRecurringFrequency(rule.frequency)
                      setEditRecurringAmountMode(rule.amount_mode)
                      setEditRecurringAmount(
                        String(
                          rule.amount_mode === 'FIXED'
                            ? rule.default_amount ?? ''
                            : rule.estimated_amount ?? ''
                        )
                      )
                      setEditRecurringCurrency(
                        rule.currency || 'EUR'
                      )
                      setEditRecurringEndDate(
                        rule.end_date ?? ''
                      )
                      setEditRecurringDueDay(
                        rule.due_day === null
                          ? ''
                          : String(rule.due_day)
                      )
                      setEditRecurringNotes(
                        rule.notes ?? ''
                      )
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Editar
                  </button>
                )}

                {rule.is_active && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeactivateRecurringExpenseRule(
                        rule
                      )
                    }
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Inativar
                  </button>
                )}
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {editingRecurringExpenseRule && (
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Editar despesa recorrente
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Altere os dados da regra para as ocorrências futuras.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setEditingRecurringExpenseRule(null)
            }
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Descrição
            </label>

            <input
              type="text"
              value={editRecurringDescription}
              onChange={(event) =>
                setEditRecurringDescription(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Categoria
            </label>

            <select
              value={editRecurringCategoryId}
              onChange={(event) =>
                setEditRecurringCategoryId(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Sem categoria</option>

              {expenseCategories.map((category) => (
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
            <label className="block text-sm font-medium text-slate-700">
              Fornecedor
            </label>

            <select
              value={editRecurringSupplierId}
              onChange={(event) =>
                setEditRecurringSupplierId(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Sem fornecedor</option>

              {suppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Frequência
            </label>

            <select
              value={editRecurringFrequency}
              disabled
              className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2 text-slate-600"
            >

              <option value="MONTHLY">Mensal</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="SEMIANNUAL">Semestral</option>
              <option value="ANNUAL">Anual</option>
              <option value="OTHER">Outra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tipo de valor
            </label>

            <select
              value={editRecurringAmountMode}
              onChange={(event) =>
                setEditRecurringAmountMode(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="FIXED">Valor fixo</option>
              <option value="ESTIMATED">Valor previsto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Valor
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={editRecurringAmount}
              onChange={(event) =>
                setEditRecurringAmount(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Moeda
            </label>

            <select
              value={editRecurringCurrency}
              onChange={(event) =>
                setEditRecurringCurrency(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Dia de vencimento
            </label>

            <input
              type="number"
              min="1"
              max="31"
              value={editRecurringDueDay}
              onChange={(event) =>
                setEditRecurringDueDay(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Data final
            </label>

            <input
              type="date"
              value={editRecurringEndDate}
              onChange={(event) =>
                setEditRecurringEndDate(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Observações
            </label>

             <textarea
              value={editRecurringNotes}
              onChange={(event) =>
                setEditRecurringNotes(event.target.value)
              }
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              setEditingRecurringExpenseRule(null)
            }
            disabled={savingRecurringRuleEdit}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleUpdateRecurringExpenseRule}
            disabled={savingRecurringRuleEdit}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {savingRecurringRuleEdit
              ? 'A guardar...'
              : 'Guardar alterações'}
          </button>
        </div>
      </div>
    )}


    <div className="px-6 py-4 border-b bg-slate-50">
      <div className="flex flex-wrap gap-2">
        {[
          ['OPEN', 'Em aberto'],
          ['PAID', 'Pagas'],
          ['CANCELLED', 'Canceladas'],
          ['ALL', 'Todas'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setPayablesFilter(
                value as
                  | 'OPEN'
                  | 'PAID'
                  | 'CANCELLED'
                  | 'ALL'
              )
            }
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              payablesFilter === value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Tipo
        </span>

        {[
          ['ALL', 'Todos'],
          ['SALE_ITEM_FEE', 'Taxas oficiais'],
          ['PARTNER_COMMISSION', 'Comissões'],
          ['EXPENSE', 'Despesas'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setPayablesTypeFilter(
                value as
                  | 'ALL'
                  | 'SALE_ITEM_FEE'
                  | 'PARTNER_COMMISSION'
                  | 'EXPENSE'
              )
            }
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              payablesTypeFilter === value
                ? 'bg-slate-700 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>


{payablesFilter === 'OPEN' &&
  futurePayables.length > 0 && (
    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {showFuturePayables
            ? 'Obrigações atuais e próximos vencimentos'
            : 'Obrigações atuais'}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {showFuturePayables
            ? `${futurePayables.length} vencimento${
                futurePayables.length === 1 ? '' : 's'
              } futuro${
                futurePayables.length === 1 ? '' : 's'
              } também exibido${
                futurePayables.length === 1 ? '' : 's'
              }.`
            : `${futurePayables.length} próximo${
                futurePayables.length === 1 ? '' : 's'
              } vencimento${
                futurePayables.length === 1 ? '' : 's'
              } oculto${
                futurePayables.length === 1 ? '' : 's'
              } para manter a lista organizada.`}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          setShowFuturePayables(
            (current) => !current
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {showFuturePayables
          ? 'Ocultar próximos vencimentos'
          : `Mostrar próximos vencimentos (${futurePayables.length})`}
      </button>
    </div>
  )}

		{displayedPayables.length === 0 ? (

            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum valor pendente a pagar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
		  <th className="px-5 py-3 text-left font-medium">
		    Tipo
		  </th>

		  <th className="px-5 py-3 text-left font-medium">
		    Credor
		  </th>

		  <th className="px-5 py-3 text-left font-medium">
		   Descrição
		</th>

                    <th className="px-5 py-3 text-left font-medium">
                      Vencimento
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
		Valor
		 </th>

		<th className="px-5 py-3 text-right font-medium">
		Pago
		</th>

		<th className="px-5 py-3 text-right font-medium">
		  Pendente
		</th>

		<th className="px-5 py-3 text-left font-medium">
		  Estado
		</th>

		<th className="px-5 py-3 text-right font-medium">
		  Ação
		</th>

                  </tr>
                </thead>

                <tbody className="divide-y">
                  {displayedPayables.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >

<td className="px-5 py-4">
  <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium text-slate-700">
    {item.source_type === 'SALE_ITEM_FEE'
      ? 'Taxa oficial'
      : item.source_type === 'PARTNER_COMMISSION'
        ? 'Comissão'
        : item.source_type === 'EXPENSE'
          ? 'Despesa'
          : 'Outro'}
  </span>
</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {item.creditor_name ||
                            item.creditor_type}
                        </p>
                      </td>

<td className="px-5 py-4 text-slate-600">
  <div>
    {item.description}
  </div>

  {item.sale_number && (
    <div className="mt-1 text-xs text-slate-500">
      {item.sale_number}
      {item.item_number !== null
        ? ` · Item ${item.item_number}`
        : ''}
      {item.client_name
        ? ` · ${item.client_name}`
        : ''}
    </div>
  )}

  {!item.sale_number &&
    item.source_type === 'EXPENSE' && (
      <div className="mt-1 text-xs text-slate-500">
        Empresa
      </div>
    )}
</td>
                      <td className="px-5 py-4">
                        <div className="text-slate-600">
                          {item.due_date
                            ? new Date(
                                item.due_date
                              ).toLocaleDateString('pt-PT')
                            : '—'}
                        </div>

                        {item.due_status === 'OVERDUE' && (
                          <div className="mt-1 text-xs font-medium text-red-600">
                            Vencido
                          </div>
                        )}

                        {item.due_status === 'DUE_TODAY' && (
                          <div className="mt-1 text-xs font-medium text-amber-600">
                            Vence hoje
                          </div>
                        )}

                        {item.due_status === 'UPCOMING' && (
                          <div className="mt-1 text-xs text-slate-500">
                            A vencer
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-900">
                        {Number(
                          item.amount
                        ).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency:
                            item.currency || 'EUR',
                        })}
                                            </td>

                      <td className="px-5 py-4 text-right text-slate-600">
                        {Number(
                          item.paid_amount
                        ).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency:
                            item.currency || 'EUR',
                        })}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-slate-900">
                        {Number(
                          item.outstanding_amount
                        ).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency:
                            item.currency || 'EUR',
                        })}
                      </td>

                      <td className="px-5 py-4">
<span
  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
    item.cost_status === 'CANCELLED'
      ? 'bg-slate-100 text-slate-600'
      : item.payment_status === 'PAID'
        ? 'bg-green-50 text-green-700'
      : getPayableInstallments(item.id).length > 0
        ? 'bg-amber-50 text-amber-700'
          : item.payment_status === 'PARTIALLY_PAID'
            ? 'bg-amber-50 text-amber-700'
            : item.cost_status === 'EXPECTED'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-red-50 text-red-700'
  }`}
>
  {item.cost_status === 'CANCELLED'
    ? 'Cancelado'
    : item.payment_status === 'PAID'
      ? 'Pago'
: getPayableInstallments(item.id).length > 0
  ? 'Parcelado'
        : item.payment_status === 'PARTIALLY_PAID'
          ? 'Parcialmente pago'
          : item.cost_status === 'EXPECTED'
            ? 'Previsto'
            : 'Pendente'}
</span>

                      </td>

<td className="px-5 py-4 text-right">
  {item.cost_status !== 'CANCELLED' &&
  Number(item.outstanding_amount) > 0 ? (
    <div className="flex justify-end gap-2">
{item.source_type === 'EXPENSE' && (
  <button
  type="button"
  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
  onClick={() => {
setError('')
    setEditingExpensePayable(item)
    setEditExpenseDescription(item.description)
    setEditExpenseAmount(String(item.amount))
    setEditExpenseDueDate(item.due_date ?? '')
    setEditExpenseCategoryId(
  item.expense_category_id ?? ''
)
    setEditExpenseSupplierId(item.creditor_id ?? '')
  }}
>
  Editar
</button>

)}

      {item.cost_status === 'EXPECTED' ? (
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={() => {
  setError('')
  setConfirmingEstimatedPayable(item)
  setEstimatedActualAmount(String(item.amount))
}}
        >
          Confirmar valor
        </button>
      ) : (
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={() => {
            setSelectedPayable(item)

            setPayableAmount(
              String(item.outstanding_amount)
            )

            const today = new Date()
            const localToday = new Date(
              today.getTime() -
                today.getTimezoneOffset() * 60000
            )
              .toISOString()
              .split('T')[0]

            setPayableDate(localToday)

            setPayablePaymentMethodId('')
            setPayableFinancialAccountId('')
          }}
        >
          Pagar
        </button>
      )}

      {getPayablePayments(item.id).length > 0 && (
        <button
          type="button"
          onClick={() =>
            setSelectedPayableHistory(item)
          }
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Ver histórico
        </button>
      )}
    </div>
  ) : item.payment_status === 'PAID' ? (
    <div className="flex justify-end gap-2">
      {item.source_type === 'EXPENSE' && (
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={() => {
	setError('')
            setEditingExpensePayable(item)
            setEditExpenseDescription(item.description)
            setEditExpenseAmount(String(item.amount))
            setEditExpenseDueDate(item.due_date ?? '')
            setEditExpenseCategoryId(
              item.expense_category_id ?? ''
            )
            setEditExpenseSupplierId(
              item.creditor_id ?? ''
            )
          }}
        >
          Editar
        </button>
      )}

      <button
        type="button"
        onClick={() =>
          setSelectedPayableHistory(item)
        }
        className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Ver pagamento
      </button>
    </div>
  ) : (

    <span className="text-sm text-slate-400">
      —
    </span>
  )}
</td>
                    </tr>
                  ))}
                      </tbody>
              </table>
            </div>
          )}

{confirmingEstimatedPayable && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Confirmar valor previsto
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Informe o valor real da despesa para transformá-la em uma obrigação pendente.
        </p>
      </div>

      <button
        type="button"
        className="text-sm text-slate-500 hover:text-slate-900"
        onClick={() => {
          setConfirmingEstimatedPayable(null)
          setEstimatedActualAmount('')
          setError('')
        }}
      >
        Fechar
      </button>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Valor previsto
        </label>

        <div className="mt-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {Number(
            confirmingEstimatedPayable.amount
          ).toLocaleString('pt-PT', {
            style: 'currency',
            currency:
              confirmingEstimatedPayable.currency || 'EUR',
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Valor real
        </label>

        <input
          type="number"
          min="0.01"
          step="0.01"
          value={estimatedActualAmount}
          onChange={(event) =>
            setEstimatedActualAmount(event.target.value)
          }
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>
       </div>

    {error && (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )}

    <div className="mt-6 flex justify-end">
      <button
        type="button"
        onClick={handleConfirmEstimatedExpense}
        disabled={savingEstimatedConfirmation}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {savingEstimatedConfirmation
          ? 'A confirmar...'
          : 'Confirmar valor'}
      </button>
    </div>

  </div>
  </div>
)}

{editingExpensePayable && (
    <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl">

    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Editar despesa
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Altere os dados da despesa
        </p>
      </div>

      <button
        type="button"
        className="text-sm text-slate-500 hover:text-slate-900"
        onClick={() => setEditingExpensePayable(null)}
      >
        Fechar
      </button>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Descrição
        </label>

        <input
          type="text"
          value={editExpenseDescription}
          onChange={(event) =>
            setEditExpenseDescription(event.target.value)
          }
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Categoria
        </label>

        <select
          value={editExpenseCategoryId}
          onChange={(event) =>
            setEditExpenseCategoryId(event.target.value)
          }
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="">Sem categoria</option>

          {expenseCategories.map((category) => (
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
        <label className="block text-sm font-medium text-slate-700">
          Fornecedor
        </label>

        <select
          value={editExpenseSupplierId}
          onChange={(event) =>
            setEditExpenseSupplierId(event.target.value)
          }
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="">Sem fornecedor</option>

          {suppliers.map((supplier) => (
            <option
              key={supplier.id}
              value={supplier.id}
            >
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Valor
        </label>

        <input
          type="number"
          step="0.01"
          min="0"
          value={editExpenseAmount}
          onChange={(event) =>
            setEditExpenseAmount(event.target.value)
          }
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Vencimento
        </label>

        <input
          type="date"
          value={editExpenseDueDate}
          onChange={(event) =>
            setEditExpenseDueDate(event.target.value)
          }
          className="mt-1 w-full rounded-lg border px-3 py-2"
               />
      </div>

{error && (
  <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {error}
  </div>
)}

      <div className="flex items-end gap-3">
        <button
          type="button"
          onClick={handleUpdateExpensePayable}
          disabled={savingExpenseEdit}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {savingExpenseEdit
            ? 'A guardar...'
            : 'Guardar alterações'}
        </button>

        <button
          type="button"
          onClick={handleCancelExpensePayable}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Cancelar despesa
        </button>

      </div>
    </div>
  </div>
)}


        {selectedPayable && (

                    <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Registrar pagamento
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedPayable.creditor_name ||
                    selectedPayable.creditor_type}
                </p>
              </div>

              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-900"
                onClick={() => {
  setSelectedPayable(null)
  setSelectedPayableInstallment(null)
  setPayableAmount('')
}}
              >
                Fechar
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-500">
                Valor pendente
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {Number(
                  selectedPayable.outstanding_amount
                ).toLocaleString('pt-PT', {
                  style: 'currency',
                  currency:
                    selectedPayable.currency || 'EUR',
                })}
              </p>
            </div>

{error && (
  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {error}
  </div>
)}

{getPayableInstallments(selectedPayable.id).length > 0 && (
  <div className="mt-6">
    <p className="text-sm font-medium text-slate-700">
      Selecione a parcela a pagar
    </p>

    <div className="mt-3 space-y-2">
      {getPayableInstallments(selectedPayable.id).map(
        (installment) => (
          <button
            key={installment.id}
            type="button"
            disabled={installment.payment_status === 'PAID'}
onClick={() => {
  setSelectedPayableInstallment(installment)
  setPayableAmount(
    String(installment.outstanding_amount)
  )
}}

            className={`w-full rounded-lg border px-4 py-3 text-left ${
              selectedPayableInstallment?.id === installment.id
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 bg-white'
            } ${
              installment.payment_status === 'PAID'
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-slate-900">
                Parcela {installment.installment_number}
              </span>

<div className="text-right">
  <div className="font-medium text-slate-900">
    Valor:{' '}
    {Number(installment.amount).toLocaleString(
      'pt-PT',
      {
        style: 'currency',
        currency: installment.currency || 'EUR',
      }
    )}
  </div>

  <div className="mt-1 text-xs text-slate-500">
    Pago:{' '}
    {Number(installment.paid_amount).toLocaleString(
      'pt-PT',
      {
        style: 'currency',
        currency: installment.currency || 'EUR',
      }
    )}
    {' · '}
    Saldo:{' '}
    {Number(
      installment.outstanding_amount
    ).toLocaleString('pt-PT', {
      style: 'currency',
      currency: installment.currency || 'EUR',
    })}
  </div>
</div>

            </div>

            <div className="mt-1 flex items-center justify-between gap-4 text-sm text-slate-500">
              <span>
                Vencimento:{' '}
                {new Date(
                  `${installment.due_date}T12:00:00`
                ).toLocaleDateString('pt-PT')}
              </span>

              <span>
                {installment.payment_status === 'PAID'
                  ? 'Paga'
                  : installment.payment_status ===
                      'PARTIALLY_PAID'
                    ? 'Parcialmente paga'
                    : 'Em aberto'}
              </span>
            </div>
          </button>
        )
      )}
    </div>
  </div>
)}


{showPayableInstallmentPlan && (
  <div className="mt-6 rounded-xl border bg-slate-50 p-4">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-slate-900">
          Criar parcelamento
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Defina as parcelas e os respetivos vencimentos.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Número de parcelas
          </label>

          <input
            type="number"
            min="2"
            value={payableInstallmentCount}
            onChange={(e) =>
              setPayableInstallmentCount(e.target.value)
            }
            className="mt-2 w-32 rounded-lg border px-3 py-2"
          />

          <button
            type="button"
            onClick={handlePreparePayableInstallments}
            className="ml-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Gerar parcelas
          </button>

          {payableInstallmentDrafts.length > 0 && (
            <div className="mt-4 space-y-3">
              {payableInstallmentDrafts.map(
                (installment, index) => (
                  <div
                    key={installment.number}
                    className="grid items-end gap-3 rounded-lg border bg-white p-3 md:grid-cols-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Parcela
                      </p>

                      <p className="mt-2 py-2 text-sm text-slate-900">
                        {installment.number}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Valor
                      </label>

                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={installment.amount}
                        onChange={(e) => {
                          const updated = [
                            ...payableInstallmentDrafts,
                          ]

                          updated[index] = {
                            ...installment,
                            amount: e.target.value,
                          }

                          setPayableInstallmentDrafts(
                            updated
                          )
                        }}
                        className="mt-2 w-full rounded-lg border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Vencimento
                      </label>

                      <input
                        type="date"
                        value={installment.due_date}
                        onChange={(e) => {
                          const updated = [
                            ...payableInstallmentDrafts,
                          ]

                          updated[index] = {
                            ...installment,
                            due_date: e.target.value,
                          }

                          setPayableInstallmentDrafts(
                            updated
                          )
                        }}
                        className="mt-2 w-full rounded-lg border px-3 py-2"
                      />
                    </div>
                  </div>
                )
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCreatePayableInstallmentPlan}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Criar parcelamento
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      <button
        type="button"
        onClick={() =>
          setShowPayableInstallmentPlan(false)
        }
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        Voltar
      </button>
    </div>
  </div>
)}

<div className="mt-6 grid gap-4 md:grid-cols-2">
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Valor pago
    </label>

    <input
      type="number"
      step="0.01"
      min="0"
      value={payableAmount}
      onChange={(e) =>
        setPayableAmount(e.target.value)
      }
      placeholder={String(selectedPayable.outstanding_amount)}
      className="mt-2 w-full rounded-lg border px-3 py-2"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700">
      Data do pagamento
    </label>

    <input
      type="date"
      value={payableDate}
      onChange={(e) =>
        setPayableDate(e.target.value)
      }
      className="mt-2 w-full rounded-lg border px-3 py-2"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700">
      Forma de pagamento
    </label>

    <select
      value={payablePaymentMethodId}
      onChange={(e) =>
        setPayablePaymentMethodId(e.target.value)
      }
      className="mt-2 w-full rounded-lg border px-3 py-2"
    >
      <option value="">
        Selecione...
      </option>

      {paymentMethods.map((method) => (
        <option
          key={method.id}
          value={method.id}
        >
          {method.name}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700">
      Conta de saída
    </label>

    <select
      value={payableFinancialAccountId}
      onChange={(e) =>
        setPayableFinancialAccountId(e.target.value)
      }
      className="mt-2 w-full rounded-lg border px-3 py-2"
    >
      <option value="">
        Selecione...
      </option>

      {financialAccounts.map((account) => (
        <option
          key={account.id}
          value={account.id}
        >
          {account.name}
          {account.currency
            ? ` - ${account.currency}`
            : ''}
        </option>
      ))}
    </select>
  </div>
</div>

<div className="mt-6 flex items-center justify-between gap-3">
    {getPayableInstallments(selectedPayable.id).length === 0 && (
    <button
      type="button"
      onClick={() =>
        setShowPayableInstallmentPlan(true)
      }
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Criar parcelamento
    </button>
  )}

  <button
    type="button"
    disabled={savingPayable}
    onClick={handleConfirmPayable}
    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
  >
    {savingPayable
      ? 'Registrando...'
      : 'Confirmar pagamento'}
  </button>
</div>

      </div>
        )}

{selectedPayableHistory && (
  <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white p-6 shadow-xl">

    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Histórico do pagamento
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {selectedPayableHistory.creditor_name ||
            selectedPayableHistory.creditor_type}
          {' — '}
          {selectedPayableHistory.description}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          setSelectedPayableHistory(null)
        }
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        Fechar
      </button>
    </div>

    <div className="mt-6 space-y-3">
      {getPayablePayments(
        selectedPayableHistory.id
      ).map((payment) => (
        <div
          key={payment.id}
          className="rounded-xl border p-4"
        >
          <div className="grid gap-4 md:grid-cols-6">
            <div>
              <p className="text-xs text-slate-500">
                Data
              </p>
              <p className="mt-1 font-medium">
                {new Date(
                  payment.payment_date
                ).toLocaleDateString('pt-PT')}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Valor
              </p>
              <p className="mt-1 font-medium">
                {Number(
                  payment.allocated_amount
                ).toLocaleString('pt-PT', {
                  style: 'currency',
                  currency:
                    payment.currency || 'EUR',
                })}
              </p>
            </div>

<div>
  <p className="text-xs text-slate-500">
    Parcela
  </p>

  <p className="mt-1 font-medium">
    {payment.payable_installment_id
      ? (() => {
          const installment =
            payableInstallments.find(
              (item) =>
                item.id ===
                payment.payable_installment_id
            )

          return installment
            ? `Parcela ${installment.installment_number}`
            : 'Parcela'
        })()
      : '—'}
  </p>
</div>

            <div>
              <p className="text-xs text-slate-500">
                Forma
              </p>
              <p className="mt-1 font-medium">
                {getPaymentMethodName(
                  payment.payment_method_id
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Conta
              </p>
              <p className="mt-1 font-medium">
                {getFinancialAccountName(
                  payment.financial_account_id
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Estado
              </p>
              <p className="mt-1 font-medium">
  {payment.confirmation_status === 'CONFIRMED'
    ? 'Confirmado'
    : payment.confirmation_notes
        ?.trim()
        .toUpperCase()
        .startsWith('REVERTIDO:')
      ? 'Revertido'
      : 'Pendente de confirmação'}
</p>

{payment.confirmation_status !== 'CONFIRMED' &&
  payment.confirmation_notes && (
    <p className="mt-1 text-xs text-slate-500">
      {payment.confirmation_notes.replace(
        /^REVERTIDO:\s*/,
        ''
      )}
    </p>
  )}

            </div>
{payment.confirmation_status === 'CONFIRMED' && (
  <div className="md:col-span-5 flex justify-end">
    <button
      type="button"
      onClick={() => {
        setSelectedOutgoingPayment(payment)
        setReversalReason('')
      }}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
    >
      Reverter pagamento
    </button>
  </div>
)}

{selectedOutgoingPayment?.id === payment.id && (
  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
    <p className="font-semibold text-red-800">
      Confirmar reversão do pagamento
    </p>

    <p className="mt-2 text-sm text-red-700">
      Esta operação irá retirar o efeito deste pagamento
      da conta financeira e reabrir o valor correspondente
      na conta a pagar. O pagamento não será apagado e
      permanecerá registado no histórico.
    </p>

    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-700">
        Motivo da reversão
      </label>

      <textarea
        value={reversalReason}
        onChange={(event) =>
          setReversalReason(event.target.value)
        }
        rows={3}
        placeholder="Informe o motivo da reversão"
        className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm"
      />
    </div>

    <div className="mt-4 flex justify-end gap-3">
      <button
        type="button"
        onClick={() => {
          setSelectedOutgoingPayment(null)
          setReversalReason('')
        }}
        className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Voltar
      </button>

      <button
        type="button"
	onClick={handleReverseOutgoingPayment}
        disabled={
          reversalReason.trim().length < 3 ||
          reversingPayment
        }
        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirmar reversão
      </button>
    </div>
  </div>
)}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

  </>
)}

        </div>

        <div className="mt-8 rounded-2xl bg-white border shadow-sm overflow-hidden">
         <div className="px-6 py-5 border-b flex items-center justify-between gap-4">
  <div>
    <h2 className="text-lg font-semibold text-slate-900">
      Movimentações financeiras
    </h2>

    <p className="text-sm text-slate-500 mt-1">
      {financialMovements.length} movimentações registadas.
    </p>
  </div>

  <button
    type="button"
    onClick={() =>
      setShowFinancialMovements(!showFinancialMovements)
    }
    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    {showFinancialMovements
      ? 'Fechar histórico'
      : 'Ver histórico'}
  </button>
</div>

{showFinancialMovements && (
  <>

<div className="border-b bg-slate-50 px-6 py-4">
  <div className="grid gap-4 md:grid-cols-4">

<div className="md:col-span-2">
  <label className="block text-sm font-medium text-slate-700">
    Pesquisar
      </label>

      <input
        type="text"
        value={financialMovementSearch}
        onChange={(event) =>
          setFinancialMovementSearch(event.target.value)
        }
        placeholder="Venda, cliente, fornecedor, comissão..."
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700">
        Conta
      </label>

      <select
        value={financialMovementAccountFilter}
        onChange={(event) =>
          setFinancialMovementAccountFilter(
            event.target.value
          )
        }
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="ALL">
          Todas as contas
        </option>

        {financialAccountBalances.map((account) => (
          <option
            key={account.financial_account_id}
            value={account.financial_account_id}
          >
            {account.name}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700">
        Tipo
      </label>

      <select
        value={financialMovementTypeFilter}
        onChange={(event) =>
          setFinancialMovementTypeFilter(
            event.target.value
          )
        }
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="ALL">
          Todos os tipos
        </option>

        <option value="INFLOW">
          Entradas
        </option>

        <option value="OUTFLOW">
          Saídas
        </option>

        <option value="TRANSFER">
          Transferências
        </option>
      </select>
      </div>

  </div>

  <div className="mt-4 flex flex-wrap items-end gap-4">
    <div>
      <label className="block text-sm font-medium text-slate-700">
        Data inicial
      </label>

      <input
        type="date"
        value={financialMovementDateFrom}
        onChange={(event) =>
          setFinancialMovementDateFrom(event.target.value)
        }
        className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700">
        Data final
      </label>

      <input
        type="date"
        value={financialMovementDateTo}
        onChange={(event) =>
          setFinancialMovementDateTo(event.target.value)
        }
        className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      />
    </div>

    {(financialMovementDateFrom ||
      financialMovementDateTo) && (
      <button
        type="button"
        onClick={() => {
          setFinancialMovementDateFrom('')
          setFinancialMovementDateTo('')
        }}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Limpar período
      </button>
    )}
  </div>

</div>

{financialMovements.length === 0 ? (

  <div className="p-8 text-center text-sm text-slate-500">
    Nenhuma movimentação financeira registada.
  </div>
) : (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-5 py-3 text-left font-medium">
            Data
          </th>

          <th className="px-5 py-3 text-left font-medium">
            Conta
          </th>

          <th className="px-5 py-3 text-left font-medium">
            Tipo
          </th>

          <th className="px-5 py-3 text-left font-medium">
            Descrição
          </th>

          <th className="px-5 py-3 text-right font-medium">
            Valor
          </th>
        </tr>
      </thead>

      <tbody className="divide-y">
        {filteredFinancialMovements.map((movement) => (
          <tr
            key={movement.id}
            className="hover:bg-slate-50"
          >
            <td className="px-5 py-4 text-slate-600">
              {new Date(
                movement.movement_date
              ).toLocaleDateString('pt-PT')}
            </td>

            <td className="px-5 py-4 font-medium text-slate-900">
              {getFinancialAccountName(
                movement.financial_account_id
              )}
            </td>

            <td className="px-5 py-4 text-slate-600">
             {movement.movement_type === 'INFLOW'
  ? 'Entrada'
  : movement.movement_type === 'OUTFLOW'
    ? 'Saída'
    : movement.movement_type === 'TRANSFER'
      ? movement.source_type === 'ACCOUNT_TRANSFER_SOURCE'
        ? 'Transferência enviada'
        : movement.source_type === 'ACCOUNT_TRANSFER_DESTINATION'
          ? 'Transferência recebida'
          : 'Transferência'
      : movement.movement_type}
            </td>

<td className="px-5 py-4 text-slate-600">
  {financialMovementDescriptions.find(
    (item) =>
      item.financial_movement_id === movement.id
  )?.description ||
    movement.notes ||
    movement.source_type ||
    '—'}
</td>

            <td className="px-5 py-4 text-right font-semibold text-slate-900">
              {movement.movement_type === 'OUTFLOW' ||
movement.source_type === 'ACCOUNT_TRANSFER_SOURCE'
  ? '- '
  : movement.movement_type === 'INFLOW' ||
      movement.source_type === 'ACCOUNT_TRANSFER_DESTINATION'
    ? '+ '
    : ''}
              {Number(movement.amount).toLocaleString(
                'pt-PT',
                {
                  style: 'currency',
                  currency: movement.currency,
                }
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
     </>
)}

     </div>

      </div>
    </div>
  )
}







