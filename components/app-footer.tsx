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
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-16 items-center justify-center py-4">
        <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          <p className="font-medium">
            © 2025 BillingMate. All rights reserved.
          </p>
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
            <p>
              BillingMate v{version} • Deployed {deploymentDate}
            </p>
            <span className="hidden sm:inline">•</span>
            <p>Powered by 2CS Consulting</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
