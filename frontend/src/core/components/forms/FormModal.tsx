import { Modal } from "antd";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import type { ReactNode } from "react";

interface FormModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function FormModal({
  open,
  title,
  onClose,
  children,
}: FormModalProps) {
  const sizes = useResponsiveSizes();
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={sizes.modalWidth}
      style={sizes.modalFullscreen ? { top: 0} : undefined}
      bodyStyle={
        sizes.modalFullscreen
          ? { height: "100vh", padding: sizes.cardPadding }
          : { padding: sizes.cardPadding }
      }
    >
      {children}
    </Modal>
  );
}