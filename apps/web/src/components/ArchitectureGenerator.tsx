"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Server, Database, Code2, FolderTree, ArrowRight, Loader2, Play, AlertTriangle, RotateCcw } from 'lucide-react'

// This would ideally be fetched from the Next.js API/FastAPI 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export function ArchitectureGenerator({ projectId, token, initialArchitecture }: { projectId: string, token: string, initialArchitecture: any }) {
  const router = useRouter()
  const [architecture, setArchitecture] = useState(initialArchitecture)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollCountRef = useRef(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGenerating && !architecture) {
      pollCountRef.current = 0
      interval = setInterval(async () => {
        pollCountRef.current += 1
        // Timeout after ~90 seconds (30 polls * 3s)
        if (pollCountRef.current > 30) {
          setIsGenerating(false)
          setError('Architecture generation timed out. The AI might be busy — please try again.')
          return
        }
        try {
          const res = await fetch(`${API_BASE_URL}/projects/${projectId}/architecture`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setArchitecture(data)
            setIsGenerating(false)
            setError(null)
            router.refresh()
          }
        } catch (e) {
          // ignore individual fetch errors
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isGenerating, architecture, projectId, token, router])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    pollCountRef.current = 0
    try {
      await fetch(`${API_BASE_URL}/projects/${projectId}/architecture/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (e) {
      setIsGenerating(false)
      setError('Failed to connect to the server. Make sure the API is running.')
    }
  }

  if (!architecture) {
    return (
      <div className="relative rounded-2xl glass-card p-10 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center">
          <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight">Design Technical Architecture</h3>
          <p className="text-sm text-zinc-300 mb-8 max-w-md leading-relaxed">
            Ready to turn this idea into a reality? Let the AI design the full tech stack, database schema, folder structure, and API routes based on the extracted analysis.
          </p>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-6 max-w-md backdrop-blur-sm">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Designing Architecture...
              </>
            ) : error ? (
              <>
                <RotateCcw className="h-5 w-5" />
                Retry Generation
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />
                Generate Architecture
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  const renderFolderTree = (nodes: any[], level = 0) => {
    return (
      <ul className="space-y-1">
        {nodes.map((node, i) => (
          <li key={i}>
            <div className={`flex items-center gap-2 py-1 ${level > 0 ? 'ml-4 border-l border-zinc-800 pl-4' : ''}`}>
              <span className="text-zinc-500">{node.type === 'folder' ? '📁' : '📄'}</span>
              <span className={`text-sm ${node.type === 'folder' ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}>{node.name}</span>
            </div>
            {node.children && renderFolderTree(node.children, level + 1)}
          </li>
        ))}
      </ul>
    )
  }

  // safely parse JSON string if needed
  const dbSchema = typeof architecture.databaseSchema === 'string' ? JSON.parse(architecture.databaseSchema) : architecture.databaseSchema
  const folderStruct = typeof architecture.folderStructure === 'string' ? JSON.parse(architecture.folderStructure) : architecture.folderStructure
  const apiStruct = typeof architecture.apiEndpoints === 'string' ? JSON.parse(architecture.apiEndpoints) : architecture.apiEndpoints

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-white">Project Architecture</h2>
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          Generated Successfully
        </span>
      </div>

      {/* Tech Stack */}
      <section className="rounded-2xl glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2 relative z-10">
          <Server className="h-5 w-5 text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
          Recommended Tech Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          <div className="rounded-xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-5 border border-zinc-800/50 hover:border-blue-500/30 transition-colors shadow-inner backdrop-blur-sm group">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-hover:text-blue-400 transition-colors">Frontend</h3>
            <p className="text-zinc-100 font-medium">{architecture.frontendStack}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-5 border border-zinc-800/50 hover:border-emerald-500/30 transition-colors shadow-inner backdrop-blur-sm group">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-hover:text-emerald-400 transition-colors">Backend</h3>
            <p className="text-zinc-100 font-medium">{architecture.backendStack}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-5 border border-zinc-800/50 hover:border-purple-500/30 transition-colors shadow-inner backdrop-blur-sm group">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 group-hover:text-purple-400 transition-colors">Database</h3>
            <p className="text-zinc-100 font-medium">{architecture.databaseStack}</p>
          </div>
        </div>
      </section>

      {/* Grid for Folder Tree & Database */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Folder Structure */}
        <section className="rounded-2xl glass-card p-6 flex flex-col max-h-[600px] border-t-blue-500/20 border-t-2 relative">
          <h2 className="text-lg font-semibold mb-5 text-white flex items-center gap-2 shrink-0">
            <FolderTree className="h-5 w-5 text-blue-400" />
            Monorepo Structure
          </h2>
          <div className="rounded-xl bg-zinc-950/80 p-5 border border-zinc-800/50 flex-1 overflow-y-auto font-mono custom-scrollbar shadow-inner backdrop-blur-md">
            {renderFolderTree(folderStruct)}
          </div>
        </section>

        {/* Database Schema */}
        <section className="rounded-2xl glass-card p-6 flex flex-col max-h-[600px] border-t-purple-500/20 border-t-2 relative">
          <h2 className="text-lg font-semibold mb-5 text-white flex items-center gap-2 shrink-0">
            <Database className="h-5 w-5 text-purple-400" />
            Database Schema
          </h2>
          <div className="rounded-xl bg-zinc-950/80 p-5 border border-zinc-800/50 flex-1 overflow-y-auto space-y-8 custom-scrollbar shadow-inner backdrop-blur-md">
            {dbSchema.map((table: any, i: number) => (
              <div key={i} className="group">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 justify-between mb-4 border-b border-zinc-800/80 pb-2 group-hover:border-purple-500/30 transition-colors">
                  <span className="text-base font-bold text-purple-400 tracking-wide">{table.name}</span>
                  <span className="text-xs text-zinc-500 italic">{table.description}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold rounded-tl-lg">Field</th>
                        <th className="px-3 py-2.5 font-semibold">Type</th>
                        <th className="px-3 py-2.5 font-semibold rounded-tr-lg">Attributes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                      {table.fields.map((field: any, j: number) => (
                        <tr key={j} className="text-zinc-300 hover:bg-zinc-900/30 transition-colors">
                          <td className="px-3 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {field.name}
                              {field.is_primary && <span className="text-amber-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]" title="Primary Key">🔑</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-emerald-400/90">{field.type}</td>
                          <td className="px-3 py-3 text-xs text-zinc-400">
                            <div className="flex items-center gap-2 flex-wrap">
                              {field.is_required ? <span className="text-zinc-200">Required</span> : <span className="text-zinc-500">Optional</span>}
                              {field.relation && <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">→ {field.relation}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* API Endpoints */}
      <section className="rounded-2xl glass-card p-6 border-t-emerald-500/20 border-t-2 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2 relative z-10">
          <Code2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          Core API Endpoints
        </h2>
        <div className="rounded-xl bg-zinc-950/80 p-1.5 border border-zinc-800/50 divide-y divide-zinc-800/50 relative z-10 shadow-inner backdrop-blur-sm">
          {apiStruct.map((api: any, i: number) => (
            <div key={i} className="p-5 flex flex-col lg:flex-row lg:items-start gap-6 hover:bg-zinc-900/40 transition-colors rounded-lg group">
              <div className="flex flex-col gap-3 lg:w-1/3 shrink-0">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wider shadow-sm ${
                    api.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    api.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    api.method === 'PUT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {api.method}
                  </span>
                  <span className="font-mono text-sm text-zinc-300 font-medium">{api.path}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{api.description}</p>
              </div>
              
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4">
                {api.request_body ? (
                  <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/60 flex flex-col gap-2 group-hover:border-zinc-700/60 transition-colors shadow-sm">
                    <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400" /> Request Body
                    </div>
                    <p className="text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">{api.request_body}</p>
                  </div>
                ) : <div className="hidden xl:block" />}
                
                <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/60 flex flex-col gap-2 group-hover:border-emerald-500/30 transition-colors shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-xl"></div>
                  <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider relative z-10">
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400 rotate-180" /> Response
                  </div>
                  <p className="text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap relative z-10">{api.response}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
