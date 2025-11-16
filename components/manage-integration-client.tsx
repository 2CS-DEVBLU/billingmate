"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Trash2, Save, AlertTriangle, Settings2, Key, Shield, Database } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ManageIntegrationClientProps {
  integration: {
    id: string
    provider: string
    api_key?: string
    api_token?: string
    config?: any
  }
  provider: string
  isAdmin: boolean
}

export default function ManageIntegrationClient({
  integration,
  provider,
  isAdmin,
}: ManageIntegrationClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showAppKey, setShowAppKey] = useState(false)
  
  // Form states
  const [apiKey, setApiKey] = useState("")
  const [apiToken, setApiToken] = useState("")
  const [appKey, setAppKey] = useState("")

  const providerName = provider === "digitalocean" ? "DigitalOcean" : "Datadog"
  const isDatadog = provider === "datadog"

  const handleUpdateKeys = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can update integration keys.",
        variant: "destructive",
      })
      return
    }

    if (isDatadog && !apiKey && !appKey) {
      toast({
        title: "No changes",
        description: "Please enter at least one key to update.",
        variant: "destructive",
      })
      return
    }

    if (!isDatadog && !apiToken) {
      toast({
        title: "No changes",
        description: "Please enter an API token to update.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const updateData: any = {}
      
      if (isDatadog) {
        if (apiKey) updateData.api_key = apiKey
        if (appKey) {
          updateData.config = { ...integration.config, app_key: appKey }
        }
      } else {
        if (apiToken) updateData.api_token = apiToken
      }

      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update integration")
      }

      toast({
        title: "Success",
        description: "Integration keys updated successfully.",
      })

      // Clear form
      setApiKey("")
      setApiToken("")
      setAppKey("")
      
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error updating integration:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update integration keys.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can delete integrations.",
        variant: "destructive",
      })
      return
    }

    if (deleteConfirmation !== providerName) {
      toast({
        title: "Confirmation required",
        description: `Please type "${providerName}" to confirm deletion.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete integration")
      }

      toast({
        title: "Success",
        description: "Integration deleted successfully.",
      })

      router.push("/dashboard/integrations")
    } catch (error: any) {
      console.error("[v0] Error deleting integration:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete integration.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <div className="container max-w-4xl py-8">
          <Card className="border-red-800 bg-red-900/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="border-red-800 bg-red-900/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  Only company administrators can manage integrations. Please contact your administrator for assistance.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => router.push(`/dashboard/${provider}`)}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                Back to {providerName} Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${provider === 'digitalocean' ? 'bg-blue-600/20' : 'bg-purple-600/20'}`}>
              <Settings2 className={`h-6 w-6 ${provider === 'digitalocean' ? 'text-blue-400' : 'text-purple-400'}`} />
            </div>
            <h1 className="text-3xl font-bold text-white">{providerName} Integration Settings</h1>
            <Badge className={`${provider === 'digitalocean' ? 'bg-blue-600/20 text-blue-300 border-blue-600' : 'bg-purple-600/20 text-purple-300 border-purple-600'}`}>
              Connected
            </Badge>
          </div>
          <p className="text-slate-400 ml-14">
            Manage your {providerName} API credentials and integration settings
          </p>
        </div>

        <Card className="mb-6 border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-white">Update API Credentials</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Update your {providerName} API credentials. Leave fields empty to keep existing values.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isDatadog ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-slate-300">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter new API key (optional)"
                      className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-white"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Your Datadog API key for authentication</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appKey" className="text-slate-300">Application Key</Label>
                  <div className="relative">
                    <Input
                      id="appKey"
                      type={showAppKey ? "text" : "password"}
                      value={appKey}
                      onChange={(e) => setAppKey(e.target.value)}
                      placeholder="Enter new application key (optional)"
                      className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-white"
                      onClick={() => setShowAppKey(!showAppKey)}
                    >
                      {showAppKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Application key with billing_read and usage_read scopes</p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="apiToken" className="text-slate-300">API Token</Label>
                <div className="relative">
                  <Input
                    id="apiToken"
                    type={showApiKey ? "text" : "password"}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Enter new API token"
                    className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-white"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Personal access token with read/write permissions</p>
              </div>
            )}

            <Button
              onClick={handleUpdateKeys}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/50 transition-all hover:shadow-xl"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Updating..." : "Update Credentials"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-900/50 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Irreversible actions that will permanently delete your integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-red-900/50 bg-red-950/20">
              <Alert variant="destructive" className="mb-4 border-red-800 bg-red-900/30">
                <Database className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  This action cannot be undone. All billing history, resource costs, sync logs, and AI recommendations will be permanently deleted.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Delete Integration</h3>
                  <p className="text-sm text-slate-400">
                    Permanently remove this {providerName} integration and all associated data from your account.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-lg shadow-red-900/50 transition-all hover:shadow-xl hover:shadow-red-900/70 flex-shrink-0"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Integration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/${provider}`)}
            className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 border-slate-700"
          >
            Back to {providerName} Dashboard
          </Button>
        </div>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {providerName} Integration</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Type <strong>{providerName}</strong> to confirm deletion.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  All billing history, resource costs, sync logs, and recommendations will be permanently deleted.
                </AlertDescription>
              </Alert>
            
              <div className="space-y-2">
                <Label htmlFor="deleteConfirm">
                  Type <strong>{providerName}</strong> to confirm
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={providerName}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteConfirmation("")
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || deleteConfirmation !== providerName}
              >
                {isLoading ? "Deleting..." : "Delete Integration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
