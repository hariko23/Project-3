import { Link } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button component props with shadcn/ui styling
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode; // Button content
  to?: string; // If provided, renders as a Link instead of button
  onClick?: () => void; // Click handler (used when to is not provided)
  className?: string; // Additional CSS classes
  style?: React.CSSProperties; // Inline styles (for backward compatibility)
}

/**
 * Reusable Button component with shadcn/ui styling
 * Can render as either a Link (if 'to' prop is provided) or a button element
 * Supports multiple variants and sizes using Tailwind CSS
 * 
 * @param children - Content to display inside the button
 * @param to - Optional route path (renders as Link if provided)
 * @param onClick - Optional click handler (used when to is not provided)
 * @param variant - Button style variant (default, destructive, outline, secondary, ghost, link)
 * @param size - Button size (default, sm, lg, icon)
 * @param className - Additional CSS classes to merge
 */
function Button({ children, to, onClick, variant, size, className, style }: ButtonProps) {
  const buttonClasses = cn(buttonVariants({ variant, size }), className);

  if (to) {
    return (
      <Link to={to} className={buttonClasses} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonClasses} style={style}>
      {children}
    </button>
  );
}

export default Button;