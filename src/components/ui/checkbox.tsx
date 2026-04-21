import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = React.useId()
    const inputId = id ?? autoId
    return (
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2 text-sm">
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/60 bg-background">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn('peer absolute inset-0 cursor-pointer opacity-0', className)}
            {...props}
          />
          <Check className="h-4 w-4 text-primary opacity-0 peer-checked:opacity-100" />
        </span>
        {label && <span className="leading-snug">{label}</span>}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
