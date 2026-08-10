import { toast } from "sonner";
import { useUIStore } from "@/store/ui-store";

export interface ToastOptions {
  description?: string;
  duration?: number;
  playfulMsg?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const showToast = {
  success: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 3500;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    toast.success(finalTitle, {
      description,
      duration,
      action,
    });
  },

  error: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 4500;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    toast.error(finalTitle, {
      description,
      duration,
      action,
    });
  },

  info: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 3500;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    toast.info(finalTitle, {
      description,
      duration,
      action,
    });
  },

  warning: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 4000;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    toast.warning(finalTitle, {
      description,
      duration,
      action,
    });
  },
};
