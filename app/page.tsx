'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  name: string
  email: string
  access_level: number
  is_active: boolean
}

type DashboardSummary = {
  open_tasks: number
  overdue_tasks: number
  real_deadlines_next_7d: number
  open_processes: number
  open_services: number
  open_leads: number
}
type DashboardTask = {
  task_id: string
  title: string
  task_type: string
  priority: string
  status: string
  due_at: string | null
  deadline_bucket: string
  client_name: string | null
  process_reference: string | null
}

type RecentActivity = {
  id: string
  title: string
  description: string | null
  update_type: string
  created_at: string
  process_id: string
}
const menuItems = [
  'Dashboard',
  'CRM',
  'Clientes',
  'Vendas',
  'Serviços',
  'Processos',
  'Tarefas e Prazos',
  'Documentos',
  'Financeiro',
  'Produtos e Preços',
  'Parceiros',
  'Utilizadores',
  'Configurações',
]

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
 const [error, setError] = useState('')
const [activeMenu, setActiveMenu] = useState('Dashboard')
const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
const [tasks, setTasks] = useState<DashboardTask[]>([])
const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('current_user_profile')
        .select('id, name, email, access_level, is_active')
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setProfile(data)

const { data: dashboardData, error: dashboardError } =
  await supabase
    .rpc('rpc_my_dashboard_summary')
    .single()

if (dashboardError) {
  setError(dashboardError.message)
  setLoading(false)
  return
}

setDashboard(dashboardData)
const { data: taskData, error: taskError } = await supabase
  .from('dashboard_tasks')
  .select(`
    task_id,
    title,
    task_type,
    priority,
    status,
    due_at,
    deadline_bucket,
    client_name,
    process_reference
  `)
  .in('status', ['OPEN', 'IN_PROGRESS', 'WAITING'])
  .not('due_at', 'is', null)
  .order('due_at', { ascending: true })
  .limit(5)

if (taskError) {
  setError(taskError.message)
  setLoading(false)
  return
}

setTasks(taskData ?? [])

const { data: activityData, error: activityError } = await supabase
  .from('process_updates')
  .select(`
    id,
    title,
    description,
    update_type,
    created_at,
    process_id
  `)
  .order('created_at', { ascending: false })
  .limit(5)

if (activityError) {
  setError(activityError.message)
  setLoading(false)
  return
}

setRecentActivity(activityData ?? [])
setLoading(false)
    }

    loadUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Carregando Portulegal...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold mb-3">Portulegal</h1>
          <p className="text-red-600">Erro: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-slate-950 text-white flex flex-col">
        <div className="px-6 py-6 border-b border-slate-800">
          <h1 className="text-2xl font-semibold tracking-tight">
            Portulegal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistema de Gestão
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => {
  if (item === 'Utilizadores') {
    window.location.href = '/utilizadores'
    return
  }
  if (item === 'Financeiro') {
    window.location.href = '/financeiro'
    return
  }

  setActiveMenu(item)
}}
              className={`w-full text-left rounded-lg px-4 py-2.5 text-sm transition ${
                activeMenu === item
                  ? 'bg-white text-slate-950 font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-sm font-medium">
              {profile?.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Nível {profile?.access_level}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {activeMenu}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gestão integrada da Portulegal
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg border bg-white px-4 py-2 text-sm">
              Notificações
            </button>

            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {profile?.name}
              </p>
              <p className="text-xs text-slate-500">
                {profile?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeMenu === 'Dashboard' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Visão Geral
                </h3>
                <p className="text-slate-500 mt-1">
                  Acompanhe os principais indicadores da operação.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
               {[
  ['Tarefas abertas', dashboard?.open_tasks ?? 0],
  ['Prazos vencidos', dashboard?.overdue_tasks ?? 0],
  ['Processos abertos', dashboard?.open_processes ?? 0],
  ['Leads em aberto', dashboard?.open_leads ?? 0],
].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white border p-5 shadow-sm"
                  >
                    <p className="text-sm text-slate-500">
                      {label}
                    </p>
                    <p className="text-3xl font-semibold text-slate-900 mt-3">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  <div className="rounded-2xl bg-white border p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <h4 className="font-semibold text-slate-900">
        Próximos prazos
      </h4>

      <button
        onClick={() => setActiveMenu('Tarefas e Prazos')}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        Ver todos
      </button>
    </div>

    {tasks.length === 0 ? (
      <p className="text-sm text-slate-500">
        Nenhum prazo ou tarefa pendente.
      </p>
    ) : (
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.task_id}
            className="rounded-xl border p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">
                  {task.title}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {task.client_name || 'Sem cliente'}
                  {task.process_reference
                    ? ` · ${task.process_reference}`
                    : ''}
                </p>
              </div>

              <span
                className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                  task.deadline_bucket === 'OVERDUE'
                    ? 'bg-red-100 text-red-700'
                    : task.deadline_bucket === 'DUE_24H'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {task.deadline_bucket === 'OVERDUE'
                  ? 'Vencido'
                  : task.deadline_bucket === 'DUE_24H'
                  ? 'Hoje'
                  : 'Próximo'}
              </span>
            </div>

            {task.due_at && (
              <p className="text-xs text-slate-500 mt-3">
                Prazo:{' '}
                {new Date(task.due_at).toLocaleString('pt-PT')}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="rounded-2xl bg-white border p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <h4 className="font-semibold text-slate-900">
        Atividade recente
      </h4>

      <button
        onClick={() => setActiveMenu('Processos')}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        Ver processos
      </button>
    </div>

    {recentActivity.length === 0 ? (
      <p className="text-sm text-slate-500">
        Nenhuma atividade recente.
      </p>
    ) : (
      <div className="space-y-4">
        {recentActivity.map((activity) => (
          <div
            key={activity.id}
            className="border-b last:border-b-0 pb-4 last:pb-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">
                  {activity.title}
                </p>

                {activity.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                )}
              </div>

              <span className="text-xs text-slate-400 whitespace-nowrap">
                {new Date(activity.created_at).toLocaleDateString('pt-PT')}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {activity.update_type}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">
                {activeMenu}
              </h3>
              <p className="text-slate-500 mt-2">
                Este módulo será conectado ao backend nas próximas etapas.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}