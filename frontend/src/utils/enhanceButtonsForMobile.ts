import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";

interface EnhanceOptions {
  isMobile: boolean;
  buttonSize?: "small" | "middle" | "large";
  fullWidth?: boolean;
}

export function enhanceButtonsForMobile(
  actions: ReactNode,
  {
    isMobile,
    buttonSize,
  }: EnhanceOptions
) {
  if (!isMobile) return actions;

  return Children.map(actions, (child) => {
    if (!isValidElement(child)) return child;

    const element = child as ReactElement<{
      style?: React.CSSProperties;
      block?: boolean;
      size?: any;
    }>;

    return cloneElement(element, {
      block: true,
      size: buttonSize || "large",
      style: {
        ...(element.props.style || {}),
        width: "100%",
        minHeight: 48,
      },
    });
  });
}