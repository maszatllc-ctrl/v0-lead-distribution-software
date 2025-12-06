"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import {
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns"
import { cn } from "@/lib/utils"

type DateRange = {
  from: Date | null
  to: Date | null
}

interface DateRangePickerProps {
  onChange?: (range: DateRange | null) => void
}

const presets = [
  { label: "All Time", getValue: () => ({ from: null, to: null }) },
  { label: "Today", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  {
    label: "Yesterday",
    getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }),
  },
  { label: "Last 7 days", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: "Last 30 days", getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: "This week", getValue: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  {
    label: "Last week",
    getValue: () => ({ from: startOfWeek(subWeeks(new Date(), 1)), to: endOfWeek(subWeeks(new Date(), 1)) }),
  },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  {
    label: "Last month",
    getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }),
  },
]

export function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [tempDate, setTempDate] = useState<DateRange>({
    from: null,
    to: null,
  })
  const [selectedPreset, setSelectedPreset] = useState("All Time")
  const [open, setOpen] = useState(false)

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const newRange = preset.getValue()
    setTempDate(newRange)
    setSelectedPreset(preset.label)
  }

  const handleUpdate = () => {
    onChange?.(tempDate.from && tempDate.to ? tempDate : null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <CalendarIcon className="w-4 h-4" />
          {selectedPreset || "Select dates"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r border-border p-2 space-y-1 min-w-[140px]">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "w-full justify-start text-sm font-normal",
                  selectedPreset === preset.label && "bg-accent",
                )}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={tempDate.from && tempDate.to ? { from: tempDate.from, to: tempDate.to } : undefined}
              onSelect={(range) => {
                if (range?.from) {
                  setTempDate({
                    from: startOfDay(range.from),
                    to: range.to ? endOfDay(range.to) : endOfDay(range.from),
                  })
                  setSelectedPreset("")
                }
              }}
              numberOfMonths={2}
            />
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
              <Button
                size="sm"
                onClick={handleUpdate}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
