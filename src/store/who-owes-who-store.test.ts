import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWhoOwesWhoStore } from "./who-owes-who-store";

describe("useWhoOwesWhoStore", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    useWhoOwesWhoStore.getState().clearAll();
  });

  it("initializes with empty IOUs array", () => {
    const { ious } = useWhoOwesWhoStore.getState();
    expect(ious).toEqual([]);
  });

  it("adds a new IOU with pending status and timestamp", () => {
    const store = useWhoOwesWhoStore.getState();
    const created = store.addIOU({
      personName: "Rohan",
      amount: 450,
      type: "lent",
      description: "Dinner split",
      dueDate: "2026-11-25",
    });

    expect(created.id).toBeDefined();
    expect(created.personName).toBe("Rohan");
    expect(created.amount).toBe(450);
    expect(created.type).toBe("lent");
    expect(created.status).toBe("pending");
    expect(created.createdAt).toBeDefined();

    const updatedList = useWhoOwesWhoStore.getState().ious;
    expect(updatedList.length).toBe(1);
    expect(updatedList[0].id).toBe(created.id);
  });

  it("settles and unsettles an IOU", () => {
    const store = useWhoOwesWhoStore.getState();
    const created = store.addIOU({
      personName: "Ananya",
      amount: 200,
      type: "borrowed",
      description: "Coffee & Prints",
    });

    store.settleIOU(created.id);
    let item = useWhoOwesWhoStore.getState().ious.find((i) => i.id === created.id);
    expect(item?.status).toBe("settled");
    expect(item?.settledAt).toBeDefined();

    store.unsettleIOU(created.id);
    item = useWhoOwesWhoStore.getState().ious.find((i) => i.id === created.id);
    expect(item?.status).toBe("pending");
    expect(item?.settledAt).toBeUndefined();
  });

  it("updates and deletes an IOU", () => {
    const store = useWhoOwesWhoStore.getState();
    const created = store.addIOU({
      personName: "Vikram",
      amount: 1000,
      type: "lent",
      description: "Concert tickets",
    });

    store.updateIOU(created.id, { amount: 1200, description: "Concert tickets + Uber" });
    let item = useWhoOwesWhoStore.getState().ious.find((i) => i.id === created.id);
    expect(item?.amount).toBe(1200);
    expect(item?.description).toBe("Concert tickets + Uber");

    store.deleteIOU(created.id);
    expect(useWhoOwesWhoStore.getState().ious.length).toBe(0);
  });
});
