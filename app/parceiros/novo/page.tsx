'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NovoParceiroPage() {
  const [name, setName] = useState('')
  const [nifNipc, setNifNipc] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [iban, setIban] = useState('')
  const [notes, setNotes] = useState('')

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

      setLoading(false)
    }

    loadPage()
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!name.trim()) {
      setError('Informe o nome do parceiro.')
      return
    }

    setSaving(true)
    setError('')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (userError) {
      setError(userError.message)
      setSaving(false)
      return
    }

    if (!appUser?.id) {
      setError('Não foi possível identificar o utilizador logado.')
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('partners')
      .insert({
        name: name.trim(),
        nif_nipc: nifNipc.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        iban: iban.trim() || null,
        notes: notes.trim() || null,
        is_active: true,
        created_by: appUser.id,
        updated_by: appUser.id,
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    window.location.href = `/parceiros/${data.id}`
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando cadastro de parceiro...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => {
            window.location.href = '/parceiros'
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para parceiros
        </button>

        <div className="mb-8">
          <p className="text-sm text-slate-500 mb-2">
            Administração
          </p>

          <h1 className="text-3xl font-semibold text-slate-900">
            Novo Parceiro
          </h1>

          <p className="text-slate-500 mt-2">
            Cadastre os dados principais do parceiro comercial.
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
                Dados cadastrais e de contacto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Nome do parceiro *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  placeholder="Ex.: Carlos Carmo"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  NIF / NIPC
                </label>

                <input
                  type="text"
                  value={nifNipc}
                  onChange={(event) =>
                    setNifNipc(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Telefone
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  E-mail
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  IBAN
                </label>

                <input
                  type="text"
                  value={iban}
                  onChange={(event) =>
                    setIban(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Morada
                </label>

                <textarea
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Observações
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={4}
                  placeholder="Informações internas sobre o parceiro..."
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>

            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/parceiros'
              }}
              className="rounded-lg border px-5 py-3 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving
                ? 'Salvando...'
                : 'Criar Parceiro'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}