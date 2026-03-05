import { View, Text, StyleSheet, Animated } from "react-native";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { InterFont } from "@/constants/fonts";
import { colors } from "@/constants/sharedStyles";
import LottieView from "lottie-react-native";

type ProgressOverlayProps = {
  title: string;
  subtitle: string;
  progress: Animated.Value;
  restartGradient: [string, string, string];
  titleText: string;
  showLottie: boolean;
  onComplete?: () => void;
};

export default function ProgressOverlay({
  title,
  subtitle,
  progress,
  restartGradient,
  titleText,
  showLottie,
  onComplete,
}: ProgressOverlayProps) {
  useEffect(() => {
    if (!onComplete) return;

    let hasCompleted = false;
    const listenerId = progress.addListener(({ value }) => {
      if (!hasCompleted && value >= 1) {
        hasCompleted = true;
        onComplete();
      }
    });

    return () => {
      progress.removeListener(listenerId);
    };
  }, [progress, onComplete]);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <LinearGradient
        colors={restartGradient}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.content}>

        {showLottie && (
          <LottieView
            source={require('@/assets/images/illustrations/restart.json')}
            autoPlay
              loop
              style={styles.lottie}
            />
          )}

        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: titleText }]}>{title}</Text>
          
          {!showLottie && (
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: titleText },
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          )}
          <Text style={[styles.subtitle, { color: titleText }]}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  contentContainer: {
    width: "100%",
    gap: 16,
  },
  lottie: {
    width: 348,
    height: 196,
  },
  title: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    textAlign: "center",
  },
  progressBarTrack: {
    alignSelf: "stretch",
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
  },
});
