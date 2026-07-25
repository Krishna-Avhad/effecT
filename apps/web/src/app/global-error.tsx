"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-4">Something went wrong!</h2>
          <button 
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
