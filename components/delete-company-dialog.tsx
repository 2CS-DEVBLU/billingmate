"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface DeleteCompanyDialogProps {
  companyId: string
  companyName: string
  userCount: number
  integrationCount: number
}

export function DeleteCompanyDialog({
  companyId,
  companyName,
  userCount,
  integrationCount,
}: DeleteCompanyDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (confirmText !== companyName) {
      toast({
        title: "Confirmation Error",
        description: "Company name doesn't match. Please type the exact company name.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("/api/admin/companies/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete company")
      }

      toast({
        title: "Company Deleted",
        description: `${companyName} and all associated data have been permanently deleted.`,
      })

      router.push("/admin/companies")
      router.refresh()
    } catch (error) {
      console.error("[v0] Delete error:", error)
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete company",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-red-700 text-red-400 hover:bg-red-900/30 hover:text-red-300 bg-transparent"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Company
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-slate-800 bg-slate-900 text-white max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-red-900/30 p-2">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <AlertDialogTitle className="text-2xl">Delete Company</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-400 space-y-4">
            <p className="text-base">
              You are about to permanently delete <span className="font-semibold text-white">{companyName}</span> and
              all associated data. This action cannot be undone.
            </p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-red-400">The following will be permanently deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{userCount} user account{userCount !== 1 ? "s" : ""}</li>
                <li>{integrationCount} integration{integrationCount !== 1 ? "s" : ""}</li>
                <li>All billing history and resource cost data</li>
                <li>All subscriptions and payment information</li>
                <li>All sync logs and alerts</li>
                <li>All recommendations and cost anomalies</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-name" className="text-white">
                Type <span className="font-mono font-semibold">{companyName}</span> to confirm deletion:
              </Label>
              <Input
                id="confirm-name"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={companyName}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== companyName || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Company
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
