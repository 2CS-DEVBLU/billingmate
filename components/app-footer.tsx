export function AppFooter() {
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev'
  const version = commitSha.substring(0, 7)
  const buildDate = process.env.NEXT_PUBLIC_VERCEL_BUILD_TIME || new Date().toISOString()
  const deploymentDate = new Date(buildDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Main copyright */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">BM</span>
            </div>
            <span className="text-white font-semibold text-lg">BillingMate</span>
          </div>
          
          {/* Version and deployment info */}
          <div className="flex flex-col items-center gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                v{version}
              </span>
              <span>•</span>
              <span>Deployed {deploymentDate}</span>
            </div>
          </div>

          {/* Copyright and powered by */}
          <div className="flex flex-col items-center gap-1 text-xs text-slate-500">
            <p>© 2025 BillingMate. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Powered by
              <span className="text-indigo-400 font-medium">2CS Consulting</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
