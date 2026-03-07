import { Modal } from "antd";

interface ConfirmModalProps {
  title: string;
  content: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmModal({
  title,
  content,
  okText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
}: ConfirmModalProps) {
  Modal.confirm({
    title,
    content,
    okText,
    cancelText,
    okType: danger ? "danger" : "primary",
    onOk: onConfirm,
  });

  return null;
}