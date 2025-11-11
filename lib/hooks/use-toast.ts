import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    
    // Auto dismiss after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  
  success: (title, description) => {
    const id = Math.random().toString(36).substring(2);
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant: 'success' }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  
  error: (title, description) => {
    const id = Math.random().toString(36).substring(2);
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant: 'error' }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  
  warning: (title, description) => {
    const id = Math.random().toString(36).substring(2);
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant: 'warning' }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  
  info: (title, description) => {
    const id = Math.random().toString(36).substring(2);
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant: 'info' }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
}));
