// components/ui/alert.tsx
'use client';

import { forwardRef } from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'success';
  className?: string;
  children?: React.ReactNode;
}

interface AlertDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    const baseStyles = 'rounded-md p-4 mb-4';
    const variantStyles = {
      default: 'bg-blue-50 text-blue-700 border border-blue-200',
      destructive: 'bg-red-50 text-red-700 border border-red-200',
      success: 'bg-green-50 text-green-700 border border-green-200',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={`text-sm ${className}`} {...props}>
        {children}
      </p>
    );
  }
);

Alert.displayName = 'Alert';
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription };