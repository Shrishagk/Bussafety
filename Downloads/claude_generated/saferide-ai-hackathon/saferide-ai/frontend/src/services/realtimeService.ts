/**
 * SafeRide AI — Realtime Service
 * Connects to backend Socket.IO for live trip updates.
 * Falls back to polling every POLL_INTERVAL ms if Socket.IO fails.
 */
import { io, Socket } from "socket.io-client";
import { BASE_URL, ApiService, TripStatus, RiskScoreResponse } from "./api";

type RiskUpdateCallback = (data: RiskScoreResponse) => void;
type StatusCallback     = (data: TripStatus) => void;

const POLL_INTERVAL = 5000; // ms

class RealtimeService {
  private socket: Socket | null = null;
  private pollTimers: Record<string, NodeJS.Timeout> = {};
  private connected = false;

  /** Connect Socket.IO to backend */
  connect() {
    try {
      this.socket = io(BASE_URL, {
        transports:      ["websocket", "polling"],
        reconnection:    true,
        reconnectionDelay: 1000,
        timeout:         5000,
      });

      this.socket.on("connect", () => {
        this.connected = true;
        console.log("[realtime] Socket.IO connected:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        this.connected = false;
        console.log("[realtime] Socket.IO disconnected");
      });

      this.socket.on("connect_error", (err) => {
        console.warn("[realtime] Socket.IO error — using polling fallback:", err.message);
        this.connected = false;
      });
    } catch (err) {
      console.warn("[realtime] Socket.IO init failed:", err);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
    Object.values(this.pollTimers).forEach(clearInterval);
    this.pollTimers = {};
  }

  /**
   * Subscribe to live risk updates for a trip.
   * Uses Socket.IO if connected, else polls /api/trip_status.
   */
  subscribeTrip(
    tripId:          string,
    onRiskUpdate:    RiskUpdateCallback,
    onStatusUpdate?: StatusCallback,
  ) {
    if (this.socket && this.connected) {
      // Socket.IO path
      this.socket.emit("subscribe_trip", { trip_id: tripId });
      this.socket.on("risk_update", (data: RiskScoreResponse) => {
        if (data.trip_id === tripId) onRiskUpdate(data);
      });
    } else {
      // Polling fallback
      const timer = setInterval(async () => {
        try {
          const status = await ApiService.tripStatus(tripId);
          if (onStatusUpdate) onStatusUpdate(status);
          // Synthesise a RiskScoreResponse from trip status
          onRiskUpdate({
            trip_id:     tripId,
            risk_score:  status.risk_score,
            risk_level:  riskLevelFromScore(status.risk_score),
            reason_tags: status.risk_reason_tags,
            zone_name:   "—",
            timestamp:   status.last_gps.timestamp ?? new Date().toISOString(),
          });
        } catch (e) {
          console.warn("[realtime] poll error:", e);
        }
      }, POLL_INTERVAL);
      this.pollTimers[tripId] = timer;
    }
  }

  unsubscribeTrip(tripId: string) {
    if (this.pollTimers[tripId]) {
      clearInterval(this.pollTimers[tripId]);
      delete this.pollTimers[tripId];
    }
    this.socket?.off("risk_update");
  }
}

function riskLevelFromScore(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 0.3) return "low";
  if (score < 0.6) return "medium";
  if (score < 0.8) return "high";
  return "critical";
}

export const realtimeService = new RealtimeService();
export default realtimeService;
