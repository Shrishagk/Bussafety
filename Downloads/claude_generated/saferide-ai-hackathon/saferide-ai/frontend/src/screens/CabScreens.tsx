/**
 * SafeRide AI — Cab Flow Screens
 * CabBookingScreen → CabDriverDetailsScreen → CabTripMonitorScreen
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, Circle } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import ApiService from "@/services/api";
import realtimeService from "@/services/realtimeService";
import { RiskBadge } from "@/components/RiskBadge";
import { AlertBanner, AlertModal, ExplainableAIPanel } from "@/components/AlertComponents";
import { tokens, riskColor } from "@/theme/tokens";

// ── Mock driver data ──────────────────────────────────────────────────────────
const MOCK_DRIVER = {
  name:          "Sanjay Verma",
  vehicle:       "KA01MH7777",
  model:         "Maruti Swift Dzire",
  rating:        4.7,
  trips_total:   1842,
  verified:      true,
  phone_masked:  "+91 98××× ×××23",
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CAB BOOKING
// ═══════════════════════════════════════════════════════════════════════════════
export function CabBookingScreen() {
  const nav        = useNavigation<any>();
  const [pickup, setPickup]   = useState("MG Road, Bengaluru");
  const [drop, setDrop]       = useState("HSR Layout, Bengaluru");
  const [loading, setLoading] = useState(false);

  const searchRide = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      nav.navigate("CabDriverDetails", { pickup, drop });
    }, 1200);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.heading}>🚕 Book a Safe Cab</Text>

        <Text style={s.label}>📍 Pickup</Text>
        <TextInput style={s.input} value={pickup} onChangeText={setPickup} />

        <Text style={s.label}>🏁 Drop</Text>
        <TextInput style={s.input} value={drop} onChangeText={setDrop} />

        <View style={s.rideOptions}>
          {["Mini", "Sedan", "SUV"].map((opt, i) => (
            <TouchableOpacity
              key={opt}
              style={[s.rideOption, i === 1 && s.rideOptionSelected]}
            >
              <Text style={s.rideOptionEmoji}>{["🚗","🚕","🚙"][i]}</Text>
              <Text style={s.rideOptionName}>{opt}</Text>
              <Text style={s.rideOptionPrice}>₹{[89,129,199][i]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SafeRide guarantee */}
        <View style={s.safetyBanner}>
          <Text style={s.safetyText}>🛡️  SafeRide AI monitors every km for your safety</Text>
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={searchRide} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.primaryBtnText}>🔍  Find Safe Ride</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CAB DRIVER DETAILS
// ═══════════════════════════════════════════════════════════════════════════════
export function CabDriverDetailsScreen() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const { pickup, drop } = route.params ?? {};

  const driver = MOCK_DRIVER;
  const [verified, setVerified] = useState(false);

  const verifyPlate = async () => {
    const resp = await ApiService.verifyBus(driver.vehicle).catch(() => null);
    // For demo, always succeed after short delay
    setTimeout(() => setVerified(true), 700);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.heading}>👤 Driver Details</Text>

        {/* Driver card */}
        <View style={[s.driverCard, tokens.shadows.md]}>
          <View style={s.driverAvatar}>
            <Text style={{ fontSize: 40 }}>🧑‍✈️</Text>
          </View>
          <Text style={s.driverName}>{driver.name}</Text>
          <View style={s.ratingRow}>
            <Text style={s.starText}>⭐ {driver.rating}</Text>
            <Text style={s.tripsText}>  •  {driver.trips_total} trips</Text>
          </View>
          {driver.verified && (
            <View style={s.verifiedChip}>
              <Text style={s.verifiedChipText}>✅ BMTC Verified Driver</Text>
            </View>
          )}
        </View>

        {/* Vehicle */}
        <View style={[s.infoCard, tokens.shadows.sm]}>
          <InfoRow label="Vehicle"  value={driver.model} />
          <InfoRow label="Plate"    value={driver.vehicle} />
          <InfoRow label="Contact"  value={driver.phone_masked} />
        </View>

        {/* Plate verify */}
        <TouchableOpacity
          style={[s.verifyBtn, verified && s.verifyBtnDone]}
          onPress={verifyPlate}
        >
          <Text style={s.verifyBtnText}>
            {verified ? "✅ Plate Verified via SafeRide DB" : "🔍  Verify Plate via SafeRide AI"}
          </Text>
        </TouchableOpacity>

        {/* Trip summary */}
        <View style={s.tripSummary}>
          <Text style={s.tripSummaryTitle}>Trip Summary</Text>
          <Text style={s.tripSummaryText}>From: {pickup}</Text>
          <Text style={s.tripSummaryText}>To:   {drop}</Text>
          <Text style={s.tripSummaryETA}>Estimated fare: ₹129  •  ETA: 28 min</Text>
        </View>

        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => nav.navigate("CabTripMonitor", { driver, pickup, drop })}
        >
          <Text style={s.primaryBtnText}>🛡️  Start Safe Trip</Text>
        </TouchableOpacity>
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
// 3. CAB TRIP MONITOR
// ═══════════════════════════════════════════════════════════════════════════════
export function CabTripMonitorScreen() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const { driver, pickup, drop } = route.params ?? {};

  // Predefined Bengaluru route: MG Road → Koramangala → Silk Board → HSR
  const WAYPOINTS = [
    { latitude: 12.9716, longitude: 77.5946 },   // MG Road
    { latitude: 12.9547, longitude: 77.6031 },   // Indiranagar
    { latitude: 12.9390, longitude: 77.6217 },   // Koramangala
    { latitude: 12.9174, longitude: 77.6228 },   // Silk Board ⚠️
    { latitude: 12.9059, longitude: 77.6355 },   // HSR
  ];

  const [tripId, setTripId]     = useState<string | null>(null);
  const [step, setStep]         = useState(0);
  const [cabLoc, setCabLoc]     = useState(WAYPOINTS[0]);
  const [trail, setTrail]       = useState<typeof WAYPOINTS>([]);
  const [riskScore, setRiskScore] = useState(0.08);
  const [riskLevel, setRiskLevel] = useState<any>("low");
  const [tags, setTags]          = useState<string[]>([]);
  const [zoneName, setZoneName]  = useState("—");
  const [showModal, setShowModal] = useState(false);
  const [elapsed, setElapsed]    = useState(0);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    ApiService.startTrip({ user_id: "cab_user", mode: "cab", vehicle_id: driver?.vehicle ?? "CAB-DEMO" })
      .then(r => { setTripId(r.trip_id); })
      .catch(() => {});

    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const pingNextWaypoint = async () => {
    const nextStep = (step + 1) % WAYPOINTS.length;
    const wp = WAYPOINTS[nextStep];
    setStep(nextStep);
    setCabLoc(wp);
    setTrail(t => [...t, wp]);
    mapRef.current?.animateToRegion({ ...wp, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);

    if (tripId) {
      const res = await ApiService.pushRiskScore(tripId, wp.latitude, wp.longitude, 35).catch(() => null);
      if (res) {
        setRiskScore(res.risk_score);
        setRiskLevel(res.risk_level);
        setTags(res.reason_tags);
        setZoneName(res.zone_name);
        if (res.risk_level === "critical" || res.risk_level === "high") setShowModal(true);
      }
    }
  };

  const endTrip = async () => {
    if (tripId) await ApiService.endTrip(tripId).catch(() => {});
    nav.goBack();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2,"0")}`;

  return (
    <SafeAreaView style={s.safe}>
      <AlertBanner
        level={riskLevel}
        message={`⚠️ ${riskLevel.toUpperCase()} risk: ${zoneName}`}
        visible={riskLevel === "high" || riskLevel === "critical"}
        onDismiss={() => setRiskLevel("low")}
      />

      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={{ ...WAYPOINTS[0], latitudeDelta: 0.04, longitudeDelta: 0.04 }}
      >
        {/* Cab marker */}
        <Marker coordinate={cabLoc} title="Your Cab">
          <View style={[s.cabMarker, { borderColor: riskColor(riskLevel) }]}>
            <Text style={{ fontSize: 22 }}>🚕</Text>
          </View>
        </Marker>

        {/* Destination */}
        <Marker coordinate={WAYPOINTS[WAYPOINTS.length - 1]} title="Destination">
          <Text style={{ fontSize: 26 }}>🏁</Text>
        </Marker>

        {/* Planned route (dim) */}
        <Polyline coordinates={WAYPOINTS} strokeColor={tokens.colors.border} strokeWidth={3} lineDashPattern={[6,4]} />

        {/* Driven trail */}
        {trail.length > 1 && <Polyline coordinates={trail} strokeColor={riskColor(riskLevel)} strokeWidth={4} />}

        {/* Silk Board danger zone */}
        <Circle center={{ latitude: 12.9174, longitude: 77.6228 }} radius={500}
          fillColor="rgba(220,38,38,0.12)" strokeColor="rgba(220,38,38,0.6)" strokeWidth={2} />
      </MapView>

      {/* Bottom panel */}
      <View style={s.bottomPanel}>
        <View style={s.headerRow}>
          <RiskBadge score={riskScore} size="lg" />
          <View style={{ marginLeft: "auto", alignItems: "flex-end" }}>
            <Text style={s.elapsedText}>⏱ {fmt(elapsed)}</Text>
            <Text style={s.zoneText}>📍 {zoneName}</Text>
          </View>
        </View>

        <View style={s.driverMiniCard}>
          <Text style={s.driverMiniText}>🧑‍✈️ {driver?.name ?? "Driver"}  •  {driver?.vehicle ?? "—"}</Text>
        </View>

        <ExplainableAIPanel riskScore={riskScore} tags={tags} zoneName={zoneName} />

        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btn, s.btnSim]} onPress={pingNextWaypoint}>
            <Text style={s.btnSimText}>▶ Simulate Step</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSOS]} onPress={() => Alert.alert("SOS", "Emergency services alerted (demo).")}>
            <Text style={s.btnSOSText}>🆘 SOS</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.endBtn} onPress={endTrip}>
          <Text style={s.endBtnText}>⛔  End Trip</Text>
        </TouchableOpacity>
      </View>

      <AlertModal
        visible={showModal}
        level={riskLevel}
        title={riskLevel === "critical" ? "CRITICAL RISK ZONE" : "HIGH RISK AREA"}
        message={`Your cab is near ${zoneName}. Extra caution advised.`}
        tags={tags}
        zoneName={zoneName}
        onDismiss={() => setShowModal(false)}
        onSOS={() => Alert.alert("SOS", "Emergency services notified (demo).")}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: tokens.colors.bg },
  container:         { padding: tokens.spacing.lg },
  heading:           { fontSize: tokens.fontSizes.xl, fontWeight: "700", color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  label:             { fontSize: tokens.fontSizes.sm, fontWeight: "600", color: tokens.colors.textSecondary, marginBottom: 4 },
  input:             { backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: 14, borderWidth: 1, borderColor: tokens.colors.border, fontSize: 15, marginBottom: tokens.spacing.md },
  primaryBtn:        { backgroundColor: tokens.colors.primary, borderRadius: tokens.radii.md, padding: 15, alignItems: "center", marginTop: tokens.spacing.sm },
  primaryBtnText:    { color: "#fff", fontWeight: "700", fontSize: 15 },
  rideOptions:       { flexDirection: "row", gap: 10, marginBottom: tokens.spacing.md },
  rideOption:        { flex: 1, borderWidth: 1.5, borderColor: tokens.colors.border, borderRadius: tokens.radii.md, padding: 12, alignItems: "center" },
  rideOptionSelected:{ borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primaryLight },
  rideOptionEmoji:   { fontSize: 24 },
  rideOptionName:    { fontSize: 13, fontWeight: "600", color: tokens.colors.textPrimary, marginTop: 4 },
  rideOptionPrice:   { fontSize: 12, color: tokens.colors.textSecondary },
  safetyBanner:      { backgroundColor: "#ECFDF5", borderRadius: tokens.radii.md, padding: 12, marginBottom: tokens.spacing.md, borderWidth: 1, borderColor: "#6EE7B7" },
  safetyText:        { color: "#065F46", fontSize: 13, fontWeight: "500" },
  driverCard:        { backgroundColor: "#fff", borderRadius: tokens.radii.lg, padding: tokens.spacing.lg, alignItems: "center", marginBottom: tokens.spacing.md },
  driverAvatar:      { width: 80, height: 80, borderRadius: 40, backgroundColor: tokens.colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  driverName:        { fontSize: 20, fontWeight: "700", color: tokens.colors.textPrimary },
  ratingRow:         { flexDirection: "row", marginTop: 4 },
  starText:          { fontSize: 14, color: tokens.colors.textPrimary, fontWeight: "600" },
  tripsText:         { fontSize: 14, color: tokens.colors.textSecondary },
  verifiedChip:      { marginTop: 8, backgroundColor: "#ECFDF5", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  verifiedChipText:  { color: "#065F46", fontSize: 12, fontWeight: "600" },
  infoCard:          { backgroundColor: "#fff", borderRadius: tokens.radii.md, marginBottom: tokens.spacing.md },
  infoRow:           { flexDirection: "row", padding: 14, borderBottomWidth: 1, borderColor: tokens.colors.divider },
  infoLabel:         { width: 80, fontSize: 13, color: tokens.colors.textSecondary, fontWeight: "500" },
  infoValue:         { flex: 1, fontSize: 13, color: tokens.colors.textPrimary },
  verifyBtn:         { borderWidth: 1.5, borderColor: tokens.colors.primary, borderRadius: tokens.radii.md, padding: 14, alignItems: "center", marginBottom: tokens.spacing.md },
  verifyBtnDone:     { borderColor: tokens.colors.riskLow, backgroundColor: "#ECFDF5" },
  verifyBtnText:     { color: tokens.colors.primary, fontWeight: "600" },
  tripSummary:       { backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: tokens.spacing.md, marginBottom: tokens.spacing.md, ...tokens.shadows.sm },
  tripSummaryTitle:  { fontSize: 14, fontWeight: "700", color: tokens.colors.textPrimary, marginBottom: 6 },
  tripSummaryText:   { fontSize: 13, color: tokens.colors.textSecondary, marginBottom: 2 },
  tripSummaryETA:    { fontSize: 12, color: tokens.colors.primary, marginTop: 6, fontWeight: "500" },
  map:               { flex: 1 },
  bottomPanel:       { backgroundColor: "#fff", borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, padding: tokens.spacing.md, ...tokens.shadows.lg },
  headerRow:         { flexDirection: "row", alignItems: "center", marginBottom: tokens.spacing.sm },
  elapsedText:       { fontSize: 12, color: tokens.colors.textSecondary, fontWeight: "600" },
  zoneText:          { fontSize: 11, color: tokens.colors.textMuted },
  driverMiniCard:    { backgroundColor: tokens.colors.bgDark, borderRadius: tokens.radii.md, padding: 10, marginBottom: tokens.spacing.sm },
  driverMiniText:    { color: "#fff", fontSize: 13, fontWeight: "500" },
  btnRow:            { flexDirection: "row", gap: 10, marginBottom: tokens.spacing.sm },
  btn:               { flex: 1, padding: 12, borderRadius: tokens.radii.md, alignItems: "center" },
  btnSim:            { backgroundColor: tokens.colors.primaryLight },
  btnSimText:        { color: tokens.colors.primary, fontWeight: "600" },
  btnSOS:            { backgroundColor: tokens.colors.riskCritical },
  btnSOSText:        { color: "#fff", fontWeight: "700" },
  endBtn:            { backgroundColor: "#F3F4F6", borderRadius: tokens.radii.md, padding: 13, alignItems: "center" },
  endBtnText:        { color: tokens.colors.textSecondary, fontWeight: "600" },
  cabMarker:         { backgroundColor: "#fff", borderRadius: 99, borderWidth: 2, padding: 4 },
});
