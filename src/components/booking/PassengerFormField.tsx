import { PassengerDetails } from '@/types/booking';

interface PassengerFormFieldProps {
  field: keyof PassengerDetails;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export const PassengerFormField = ({ field, value, error, onChange }: PassengerFormFieldProps) => {
  // Define valid fields and their labels
  const fieldConfigs = {
    title: {
      label: 'Title',
      type: 'select',
      options: [
        { value: 'Mr', label: 'Mr' },
        { value: 'Mrs', label: 'Mrs' },
        { value: 'Ms', label: 'Ms' },
        { value: 'Dr', label: 'Dr' }
      ]
    },
    firstName: {
      label: 'First Name',
      type: 'text'
    },
    lastName: {
      label: 'Last Name',
      type: 'text'
    },
    email: {
      label: 'Email Address',
      type: 'email'
    },
    phone: {
      label: 'Phone Number',
      type: 'tel'
    },
    nationality: {
      label: 'Nationality',
      type: 'select',
      options: [
        { value: 'IN', label: 'Indian' },
        { value: 'US', label: 'American' },
        { value: 'GB', label: 'British' },
        { value: 'CA', label: 'Canadian' },
        { value: 'AU', label: 'Australian' }
      ]
    }
  } as const;

  // Check if the field is valid
  if (!fieldConfigs[field]) {
    return null; // Don't render anything for invalid fields
  }

  const config = fieldConfigs[field];
  const baseClassName = `w-full rounded-lg border ${
    error ? 'border-red-300 ring-red-500' : 'border-gray-300'
  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`;

  const renderField = () => {
    if (config.type === 'select') {
      return (
        <select
          id={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClassName}
        >
          <option value="">Select {config.label.toLowerCase()}</option>
          {config.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        id={field}
        type={config.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseClassName}
        placeholder={`Enter your ${config.label.toLowerCase()}`}
      />
    );
  };

  return (
    <div className="space-y-2">
      <label htmlFor={field} className="block text-sm font-medium text-gray-700">
        {config.label}
        <span className="text-red-500 ml-1">*</span>
      </label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};