import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type IOUType = "lent" | "borrowed"; // lent: "They owe me", borrowed: "I owe them"
export type IOUStatus = "pending" | "settled";

export interface IOU {
  id: string;
  personName: string;
  amount: number;
  type: IOUType;
  description: string;
  dueDate?: string;
  status: IOUStatus;
  createdAt: string;
  settledAt?: string;
  linkedTransactionId?: string;
}

export interface WhoOwesWhoState {
  ious: IOU[];
  addIOU: (iou: Omit<IOU, "id" | "createdAt" | "status">) => IOU;
  settleIOU: (id: string) => void;
  unsettleIOU: (id: string) => void;
  deleteIOU: (id: string) => void;
  updateIOU: (id: string, updates: Partial<Omit<IOU, "id" | "createdAt">>) => void;
  clearAll: () => void;
}

export const useWhoOwesWhoStore = create<WhoOwesWhoState>()(
  persist(
    (set) => ({
      ious: [],

      addIOU: (iouData) => {
        const newIOU: IOU = {
          ...iouData,
          id: `iou_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          ious: [newIOU, ...state.ious],
        }));

        return newIOU;
      },

      settleIOU: (id) => {
        set((state) => ({
          ious: state.ious.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "settled",
                  settledAt: new Date().toISOString(),
                }
              : item
          ),
        }));
      },

      unsettleIOU: (id) => {
        set((state) => ({
          ious: state.ious.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "pending",
                  settledAt: undefined,
                }
              : item
          ),
        }));
      },

      deleteIOU: (id) => {
        set((state) => ({
          ious: state.ious.filter((item) => item.id !== id),
        }));
      },

      updateIOU: (id, updates) => {
        set((state) => ({
          ious: state.ious.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      clearAll: () => {
        set({ ious: [] });
      },
    }),
    {
      name: "invictus_who_owes_who_store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
