"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Eye, EyeOff } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export function OpenAISettingsForm() {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings/openai")
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey || "")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "OpenAI API key has been updated successfully.",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="openai-api-key" className="text-slate-300">
          OpenAI API Key
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="openai-api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="bg-slate-800 border-slate-700 text-white pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0 text-slate-400 hover:text-white"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Enter your OpenAI API key to enable AI-powered cost recommendations. Get your API key from{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            OpenAI Platform
          </a>
          .
        </p>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving || !apiKey}
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
}
