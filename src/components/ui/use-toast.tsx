import React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

// Toast type definition
export type ToastType = {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ReactNode;
};

// Context
const ToastContext = createContext<{
  toasts: ToastType[];
  addToast: (toast: Omit<ToastType, "id">) => void;
  removeToast: (id: number) => void;
} | undefined>(undefined);

// Global toast function using a simple event emitter
let globalAddToast: ((toast: Omit<ToastType, "id">) => void) | null = null;

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = useCallback((toast: Omit<ToastType, "id">) => {
    setToasts((prev) => [...prev, { ...toast, id: Date.now() + Math.random() }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  // NOTE: Implement the actual provider JSX in a .tsx file. This is just the logic/context.
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Global toast function
export function toast(toast: Omit<ToastType, "id">) {
  if (globalAddToast) {
    globalAddToast(toast);
  } else {
    console.warn("ToastProvider is not mounted. Toast not shown.");
  }
}