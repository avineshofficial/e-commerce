import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import '../styles/Toast.css';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Function to add toast
  const addToast = useCallback((message, type = 'success', title) => {
    const id = generateId();
    
    // Auto-set title if missing
    let finalTitle = title;
    if (!finalTitle) {
        if (type === 'success') finalTitle = 'Success';
        else if (type === 'error') finalTitle = 'Error';
        else if (type === 'info') finalTitle = 'Info';
        else if (type === 'warning') finalTitle = 'Warning';
    }

    setToasts(prev => [...prev, { id, message, type, title: finalTitle }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000); // 4 seconds
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <FaCheckCircle />;
      case 'error': return <FaExclamationCircle />;
      case 'info': return <FaInfoCircle />;
      case 'warning': return <FaExclamationTriangle />;
      default: return <FaInfoCircle />;
    }
  };

  const showToast = {
    success: (msg, title) => addToast(msg, 'success', title),
    error: (msg, title) => addToast(msg, 'error', title),
    info: (msg, title) => addToast(msg, 'info', title),
    warning: (msg, title) => addToast(msg, 'warning', title),
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      
      {/* Toast Rendering Portal */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {getIcon(toast.type)}
            </div>
            <div className="toast-content">
              <h4 className="toast-title">{toast.title}</h4>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

    </ToastContext.Provider>
  );
};