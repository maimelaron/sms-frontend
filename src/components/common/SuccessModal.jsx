import React, { useEffect } from 'react';
import './SuccessModal.css';

const SuccessModal = ({
    show,
    title = "Success!",
    message,
    onClose,
    autoCloseDelay = 2000,
    showCloseButton = true
}) => {
    useEffect(() => {
        if (show && autoCloseDelay > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [show, autoCloseDelay, onClose]);

    if (!show) return null;

    return (
        <div className="success-modal-overlay" onClick={onClose}>
            <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="success-modal-icon">
                    <svg viewBox="0 0 52 52" className="success-checkmark">
                        <circle cx="26" cy="26" r="25" fill="none" />
                        <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                </div>
                <h2 className="success-modal-title">{title}</h2>
                <p className="success-modal-message">{message}</p>
                {showCloseButton && (
                    <button
                        className="success-modal-button"
                        onClick={onClose}
                    >
                        OK
                    </button>
                )}
            </div>
        </div>
    );
};

export default SuccessModal;
