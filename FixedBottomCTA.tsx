import { Pressable, StyleSheet, Animated, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CustomIcon } from "@/components/ui/IconCustom";
import { colors } from "@/constants/sharedStyles";
import { InterFont } from "@/constants/fonts";
import type { ChallengeSession } from "@/lib/api/response/challenge";
import { BlurView } from "expo-blur";

export type FixedBottomCTAProps = {
  currentSession: ChallengeSession | undefined;
  onPress: (session: ChallengeSession) => void;
  sessionsOpacity: Animated.Value;
  sessionsTranslateY: Animated.Value;
  sessionsAnimationDone: boolean;
  isVisible: boolean;
};

export default function FixedBottomCTA({
  currentSession,
  onPress,
  sessionsOpacity,
  sessionsTranslateY,
  sessionsAnimationDone,
  isVisible,
}: FixedBottomCTAProps) {
  if (!currentSession || !isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.fixedBottomContainer,
        {
          opacity: sessionsOpacity,
          transform: [{ translateY: sessionsTranslateY }],
          pointerEvents: sessionsAnimationDone ? "auto" : "none",
        },
      ]}
    >
      <Pressable onPress={() => onPress(currentSession)} style={styles.fixedBottomButtonWrapper}>
        <View style={styles.fixedBottomButtonClip}>
          <BlurView intensity={20} tint="light" style={styles.fixedBottomButtonBlur}>
            <CustomIcon name="arrowUpBlack" size={27} color={colors.white} />
          </BlurView>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fixedBottomContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 16,
  },
  fixedBottomButtonWrapper: {
    width: 56,
    height: 56,
    borderRadius: 100,
    shadowColor: colors.black,
    shadowOffset: { width: -1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: colors.white,
  },
  fixedBottomButtonClip: {
    width: 56,
    height: 56,
    borderRadius: 100,
    overflow: "hidden",
  },
  fixedBottomButtonBlur: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.white50,
    shadowColor: "#000000",
    shadowOffset: { width: -1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  gradientOverlay: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.9)",
  },
  fixedBottomButtonText: {
    fontFamily: InterFont.BOLD,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    color: colors.white,
    letterSpacing: 0.5,
  },
});