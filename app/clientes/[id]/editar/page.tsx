'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default function EditarClientePage({ params }: PageProps) {
  const { id } = use(params)

  const [name, setName] = useState('')
  const [nif, setNif] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClient() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          nif,
          phone,
          email,
          contact,
          birth_date,
          address,
          notes
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setName(data.name ?? '')
      setNif(data.nif ?? '')
      setPhone(data.phone ?? '')
      setEmail(data.email ?? '')
      setContact(data.contact ?? '')
      setBirthDate(data.birth_date ?? '')
      setAddress(data.address ?? '')
      setNotes(data.notes ?? '')

      setLoading(false)
    }

    loadClient()
  }, [id])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setSaving(true)
    setError('')

    const { error } = await supabase
      .from('clients')
      .update({
        name: name.trim(),
        nif: nif.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        contact: contact.trim() || null,
        birth_date: birthDate || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    window.location.href = `/clientes/${id}`
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Carregando cliente...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => {
            window.location.href = `/clientes/${id}`
          }}
          className="text-sm text-slate-500 hover:text-slate-900 mb-5"
        >
          ← Voltar para ficha do cliente
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">
            Editar Cliente
          </h1>

          <p className="text-slate-500 mt-2">
            Atualize os dados cadastrados.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-6 shadow-sm space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Nome completo *
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                NIF
              </label>

              <input
                type="text"
                value={nif}
                onChange={(event) => setNif(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Data de nascimento
              </label>

              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Telefone
              </label>

              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Contacto / responsável
              </label>

              <input
                type="text"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Morada
              </label>

              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Observações
              </label>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

          </div>

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
                window.location.href = `/clientes/${id}`
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
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}