"use client";

export interface DiagnosticLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "system";
  tag: string;
  message: string;
  details?: any;
}

class DiagnosticLoggerService {
  private static instance: DiagnosticLoggerService;
  private readonly maxEntries = 40;
  private buffer: DiagnosticLogEntry[] = [];
  private listeners: Set<(entries: DiagnosticLogEntry[]) => void> = new Set();

  private constructor() {
    if (typeof window !== "undefined") {
      this.log("system", "BOOT", "Diagnostic logger initialized");
      this.hookGlobalErrors();
    }
  }

  public static getInstance(): DiagnosticLoggerService {
    if (!DiagnosticLoggerService.instance) {
      DiagnosticLoggerService.instance = new DiagnosticLoggerService();
    }
    return DiagnosticLoggerService.instance;
  }

  private hookGlobalErrors() {
    window.addEventListener("error", (event) => {
      this.log("error", "UNCAUGHT_EXCEPTION", event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.log("error", "UNHANDLED_REJECTION", String(event.reason));
    });
  }

  public log(
    level: "info" | "warn" | "error" | "system",
    tag: string,
    message: string,
    details?: any
  ) {
    const entry: DiagnosticLogEntry = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      tag: tag.toUpperCase(),
      message,
      details,
    };

    this.buffer.unshift(entry);
    if (this.buffer.length > this.maxEntries) {
      this.buffer.pop();
    }

    this.notifyListeners();
  }

  public getEntries(): DiagnosticLogEntry[] {
    return [...this.buffer];
  }

  public clear() {
    this.buffer = [];
    this.notifyListeners();
  }

  public subscribe(listener: (entries: DiagnosticLogEntry[]) => void) {
    this.listeners.add(listener);
    listener([...this.buffer]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l([...this.buffer]));
  }

  public exportDiagnosticPackage(): string {
    const pkg = {
      exportedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "SSR",
      onlineStatus: typeof navigator !== "undefined" ? navigator.onLine : true,
      screenResolution:
        typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A",
      logEntries: this.buffer,
    };
    return JSON.stringify(pkg, null, 2);
  }
}

export const diagnosticLogger = DiagnosticLoggerService.getInstance();
