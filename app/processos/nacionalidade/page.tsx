'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Row = {
  process_id: string
  internal_reference: string
  sale_number: string
  sale_date: string
  client_id: string
  client_name: string
  product_id: string
  product_code: string
  product_name: string
  responsible_user_id: string | null
  responsible_user_name: string | null
  current_status_id: string | null
  current_status_name: string | null
  current_status_order: number | null
  general_status: string
  registry_office: string | null
  distribution_date: string | null
  submission_number: string | null
  external_process_number: string | null
  access_code: string | null
  notes_internal: string | null
  opened_at: string
  closed_at: string | null
  created_at: string
  updated_at: string
  documents_sender: string | null
  documents_sent_date: string | null
  partner_id: string | null
  partner_name: string | null
}

export default function NacionalidadePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [phase, setPhase] = useState('')
  const [responsible, setResponsible] = useState('')
  const [product, setProduct] = useState('')
  const [partner, setPartner] = useState('')
  const [registryOffice, setRegistryOffice] = useState('')
  const [documentsSender, setDocumentsSender] = useState('')
  const [generalStatus, setGeneralStatus] = useState('')

const [editingRow, setEditingRow] = useState<Row | null>(null)
const [editRegistryOffice, setEditRegistryOffice] = useState('')
const [editDocumentsSender, setEditDocumentsSender] = useState('')
const [editDocumentsSentDate, setEditDocumentsSentDate] = useState('')
const [editNotes, setEditNotes] = useState('')
const [savingEdit, setSavingEdit] = useState(false)
const [editError, setEditError] = useState('')
  useEffect(() => {
    loadRows()
  }, [])

  async function loadRows() {
    setLoading(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data, error } = await supabase
      .from('vw_irn_nacionalidade_processos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setRows(data ?? [])
    setLoading(false)
  }

  const phases = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.current_status_name)
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  )

  const responsibles = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.responsible_user_name)
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  )

  const products = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.product_name)
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  )

  const partners = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.partner_name)
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  )

  const registryOffices = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.registry_office)
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  )

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (phase && row.current_status_name !== phase) {
        return false
      }

      if (
        responsible &&
        row.responsible_user_name !== responsible
      ) {
        return false
      }

      if (product && row.product_name !== product) {
        return false
      }

      if (partner && row.partner_name !== partner) {
        return false
      }

      if (
        registryOffice &&
        row.registry_office !== registryOffice
      ) {
        return false
      }

      if (
        documentsSender &&
        row.documents_sender !== documentsSender
      ) {
        return false
      }

      if (
        generalStatus &&
        row.general_status !== generalStatus
      ) {
        return false
      }

      if (term) {
        const haystack = [
          row.client_name,
          row.product_name,
          row.product_code,
          row.sale_number,
          row.internal_reference,
          row.submission_number,
          row.external_process_number,
          row.access_code,
          row.registry_office,
          row.partner_name,
          row.responsible_user_name,
          row.notes_internal,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(term)) {
          return false
        }
      }

      return true
    })
  }, [
    rows,
    search,
    phase,
    responsible,
    product,
    partner,
    registryOffice,
    documentsSender,
    generalStatus,
  ])

  function clearFilters() {
    setSearch('')
    setPhase('')
    setResponsible('')
    setProduct('')
    setPartner('')
    setRegistryOffice('')
    setDocumentsSender('')
    setGeneralStatus('')
  }
function startEditing(row: Row) {
  setEditingRow(row)
  setEditRegistryOffice(row.registry_office || '')
  setEditDocumentsSender(row.documents_sender || '')
  setEditDocumentsSentDate(row.documents_sent_date || '')
  setEditNotes(row.notes_internal || '')
  setEditError('')
}
async function saveEditing() {
  if (!editingRow) {
    return
  }

  setSavingEdit(true)
  setEditError('')

  const fields = [
    {
      code: 'registry_office',
      valueText: editRegistryOffice.trim() || null,
      valueDate: null,
    },
    {
      code: 'documents_sender',
      valueText: editDocumentsSender || null,
      valueDate: null,
    },
    {
      code: 'documents_sent_date',
      valueText: null,
      valueDate: editDocumentsSentDate || null,
    },
    {
      code: 'notes_internal',
      valueText: editNotes.trim() || null,
      valueDate: null,
    },
  ]

  for (const field of fields) {
    const { error: fieldError } = await supabase.rpc(
      'rpc_set_process_field_value',
      {
        p_process_id: editingRow.process_id,
        p_field_code: field.code,
        p_value_text: field.valueText,
        p_value_date: field.valueDate,
        p_value_number: null,
        p_value_boolean: null,
      }
    )

    if (fieldError) {
      setEditError(fieldError.message)
      setSavingEdit(false)
      return
    }
  }

  await loadRows()

  setEditingRow(null)
  setSavingEdit(false)
}
  function formatDate(value: string | null) {
    if (!value) {
      return '—'
    }

    return new Date(value).toLocaleDateString('pt-PT')
  }

  function formatDocumentsSender(value: string | null) {
    if (value === 'PORTULEGAL') {
      return 'Portulegal'
    }

    if (value === 'CLIENT') {
      return 'Cliente'
    }

    return '—'
  }

  function formatGeneralStatus(value: string) {
    if (value === 'OPEN') {
      return 'Aberto'
    }

    if (value === 'COMPLETED') {
      return 'Concluído'
    }

    if (value === 'CANCELLED') {
      return 'Cancelado'
    }

    return value
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando processos de nacionalidade...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-[1800px] mx-auto">

        <div className="mb-8">
          <p className="text-sm text-slate-500">
            Processos
          </p>

          <h1 className="text-3xl font-semibold text-slate-900 mt-1">
            IRN Nacionalidade
          </h1>

          <p className="text-slate-500 mt-2">
            Central de acompanhamento dos processos de nacionalidade.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="rounded-2xl border bg-white p-5 shadow-sm mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquisar cliente, processo, submissão..."
              className="rounded-lg border px-4 py-3"
            />

            <select
              value={phase}
              onChange={(event) =>
                setPhase(event.target.value)
              }
              className="rounded-lg border bg-white px-4 py-3"
            >
              <option value="">
                Todas as fases
              </option>

              {phases.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={responsible}
              onChange={(event) =>
                setResponsible(event.target.value)
              }
              className="rounded-lg border bg-white px-4 py-3"
            >
              <option value="">
                Todos os responsáveis
              </option>

              {responsibles.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={product}
              onChange={(event) =>
                setProduct(event.target.value)
              }
              className="rounded-lg border bg-white px-4 py-3"
            >
              <option value="">
                Todos os tipos de processo
              </option>

              {products.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={partner}
              onChange={(event) =>
                setPartner(event.target.value)
              }
              className="rounded-lg border bg-white px-4 py-3"
            >
              <option value="">
                Todos os parceiros
              </option>

              {partners.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={registryOffice}
              onChange={(event) =>
                setRegistryOffice(event.target.value)
              }
              className="rounded-lg border bg-white px-4 py-3"
            >
              <option value="">
                Todas as conservatórias
              </option>

              {registryOffices.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={documentsSender}
              onChange={(event) =>
                setDocumentsSender(event.target.value)
              }
              className="rounded-lg border bg-white px-4 py-3"
            >
              <option value="">
                Envio dos documentos
              </option>

              <option value="PORTULEGAL">
                Portulegal
              </option>

              <option value="CLIENT">
                Cliente
              </option>
            </select>

            <select
              value={generalStatus}
              onChange={(event) =>
                setGeneralStatus(event.target.value)
              }
              className="rounded-lg border bg-white px-4 py-3"
            >
              <option value="">
                Todos os estados
              </option>

              <option value="OPEN">
                Aberto
              </option>

              <option value="COMPLETED">
                Concluído
              </option>

              <option value="CANCELLED">
                Cancelado
              </option>
            </select>

          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-500">
              {filteredRows.length} de {rows.length} processo(s)
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Limpar filtros
            </button>
          </div>

        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

          <div className="border-b p-5">
            <h2 className="font-semibold text-slate-900">
              Processos de nacionalidade
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Informações consolidadas automaticamente a partir dos processos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1750px] w-full text-sm">

              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Requerente
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Tipo de processo
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    N.º Processo
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Submissão
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Código Consulta
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Fase
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Conservatória
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Distribuição
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Envio docs por
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Docs enviados
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Parceiro
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Responsável
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Observações
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Estado
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Conclusão
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {filteredRows.map((row) => (
                  <tr
                    key={row.process_id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
  <div className="flex flex-col gap-2">
    <p className="font-medium text-slate-900">
      {row.client_name}
    </p>

    <button
      type="button"
      onClick={() => startEditing(row)}
      className="w-fit rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
    >
      Editar
    </button>
  </div>
</td>

                    <td className="px-4 py-4 text-slate-600">
                      <div>
                        <p>
                          {row.product_name}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {row.product_code}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {row.external_process_number || '—'}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {row.submission_number || '—'}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {row.access_code || '—'}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-full border bg-white px-3 py-1 text-xs font-medium">
                        {row.current_status_name || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {row.registry_office || '—'}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(row.distribution_date)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDocumentsSender(
                        row.documents_sender
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(
                        row.documents_sent_date
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {row.partner_name || '—'}
                    </td>

                    <td className="px-4 py-4">
                      {row.responsible_user_name || '—'}
                    </td>

                    <td className="px-4 py-4 min-w-72">
                      {row.notes_internal || '—'}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatGeneralStatus(
                        row.general_status
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(row.closed_at)}
                    </td>

                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={15}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Nenhum processo encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>

        </div>
{editingRow && (
  <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">

      <div className="border-b p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Editar processo
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          {editingRow.client_name} · {editingRow.internal_reference}
        </p>
      </div>

      <div className="p-5 space-y-5">

        {editError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {editError}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Conservatória / Unidade
          </label>

          <input
            value={editRegistryOffice}
            onChange={(event) =>
              setEditRegistryOffice(event.target.value)
            }
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Envio dos documentos por
          </label>

          <select
            value={editDocumentsSender}
            onChange={(event) =>
              setEditDocumentsSender(event.target.value)
            }
            className="w-full rounded-lg border bg-white px-4 py-3"
          >
            <option value="">
              Não definido
            </option>

            <option value="PORTULEGAL">
              Portulegal
            </option>

            <option value="CLIENT">
              Cliente
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Data de envio dos documentos
          </label>

          <input
            type="date"
            value={editDocumentsSentDate}
            onChange={(event) =>
              setEditDocumentsSentDate(event.target.value)
            }
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Observações
          </label>

          <textarea
            value={editNotes}
            onChange={(event) =>
              setEditNotes(event.target.value)
            }
            rows={6}
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

      </div>

      <div className="border-t bg-slate-50 p-5 flex justify-end gap-3">

        <button
          type="button"
          onClick={() => setEditingRow(null)}
          disabled={savingEdit}
          className="rounded-lg border bg-white px-5 py-2.5 text-sm font-medium"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={saveEditing}
          disabled={savingEdit}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {savingEdit
            ? 'Guardando...'
            : 'Guardar'}
        </button>

      </div>
    </div>
  </div>
)}
      </div>
    </main>
  )
}