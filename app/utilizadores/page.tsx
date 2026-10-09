'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AppUser = {
  id: string
  name: string
  email: string
  access_level: number
  is_active: boolean
}

export default function UtilizadoresPage() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<AppUser[]>([])
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserNotificationEmail, setNewUserNotificationEmail] = useState('')
  const [newUserAccessLevel, setNewUserAccessLevel] = useState(1)
  const [creatingUser, setCreatingUser] = useState(false)

  async function saveNewUser() {
    if (creatingUser) return

    setError('')

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setError('Preencha o nome e o e-mail do colaborador.')
      return
    }

    setCreatingUser(true)

    try {
      const { error: createError } = await supabase.rpc(
        'rpc_create_app_user',
        {
          p_name: newUserName.trim(),
          p_email: newUserEmail.trim(),
          p_notification_email: newUserNotificationEmail.trim() || null,
          p_access_level: newUserAccessLevel,
        }
      )

      if (createError) throw createError

      const { data, error: listError } = await supabase
        .from('app_users')
        .select('id, name, email, access_level, is_active')
        .order('name')

      if (listError) throw listError

      setUsers(data ?? [])
      setNewUserName('')
      setNewUserEmail('')
      setNewUserNotificationEmail('')
      setNewUserAccessLevel(1)
      setShowCreateUser(false)

      window.alert(
        'Colaborador cadastrado com sucesso. O acesso permanece inativo.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao cadastrar colaborador.'
      )
    } finally {
      setCreatingUser(false)
    }
  }

  async function activateUser(user: AppUser) {
    if (user.is_active) return

    const confirmed = window.confirm(
      `Confirma a ativação de ${user.name}, com nível de acesso ${user.access_level}?`
    )

    if (!confirmed) return

    setError('')

    const { error: activateError } = await supabase.rpc(
      'rpc_activate_app_user',
      { p_user_id: user.id }
    )

    if (activateError) {
      window.alert(`Não foi possível ativar o colaborador: ${activateError.message}`)
      return
    }

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id ? { ...item, is_active: true } : item
      )
    )

    window.alert(`${user.name} foi ativado com sucesso.`)
  }

  useEffect(() => {
    async function checkAccess() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        window.location.href = '/login'
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('current_user_profile')
        .select('is_active')
        .single()

      if (profileError || !profile?.is_active) {
        setError('Utilizador sem acesso ativo.')
        setLoading(false)
        return
      }

      const { data: allowed, error: permissionError } = await supabase
        .rpc('has_permission', { p_code: 'manage_users' })

      if (permissionError || allowed !== true) {
        setError('Sem permissão para gerir utilizadores.')
        setLoading(false)
        return
      }

      const { data: userData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, access_level, is_active')
        .order('name')

      if (usersError) {
        setError(usersError.message)
        setLoading(false)
        return
      }

      setUsers(userData ?? [])
      setAuthorized(true)
      setLoading(false)
    }
    void checkAccess()
  }, [])

  if (loading) return <main className="p-8">A verificar acesso...</main>
  if (!authorized) return <main className="p-8 text-red-700">{error}</main>

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Gestão de Utilizadores</h1>
        <p className="mt-2 text-slate-600">Administração dos colaboradores da Portulegal.</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setShowCreateUser(!showCreateUser)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {showCreateUser ? 'Cancelar' : 'Novo colaborador'}
          </button>
        </div>
        {showCreateUser && (
          <div className="mt-6 rounded-xl border bg-slate-50 p-5">
            <h2 className="mb-4 text-lg font-semibold">Novo colaborador</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">Nome completo
                <input className="mt-1 w-full rounded-lg border p-2" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
              </label>
              <label className="text-sm">E-mail
                <input type="email" className="mt-1 w-full rounded-lg border p-2" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
              </label>
              <label className="text-sm">E-mail de notificacoes (opcional)
                <input type="email" className="mt-1 w-full rounded-lg border p-2" value={newUserNotificationEmail} onChange={(e) => setNewUserNotificationEmail(e.target.value)} />
              </label>
              <label className="text-sm">Nivel de acesso
                <select className="mt-1 w-full rounded-lg border p-2" value={newUserAccessLevel} onChange={(e) => setNewUserAccessLevel(Number(e.target.value))}>
                  {[0, 1, 2, 3, 4].map((level) => <option key={level} value={level}>Nivel {level}</option>)}
                </select>
              </label>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={saveNewUser}
                disabled={creatingUser}
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingUser ? 'A guardar...' : 'Guardar colaborador'}
              </button>
            </div>
          </div>
        )}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Nível</th>
                <th className="px-4 py-3">Estado</th>
		<th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.access_level}</td>
                  <td className="px-4 py-3">{user.is_active ? 'Ativo' : 'Pendente de ativação'}</td>
<td className="px-4 py-3">
  {!user.is_active && (
    <button
      type="button"
      onClick={() => activateUser(user)}
      className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
    >
      Ativar
    </button>
  )}
</td>

                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Nenhum colaborador cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}