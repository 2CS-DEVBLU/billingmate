"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { AddUserDialog } from "@/components/add-user-dialog"

interface AddUserButtonProps {
  companies: Array<{ id: string; name: string }>
}

export function AddUserButton({ companies }: AddUserButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
        <UserPlus className="h-4 w-4 mr-2" />
        Register User
      </Button>
      <AddUserDialog open={open} onOpenChange={setOpen} companies={companies} />
    </>
  )
}
