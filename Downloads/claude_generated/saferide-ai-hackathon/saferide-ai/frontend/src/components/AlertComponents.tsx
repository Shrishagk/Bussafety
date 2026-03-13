/**
 * SafeRide AI — AlertBanner + AlertModal Components
 * Shown when risk level is high or critical.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Modal, TouchableOpacity, Animated,
  StyleSheet, Vibration, Platform,
} from "react-native";
import { tokens, RiskLevel, riskColor } from "@/theme/tokens";

// ── AlertBanner (inline strip at top of map screen) ──────────────────────────
interface BannerProps {
  level:   RiskLevel;
  message: string;
  visible: boolean;
  onDismiss?: () => void;
}

export const AlertBanner: React.FC<BannerProps> = ({ level, message, visible, onDismiss }) => {
  const slideY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.timing(slideY, {
      toValue:         visible ? 0 : -80,
      duration:        300,
      useNativeDriver: true,
    }).start();

    if (visible && (level === "high" || level === "critical")) {
      Vibration.vibrate(level === "critical" ? [0, 200, 100, 200] : 200);
    }
  }, [visible, level]);

  if (!visible) return null;

  const bgColor = riskColor(level);

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bgColor, transform: [{ translateY: slideY }] }]}>
      <Text style={styles.bannerIcon}>{level === "critical" ? "🚨" : "⚠️"}</Text>
      <Text style={styles.bannerText} numberOfLines={2}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.bannerClose}>
          <Text style={styles.bannerCloseText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// ── AlertModal (full modal for critical events) ───────────────────────────────
interface ModalProps {
  visible:     boolean;
  level:       RiskLevel;
  title:       string;
  message:     string;
  tags:        string[];
  zoneName:    string;
  onDismiss:   () => void;
  onSOS?:      () => void;
}

export const AlertModal: React.FC<ModalProps> = ({
  visible, level, title, message, tags, zoneName, onDismiss, onSOS
}) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!visible) { setCountdown(10); return; }
    if (countdown <= 0) { onDismiss(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, countdown]);

  const color = riskColor(level);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, tokens.shadows.lg]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: color }]}>
            <Text style={styles.modalHeaderIcon}>{level === "critical" ? "🚨" : "⚠️"}</Text>
            <Text style={styles.modalHeaderTitle}>{title}</Text>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}s</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            <Text style={styles.modalMessage}>{message}</Text>

            {/* Zone */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍 Zone</Text>
              <Text style={styles.infoValue}>{zoneName}</Text>
            </View>

            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.infoLabel}>🔍 Detected factors</Text>
                <View style={styles.tagsRow}>
                  {tags.map(tag => (
                    <View key={tag} style={[styles.tag, { borderColor: color }]}>
                      <Text style={[styles.tagText, { color }]}>{tag.replace(/_/g, " ")}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            {onSOS && (
              <TouchableOpacity style={[styles.btnSOS, { backgroundColor: tokens.colors.riskCritical }]} onPress={onSOS}>
                <Text style={styles.btnSOSText}>🆘  SOS</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btnDismiss, { borderColor: color }]} onPress={onDismiss}>
              <Text style={[styles.btnDismissText, { color }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── ExplainableAIPanel (collapsible) ─────────────────────────────────────────
interface ExplainProps {
  riskScore:  number;
  tags:       string[];
  zoneName:   string;
}

export const ExplainableAIPanel: React.FC<ExplainProps> = ({ riskScore, tags, zoneName }) => {
  const [open, setOpen] = useState(false);
  const height = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(height, {
      toValue:         open ? 0 : 180,
      duration:        250,
      useNativeDriver: false,
    }).start();
    setOpen(o => !o);
  };

  const factors = [
    { label: "Zone risk",     value: tags.includes("high_risk_zone") ? "HIGH" : "Normal", pct: tags.includes("high_risk_zone") ? 45 : 10 },
    { label: "Speed",         value: tags.includes("speeding") ? "Excessive" : "Normal", pct: tags.includes("speeding") ? 30 : 5 },
    { label: "Time of day",   value: tags.includes("late_night") ? "Night" : "Daytime",  pct: tags.includes("late_night") ? 20 : 5 },
    { label: "Anomaly AI",    value: tags.includes("anomaly_detected") ? "Detected" : "None", pct: tags.includes("anomaly_detected") ? 25 : 0 },
  ];

  return (
    <View style={styles.explainContainer}>
      <TouchableOpacity onPress={toggle} style={styles.explainHeader}>
        <Text style={styles.explainTitle}>🤖  AI Explanation</Text>
        <Text style={styles.explainChevron}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      <Animated.View style={{ overflow: "hidden", maxHeight: height }}>
        <View style={styles.explainBody}>
          <Text style={styles.explainSubtitle}>Risk score: {Math.round(riskScore * 100)}/100 · Zone: {zoneName}</Text>
          {factors.map(f => (
            <View key={f.label} style={styles.factorRow}>
              <Text style={styles.factorLabel}>{f.label}</Text>
              <View style={styles.factorBarBg}>
                <View style={[styles.factorBar, { width: `${f.pct}%`, backgroundColor: f.pct > 20 ? tokens.colors.riskHigh : tokens.colors.riskLow }]} />
              </View>
              <Text style={styles.factorValue}>{f.value}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Banner
  banner: { flexDirection: "row", alignItems: "center", padding: tokens.spacing.md, borderRadius: tokens.radii.md, margin: tokens.spacing.md, ...tokens.shadows.md },
  bannerIcon: { fontSize: 20, marginRight: 8 },
  bannerText: { flex: 1, color: "#fff", fontWeight: "600", fontSize: 14 },
  bannerClose: { padding: 4 },
  bannerCloseText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: tokens.colors.bgModal, justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: tokens.radii.lg, overflow: "hidden", width: "100%", maxWidth: 380 },
  modalHeader: { padding: 20, alignItems: "center" },
  modalHeaderIcon: { fontSize: 36, marginBottom: 6 },
  modalHeaderTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  countdownBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  countdownText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  modalBody: { padding: 20 },
  modalMessage: { fontSize: 15, color: tokens.colors.textPrimary, marginBottom: 12 },
  infoRow: { flexDirection: "row", marginBottom: 8 },
  infoLabel: { fontSize: 13, color: tokens.colors.textSecondary, width: 100, fontWeight: "600" },
  infoValue: { fontSize: 13, color: tokens.colors.textPrimary, flex: 1 },
  tagsContainer: { marginTop: 8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, gap: 6 },
  tag: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 12, fontWeight: "500" },
  modalActions: { flexDirection: "row", padding: 16, gap: 12, borderTopWidth: 1, borderColor: tokens.colors.border },
  btnSOS: { flex: 1, padding: 14, borderRadius: tokens.radii.md, alignItems: "center" },
  btnSOSText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnDismiss: { flex: 1, padding: 14, borderRadius: tokens.radii.md, borderWidth: 1.5, alignItems: "center" },
  btnDismissText: { fontWeight: "600", fontSize: 15 },
  // Explainable AI
  explainContainer: { backgroundColor: tokens.colors.bgCard, borderRadius: tokens.radii.md, ...tokens.shadows.sm, marginHorizontal: tokens.spacing.md, marginVertical: tokens.spacing.sm },
  explainHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  explainTitle: { fontSize: 14, fontWeight: "600", color: tokens.colors.textPrimary },
  explainChevron: { color: tokens.colors.textSecondary, fontSize: 12 },
  explainBody: { paddingHorizontal: 14, paddingBottom: 14 },
  explainSubtitle: { fontSize: 12, color: tokens.colors.textSecondary, marginBottom: 10 },
  factorRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  factorLabel: { width: 90, fontSize: 12, color: tokens.colors.textSecondary },
  factorBarBg: { flex: 1, height: 6, backgroundColor: tokens.colors.border, borderRadius: 3, marginHorizontal: 8 },
  factorBar: { height: 6, borderRadius: 3 },
  factorValue: { width: 70, fontSize: 12, color: tokens.colors.textPrimary, textAlign: "right" },
});
