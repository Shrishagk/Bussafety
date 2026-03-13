/**
 * SafeRide AI — Dashboard Screen (mobile view)
 * Full dashboard is in /dashboard/index.html (web).
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ApiService from "@/services/api";
import { RiskBadge } from "@/components/RiskBadge";
import { tokens, riskLabel } from "@/theme/tokens";

export default function DashboardScreen() {
  const nav = useNavigation<any>();
  const [summary, setSummary]   = useState<any>(null);
  const [alerts, setAlerts]     = useState<any[]>([]);
  const [trips, setTrips]       = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, a, t] = await Promise.all([
        ApiService.dashboardSummary(),
        ApiService.activeTrips().then(r => r.trips ?? []).catch(() => []),
        fetch(`${require("@/services/api").BASE_URL}/api/dashboard/alerts`)
          .then(r => r.json()).then(r => r.alerts ?? []).catch(() => []),
      ]);
      setSummary(s);
      setTrips(a);
      setAlerts(t);
    } catch (e) {
      console.warn("Dashboard load error:", e);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={s.heading}>📊 Operator Dashboard</Text>

        {/* Summary cards */}
        {summary && (
          <View style={s.summaryRow}>
            <StatCard label="Active Trips"  value={summary.active_trips}  color={tokens.colors.primary} />
            <StatCard label="Fleet Size"    value={summary.total_fleet}   color={tokens.colors.secondary} />
            <StatCard label="Alerts Today"  value={summary.alerts_today}  color={tokens.colors.riskHigh} />
            <StatCard label="Avg Risk"      value={`${Math.round((summary.avg_risk ?? 0) * 100)}`} color={tokens.colors.riskMedium} />
          </View>
        )}

        {/* Live alerts */}
        <Text style={s.sectionTitle}>🚨 Live Alerts</Text>
        {alerts.length === 0
          ? <Text style={s.empty}>No active alerts — all clear ✅</Text>
          : alerts.slice(0, 8).map((a, i) => (
              <View key={i} style={[s.alertRow, tokens.shadows.sm]}>
                <Text style={s.alertIcon}>{a.type?.includes("critical") ? "🔴" : "🟠"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.alertMsg}>{a.message}</Text>
                  <Text style={s.alertMeta}>{a.trip_id}  •  {a.timestamp?.slice(11, 19)}</Text>
                </View>
              </View>
            ))
        }

        {/* Active trips */}
        <Text style={s.sectionTitle}>🚌 Active Trips</Text>
        {trips.length === 0
          ? <Text style={s.empty}>No active trips. Start the simulator!</Text>
          : trips.slice(0, 6).map(t => (
              <View key={t.trip_id} style={[s.tripRow, tokens.shadows.sm]}>
                <View>
                  <Text style={s.tripId}>{t.trip_id}</Text>
                  <Text style={s.tripMeta}>{t.mode.toUpperCase()}  •  {t.vehicle_id}</Text>
                </View>
                <RiskBadge score={t.risk_score ?? 0} size="sm" />
              </View>
            ))
        }

        {/* Open web dashboard */}
        <TouchableOpacity style={s.webDashBtn}>
          <Text style={s.webDashBtnText}>🖥️  Open Full Web Dashboard</Text>
          <Text style={s.webDashBtnSub}>Open dashboard/index.html in browser</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, color }: any) => (
  <View style={[s.statCard, { borderTopColor: color, borderTopWidth: 3 }, tokens.shadows.sm]}>
    <Text style={[s.statValue, { color }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: tokens.colors.bg },
  container:      { padding: tokens.spacing.md },
  heading:        { fontSize: tokens.fontSizes.xl, fontWeight: "700", color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  sectionTitle:   { fontSize: 14, fontWeight: "700", color: tokens.colors.textSecondary, marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryRow:     { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: tokens.spacing.sm },
  statCard:       { flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: 14 },
  statValue:      { fontSize: 28, fontWeight: "800" },
  statLabel:      { fontSize: 12, color: tokens.colors.textSecondary, marginTop: 2 },
  alertRow:       { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: 12, marginBottom: 8, gap: 10 },
  alertIcon:      { fontSize: 22 },
  alertMsg:       { fontSize: 13, fontWeight: "600", color: tokens.colors.textPrimary },
  alertMeta:      { fontSize: 11, color: tokens.colors.textMuted, marginTop: 2 },
  tripRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: 14, marginBottom: 8 },
  tripId:         { fontSize: 14, fontWeight: "600", color: tokens.colors.textPrimary },
  tripMeta:       { fontSize: 12, color: tokens.colors.textSecondary, marginTop: 2 },
  empty:          { fontSize: 13, color: tokens.colors.textMuted, fontStyle: "italic", textAlign: "center", paddingVertical: 16 },
  webDashBtn:     { backgroundColor: tokens.colors.bgDark, borderRadius: tokens.radii.md, padding: tokens.spacing.md, alignItems: "center", marginTop: tokens.spacing.lg },
  webDashBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  webDashBtnSub:  { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 },
});
