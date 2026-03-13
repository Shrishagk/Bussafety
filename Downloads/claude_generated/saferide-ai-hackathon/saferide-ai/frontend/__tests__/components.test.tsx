/**
 * SafeRide AI — Frontend Unit Tests
 * Run: cd frontend && npm test
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { RiskBadge } from "../src/components/RiskBadge";
import { AlertBanner, AlertModal, ExplainableAIPanel } from "../src/components/AlertComponents";
import { riskLabel, riskColor, riskEmoji, tokens } from "../src/theme/tokens";

// ─── Token helpers ────────────────────────────────────────────────────────────
describe("riskLabel()", () => {
  it("maps 0.1 → low",      () => expect(riskLabel(0.10)).toBe("low"));
  it("maps 0.4 → medium",   () => expect(riskLabel(0.40)).toBe("medium"));
  it("maps 0.7 → high",     () => expect(riskLabel(0.70)).toBe("high"));
  it("maps 0.9 → critical", () => expect(riskLabel(0.90)).toBe("critical"));
  it("boundary 0.3 → medium",() => expect(riskLabel(0.30)).toBe("medium"));
  it("boundary 0.6 → high",  () => expect(riskLabel(0.60)).toBe("high"));
  it("boundary 0.8 → critical",() => expect(riskLabel(0.80)).toBe("critical"));
});

describe("riskColor()", () => {
  it("low → green",     () => expect(riskColor("low")).toBe(tokens.colors.riskLow));
  it("critical → red",  () => expect(riskColor("critical")).toBe(tokens.colors.riskCritical));
});

describe("riskEmoji()", () => {
  it("low → 🟢",     () => expect(riskEmoji("low")).toBe("🟢"));
  it("critical → 🔴",() => expect(riskEmoji("critical")).toBe("🔴"));
});

// ─── RiskBadge ────────────────────────────────────────────────────────────────
describe("<RiskBadge />", () => {
  it("renders LOW for score 0.1", () => {
    const { getByText } = render(<RiskBadge score={0.1} />);
    expect(getByText("LOW")).toBeTruthy();
  });

  it("renders MEDIUM for score 0.45", () => {
    const { getByText } = render(<RiskBadge score={0.45} />);
    expect(getByText("MEDIUM")).toBeTruthy();
  });

  it("renders HIGH for score 0.72", () => {
    const { getByText } = render(<RiskBadge score={0.72} />);
    expect(getByText("HIGH")).toBeTruthy();
  });

  it("renders CRITICAL for score 0.92", () => {
    const { getByText } = render(<RiskBadge score={0.92} />);
    expect(getByText("CRITICAL")).toBeTruthy();
  });

  it("shows score when showScore=true", () => {
    const { getByText } = render(<RiskBadge score={0.72} showScore />);
    // Score is shown as (72)
    expect(getByText(/(72)/)).toBeTruthy();
  });

  it("renders sm / lg sizes without crash", () => {
    expect(() => render(<RiskBadge score={0.5} size="sm" />)).not.toThrow();
    expect(() => render(<RiskBadge score={0.5} size="lg" />)).not.toThrow();
  });
});

// ─── AlertBanner ─────────────────────────────────────────────────────────────
describe("<AlertBanner />", () => {
  it("renders when visible=true", () => {
    const { getByText } = render(
      <AlertBanner level="high" message="Test alert" visible onDismiss={jest.fn()} />
    );
    expect(getByText("Test alert")).toBeTruthy();
  });

  it("does NOT render when visible=false", () => {
    const { queryByText } = render(
      <AlertBanner level="high" message="Hidden" visible={false} />
    );
    expect(queryByText("Hidden")).toBeNull();
  });

  it("calls onDismiss when ✕ pressed", () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <AlertBanner level="high" message="Alert" visible onDismiss={onDismiss} />
    );
    fireEvent.press(getByText("✕"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

// ─── AlertModal ──────────────────────────────────────────────────────────────
describe("<AlertModal />", () => {
  const baseProps = {
    visible:   true,
    level:     "critical" as const,
    title:     "CRITICAL ZONE",
    message:   "High danger ahead",
    tags:      ["high_risk_zone", "speeding"],
    zoneName:  "Silk Board Junction",
    onDismiss: jest.fn(),
  };

  it("renders title and message", () => {
    const { getByText } = render(<AlertModal {...baseProps} />);
    expect(getByText("CRITICAL ZONE")).toBeTruthy();
    expect(getByText("High danger ahead")).toBeTruthy();
  });

  it("renders zone name", () => {
    const { getByText } = render(<AlertModal {...baseProps} />);
    expect(getByText("Silk Board Junction")).toBeTruthy();
  });

  it("renders tags as pills", () => {
    const { getByText } = render(<AlertModal {...baseProps} />);
    expect(getByText("high risk zone")).toBeTruthy();
    expect(getByText("speeding")).toBeTruthy();
  });

  it("calls onDismiss when Dismiss pressed", () => {
    const onDismiss = jest.fn();
    const { getByText } = render(<AlertModal {...baseProps} onDismiss={onDismiss} />);
    fireEvent.press(getByText("Dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders SOS button when onSOS provided", () => {
    const { getByText } = render(<AlertModal {...baseProps} onSOS={jest.fn()} />);
    expect(getByText(/SOS/)).toBeTruthy();
  });

  it("does not render when visible=false", () => {
    const { queryByText } = render(<AlertModal {...baseProps} visible={false} />);
    expect(queryByText("CRITICAL ZONE")).toBeNull();
  });
});

// ─── ExplainableAIPanel ───────────────────────────────────────────────────────
describe("<ExplainableAIPanel />", () => {
  it("shows collapsed initially", () => {
    const { getByText, queryByText } = render(
      <ExplainableAIPanel riskScore={0.6} tags={["speeding"]} zoneName="Hebbal" />
    );
    expect(getByText("🤖  AI Explanation")).toBeTruthy();
    // Body hidden — Risk score text inside body not visible before expand
  });

  it("expands on press", () => {
    const { getByText } = render(
      <ExplainableAIPanel riskScore={0.6} tags={["high_risk_zone"]} zoneName="Silk Board" />
    );
    const header = getByText("🤖  AI Explanation");
    act(() => { fireEvent.press(header); });
    // After expand, factor labels visible
    expect(getByText("Zone risk")).toBeTruthy();
  });
});

// ─── API Service (mocked) ─────────────────────────────────────────────────────
jest.mock("../src/services/api", () => ({
  __esModule: true,
  BASE_URL: "http://localhost:5000",
  ApiService: {
    startTrip:     jest.fn().mockResolvedValue({ trip_id: "TRIP-MOCK", status: "active", started_at: "2026-03-13T00:00:00Z" }),
    tripStatus:    jest.fn().mockResolvedValue({ trip_id: "TRIP-MOCK", risk_score: 0.2, risk_reason_tags: [], status: "active", last_gps: {}, events: [], gps_trail: [], mode: "bus", vehicle_id: "BUS_X", started_at: "", ended_at: null, user_id: "u1" }),
    verifyBus:     jest.fn().mockResolvedValue({ verified: true, bus: { bus_id: "BUS_45A_01", number_plate: "KA01AB1234", route: "45A", driver_name: "Test Driver", status: "in_transit", next_stop: "Majestic", last_lat: 12.97, last_lng: 77.59, gps_device_id: "GPS1", speed_kmh: 30, capacity: 60, current_occupancy: 20, vehicle_age_years: 2, last_maintenance: "2026-01-01", last_seen: "2026-03-13T00:00:00Z" }}),
    endTrip:       jest.fn().mockResolvedValue({ status: "completed" }),
    pushRiskScore: jest.fn().mockResolvedValue({ trip_id: "TRIP-MOCK", risk_score: 0.55, risk_level: "medium", reason_tags: [], zone_name: "normal_area", timestamp: "2026-03-13T00:00:00Z" }),
  },
  default: { startTrip: jest.fn(), tripStatus: jest.fn(), verifyBus: jest.fn() },
}));

describe("ApiService mock", () => {
  const { ApiService } = require("../src/services/api");

  it("startTrip returns trip_id", async () => {
    const res = await ApiService.startTrip({ user_id: "u1", mode: "bus", vehicle_id: "BUS_X" });
    expect(res.trip_id).toBe("TRIP-MOCK");
  });

  it("verifyBus returns verified=true", async () => {
    const res = await ApiService.verifyBus("KA01AB1234");
    expect(res.verified).toBe(true);
    expect(res.bus.route).toBe("45A");
  });

  it("pushRiskScore returns risk_level", async () => {
    const res = await ApiService.pushRiskScore("TRIP-MOCK", 12.97, 77.59, 30);
    expect(res.risk_level).toBe("medium");
    expect(res.risk_score).toBeCloseTo(0.55);
  });
});
