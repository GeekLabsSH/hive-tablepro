import * as React from "react";
import { format, type Locale } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

export interface HiveDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Padrão date-fns, ex.: "dd/MM/yyyy" */
  displayFormat?: string;
  locale?: Locale;
  fromYear?: number;
  toYear?: number;
}

export function HiveDatePicker({
  value,
  onChange,
  placeholder = "Escolher data",
  disabled,
  className,
  displayFormat = "dd/MM/yyyy",
  locale = ptBR,
  fromYear = 1920,
  toYear = new Date().getFullYear() + 10
}: HiveDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, displayFormat, { locale }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          initialFocus
          locale={locale}
          fromYear={fromYear}
          toYear={toYear}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
}
