'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NovoClientePage() {
  const [name, setName] = useState('')
  const [nif, setNif] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setLoading(true)
    setError('')

    const { data, error } = await supabase.rpc('rpc_create_client', {
      p_name: name,
      p_phone: phone || null,
      p_email: email || null,
      p_contact: contact || null,
      p_nif: nif || null,
      p_birth_date: birthDate || null,
      p_address: address || null,
      p_notes: notes || null,
      p_origin_partner_id: null,
      p_origin_channel_id: null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = `/clientes/${data}`
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => {
              window.location.href = '/clientes'
            }}
            className="text-sm text-slate-500 hover:text-slate-900 mb-4"
          >
            ← Voltar para clientes
          </button>

          <h1 className="text-3xl font-semibold text-slate-900">
            Novo Cliente
          </h1>

          <p className="text-slate-500 mt-2">
            Cadastre os dados principais do cliente.
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
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/clientes'
              }}
              className="rounded-lg border px-5 py-3 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}