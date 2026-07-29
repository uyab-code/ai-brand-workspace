"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info" | "warning"
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type: Toast["type"], duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast["type"], duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-md text-sm font-medium animate-slide-in",
              "pointer-events-auto",
              {
                "bg-card text-foreground border border-border": toast.type === "success",
                "bg-destructive text-destructive-foreground border border-destructive": toast.type === "error",
                "bg-accent text-primary border border-border": toast.type === "info",
                "bg-muted text-foreground border border-border": toast.type === "warning",
              }
            )}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: "pointer" }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Add this CSS keyframes via global CSS or tailwind
// @keyframes slide-in { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
// .animate-slide-in { animation: slide-in 0.3s ease-out; }

import React from "react"