import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: any; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 5000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <XCircle className="w-5 h-5 text-danger-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
    info: <Info className="w-5 h-5 text-primary-500" />,
  };

  const bgs = {
    success: 'bg-success-500/10 border-success-500/20',
    error: 'bg-danger-500/10 border-danger-500/20',
    warning: 'bg-warning-500/10 border-warning-500/20',
    info: 'bg-primary-500/10 border-primary-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg w-80 bg-surface-900/90 ${bgs[toast.type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.message && <p className="text-xs text-surface-400 mt-1 line-clamp-2">{toast.message}</p>}
      </div>
      <button onClick={onRemove} className="flex-shrink-0 text-surface-500 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
