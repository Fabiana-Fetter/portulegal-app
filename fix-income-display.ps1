$p = 'app\financeiro\page.tsx'
$enc = New-Object System.Text.UTF8Encoding($false)
$lines = [System.IO.File]::ReadAllLines($p, $enc)

$start = 849
$end = 891

$newBlock = @'
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
        ? incomeCategories.find(
            (category) =>
              category.id === income.category_id
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
    }
  })

setReceivables(enrichedReceivables)
'@ -split [Environment]::NewLine

$before = if ($start -gt 0) {
  $lines[0..($start - 1)]
} else {
  @()
}

$after = if ($end + 1 -lt $lines.Length) {
  $lines[($end + 1)..($lines.Length - 1)]
} else {
  @()
}

$result = @($before) + @($newBlock) + @($after)

[System.IO.File]::WriteAllLines(
  $p,
  $result,
  $enc
)