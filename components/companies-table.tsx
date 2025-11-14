"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Plus } from "lucide-react"
import Link from "next/link"
import { AddCompanyDialog } from "./add-company-dialog"

interface Subscription {
  id: string
  plan_name: string
  status: string
}

interface Company {
  id: string
  name: string
  industry: string | null
  company_size: string | null
  created_at: string
  subscriptions?: Subscription[] // Added subscriptions data
}

interface CompaniesTableProps {
  companies: Company[]
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)

  const getActiveSubscription = (company: Company) => {
    if (!company.subscriptions || company.subscriptions.length === 0) {
      return null
    }
    return company.subscriptions.find((sub) => sub.status === "active") || company.subscriptions[0]
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">
          {companies.length} {companies.length === 1 ? "company" : "companies"} total
        </p>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="rounded-md border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              <TableHead className="text-slate-300">Company Name</TableHead>
              <TableHead className="text-slate-300">Industry</TableHead>
              <TableHead className="text-slate-300">Size</TableHead>
              <TableHead className="text-slate-300">Plan</TableHead> {/* Added Plan column */}
              <TableHead className="text-slate-300">Joined</TableHead>
              <TableHead className="text-slate-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  No companies found. Add your first company to get started.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => {
                const subscription = getActiveSubscription(company) // Get active subscription

                return (
                  <TableRow key={company.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{company.name}</TableCell>
                    <TableCell className="text-slate-300">
                      {company.industry || <span className="text-slate-500">Not set</span>}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {company.company_size ? (
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                          {company.company_size}
                        </Badge>
                      ) : (
                        <span className="text-slate-500">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {subscription ? (
                        <Badge
                          variant="outline"
                          className={
                            subscription.status === "active"
                              ? "border-green-700 text-green-400 bg-green-900/20"
                              : "border-slate-700 text-slate-400"
                          }
                        >
                          {subscription.plan_name}
                        </Badge>
                      ) : (
                        <span className="text-slate-500">No plan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30"
                      >
                        <Link href={`/admin/companies/${company.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddCompanyDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  )
}
