"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Lock } from 'lucide-react'

interface TimeRangeSelectorProps {
  currentRange: string
  maxMonths?: number
}

export function TimeRangeSelector({ currentRange, maxMonths = 12 }: TimeRangeSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("timeRange", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const can12Months = maxMonths >= 12

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-slate-400" />
      <Select value={currentRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="1" className="text-white hover:bg-slate-700">
            Current Month
          </SelectItem>
          <SelectItem value="3" className="text-white hover:bg-slate-700">
            Last 3 Months
          </SelectItem>
          <SelectItem value="6" className="text-white hover:bg-slate-700">
            Last 6 Months
          </SelectItem>
          <SelectItem 
            value="12" 
            className="text-white hover:bg-slate-700"
            disabled={!can12Months}
          >
            <div className="flex items-center gap-2">
              Last 12 Months
              {!can12Months && <Lock className="h-3 w-3 text-slate-500" />}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
