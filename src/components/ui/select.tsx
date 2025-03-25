import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(({
  value,
  onValueChange,
  options,
  label,
  error,
  className,
  placeholder,
  disabled
}, ref) => {
  return (
  <div className="space-y-2">
    {label && (
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        disabled={disabled}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md animate-in fade-in-80"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-blue-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  "hover:bg-blue-50"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
    {error && (
      <p className="text-sm text-red-500">
        {error}
      </p>
    )}
  </div>
  );
});

Select.displayName = "Select";

export type { SelectProps };
export { Select };
