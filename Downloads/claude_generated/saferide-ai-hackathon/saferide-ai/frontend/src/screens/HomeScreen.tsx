/**
 * SafeRide AI — HomeScreen
 * Entry point: choose Bus or Cab flow.
 */
import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { tokens } from "@/theme/tokens";

export default function HomeScreen() {
  const nav = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.bg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🛡️ SafeRide AI</Text>
          <Text style={styles.tagline}>AI-powered commute safety for Bengaluru</Text>
        </View>

        {/* Mode cards */}
        <View style={styles.cardsRow}>
          <ModeCard
            emoji="🚌"
            title="Bus"
            subtitle="Verify bus & track route safety"
            color={tokens.colors.primary}
            onPress={() => nav.navigate("BusRouteSearch")}
          />
          <ModeCard
            emoji="🚕"
            title="Cab"
            subtitle="Monitor your cab trip live"
            color={tokens.colors.secondary}
            onPress={() => nav.navigate("CabBooking")}
          />
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          {FEATURES.map(f => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Dashboard shortcut */}
        <TouchableOpacity style={styles.dashBtn} onPress={() => nav.navigate("Dashboard")}>
          <Text style={styles.dashBtnText}>📊  Open Operator Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: "🗺️", label: "Live GeoAI risk detection" },
  { icon: "🔴", label: "Predictive alerts with countdown" },
  { icon: "🤖", label: "Explainable AI risk breakdown" },
  { icon: "📷", label: "Number plate verification (OCR)" },
];

const ModeCard = ({ emoji, title, subtitle, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: color }, tokens.shadows.md]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.cardEmoji}>{emoji}</Text>
    <Text style={[styles.cardTitle, { color }]}>{title}</Text>
    <Text style={styles.cardSub}>{subtitle}</Text>
    <View style={[styles.cardBtn, { backgroundColor: color }]}>
      <Text style={styles.cardBtnText}>Start →</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: tokens.colors.bg },
  container:   { flex: 1, padding: tokens.spacing.lg },
  header:      { alignItems: "center", paddingVertical: tokens.spacing.xl },
  logo:        { fontSize: tokens.fontSizes.xxl, fontWeight: "800", color: tokens.colors.textPrimary },
  tagline:     { fontSize: tokens.fontSizes.sm, color: tokens.colors.textSecondary, marginTop: 4, textAlign: "center" },
  cardsRow:    { flexDirection: "row", gap: tokens.spacing.md, marginBottom: tokens.spacing.lg },
  card:        { flex: 1, backgroundColor: "#fff", borderRadius: tokens.radii.lg, padding: tokens.spacing.md, borderWidth: 1.5, alignItems: "center" },
  cardEmoji:   { fontSize: 40, marginBottom: 6 },
  cardTitle:   { fontSize: tokens.fontSizes.xl, fontWeight: "700" },
  cardSub:     { fontSize: tokens.fontSizes.xs, color: tokens.colors.textSecondary, textAlign: "center", marginTop: 4, marginBottom: 12 },
  cardBtn:     { borderRadius: tokens.radii.pill, paddingHorizontal: 16, paddingVertical: 7, marginTop: "auto" },
  cardBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  features:    { backgroundColor: "#fff", borderRadius: tokens.radii.md, padding: tokens.spacing.md, ...tokens.shadows.sm, marginBottom: tokens.spacing.lg },
  featureRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  featureIcon: { fontSize: 18, marginRight: 10 },
  featureLabel:{ fontSize: tokens.fontSizes.sm, color: tokens.colors.textPrimary, fontWeight: "500" },
  dashBtn:     { backgroundColor: tokens.colors.bgDark, borderRadius: tokens.radii.md, padding: tokens.spacing.md, alignItems: "center" },
  dashBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
