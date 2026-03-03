// Example Sail-styled components for your Pattern Library
// Copy these into your components folder when you create your Next.js project

import React from 'react';
import clsx from 'clsx';

/* ============================================
   Button Component
   ============================================ */

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-sail-md',
        'transition-sail-fast focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Sizes
        {
          'px-sail-150 py-sail-75 text-sail-sm': size === 'sm',
          'px-sail-200 py-sail-100 text-sail-base': size === 'md',
          'px-sail-300 py-sail-150 text-sail-lg': size === 'lg',
        },

        // Variants
        {
          'bg-primary text-white hover:bg-primary-hover active:bg-primary-pressed focus:ring-primary':
            variant === 'primary',
          'bg-background-secondary text-foreground border border-border hover:bg-background-tertiary hover:border-border-hover focus:ring-primary':
            variant === 'secondary',
          'text-foreground hover:bg-background-secondary active:bg-background-tertiary focus:ring-primary':
            variant === 'tertiary',
        },

        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ============================================
   Card Component
   ============================================ */

export type CardProps = {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({
  hover = false,
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-background border border-border rounded-sail-md',
        'transition-sail-base',
        {
          'hover:shadow-sail-md hover:border-border-hover cursor-pointer': hover,
          'shadow-sail-sm': !hover,
        },
        {
          'p-0': padding === 'none',
          'p-sail-150': padding === 'sm',
          'p-sail-200': padding === 'md',
          'p-sail-300': padding === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ============================================
   Input Component
   ============================================ */

export type InputProps = {
  label?: string;
  error?: string;
  helperText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sail-sm font-medium text-foreground mb-sail-50"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-sail-150 py-sail-100',
          'bg-background text-foreground text-sail-base',
          'border rounded-sail-md',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'transition-sail-fast',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-error focus:ring-error focus:border-error'
            : 'border-border focus:ring-primary focus:border-primary',
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <p
          className={clsx(
            'mt-sail-50 text-sail-sm',
            error ? 'text-error' : 'text-foreground-secondary'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

/* ============================================
   Badge Component (for tags)
   ============================================ */

export type BadgeProps = {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sail-full font-medium',
        {
          'px-sail-100 py-sail-25 text-sail-xs': size === 'sm',
          'px-sail-150 py-sail-50 text-sail-sm': size === 'md',
        },
        {
          'bg-background-tertiary text-foreground': variant === 'default',
          'bg-primary-light text-primary': variant === 'primary',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'error',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

/* ============================================
   Example: Pattern Card Component
   ============================================ */

export type PatternCardProps = {
  pattern: {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl: string;
    tags: string[];
    author: string;
    createdAt: Date;
  };
  onClick?: () => void;
};

export function PatternCard({ pattern, onClick }: PatternCardProps) {
  return (
    <Card hover onClick={onClick} padding="none" className="overflow-hidden">
      {/* Image */}
      <div className="aspect-video w-full overflow-hidden bg-background-secondary">
        <img
          src={pattern.thumbnailUrl}
          alt={pattern.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-sail-200">
        <h3 className="font-medium text-sail-lg text-foreground mb-sail-50">
          {pattern.title}
        </h3>

        {pattern.description && (
          <p className="text-sail-sm text-foreground-secondary mb-sail-150 line-clamp-2">
            {pattern.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-sail-50 mb-sail-150">
          {pattern.tags.map((tag) => (
            <Badge key={tag} size="sm">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sail-xs text-foreground-tertiary">
          <span>{pattern.author}</span>
          <span>{pattern.createdAt.toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
}

/* ============================================
   Example: Pattern Grid
   ============================================ */

export function PatternGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-sail-300">
      {children}
    </div>
  );
}
