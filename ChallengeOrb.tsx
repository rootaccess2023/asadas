import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, ImageBackground, type LayoutChangeEvent } from "react-native";
import type { ChallengeAssets } from "../constants";
import { InterFont, ForrestFont } from "@/constants/fonts";
import { colors } from "@/constants/sharedStyles";

export type ChallengeOrbProps = {
  challengeAssets: ChallengeAssets;
  progressPercentage: number;
  challengeName: string | null | undefined;
  shouldAnimate: boolean;
  showStickyNav: boolean;
  orbOpacity: Animated.AnimatedInterpolation<number>;
  onOrbLayout: (event: LayoutChangeEvent) => void;
  orbTranslateY?: Animated.Value | Animated.AnimatedInterpolation<number>;
  orbScale?: Animated.Value | Animated.AnimatedInterpolation<number>;
  orbTextOpacity?: Animated.Value;
  orbRevealOpacity?: Animated.Value;
};

export default function ChallengeOrb({
  challengeAssets,
  progressPercentage,
  challengeName,
  shouldAnimate,
  showStickyNav,
  orbOpacity,
  onOrbLayout,
  orbTranslateY,
  orbScale,
  orbTextOpacity,
  orbRevealOpacity,
}: ChallengeOrbProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const orbStyle = [
    styles.orbMainContainer,
    {
      opacity: orbRevealOpacity != null ? Animated.multiply(orbOpacity, orbRevealOpacity) : orbOpacity,
      pointerEvents: showStickyNav ? ("none" as const) : ("auto" as const),
    },
  ];

  const renderOrbContent = (textOpacity?: Animated.Value) => (
    <View style={styles.orbContainer}>
      {/* Image Absolutely Positioned */}
      <Animated.View style={[styles.orbImage, { transform: [{ scale: pulseAnim }] }]}>
        <ImageBackground source={challengeAssets.orb} style={styles.orbImage} />
      </Animated.View>

      <View style={styles.orbContent}>
        {textOpacity ? (
          <Animated.View style={{ opacity: textOpacity, ...styles.orbContent }}>
            <Text style={[styles.titleText, { color: challengeAssets.orbText }]}>{challengeName}</Text>
            <Text style={[styles.progressText, { color: challengeAssets.orbText }]}>
              {progressPercentage}% COMPLETE
            </Text>
          </Animated.View>
        ) : (
          <>
            <Text style={[styles.titleText, { color: challengeAssets.orbText }]}>{challengeName}</Text>
            <Text style={[styles.progressText, { color: challengeAssets.orbText }]}>
              {progressPercentage}% COMPLETE
            </Text>
          </>
        )}
      </View>
    </View>
  );

  if (shouldAnimate && orbTranslateY != null && orbScale != null && orbTextOpacity != null && orbRevealOpacity != null) {
    return (
      <Animated.View
        style={[...orbStyle, { transform: [{ translateY: orbTranslateY }, { scale: orbScale }] }]}
        onLayout={onOrbLayout}
      >
        {renderOrbContent(orbTextOpacity)}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={orbStyle} onLayout={onOrbLayout}>
      {renderOrbContent()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orbMainContainer: {
    width: "100%",
    height: 430,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    top: 60,
  },
  orbContainer: {
    width: "100%",
    height: 600,
    position: "absolute",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  orbImage: {
    width: "100%",
    height: "100%",
  },
  // Content is absolutely positioned so it overlays the image without being a child of it
  orbContent: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  titleText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 28 * 1.2,
    textAlign: "center",
  },
  progressText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1,
    textAlign: "center",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});