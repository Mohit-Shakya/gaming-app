'use client';

import { ReactNode } from 'react';

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    gradient: string;
    color: string;
    isMobile?: boolean;
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    gradient,
    color,
    isMobile = false,
}: StatCardProps) {
    return (
        <div
            className={`
        relative overflow-hidden rounded-2xl border
        ${isMobile ? 'p-4' : 'p-6'}
      `}
            style={{
                background: gradient,
                borderColor: `${color}40`,
            }}
        >
            <div
                className="absolute -top-5 -right-5 opacity-10"
                style={{ fontSize: isMobile ? 60 : 80 }}
            >
                {icon}
            </div>
            <div className="relative z-10">
                <p
                    className={`
            uppercase tracking-wider font-semibold
            ${isMobile ? 'text-[9px] mb-1.5' : 'text-[11px] mb-2'}
          `}
                    style={{ color: `${color}E6` }}
                >
                    {title}
                </p>
                <p
                    className={`
            font-bold leading-none
            ${isMobile ? 'text-2xl my-1.5' : 'text-4xl my-2'}
          `}
                    style={{ color }}
                >
                    {value}
                </p>
                {subtitle && (
                    <p
                        className={`${isMobile ? 'text-[11px] mt-1.5' : 'text-[13px] mt-2'}`}
                        style={{ color: `${color}B3` }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

// Status Badge Component
interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const statusLower = status.toLowerCase();

    let bgColor = 'bg-amber-500/15';
    let textColor = 'text-amber-500';
    let borderColor = 'border-amber-500/30';

    if (statusLower === 'confirmed') {
        bgColor = 'bg-emerald-500/15';
        textColor = 'text-emerald-500';
        borderColor = 'border-emerald-500/30';
    } else if (statusLower === 'in-progress') {
        bgColor = 'bg-blue-500/15';
        textColor = 'text-blue-500';
        borderColor = 'border-blue-500/30';
    } else if (statusLower === 'completed') {
        bgColor = 'bg-slate-500/15';
        textColor = 'text-slate-400';
        borderColor = 'border-slate-500/30';
    } else if (statusLower === 'cancelled') {
        bgColor = 'bg-red-500/15';
        textColor = 'text-red-500';
        borderColor = 'border-red-500/30';
    }

    return (
        <span
            className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
        border ${bgColor} ${textColor} ${borderColor}
      `}
        >
            {status}
        </span>
    );
}

// Card Component
interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-3 md:p-4',
        md: 'p-4 md:p-6',
        lg: 'p-6 md:p-8',
    };

    return (
        <div
            className={`
        bg-slate-900/60 border border-slate-800/50 rounded-2xl
        backdrop-blur-sm
        ${paddingClasses[padding]}
        ${className}
      `}
        >
            {children}
        </div>
    );
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    type = 'button',
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
        danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30',
        ghost: 'hover:bg-slate-800 text-slate-400 hover:text-white',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
            className={`
        inline-flex items-center justify-center rounded-xl font-medium
        transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
        >
            {loading && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {children}
        </button>
    );
}

// Input Component
interface InputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel';
    disabled?: boolean;
    className?: string;
}

export function Input({
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    disabled = false,
    className = '',
}: InputProps) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="
          w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl
          bg-slate-900/50 border border-slate-700
          text-base text-white placeholder-slate-500
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
            />
        </div>
    );
}

// Select Component
interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
    className?: string;
}

export function Select({
    label,
    value,
    onChange,
    options,
    disabled = false,
    className = '',
}: SelectProps) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    {label}
                </label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="
          w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl
          bg-slate-900/50 border border-slate-700
          text-base text-white
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          appearance-none cursor-pointer
        "
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// Empty State Component
interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-4 opacity-50">{icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}

// Loading Spinner Component
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className="flex items-center justify-center p-8">
            <div
                className={`
          ${sizes[size]}
          animate-spin rounded-full
          border-2 border-slate-700 border-t-blue-500
        `}
            />
        </div>
    );
}
