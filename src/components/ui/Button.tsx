// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  // Basis-Styling, wie es auch bei den HeaderBar-Buttons genutzt wird:
  const baseClasses = 'rounded font-medium';

  // Wir orientieren uns an den Klassen, die du in HeaderBar benutzt:
  const variantClasses =
  variant === 'outline'
    ? 'bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark border border-solid border-chatGray-textLight dark:border-chatGray-textDark'
    : 'bg-header-btn-selected dark:bg-header-btn-selected-dark text-chatGray-textLight dark:text-chatGray-textDark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark';
  
  // Größenanpassung:
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-1 text-sm'
      : size === 'lg'
      ? 'px-4 py-2 text-lg'
      : 'px-3 py-1';

  return (
    <button className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
