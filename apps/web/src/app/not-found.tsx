export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">404 - Not Found</h2>
        <p className="text-zinc-400 mb-4">The page you are looking for does not exist.</p>
        <a href="/" className="text-indigo-400 hover:underline">Return to Dashboard</a>
      </div>
    </div>
  )
}
