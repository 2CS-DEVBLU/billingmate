"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Eye, EyeOff, Save } from 'lucide-react'
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
  }
  provider: string
  isAdmin: boolean
}

export default function ManageIntegrationClient({ integration, provider, isAdmin }: ManageIntegrationClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showAppKey, setShowAppKey] = useState(false)

  const providerName = provider === "digitalocean" ? "DigitalOcean" : "Datadog"
  const [apiKey, setApiKey] = useState(integration.api_key || integration.api_token || "")
  const [appKey, setAppKey] = useState(integration.config?.app_key || "")

  const handleUpdateKeys = async () => {
    setIsLoading(true)
    try {
      const payload: any = {}
      
      if (provider === "digitalocean") {
        payload.api_token = apiKey
      } else if (provider === "datadog") {
        payload.api_key = apiKey
        payload.config = { app_key: appKey }
      }

      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update keys")
      }

      toast({
        title: "Keys updated",
        description: `Your ${providerName} API keys have been updated successfully.`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== providerName) {
      toast({
        title: "Invalid confirmation",
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
        title: "Integration deleted",
        description: `Your ${providerName} integration has been removed.`,
      })

      router.push("/dashboard/integrations")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Only company administrators can manage integrations. Please contact your administrator for changes.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage {providerName} Integration</h1>
        <p className="text-muted-foreground mt-2">
          Update your API keys or remove this integration
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Update your {providerName} API credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {provider === "digitalocean" ? "API Token" : "API Key"}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {provider === "datadog" && (
              <div className="space-y-2">
                <Label htmlFor="appKey">Application Key</Label>
                <div className="relative">
                  <Input
                    id="appKey"
                    type={showAppKey ? "text" : "password"}
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder="Enter your application key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowAppKey(!showAppKey)}
                  >
                    {showAppKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={handleUpdateKeys} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Update Keys
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this integration and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Warning: This will permanently delete all billing history, resource costs, recommendations, and sync logs associated with this integration. This action cannot be undone.
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
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your {providerName} integration
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="confirm">
              Type <span className="font-bold">{providerName}</span> to confirm:
            </Label>
            <Input
              id="confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={providerName}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConfirmation !== providerName || isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Integration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
