import { Text, StyleSheet, Animated } from "react-native";
import { ForrestFont } from "@/constants/fonts";

export type JourneyOverlayProps = {
  opacity: Animated.Value;
  countdown: number | null; // null = show "Your journey begins...", then 3, 2, 1
  showIntroText?: boolean; // true after 1s delay so "Your journey begins..." appears after delay
  titleTextColor: string;
};

export default function JourneyOverlay({ opacity, countdown, showIntroText = true, titleTextColor }: JourneyOverlayProps) {
  const isIntro = countdown === null;
  const showJourneyText = isIntro && showIntroText;
  return (
    <Animated.View
      style={[styles.journeyOverlay, { opacity }]}
      pointerEvents="none"
    >
      {showJourneyText ? (
        <Text style={[styles.journeyText, { color: titleTextColor }]}>Your journey begins...</Text>
      ) : !isIntro ? (
        <Text style={[styles.journeyCountdown, { color: titleTextColor }]}>{countdown}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  journeyOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 2,
  },
  journeyCountdown: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 150,
    lineHeight: 180,
  },
  journeyText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 28 * 1.2,
    textAlign: "center",
  },
});
