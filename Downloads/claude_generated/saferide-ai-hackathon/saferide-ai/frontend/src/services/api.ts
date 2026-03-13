/**
 * SafeRide AI — API Service
 * All HTTP calls to the Flask backend.
 * Base URL is set via env; fallback to localhost for dev.
 */
import axios from "axios";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
    // Placeholder auth header — replace with real token in prod
    "X-SafeRide-Token": "{{SAFERIDE_API_TOKEN}}",
  },
});

// ─── Types ──────────────────────────────────────────────────────────────────
export interface TripStartPayload {
  user_id:    string;
  mode:       "bus" | "cab";
  vehicle_id: string;
}

export interface TripStartResponse {
  trip_id:    string;
  status:     string;
  started_at: string;
}

export interface TripStatus {
  trip_id:          string;
  user_id:          string;
  mode:             "bus" | "cab";
  vehicle_id:       string;
  status:           "active" | "completed";
  started_at:       string;
  ended_at:         string | null;
  last_gps:         { lat: number; lng: number; timestamp: string };
  risk_score:       number;
  risk_reason_tags: string[];
  events:           TripEvent[];
  gps_trail:        { lat: number; lng: number; timestamp: string }[];
}

export interface TripEvent {
  type:      string;
  message:   string;
  timestamp: string;
  lat:       number;
  lng:       number;
  tags:      string[];
  trip_id?:  string;
}

export interface RiskScoreResponse {
  trip_id:     string;
  risk_score:  number;
  risk_level:  "low" | "medium" | "high" | "critical";
  reason_tags: string[];
  zone_name:   string;
  timestamp:   string;
}

export interface BusRecord {
  bus_id:            string;
  number_plate:      string;
  route:             string;
  driver_name:       string;
  gps_device_id:     string;
  last_lat:          number;
  last_lng:          number;
  last_seen:         string;
  status:            string;
  next_stop:         string;
  speed_kmh:         number;
  capacity:          number;
  current_occupancy: number;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────
export const ApiService = {
  /** Start a new trip session */
  startTrip: async (payload: TripStartPayload): Promise<TripStartResponse> => {
    const { data } = await api.post<TripStartResponse>("/api/start_trip", payload);
    return data;
  },

  /** Poll current trip state */
  tripStatus: async (tripId: string): Promise<TripStatus> => {
    const { data } = await api.get<TripStatus>("/api/trip_status", { params: { trip_id: tripId } });
    return data;
  },

  /** End a trip */
  endTrip: async (tripId: string) => {
    const { data } = await api.post("/api/end_trip", { trip_id: tripId });
    return data;
  },

  /** Verify bus by number plate */
  verifyBus: async (numberPlate: string): Promise<{ verified: boolean; bus?: BusRecord; message?: string }> => {
    const { data } = await api.post("/api/verify_bus", { number_plate: numberPlate });
    return data;
  },

  /** Push a GPS ping and receive risk score */
  pushRiskScore: async (tripId: string, lat: number, lng: number, speed: number): Promise<RiskScoreResponse> => {
    const { data } = await api.post<RiskScoreResponse>("/api/risk_score", {
      trip_id: tripId, lat, lng, speed,
      timestamp: new Date().toISOString(),
    });
    return data;
  },

  /** OCR plate stub */
  ocrPlate: async (imageB64: string) => {
    const { data } = await api.post("/api/ocr_plate", { image_b64: imageB64 });
    return data;
  },

  /** Dashboard summary */
  dashboardSummary: async () => {
    const { data } = await api.get("/api/dashboard/summary");
    return data;
  },

  /** Dashboard active trips */
  activeTrips: async () => {
    const { data } = await api.get("/api/active_trips");
    return data;
  },

  /** Heatmap data */
  heatmap: async () => {
    const { data } = await api.get("/api/dashboard/heatmap");
    return data;
  },
};

export default ApiService;
