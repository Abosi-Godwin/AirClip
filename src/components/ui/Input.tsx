import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { label, error, hint, className, wrapperClassName, id, ...props },
        ref
    ) => {
        const generatedId = useId();
        const inputId = id ?? generatedId;
        const messageId = `${inputId}-message`;
        const message = error ?? hint;

        return (
            <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={message ? messageId : undefined}
                    className={cn(
                        "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-400 sm:text-sm",
                        "transition-colors focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500",
                        error &&
                            "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                        className
                    )}
                    {...props}
                />
                {message && (
                    <p
                        id={messageId}
                        className={cn(
                            "text-xs",
                            error ? "text-red-500" : "text-neutral-500"
                        )}
                    >
                        {message}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";