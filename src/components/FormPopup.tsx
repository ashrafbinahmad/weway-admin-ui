import { X } from "lucide-react";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

interface FormPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
          errorDetails?: { instancePath?: string; message: string }[];
        }

        export function FormPopup({
          isOpen,
          onClose,
          title,
          onSubmit,
          children,
          submitLabel = "Save",
          cancelLabel = "Cancel",
          submitDisabled = false,
          errorDetails,
        }: FormPopupProps) {
          useEffect(() => {
            if (!isOpen) return;

            const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === "Escape") {
                onClose();
              }
            };

            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
          }, [isOpen, onClose]);

          if (!isOpen) return null;

          const mainContent = document.querySelector(".main-content");
          if (!mainContent) return null;

          return ReactDOM.createPortal(
            <div
              onClick={onClose}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "var(--bg-panel)",
                  padding: "24px",
                  borderRadius: "var(--radius)",
                  width: "100%",
                  maxWidth: "500px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-lg)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{title}</h2>
                  <button
                    onClick={onClose}
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form
                  onSubmit={onSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  {errorDetails && errorDetails.length > 0 && (
                    <div style={{ background: "rgba(255, 0, 0, 0.1)", borderLeft: "4px solid var(--danger)", padding: "12px", borderRadius: "4px", color: "var(--danger)", fontSize: "0.875rem" }}>
                      <div style={{ fontWeight: 600, marginBottom: "8px" }}>Please fix the following errors:</div>
                      <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {errorDetails.map((err, i) => (
                          <li key={i}>
                            {err.instancePath ? <strong>{err.instancePath.replace("/", "")}: </strong> : null}
                            {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {children}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ background: "var(--bg-hover)", color: "white" }}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitDisabled}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    mainContent
  );
}
