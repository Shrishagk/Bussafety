/**
 * SafeRide AI — Bus Flow Screens
 * BusRouteSearchScreen → BusNearbyScreen → BusVerifyScreen → BusTripMonitorScreen
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView, Alert,
} from "react-native";
import MapView, { Marker, Polyline, Circle } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import ApiService, { BusRecord } from "@/services/api";
import realtimeService from "@/services/realtimeService";
import { RiskBadge } from "@/components/RiskBadge";
import { AlertBanner, AlertModal, ExplainableAIPanel } from "@/components/AlertComponents";
import { tokens, riskLabel, riskColor } from "@/theme/tokens";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ROUTE SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
export function BusRouteSearchScreen() {
  const nav   = useNavigation<any>();
  const [query, setQuery] = useState("");

  const POPULAR = ["45A", "500C", "500D", "201", "365", "10A", "218"];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.heading}>🔍 Search Bus Route</Text>

        <TextInput
          style={s.input}
          placeholder="Enter route number or stop name…"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => nav.navigate("BusNearby", { route: query })}
        />

        <Text style={s.sectionTitle}>Popular Routes</Text>
        <View style={s.chipRow}>
          {POPULAR.map(r => (
            <TouchableOpacity
              key={r}
              style={s.chip}
              onPress={() => nav.navigate("BusNearby", { route: r })}
            >
              <Text style={s.chipText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.scanBtn} onPress={() => nav.navigate("BusVerify", {})}>
          <Text style={s.scanBtnText}>📷  Scan Bus Number Plate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. NEARBY BUS LIST
// ═══════════════════════════════════════════════════════════════════════════════
export function BusNearbyScreen() {
  const nav              = useNavigation<any>();
  const route            = useRoute<any>();
  const routeFilter      = route.params?.route ?? "";
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In prod: fetch from /api/buses?route=... — mocked here via fleet_db via backend
    // Simulated fetch with timeout
    setTimeout(() => {
      ApiService.activeTrips().then(data => {
        // Fall through to mock data if no active trips
      }).catch(() => {});

      // Use mock buses (in a real app, GET /api/buses?route=X)
      import("../../data/fleet_db_mock").catch(() => null);

      // Generate plausible mock list from known routes
      const mockBuses: BusRecord[] = Array.from({ length: 6 }, (_, i) => ({
        bus_id:            `BUS_${routeFilter || "45A"}_${i + 1:02}`.replace(/:02/g, ""),
        number_plate:      `KA${(i + 1).toString().padStart(2,"0")}AB${1000 + i * 111}`,
        route:             routeFilter || "45A",
        driver_name:       ["Ramesh Kumar","Suresh Gowda","Mahesh Naik","Rajesh Reddy","Dinesh Rao","Ganesh Murthy"][i],
        gps_device_id:     `GPS${1000 + i}`,
        last_lat:          12.97 + i * 0.004,
        last_lng:          77.59 + i * 0.003,
        last_seen:         new Date().toISOString(),
        status:            i < 4 ? "in_transit" : i === 4 ? "at_stop" : "delayed",
        next_stop:         ["Majestic","Shivajinagar","KR Market","Hebbal","MG Road","Koramangala"][i],
        speed_kmh:         [35, 42, 0, 28, 0, 15][i],
        capacity:          60,
        current_occupancy: 20 + i * 7,
        vehicle_age_years: 3,
        last_maintenance:  "2026-01-15",
      }));
      setBuses(mockBuses);
      setLoading(false);
    }, 800);
  }, [routeFilter]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={tokens.colors.primary} />;

  return (
    <SafeAreaView style={s.safe}>
      <Text style={[s.heading, { padding: tokens.spacing.md }]}>
        🚌 Route {routeFilter || "All"} — {buses.length} buses nearby
      </Text>
      <FlatList
        data={buses}
        keyExtractor={b => b.bus_id}
        contentContainerStyle={{ padding: tokens.spacing.md }}
        renderItem={({ item: bus }) => (
          <TouchableOpacity
            style={[s.busCard, tokens.shadows.sm]}
            onPress={() => nav.navigate("BusVerify", { bus })}
          >
            <View style={s.busCardRow}>
              <Text style={s.busRoute}>🚌 {bus.route}</Text>
              <View style={[s.statusPill, { backgroundColor: statusColor(bus.status) }]}>
                <Text style={s.statusText}>{bus.status.replace("_"," ")}</Text>
              </View>
            </View>
            <Text style={s.busPlate}>🔢 {bus.number_plate}</Text>
            <Text style={s.busDriver}>👤 {bus.driver_name}</Text>
            <Text style={s.busStop}>📍 Next: {bus.next_stop}</Text>
            <View style={s.busFooter}>
              <Text style={s.busOcc}>👥 {bus.current_occupancy}/{bus.capacity}</Text>
              <Text style={s.busSpeed}>⚡ {bus.speed_kmh} km/h</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function statusColor(status: string) {
  return { in_transit: "#0E9F6E", at_stop: "#1A56DB", idle: "#9CA3AF", delayed: "#E3702E" }[status] ?? "#9CA3AF";
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. BUS VERIFY
// ═══════════════════════════════════════════════════════════════════════════════
export function BusVerifyScreen() {
  const nav    = useNavigation<any>();
  const route  = useRoute<any>();
  const preloaded: BusRecord | undefined = route.params?.bus;

  const [plate, setPlate]   = useState(preloaded?.number_plate ?? "");
  const [result, setResult] = useState<BusRecord | null>(preloaded ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const verify = async () => {
    if (!plate.trim()) return;
    setLoading(true); setError("");
    try {
      const resp = await ApiService.verifyBus(plate.trim().toUpperCase());
      if (resp.verified && resp.bus) setResult(resp.bus);
      else setError("Bus not found in BMTC fleet. Verify plate manually.");
    } catch {
      setError("Network error — check backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.heading}>🔍 Verify Bus</Text>

        <TextInput
          style={s.input}
          placeholder="Enter plate e.g. KA01AB1234"
          value={plate}
          onChangeText={setPlate}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={s.primaryBtn} onPress={verify} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.primaryBtnText}>✅  Verify Plate</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={s.outlineBtn} onPress={() => nav.navigate("BusNearby", {})}>
          <Text style={s.outlineBtnText}>📷  Use Camera (OCR)</Text>
        </TouchableOpacity>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {result && (
          <View style={[s.resultCard, tokens.shadows.md]}>
            <View style={s.verifiedBadge}><Text style={s.verifiedText}>✅ VERIFIED</Text></View>
            <Text style={s.resultTitle}>{result.bus_id}</Text>
            <InfoRow label="Plate"   value={result.number_plate} />
            <InfoRow label="Route"   value={result.route} />
            <InfoRow label="Driver"  value={result.driver_name} />
            <InfoRow label="Status"  value={result.status} />
            <InfoRow label="Next Stop" value={result.next_stop} />
            <TouchableOpacity
              style={[s.primaryBtn, { marginTop: tokens.spacing.md }]}
              onPress={() => nav.navigate("BusTripMonitor", { bus: result, userId: "demo_user" })}
            >
              <Text style={s.primaryBtnText}>🛡️  Start Safe Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value}</Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BUS TRIP MONITOR
// ═══════════════════════════════════════════════════════════════════════════════
export function BusTripMonitorScreen() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const { bus, userId = "demo_user" } = route.params ?? {};

  const [tripId, setTripId]     = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState(0.1);
  const [riskLevel, setRiskLevel] = useState<any>("low");
  const [tags, setTags]          = useState<string[]>([]);
  const [zoneName, setZoneName]  = useState("—");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg]  = useState("");
  const [busLoc, setBusLoc]      = useState({
    latitude:  bus?.last_lat  ?? 12.9716,
    longitude: bus?.last_lng  ?? 77.5946,
  });
  const [trail, setTrail]        = useState<{latitude:number;longitude:number}[]>([]);
  const mapRef = useRef<MapView>(null);

  // Start trip on mount
  useEffect(() => {
    ApiService.startTrip({ user_id: userId, mode: "bus", vehicle_id: bus?.bus_id ?? "BUS_DEMO" })
      .then(resp => {
        setTripId(resp.trip_id);
        realtimeService.connect();
        realtimeService.subscribeTrip(resp.trip_id, update => {
          setRiskScore(update.risk_score);
          setRiskLevel(update.risk_level);
          setTags(update.reason_tags ?? []);
          setZoneName(update.zone_name ?? "—");
          if (update.risk_level === "high" || update.risk_level === "critical") {
            setAlertMsg(`${update.risk_level.toUpperCase()} risk near ${update.zone_name}`);
            setShowAlert(true);
          }
        });
      })
      .catch(e => console.warn("start_trip failed:", e));

    return () => { if (tripId) realtimeService.unsubscribeTrip(tripId); };
  }, []);

  // Simulate bus movement (debug only)
  const simulateStep = async () => {
    if (!tripId) return;
    const newLat = busLoc.latitude  + (Math.random() - 0.5) * 0.002;
    const newLng = busLoc.longitude + (Math.random() - 0.5) * 0.002;
    setBusLoc({ latitude: newLat, longitude: newLng });
    setTrail(t => [...t, { latitude: newLat, longitude: newLng }]);
    const res = await ApiService.pushRiskScore(tripId, newLat, newLng, 35);
    setRiskScore(res.risk_score);
    setRiskLevel(res.risk_level);
    setTags(res.reason_tags);
    setZoneName(res.zone_name);
    mapRef.current?.animateToRegion({ latitude: newLat, longitude: newLng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
  };

  const endTrip = async () => {
    if (tripId) await ApiService.endTrip(tripId);
    nav.goBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Alert banner */}
      <AlertBanner
        level={riskLevel}
        message={alertMsg}
        visible={showAlert && (riskLevel === "high" || riskLevel === "critical")}
        onDismiss={() => setShowAlert(false)}
      />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={{ latitude: busLoc.latitude, longitude: busLoc.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        {/* Bus marker */}
        <Marker coordinate={busLoc} title={bus?.bus_id ?? "Bus"} description={`Route ${bus?.route}`}>
          <View style={[s.busMarker, { borderColor: riskColor(riskLevel) }]}>
            <Text style={s.busMarkerText}>🚌</Text>
          </View>
        </Marker>

        {/* GPS trail */}
        {trail.length > 1 && (
          <Polyline coordinates={trail} strokeColor={tokens.colors.primary} strokeWidth={3} />
        )}

        {/* High-risk zone circles (mocked) */}
        {HIGH_RISK_ZONES.map(z => (
          <Circle
            key={z.name}
            center={{ latitude: z.lat, longitude: z.lng }}
            radius={z.radius_m}
            fillColor="rgba(220,38,38,0.15)"
            strokeColor="rgba(220,38,38,0.5)"
            strokeWidth={1.5}
          />
        ))}
      </MapView>

      {/* Bottom panel */}
      <View style={s.bottomPanel}>
        <View style={s.riskRow}>
          <RiskBadge score={riskScore} size="lg" />
          <View style={{ marginLeft: "auto" }}>
            <Text style={s.tripIdText}>Trip: {tripId ?? "…"}</Text>
            <Text style={s.zoneText}>📍 {zoneName}</Text>
          </View>
        </View>

        <ExplainableAIPanel riskScore={riskScore} tags={tags} zoneName={zoneName} />

        {/* Debug controls */}
        <TouchableOpacity style={s.simBtn} onPress={simulateStep}>
          <Text style={s.simBtnText}>▶  Simulate GPS Ping</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: tokens.colors.riskCritical }]} onPress={endTrip}>
          <Text style={s.primaryBtnText}>⛔  End Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Alert modal */}
      <AlertModal
        visible={showAlert && riskLevel === "critical"}
        level={riskLevel}
        title="CRITICAL RISK AHEAD"
        message={alertMsg}
        tags={tags}
        zoneName={zoneName}
        onDismiss={() => setShowAlert(false)}
        onSOS={() => Alert.alert("SOS", "Emergency services notified (demo).")}
      />
    </SafeAreaView>
  );
}

const HIGH_RISK_ZONES = [
  { name: "Silk Board", lat: 12.9174, lng: 77.6228, radius_m: 500 },
  { name: "Hebbal",     lat: 13.0358, lng: 77.5970, radius_m: 400 },
  { name: "Majestic",   lat: 12.9766, lng: 77.5713, radius_m: 400 },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: tokens.colors.bg },
  container:      { padding: tokens.spacing.lg },
  heading:        { fontSize: tokens.fontSizes.xl, fontWeight: "700", color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  sectionTitle:   { fontSize: tokens.fontSizes.sm, fontWeight: "600", color: tokens.colors.textSecondary, marginTop: tokens.spacing.md, marginBottom: tokens.spacing.sm },
  input:          { backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: 14, borderWidth: 1, borderColor: tokens.colors.border, fontSize: 15, marginBottom: tokens.spacing.sm },
  primaryBtn:     { backgroundColor: tokens.colors.primary, borderRadius: tokens.radii.md, padding: 14, alignItems: "center", marginBottom: tokens.spacing.sm },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  outlineBtn:     { borderWidth: 1.5, borderColor: tokens.colors.primary, borderRadius: tokens.radii.md, padding: 13, alignItems: "center", marginBottom: tokens.spacing.sm },
  outlineBtnText: { color: tokens.colors.primary, fontWeight: "600", fontSize: 14 },
  errorText:      { color: tokens.colors.error, fontSize: 13, marginBottom: tokens.spacing.sm },
  chipRow:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: tokens.spacing.lg },
  chip:           { backgroundColor: tokens.colors.primaryLight, borderRadius: tokens.radii.pill, paddingHorizontal: 14, paddingVertical: 7 },
  chipText:       { color: tokens.colors.primary, fontWeight: "600", fontSize: 13 },
  scanBtn:        { borderWidth: 1, borderColor: tokens.colors.textSecondary, borderRadius: tokens.radii.md, padding: 14, alignItems: "center", borderStyle: "dashed" },
  scanBtnText:    { color: tokens.colors.textSecondary, fontWeight: "500" },
  busCard:        { backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: tokens.spacing.md, marginBottom: tokens.spacing.sm },
  busCardRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  busRoute:       { fontSize: 16, fontWeight: "700", color: tokens.colors.textPrimary },
  statusPill:     { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:     { color: "#fff", fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  busPlate:       { fontSize: 13, color: tokens.colors.textSecondary, marginBottom: 2 },
  busDriver:      { fontSize: 13, color: tokens.colors.textSecondary, marginBottom: 2 },
  busStop:        { fontSize: 13, color: tokens.colors.textSecondary },
  busFooter:      { flexDirection: "row", marginTop: 8, gap: 16 },
  busOcc:         { fontSize: 12, color: tokens.colors.textMuted },
  busSpeed:       { fontSize: 12, color: tokens.colors.textMuted },
  resultCard:     { backgroundColor: "#fff", borderRadius: tokens.radii.lg, padding: tokens.spacing.lg, marginTop: tokens.spacing.md },
  verifiedBadge:  { backgroundColor: tokens.colors.riskLow, alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  verifiedText:   { color: "#fff", fontSize: 12, fontWeight: "700" },
  resultTitle:    { fontSize: 20, fontWeight: "700", color: tokens.colors.textPrimary, marginBottom: 12 },
  infoRow:        { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: tokens.colors.divider },
  infoLabel:      { width: 90, fontSize: 13, color: tokens.colors.textSecondary, fontWeight: "500" },
  infoValue:      { flex: 1, fontSize: 13, color: tokens.colors.textPrimary },
  map:            { flex: 1 },
  bottomPanel:    { backgroundColor: "#fff", borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, padding: tokens.spacing.md, ...tokens.shadows.lg },
  riskRow:        { flexDirection: "row", alignItems: "center", marginBottom: tokens.spacing.sm },
  tripIdText:     { fontSize: 11, color: tokens.colors.textMuted },
  zoneText:       { fontSize: 12, color: tokens.colors.textSecondary },
  busMarker:      { backgroundColor: "#fff", borderRadius: 99, borderWidth: 2, padding: 4 },
  busMarkerText:  { fontSize: 20 },
  simBtn:         { backgroundColor: tokens.colors.primaryLight, borderRadius: tokens.radii.md, padding: 12, alignItems: "center", marginBottom: tokens.spacing.sm },
  simBtnText:     { color: tokens.colors.primary, fontWeight: "600", fontSize: 14 },
});
