import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export default function AlertsHandler({ alertType, setAlertType }) {
  useEffect(() => {
    if (alertType) {
      const timer = setTimeout(() => {
        setAlertType(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertType, setAlertType]);

  if (!alertType) return null;

  const isError = alertType === "error";

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5">
      <div 
        className={`flex items-start gap-4 p-4 rounded-lg shadow-xl border \${
          isError 
            ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-200" 
            : "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-800 dark:text-green-200"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-sm">
            {isError ? "Error" : "Éxito"}
          </h3>
          <p className="text-sm mt-1">
            {isError 
              ? "Ha ocurrido un error subiendo el programa." 
              : "Código subido exitosamente."}
          </p>
        </div>

        <button 
          onClick={() => setAlertType(null)}
          className="shrink-0 rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}