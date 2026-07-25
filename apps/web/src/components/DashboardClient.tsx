"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Plus, Search, Sparkles, FolderGit2, ChevronRight } from 'lucide-react'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { fetchProjects } from '@/lib/api'

export function DashboardClient({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
      .then(data => {
        setProjects(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 -z-10" />
      
      {/* Sidebar */}
      <aside className="w-64 flex-col border-r border-zinc-800/50 glass hidden md:flex">
        <div className="flex h-16 items-center border-b border-zinc-800/50 px-6">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
            <span className="font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Prompt Master</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <nav className="flex-1 space-y-2">
            <a href="/" className="group flex items-center gap-3 rounded-lg bg-indigo-500/10 px-3 py-2.5 text-sm font-medium text-indigo-300 border border-indigo-500/20 transition-all hover:bg-indigo-500/20">
              <LayoutDashboard className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              Projects
            </a>
          </nav>
        </div>
        <div className="border-t border-zinc-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-medium text-white shadow-lg shadow-indigo-500/20">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-zinc-200">{userEmail}</span>
            </div>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800/50 bg-zinc-950/30 backdrop-blur-md px-6 md:px-8 sticky top-0 z-20">
          <h1 className="text-lg font-medium text-white">Your Projects</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8 custom-scrollbar">
          <div className="mb-8 flex items-center justify-between">
            <div className="relative w-full max-w-sm group">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-20 blur transition duration-500"></div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-indigo-400 animate-pulse">Loading your ideas...</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-24 text-center backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]">
                <Sparkles className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="relative mb-2 text-xl font-medium text-white">No projects yet</h3>
              <p className="relative mb-8 max-w-md text-sm text-zinc-400 leading-relaxed">
                Transform your raw software ideas into production-ready architecture and optimized AI prompts. Get started by describing what you want to build.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="relative flex items-center gap-2 rounded-xl bg-white text-zinc-900 px-6 py-3 text-sm font-semibold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Create your first project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="group cursor-pointer rounded-2xl glass-card p-6 hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_-5px_rgba(99,102,241,0.25)] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shadow-sm">
                      <FolderGit2 className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                      project.status === 'draft' ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700' : 
                      project.status.includes('fail') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {project.status === 'draft' ? 'Draft' : project.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </div>
                  <h3 className="relative mb-2 text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors">{project.name}</h3>
                  <p className="relative text-sm text-zinc-400 line-clamp-2 leading-relaxed">{project.rawIdea}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
