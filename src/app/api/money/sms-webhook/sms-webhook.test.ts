import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("SMS Webhook & Ambient Micro-Dialog Cloud Ingestion Engine", () => {
  it("processes direct ambient micro-dialog quick-log payloads for guest accounts", async () => {
    const payload = {
      userId: "guest-user",
      amount: 40,
      type: "expense",
      merchant: "Metro",
      category: "Travel",
      rawSender: "AmbientMicroDialog",
      dedupSignature: "ambient_test_sig_123",
      date: "2026-11-19",
    };

    const req = new Request("http://localhost:3000/api/money/sms-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.isGuest).toBe(true);
    expect(json.transaction.amount).toBe(40);
    expect(json.transaction.merchant).toBe("Metro");
  });

  it("rejects invalid amounts in direct ambient quick-log payloads", async () => {
    const payload = {
      userId: "guest-user",
      amount: -10,
      rawSender: "AmbientMicroDialog",
    };

    const req = new Request("http://localhost:3000/api/money/sms-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid quick-log amount");
  });

  it("rejects payloads with no text and no ambient quick-log data", async () => {
    const req = new Request("http://localhost:3000/api/money/sms-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("SMS text payload is required");
  });
});
