"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Ban, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeactivateCompanyDialogProps {
  companyId: string
  companyName: string
  userCount: number
  isReactivating?: boolean
}

export function DeactivateCompanyDialog({
  companyId,
  companyName,
  userCount,
  isReactivating = false,
}: DeactivateCompanyDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async () => {
    if (confirmText !== companyName) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const endpoint = isReactivating
        ? "/api/company/reactivate"
        : "/api/company/deactivate"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isReactivating ? "reactivate" : "deactivate"} company`)
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(`[v0] ${isReactivating ? "Reactivate" : "Deactivate"} error:`, err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const isConfirmValid = confirmText === companyName

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isReactivating ? (
          <Button
            variant="outline"
            size="sm"
            className="border-green-700 text-green-400 hover:bg-green-900/30 bg-transparent"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Reactivate Company
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="border-orange-700 text-orange-400 hover:bg-orange-900/30 bg-transparent"
          >
            <Ban className="h-4 w-4 mr-2" />
            Deactivate Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {isReactivating ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-400" />
                Reactivate Company
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-orange-400" />
                Deactivate Company
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isReactivating
              ? "Reactivating this company will restore access for all users."
              : "Deactivating this company will disable access for all users and integrations."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="bg-slate-800 border-slate-700">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-slate-300">
              {isReactivating ? (
                <div className="space-y-2">
                  <p className="font-medium">This will:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Restore company access</li>
                    <li>Reactivate {userCount} user{userCount !== 1 ? "s" : ""}</li>
                    <li>Resume all integrations</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">This will:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Deactivate {userCount} user{userCount !== 1 ? "s" : ""}</li>
                    <li>Disable all integrations</li>
                    <li>Prevent login access</li>
                    <li>Preserve all data (can be reactivated within 30 days)</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-slate-300">
              Type <span className="font-mono font-bold text-white">{companyName}</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={companyName}
              className="bg-slate-800 border-slate-700 text-white"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={!isConfirmValid || isLoading}
            className={
              isReactivating
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isReactivating ? "Reactivate Company" : "Deactivate Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
