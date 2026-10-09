$p = 'app\financeiro\page.tsx'
$enc = New-Object System.Text.UTF8Encoding($false)
$c = [System.IO.File]::ReadAllText($p, $enc)

$old = @'
  {item.source_type === 'PARTNER_COMMISSION'
    ? 'Comissão de parceiro'
    : item.source_type === 'CLIENT_INSTALLMENT'
      ? 'Parcela de cliente'
      : item.source_type === 'PARTNER_SERVICE'
        ? 'Serviço de parceiro'
        : 'Outro'}
'@

$new = @'
  {item.source_type === 'PARTNER_COMMISSION'
    ? 'Comissão de parceiro'
    : item.source_type === 'CLIENT_INSTALLMENT'
      ? 'Parcela de cliente'
      : item.source_type === 'PARTNER_SERVICE'
        ? 'Serviço de parceiro'
        : item.source_type === 'INCOME'
          ? item.source_name ?? 'Receita'
          : 'Outro'}
'@

if (-not $c.Contains($old)) {
  throw 'Trecho da coluna Origem nao encontrado'
}

$c = $c.Replace($old, $new)

[System.IO.File]::WriteAllText(
  $p,
  $c,
  $enc
)