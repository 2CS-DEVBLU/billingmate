export function AppFooter() {
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev'
  const version = commitSha.substring(0, 7)

  return (
    <footer className="mt-auto border-t border-slate-800/50 bg-slate-950/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-400 font-mono">
            v{version}
          </span>
          <span>•</span>
          <span>© 2025 All rights reserved</span>
          <span>•</span>
          <span>Powered by <span className="text-slate-400">2CS Consulting</span></span>
        </div>
      </div>
    </footer>
  )
}
