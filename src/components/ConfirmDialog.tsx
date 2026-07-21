import { useState, type CSSProperties } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requireText,
  destructive,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState("");

  if (!open) return null;

  const canConfirm = !requireText || typedText === requireText;

  return (
    <div style={overlayStyle} role="presentation" onClick={onCancel}>
      <div className="card" style={dialogStyle} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2 style={{ fontSize: "1.15rem" }}>{title}</h2>
        <p style={{ color: "var(--muted)" }}>{message}</p>

        {requireText ? (
          <input
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            placeholder={`Type ${requireText} to confirm`}
            className="soft-input"
            autoFocus
          />
        ) : null}

        <div style={{ display: "grid", gap: "8px" }}>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              setTypedText("");
              onConfirm();
            }}
            style={{
              ...confirmButtonStyle,
              ...(destructive ? destructiveButtonStyle : {}),
              opacity: canConfirm ? 1 : 0.5,
              cursor: canConfirm ? "pointer" : "not-allowed"
            }}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setTypedText("");
              onCancel();
            }}
            style={cancelButtonStyle}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(5, 7, 13, 0.55)",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  zIndex: 100
};

const dialogStyle: CSSProperties = {
  width: "100%",
  maxWidth: "360px",
  display: "grid",
  gap: "12px"
};

const confirmButtonStyle: CSSProperties = {
  borderRadius: "999px",
  border: "none",
  padding: "12px",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  fontWeight: 700
};

const destructiveButtonStyle: CSSProperties = {
  background: "#b3352f",
  color: "#ffffff"
};

const cancelButtonStyle: CSSProperties = {
  borderRadius: "999px",
  border: "1px solid var(--card-border)",
  padding: "12px",
  background: "transparent",
  color: "var(--fg)",
  fontWeight: 650
};
