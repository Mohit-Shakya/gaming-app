/**
 * Reusable Modal Component
 * Eliminates repetitive overlay and positioning code across the codebase.
 */
import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string | number;
    className?: string;
    closeOnBackdropClick?: boolean;
    zIndex?: number;
}

export function Modal({
    isOpen,
    onClose,
    children,
    maxWidth = 600,
    className = '',
    closeOnBackdropClick = true,
    zIndex = 1000,
}: ModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
        >
            {/* Backdrop */}
            <div
                onClick={closeOnBackdropClick ? onClose : undefined}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Modal Content */}
            <div
                className={className}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(10, 15, 30, 0.98))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 16,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
            >
                {children}
            </div>
        </div>
    );
}

export default Modal;
