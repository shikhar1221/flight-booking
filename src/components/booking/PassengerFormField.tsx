import { PassengerDetails } from '@/types/booking';
import { useState } from 'react';
import { Info, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FieldConfig = {
  label: string;
  type: 'text' | 'email' | 'tel' | 'select';
  placeholder?: string;
  pattern?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: string) => string | undefined;
  helpText?: string;
};

type FieldConfigs = {
  [K in keyof PassengerDetails]: FieldConfig;
};

interface PassengerFormFieldProps {
  field: keyof PassengerDetails;
  value: string | undefined;
  error?: string;
  onChange: (value: string) => void;
}

export const PassengerFormField = ({ 
  field, 
  value = '', // Provide default empty string
  error, 
  onChange 
}: PassengerFormFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const fieldConfigs: FieldConfigs = {
    title: {
      label: 'Title',
      type: 'select',
      options: [
        { value: 'Mr', label: 'Mr' },
        { value: 'Mrs', label: 'Mrs' },
        { value: 'Ms', label: 'Ms' },
        { value: 'Dr', label: 'Dr' }
      ],
      validation: (value) => !value ? 'Please select a title' : undefined
    },
    firstName: {
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter your first name',
      pattern: '^[a-zA-Z ]{2,30}$',
      validation: (value) => {
        if (!value) return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z ]{2,30}$/.test(value)) return 'Please enter a valid name';
        return undefined;
      },
      helpText: 'Enter your name as it appears on your ID'
    },
    lastName: {
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter your last name',
      pattern: '^[a-zA-Z ]{2,30}$',
      validation: (value) => {
        if (!value) return 'Last name is required';
        if (value.length < 2) return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z ]{2,30}$/.test(value)) return 'Please enter a valid name';
        return undefined;
      }
    },
    email: {
      label: 'Email Address',
      type: 'email',
      placeholder: 'you@example.com',
      validation: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
        return undefined;
      },
      helpText: 'Your booking confirmation will be sent to this email'
    },
    phone: {
      label: 'Phone Number',
      type: 'tel',
      placeholder: 'Enter your phone number',
      pattern: '^[0-9]{10}$',
      validation: (value) => {
        if (!value) return 'Phone number is required';
        if (!/^[0-9]{10}$/.test(value)) return 'Please enter a valid 10-digit phone number';
        return undefined;
      },
      helpText: 'Enter a 10-digit mobile number'
    },
    nationality: {
      label: 'Nationality',
      type: 'select',
      options: [
        { value: 'IN', label: 'Indian' },
        { value: 'US', label: 'American' },
        { value: 'GB', label: 'British' },
        { value: 'CA', label: 'Canadian' },
        { value: 'AU', label: 'Australian' },
        { value: 'SG', label: 'Singaporean' },
        { value: 'MY', label: 'Malaysian' },
        { value: 'AE', label: 'Emirati' }
      ],
      validation: (value) => !value ? 'Please select your nationality' : undefined
    }
  };

  if (!fieldConfigs[field]) return null;

  const config = fieldConfigs[field];

  const baseClassName = cn(
    'w-full rounded-lg border bg-white px-4 py-3 transition-all duration-200',
    'appearance-none text-gray-900 placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:shadow-sm',
    {
      'border-gray-200 hover:border-gray-300': !error && !isFocused,
      'border-red-300 ring-red-100 bg-red-50/50': error,
      'border-blue-500 ring-2 ring-blue-100': isFocused && !error,
      'pr-10': isDirty || error // Space for status icon
    }
  );

  const handleValidation = (value: string) => {
    if (config.validation) {
      const validationError = config.validation(value);
      setIsDirty(true);
      return validationError;
    }
  };

  const renderField = () => {
    const commonProps = {
      id: field,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange(e.target.value);
        handleValidation(e.target.value);
      },
      onFocus: () => setIsFocused(true),
      onBlur: () => {
        setIsFocused(false);
        handleValidation(value);
      },
      className: cn(baseClassName, 
        config.type === 'select' && 'cursor-pointer bg-none'
      ),
      'aria-invalid': !!error,
      'aria-describedby': `${field}-error ${field}-help`
    };

    const wrapper = (element: React.ReactNode) => (
      <div className="relative">
        {element}
        {isDirty && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {error ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Check className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>
    );

    if (config.type === 'select') {
      return wrapper(
        <select {...commonProps}>
          <option value="" className="text-gray-500">
            Select {config.label.toLowerCase()}
          </option>
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return wrapper(
      <input
        {...commonProps}
        type={config.type}
        placeholder={config.placeholder}
        pattern={config.pattern}
      />
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label 
          htmlFor={field} 
          className={cn(
            "block text-sm font-medium transition-colors duration-200",
            error ? "text-red-600" : "text-gray-700"
          )}
        >
          {config.label}
          <span className="text-red-500 ml-1">*</span>
        </label>
        {config.helpText && (
          <div className="group relative">
            <Info className={cn(
              "h-4 w-4 transition-colors duration-200",
              error ? "text-red-400" : "text-gray-400"
            )} />
            <div className="absolute right-0 mt-1 w-48 p-2.5 bg-gray-900 text-xs text-white rounded-lg 
              opacity-0 invisible group-hover:opacity-100 group-hover:visible 
              transition-all duration-200 z-10 shadow-lg
              before:content-[''] before:absolute before:top-0 before:right-4 
              before:w-2 before:h-2 before:bg-gray-900 before:-translate-y-1 
              before:rotate-45"
            >
              {config.helpText}
            </div>
          </div>
        )}
      </div>

      {renderField()}

      <div className="min-h-[20px]"> {/* Prevents layout shift */}
        {error ? (
          <p 
            id={`${field}-error`} 
            className="text-sm text-red-600 animate-slideIn flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        ) : config.helpText && !isFocused && (
          <p 
            id={`${field}-help`} 
            className="text-sm text-gray-500"
          >
            {config.helpText}
          </p>
        )}
      </div>
    </div>
  );
};
