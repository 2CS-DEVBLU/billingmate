"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ManageIntegrationClientProps {
  integration: {
    id: string
    provider: string
    api_key?: string
    api_token?: string
    config?: any
    is_active: boolean
    last_sync?: string
  }
  providerName: string
  providerLogo: string
  isAdmin: boolean
}

export function ManageIntegrationClient({
  integration,
  providerName,
  providerLogo,
  isAdmin,
}: ManageIntegrationClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [apiKey, setApiKey] = useState("")
  const [appKey, setAppKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showAppKey, setShowAppKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const handleUpdateKeys = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can update integration keys.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey && !appKey) {
      toast({
        title: "No Changes",
        description: "Please enter at least one key to update.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const updateData: any = {}
      
      if (apiKey) {
        if (integration.provider === "digitalocean") {
          updateData.api_token = apiKey
        } else if (integration.provider === "datadog") {
          updateData.api_key = apiKey
        }
      }

      if (appKey && integration.provider === "datadog") {
        updateData.config = { ...integration.config, app_key: appKey }
      }

      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update keys")
      }

      toast({
        title: "Keys Updated",
        description: "Integration keys have been successfully updated.",
      })

      setApiKey("")
      setAppKey("")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete integrations.",
        variant: "destructive",
      })
      return
    }

    if (confirmText !== providerName) {
      toast({
        title: "Confirmation Required",
        description: `Please type "${providerName}" to confirm deletion.`,
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete integration")
      }

      toast({
        title: "Integration Deleted",
        description: `${providerName} integration has been removed.`,
      })

      router.push("/dashboard/integrations")
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/integrations">
          <Button variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integrations
          </Button>
        </Link>
      </div>

      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{providerLogo}</div>
            <div className="flex-1">
              <CardTitle className="text-white text-2xl">Manage {providerName} Integration</CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Update API keys or remove this integration
              </CardDescription>
            </div>
            <Badge variant={integration.is_active ? "default" : "secondary"} className="text-sm">
              {integration.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Integration Info */}
          <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
            <p className="text-sm text-slate-400">
              <span className="font-medium text-white">Provider:</span> {providerName}
            </p>
            {integration.last_sync && (
              <p className="text-sm text-slate-400">
                <span className="font-medium text-white">Last Sync:</span>{" "}
                {new Date(integration.last_sync).toLocaleString()}
              </p>
            )}
          </div>

          {/* Update Keys Section */}
          {isAdmin && (
            <div className="space-y-4 p-4 border border-slate-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white">Update API Keys</h3>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-slate-300">
                  {integration.provider === "digitalocean" ? "API Token" : "API Key"}
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter new API key to update"
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {integration.provider === "datadog" && (
                <div className="space-y-2">
                  <Label htmlFor="appKey" className="text-slate-300">
                    Application Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="appKey"
                      type={showAppKey ? "text" : "password"}
                      value={appKey}
                      onChange={(e) => setAppKey(e.target.value)}
                      placeholder="Enter new application key to update"
                      className="bg-slate-800 border-slate-700 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAppKey(!showAppKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showAppKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpdateKeys}
                disabled={isSaving || (!apiKey && !appKey)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Update Keys"}
              </Button>
            </div>
          )}

          {/* Delete Section */}
          {isAdmin && (
            <div className="space-y-4 p-4 border border-red-900/50 bg-red-950/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Deleting this integration will remove all associated billing data, cost analytics, and
                    recommendations. This action cannot be undone.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Integration
              </Button>
            </div>
          )}

          {!isAdmin && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-400">
                Only company administrators can modify or delete integrations. Please contact your administrator
                if you need to make changes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {providerName} Integration</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete the integration and all associated data. Type <strong>{providerName}</strong> to
              confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "${providerName}" to confirm`}
            className="bg-slate-800 border-slate-700 text-white"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== providerName}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Integration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
