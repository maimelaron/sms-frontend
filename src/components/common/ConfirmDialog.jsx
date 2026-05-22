import { useState, useEffect } from 'react';
import { resolveConfirm } from '../../utils/confirm';
import './ConfirmDialog.css';

const ConfirmDialog = () => {
    const [state, setState] = useState({ open: false, message: '', description: '' });

    useEffect(() => {
        const handler = (e) => {
            setState({ open: true, message: e.detail.message, description: e.detail.description || '' });
        };
        document.addEventListener('app:confirm', handler);
        return () => document.removeEventListener('app:confirm', handler);
    }, []);

    const handle = (value) => {
        setState(s => ({ ...s, open: false }));
        resolveConfirm(value);
    };

    if (!state.open) return null;

    return (
        <div className="confirm-overlay" onClick={() => handle(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">⚠</div>
                <h3 className="confirm-title">{state.message}</h3>
                {state.description && (
                    <p className="confirm-description">{state.description}</p>
                )}
                <div className="confirm-actions">
                    <button className="confirm-btn confirm-btn-cancel" onClick={() => handle(false)}>
                        Cancel
                    </button>
                    <button className="confirm-btn confirm-btn-confirm" onClick={() => handle(true)}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
