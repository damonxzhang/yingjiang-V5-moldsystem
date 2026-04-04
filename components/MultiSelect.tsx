import React, { useState, useRef, useEffect } from 'react';

export interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: Option[];
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  maxTagCount?: number | 'responsive';
  className?: string;
  style?: React.CSSProperties;
  dropdownClassName?: string;
  dropdownStyle?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = '请选择...',
  disabled = false,
  allowClear = true,
  maxTagCount,
  className = '',
  style,
  dropdownClassName = '',
  dropdownStyle,
  size = 'middle',
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<(string | number)[]>(defaultValue || []);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentValue = isControlled ? value : internalValue;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (newValue: (string | number)[]) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const toggleOption = (optionValue: string | number, optionDisabled?: boolean) => {
    if (disabled || optionDisabled) return;

    if (currentValue.includes(optionValue)) {
      handleChange(currentValue.filter(v => v !== optionValue));
    } else {
      handleChange([...currentValue, optionValue]);
    }
  };

  const removeTag = (e: React.MouseEvent, optionValue: string | number) => {
    e.stopPropagation();
    if (disabled) return;
    handleChange(currentValue.filter(v => v !== optionValue));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    handleChange([]);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'min-h-[28px] p-1 text-xs';
      case 'large':
        return 'min-h-[44px] p-2 text-base';
      default:
        return 'min-h-[38px] p-1.5 text-sm';
    }
  };

  const getTagSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-1.5 py-0 text-[10px]';
      case 'large':
        return 'px-2.5 py-1 text-sm';
      default:
        return 'px-2 py-0.5 text-xs';
    }
  };

  const selectedOptions = currentValue.map(v => options.find(o => o.value === v)).filter(Boolean) as Option[];

  const renderTags = () => {
    if (currentValue.length === 0) {
      return <span className="text-slate-400 px-1">{placeholder}</span>;
    }

    let displayOptions = selectedOptions;
    let hiddenCount = 0;

    if (maxTagCount && maxTagCount !== 'responsive' && selectedOptions.length > maxTagCount) {
      displayOptions = selectedOptions.slice(0, maxTagCount);
      hiddenCount = selectedOptions.length - maxTagCount;
    }

    return (
      <>
        {displayOptions.map(option => (
          <span
            key={option.value}
            className={`inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 rounded font-medium ${getTagSizeClasses()}`}
          >
            {option.label}
            {!disabled && allowClear && (
              <span
                onClick={(e) => removeTag(e, option.value)}
                className="cursor-pointer hover:text-indigo-900 ml-0.5 leading-none"
              >
                ×
              </span>
            )}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className={`inline-flex items-center bg-slate-100 text-slate-600 rounded ${getTagSizeClasses()}`}>
            +{hiddenCount}...
          </span>
        )}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full ${className}`}
      style={style}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full ${getSizeClasses()} bg-white border rounded-lg cursor-pointer
          flex flex-wrap gap-1 items-center transition-colors
          ${disabled
            ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
            : 'border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500'
          }
        `}
      >
        {renderTags()}
        <span className="ml-auto text-slate-400 text-xs flex items-center gap-1">
          {allowClear && currentValue.length > 0 && !disabled && (
            <span
              onClick={clearAll}
              className="hover:text-slate-600 cursor-pointer mr-1"
            >
              ×
            </span>
          )}
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && !disabled && (
        <div
          className={`
            absolute z-50 w-full mt-1 bg-white border border-slate-200
            rounded-lg shadow-lg max-h-48 overflow-y-auto
            ${dropdownClassName}
          `}
          style={dropdownStyle}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400 text-center">暂无数据</div>
          ) : (
            options.map(option => {
              const isSelected = currentValue.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value, option.disabled)}
                  className={`
                    px-3 py-2 cursor-pointer flex items-center justify-between
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}
                    ${isSelected ? 'bg-indigo-50' : ''}
                  `}
                >
                  <span className={`text-sm ${isSelected ? 'text-indigo-700 font-medium' : 'text-slate-700'}`}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <span className="text-indigo-600 text-sm">✓</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
