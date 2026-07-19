"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = ComponentProps<"button"> & {
  children: ReactNode;
  pendingLabel?: string;
  showPendingLabel?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  showPendingLabel = true,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${props.className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {showPendingLabel ? (
            <span>{pendingLabel}</span>
          ) : (
            <span className="sr-only">{pendingLabel}</span>
          )}
        </>
      ) : (
        children
      )}
    </button>
  );
}
