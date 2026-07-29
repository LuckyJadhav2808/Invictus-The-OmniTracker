import { toast } from "sonner";
import { useUIStore } from "@/store/ui-store";

export const showToast = {
  success: (msg: string, playfulMsg?: string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    toast.success(isPlayful && playfulMsg ? playfulMsg : msg);
  },
  error: (msg: string, playfulMsg?: string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    toast.error(isPlayful && playfulMsg ? playfulMsg : msg);
  },
};
