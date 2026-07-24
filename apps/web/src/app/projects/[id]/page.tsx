import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, ArrowLeft, BrainCircuit, Target, LayoutTemplate, Sparkles, Server } from 'lucide-react'
import Link from 'next/link'
import { ArchitectureGenerator } from '@/components/ArchitectureGenerator'
import { PromptGenerator } from '@/components/PromptGenerator'

// This would ideally be fetched from the Next.js API/FastAPI 
// but since it's a Server Component, we can fetch it directly using fetch()
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

async function getProjectWithAnalysis(projectId: string, token: string) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
  
  const [projectRes, analysisRes, archRes, promptsRes] = await Promise.all([
    fetch(`${API_BASE_URL}/projects/${projectId}`, { headers }),
    fetch(`${API_BASE_URL}/projects/${projectId}/analysis`, { headers }).catch(() => ({ ok: false, json: () => null })),
    fetch(`${API_BASE_URL}/projects/${projectId}/architecture`, { headers }).catch(() => ({ ok: false, json: () => null })),
    fetch(`${API_BASE_URL}/projects/${projectId}/prompts`, { headers }).catch(() => ({ ok: false, json: () => [] }))
  ])

  if (!projectRes.ok) {
    throw new Error('Project not found')
  }

  const project = await projectRes.json()
  const analysis = analysisRes.ok ? await analysisRes.json() : null
  const architecture = archRes.ok ? await archRes.json() : null
  const prompts = promptsRes.ok ? await promptsRes.json() : []

  return { project, analysis, architecture, prompts }
}

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  try {
    const { project, analysis, architecture, prompts } = await getProjectWithAnalysis(params.id, session.access_token)

    return (
      <div className="flex min-h-screen w-full bg-zinc-950 text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950 to-zinc-950 -z-10" />
        
        <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 z-10 relative">
          
          <div className="mb-8">
            <Link href="/" className="group inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 bg-zinc-900/50 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-800 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">{project.name}</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_-2px_rgba(99,102,241,0.3)]">
                {project.status.toUpperCase()}
              </span>
            </div>
            <p className="text-zinc-400 max-w-2xl leading-relaxed">{project.description || 'No description provided'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Raw Idea & Analysis */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <section className="rounded-2xl glass-card p-6 border-t-indigo-500/20 border-t-2 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2 relative z-10 text-zinc-100">
                  <LayoutTemplate className="h-5 w-5 text-indigo-400" />
                  Raw Idea
                </h2>
                <div className="rounded-xl bg-zinc-950/60 p-5 border border-zinc-800/50 relative z-10 backdrop-blur-md">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {project.rawIdea}
                  </p>
                </div>
              </section>

              {analysis ? (
                <section className="rounded-2xl glass-card p-6 border-t-purple-500/30 border-t-2 shadow-[0_0_40px_-10px_rgba(168,85,247,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  <h2 className="text-lg font-medium mb-6 flex items-center gap-2 relative z-10">
                    <BrainCircuit className="h-5 w-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                    AI Analysis Results
                  </h2>
                  
                  <div className="space-y-6 relative z-10">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Core Intent</h3>
                      <p className="text-base text-zinc-100 font-medium">{analysis.intent}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-zinc-950/60 p-4 border border-zinc-800/50 hover:border-purple-500/30 transition-colors">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Primary Domain</h3>
                        <p className="text-purple-400 font-medium">{analysis.domain}</p>
                      </div>
                      <div className="rounded-xl bg-zinc-950/60 p-4 border border-zinc-800/50 hover:border-indigo-500/30 transition-colors">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Target Audience</h3>
                        <p className="text-zinc-200">{analysis.targetAudience || 'General'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Extracted Features</h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300 group">
                            <div className="mt-0.5 p-1 rounded-full bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                              <Sparkles className="h-3 w-3 text-purple-400" />
                            </div>
                            <span className="group-hover:text-zinc-100 transition-colors">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {analysis.subDomains.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Sub-domains</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.subDomains.map((sub: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center rounded-lg bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700 hover:text-white transition-colors">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl glass-card border border-dashed border-zinc-700 p-12 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 shadow-inner group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2 relative">No AI Analysis</h3>
                  <p className="text-sm text-zinc-400 relative">This project hasn't been parsed by the AI yet.</p>
                </section>
              )}
            </div>
            
            {/* Right Column: Next Steps */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl glass-card p-6 sticky top-24">
                <h3 className="text-base font-medium text-white mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  Project Pipeline
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/20 before:via-emerald-500/20 before:to-transparent">
                  
                  {/* Step 1: Parsing */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-indigo-500 bg-zinc-950 text-indigo-400 shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)] shrink-0 z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
                      <div className="text-sm font-semibold text-indigo-300 mb-1">AI Parsing</div>
                      <div className="text-xs text-indigo-400/80 font-medium">Completed ✓</div>
                    </div>
                  </div>

                  {/* Step 2: Architecture */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 ${architecture ? 'border-emerald-500 bg-zinc-950 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]' : 'border-zinc-700 bg-zinc-900 text-zinc-500'} shrink-0 z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all`}>
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <div className={`w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border ${architecture ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/50'} backdrop-blur-md transition-all`}>
                      <div className={`text-sm font-semibold ${architecture ? 'text-emerald-300' : 'text-zinc-300'} mb-1`}>Architecture</div>
                      <div className={`text-xs ${architecture ? 'text-emerald-400/80 font-medium' : 'text-zinc-500'}`}>
                        {architecture ? 'Completed ✓' : 'Pending Action'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Prompts */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 ${prompts && prompts.length > 0 ? 'border-emerald-500 bg-zinc-950 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]' : (architecture ? 'border-indigo-500 bg-zinc-950 text-indigo-400 shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)]' : 'border-zinc-700 bg-zinc-900 text-zinc-500')} shrink-0 z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all`}>
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <div className={`w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border ${prompts && prompts.length > 0 ? 'border-emerald-500/30 bg-emerald-500/10' : (architecture ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-950/50')} backdrop-blur-md transition-all`}>
                      <div className={`text-sm font-semibold ${prompts && prompts.length > 0 ? 'text-emerald-300' : (architecture ? 'text-indigo-300' : 'text-zinc-500')} mb-1`}>AI Prompts</div>
                      <div className={`text-xs ${prompts && prompts.length > 0 ? 'text-emerald-400/80 font-medium' : (architecture ? 'text-indigo-400/80 font-medium' : 'text-zinc-600')}`}>
                        {prompts && prompts.length > 0 ? 'Completed ✓' : (architecture ? 'Next Action' : 'Awaiting Architecture')}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Architecture Section - Full Width */}
          {analysis && (
            <div className="pt-8 border-t border-zinc-800/50">
              <ArchitectureGenerator 
                projectId={project.id} 
                token={session.access_token} 
                initialArchitecture={architecture}
                projectStatus={project.status}
              />
            </div>
          )}

          {/* Prompts Section - Full Width */}
          {architecture && (
            <PromptGenerator
              projectId={project.id}
              token={session.access_token}
              initialPrompts={prompts}
            />
          )}

        </main>
      </div>
    )
  } catch (err) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Project not found</h2>
          <Link href="/" className="text-indigo-400 hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    )
  }
}
