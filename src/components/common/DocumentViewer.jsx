import React from 'react';
import './DocumentViewer.css';

const DocumentViewer = ({ document, onClose }) => {
    if (!document) return null;

    const isImage = document.mimeType?.startsWith('image/') ||
        document.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPDF = document.mimeType === 'application/pdf' ||
        document.fileName?.endsWith('.pdf');
    const isBase64 = document.fileUrl?.startsWith('data:');

    const renderContent = () => {
        if (isImage) {
            return (
                <img
                    src={document.fileUrl}
                    alt={document.fileName}
                    className="document-viewer-image"
                />
            );
        }

        if (isPDF) {
            if (isBase64) {
                // For base64 PDFs, create an iframe
                return (
                    <iframe
                        src={document.fileUrl}
                        title={document.fileName}
                        className="document-viewer-iframe"
                    />
                );
            } else {
                // For external PDF URLs, use iframe with direct link
                return (
                    <iframe
                        src={document.fileUrl}
                        title={document.fileName}
                        className="document-viewer-iframe"
                    />
                );
            }
        }

        // For other document types, show a message and download link
        return (
            <div className="document-viewer-unsupported">
                <div className="unsupported-icon">📄</div>
                <h3>Preview Not Available</h3>
                <p>This document type cannot be previewed directly.</p>
                <p><strong>File:</strong> {document.fileName}</p>
                <a
                    href={document.fileUrl}
                    download={document.fileName}
                    className="btn-download"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download Document
                </a>
            </div>
        );
    };

    return (
        <div className="document-viewer-overlay" onClick={onClose}>
            <div className="document-viewer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="document-viewer-header">
                    <div className="document-info">
                        <h3>{document.fileName}</h3>
                        <span className="document-type">{document.documentType}</span>
                    </div>
                    <button
                        className="document-viewer-close"
                        onClick={onClose}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="document-viewer-content">
                    {renderContent()}
                </div>
                <div className="document-viewer-footer">
                    <div className="document-metadata">
                        {document.fileSize && (
                            <span>Size: {(document.fileSize / 1024).toFixed(2)} KB</span>
                        )}
                        {document.uploadedAt && (
                            <span>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</span>
                        )}
                        {document.verified !== undefined && (
                            <span className={`verification-badge ${document.verified ? 'verified' : 'unverified'}`}>
                                {document.verified ? '✓ Verified' : '⏳ Pending Verification'}
                            </span>
                        )}
                    </div>
                    <div className="document-actions">
                        <a
                            href={document.fileUrl}
                            download={document.fileName}
                            className="btn-download-small"
                        >
                            ⬇ Download
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
