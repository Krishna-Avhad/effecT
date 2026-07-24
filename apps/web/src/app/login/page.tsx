import { login, signup } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
        <p className="mb-8 text-sm text-zinc-400">Enter your credentials to access Prompt Master</p>
        
        {searchParams?.error && (
          <div className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            {searchParams.error}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300" htmlFor="email">Email</label>
            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300" htmlFor="password">Password</label>
            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              id="password"
              name="password"
              type="password"
              required
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              formAction={login}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Log In
            </button>
            <button
              formAction={signup}
              className="flex w-full items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
