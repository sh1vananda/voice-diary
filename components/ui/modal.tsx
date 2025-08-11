import { ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
}

export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="claude-modal-overlay" onClick={onClose}>
      <div className="claude-modal fade-in" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div>{children}</div>
        {actions && <div className="claude-modal-buttons">{actions}</div>}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "default"
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default"
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button onClick={onClose} className="claude-button claude-button-secondary">
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm} 
            className={`claude-button ${variant === "danger" ? "claude-button-danger" : "claude-button-primary"}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}