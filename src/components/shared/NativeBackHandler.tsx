"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { toast } from "sonner";
import { soundFX } from "@/components/shared/SoundFX";
import { resolveBackAction, type BackAction } from "@/lib/page-flow/page-flow-resolver";
export { resolveBackAction, type BackAction };

export function NativeBackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPressRef = useRef<number>(0);
  const pathnameRef = useRef<string>(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backListenerHandle: { remove: () => Promise<void> } | null = null;

    const setupListener = async () => {
      try {
        const handle = await App.addListener("backButton", () => {
          const openModalCloseBtn = document.querySelector<HTMLElement>(
            '[role="dialog"][data-state="open"] button[aria-label="Close"], ' +
            '[role="dialog"][data-state="open"] [data-radix-dialog-close], ' +
            '[role="alertdialog"][data-state="open"] button, ' +
            '[aria-modal="true"][data-state="open"] button[aria-label="Close"]'
          );

          const anyOpenModal = document.querySelector(
            '[role="dialog"][data-state="open"], [aria-modal="true"][data-state="open"]'
          );
          const hasOpenModal = Boolean(openModalCloseBtn || anyOpenModal);

          const action = resolveBackAction(
            pathnameRef.current,
            hasOpenModal,
            lastBackPressRef.current
          );

          switch (action.type) {
            case "close_modal":
              soundFX.playPop();
              if (openModalCloseBtn) {
                openModalCloseBtn.click();
              } else {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
              }
              break;
            case "navigate_back":
              soundFX.playPop();
              router.back();
              break;
            case "navigate_today":
              soundFX.playPop();
              router.push("/today");
              break;
            case "exit_app":
              App.exitApp();
              break;
            case "show_exit_toast":
              lastBackPressRef.current = Date.now();
              soundFX.vibrate(20);
              toast("Press back again to exit Invictus", {
                duration: 2000,
                description: "Tap back within 2 seconds to close the app",
              });
              break;
          }
        });

        backListenerHandle = handle;
      } catch (err) {
        console.warn("[NativeBackHandler] Failed to register backButton listener:", err);
      }
    };

    setupListener();

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove().catch(() => {});
      }
    };
  }, [router]);

  return null;
}
