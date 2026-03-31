import { Modal, Drawer } from "antd";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { useDeviceType } from "../../hooks/useDeviceType";
import type { ReactNode } from "react";

interface FormModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  mobileHeight?: string;
}

export default function FormModal({
  open,
  title,
  onClose,
  children,
  mobileHeight = "100dvh",
}: FormModalProps) {
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <Drawer
        open={open}
        title={title}
        placement="bottom"
        height={mobileHeight}
        onClose={onClose}
        destroyOnClose
        styles={{
          wrapper: {
            paddingBottom: "env(safe-area-inset-bottom)",
          },
          body: {
            padding: sizes.cardPadding,
            overflowY: "auto",
            paddingBottom: 32,
          },
        }}
      >
        {children}
      </Drawer>
    );
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={sizes.modalWidth}
      style={sizes.modalFullscreen ? { top: 0 } : undefined}
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