import { useState } from "react";

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState<() => void>(() => {});

  const ask = (callback: () => void) => {
    setOpen(true);
    setOnConfirm(() => callback);
  };

  const confirm = () => {
    onConfirm();
    setOpen(false);
  };

  const cancel = () => setOpen(false);

  return { open, ask, confirm, cancel };
}
