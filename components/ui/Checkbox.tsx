interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  title
}: CheckboxProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        title={title}
        className="w-5 h-5 accent-gray-800 rounded focus:ring-gray-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <label className="text-sm font-semibold text-gray-700">{label}</label>
    </div>
  );
}
