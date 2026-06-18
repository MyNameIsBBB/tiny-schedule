type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
}

let listeners: ((toasts: ToastMessage[]) => void)[] = [];
let toastsList: ToastMessage[] = [];

export const addToast = (message: string, type: ToastType = 'success') => {
  const newToast: ToastMessage = {
    id: `${Date.now()}-${Math.random()}`,
    message,
    type
  };
  toastsList = [...toastsList, newToast];
  listeners.forEach(listener => listener(toastsList));
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toastsList = toastsList.filter(t => t.id !== newToast.id);
    listeners.forEach(listener => listener(toastsList));
  }, 4000);
};

export const subscribeToToasts = (listener: (toasts: ToastMessage[]) => void) => {
  listeners.push(listener);
  listener(toastsList);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};
