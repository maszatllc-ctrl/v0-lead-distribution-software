"use client"

import { useState, useRef } from "react"
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
  format,
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
  { label: "Last 14 days", getValue: () => ({ from: startOfDay(subDays(new Date(), 13)), to: endOfDay(new Date()) }) },
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
  const [tempDate, setTempDate] = useState<DateRange>({ from: null, to: null })
  const [selectedPreset, setSelectedPreset] = useState("All Time")
  const [open, setOpen] = useState(false)
  const pendingRangeRef = useRef<DateRange | null>(null)

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && pendingRangeRef.current?.from && pendingRangeRef.current?.to) {
      onChange?.(pendingRangeRef.current)
    }
    if (!isOpen) {
      pendingRangeRef.current = null
    }
    setOpen(isOpen)
  }

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const newRange = preset.getValue()
    setTempDate(newRange)
    setSelectedPreset(preset.label)
    pendingRangeRef.current = null
    onChange?.(newRange.from && newRange.to ? newRange : null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <CalendarIcon className="w-4 h-4" />
          {selectedPreset || "Select dates"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-fit" align="start">
        <div className="flex">
          <div className="border-r border-border py-2 w-[130px]">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "w-full text-left text-[13px] py-1.5 px-3 rounded hover:bg-accent transition-colors whitespace-nowrap",
                  selectedPreset === preset.label && "bg-accent font-medium",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col p-4">
            <Calendar
              mode="range"
              selected={tempDate.from && tempDate.to ? { from: tempDate.from, to: tempDate.to } : undefined}
              onSelect={(range) => {
                if (range?.from) {
                  const newRange = {
                    from: startOfDay(range.from),
                    to: range.to ? endOfDay(range.to) : null,
                  }
                  setTempDate(newRange)
                  setSelectedPreset(
                    newRange.from && newRange.to
                      ? `${format(newRange.from, "MMM d")} - ${format(newRange.to, "MMM d")}`
                      : "",
                  )
                  pendingRangeRef.current = newRange
                }
              }}
              numberOfMonths={2}
              className="p-0"
              classNames={{
                months: "flex gap-6",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center text-sm",
                caption_label: "text-sm font-semibold",
                nav: "space-x-1 flex items-center",
                nav_button:
                  "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-accent rounded-md transition-colors",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-10 font-medium text-xs",
                row: "flex w-full mt-1.5",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-sm",
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
            <div className="text-sm text-muted-foreground pt-4 border-t mt-4">
              {tempDate.from ? (
                <>
                  {format(tempDate.from, "MMM d, yyyy")}
                  {tempDate.to && ` - ${format(tempDate.to, "MMM d, yyyy")}`}
                </>
              ) : (
                "Select date range"
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
