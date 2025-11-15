"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Trash2, Save, AlertTriangle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Only company administrators can manage integrations. Please contact your administrator for assistance.
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button onClick={() => router.push(`/dashboard/${provider}`)}>
            Back to {providerName} Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{providerName} Integration Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your {providerName} integration keys and settings
        </p>
      </div>

      {/* Update Keys Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Update API Keys</CardTitle>
          <CardDescription>
            Update your {providerName} API credentials. Leave fields empty to keep existing values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDatadog ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter new API key (optional)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appKey">Application Key</Label>
                <div className="relative">
                  <Input
                    id="appKey"
                    type={showAppKey ? "text" : "password"}
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder="Enter new application key (optional)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowAppKey(!showAppKey)}
                  >
                    {showAppKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <div className="relative">
                <Input
                  id="apiToken"
                  type={showApiKey ? "text" : "password"}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter new API token"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpdateKeys}
            disabled={isLoading}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            Update Keys
          </Button>
        </CardContent>
      </Card>

      {/* Delete Integration Card */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this integration and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. All billing history, resource costs, and recommendations will be permanently deleted.
            </AlertDescription>
          </Alert>
          
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Integration
          </Button>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push(`/dashboard/${provider}`)}>
          Back to {providerName} Dashboard
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
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
  )
}
