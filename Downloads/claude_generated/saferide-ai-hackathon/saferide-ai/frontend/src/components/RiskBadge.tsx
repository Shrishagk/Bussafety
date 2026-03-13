/**
 * SafeRide AI — RiskBadge Component
 * Color-coded badge showing current risk score and level.
 * Pulses/animates when risk is high or critical.
 */
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, ViewStyle } from "react-native";
import { tokens, RiskLevel, riskColor, riskLabel, riskEmoji } from "@/theme/tokens";

interface Props {
  score:     number;          // 0.0 – 1.0
  size?:     "sm" | "md" | "lg";
  showScore?: boolean;
  style?:    ViewStyle;
}

export const RiskBadge: React.FC<Props> = ({
  score,
  size = "md",
  showScore = true,
  style,
}) => {
  const level = riskLabel(score);
  const color = riskColor(level);
  const pulse = useRef(new Animated.Value(1)).current;

  // Pulse animation for high / critical
  useEffect(() => {
    if (level === "high" || level === "critical") {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.12, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.00, duration: 500, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
    }
  }, [level]);

  const sz = sizes[size];

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: color, borderRadius: tokens.radii.pill, transform: [{ scale: pulse }] },
        sz.container,
        style,
      ]}
    >
      <Text style={[styles.emoji, { fontSize: sz.emojiSize }]}>{riskEmoji(level)}</Text>
      <Text style={[styles.label, { fontSize: sz.fontSize, color: "#fff" }]}>
        {level.toUpperCase()}
      </Text>
      {showScore && (
        <Text style={[styles.score, { fontSize: sz.fontSize - 1, color: "rgba(255,255,255,0.85)" }]}>
          {" "}({Math.round(score * 100)})
        </Text>
      )}
    </Animated.View>
  );
};

const sizes = {
  sm: { container: { paddingHorizontal: 8,  paddingVertical: 3  }, fontSize: 11, emojiSize: 10 },
  md: { container: { paddingHorizontal: 12, paddingVertical: 5  }, fontSize: 13, emojiSize: 13 },
  lg: { container: { paddingHorizontal: 16, paddingVertical: 8  }, fontSize: 16, emojiSize: 16 },
};

const styles = StyleSheet.create({
  badge: {
    flexDirection:  "row",
    alignItems:     "center",
    alignSelf:      "flex-start",
  },
  emoji: { marginRight: 4 },
  label: { fontWeight: "700", letterSpacing: 0.5 },
  score: { fontWeight: "400" },
});

export default RiskBadge;
