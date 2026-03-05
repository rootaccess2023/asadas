import { View, Text, Pressable, StyleSheet, Animated, Image, Easing } from "react-native";
import { CustomIcon, type CustomIconName } from "@/components/ui/IconCustom";
import { colors } from "@/constants/sharedStyles";
import { ForrestFont, InterFont } from "@/constants/fonts";
import type { ChallengeSession } from "@/lib/api/response/challenge";
import { getChallengeAssets, DEFAULT_CHALLENGE_NAME } from "../constants";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";

const FLIP_HALF_DURATION_MS = 600;  // ← Duration of each half-flip in ms. Lower = snappier, higher = slower.
const FLIP_EASING = Easing.bezier(0.25, 0.1, 0.25, 1); // ← Easing curve for rotation. Try Easing.ease, Easing.linear, or Easing.inOut(Easing.quad).
const FLIP_SCALE_PEAK = 1.5;      // ← How much the icon scales UP at the midpoint (edge-on moment). 1.0 = no scale effect.
const BOUNCE_FRICTION = 6;  // ← Lower = more bouncy oscillation. Higher = more damped (settles faster).
const BOUNCE_TENSION  = 180; // ← Higher = snappier/faster spring. Lower = slower, more elastic feel.

export function DashedConnector() {
  return (
    <View style={styles.dashedConnectorContainer}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={styles.dashedSegment} />
      ))}
    </View>
  );
}

// Phase header card (dark block between session groups)
export function PhaseHeaderCard({
  weekNumber,
  weekTitle,
  challengeName = DEFAULT_CHALLENGE_NAME,
  titleTextColor = colors.primary,
}: {
  weekNumber: number;
  weekTitle: string | null;
  challengeName?: string;
  titleTextColor?: string;
}) {
  return (
    <View style={styles.phaseHeaderCard}>
      <Image
        source={getChallengeAssets(challengeName).background}
        style={[StyleSheet.absoluteFill, { resizeMode: "cover", width: "100%", height: "100%" }]}
      />
      <Text style={styles.phaseHeaderEyebrow}>PHASE {weekNumber}</Text>
      <Text style={[styles.phaseHeaderTitle, { color: titleTextColor }]}>{weekTitle ?? `Week ${weekNumber}`}</Text>
    </View>
  );
}

export function UnlockedSession({
  session,
  effectiveDay,
  onPress,
  sessionIcon,
  challengeName = DEFAULT_CHALLENGE_NAME,
  animateEntrance = false,
  challengeLockedIcon,
}: {
  session: ChallengeSession;
  effectiveDay: number;
  onPress: () => void;
  sessionIcon: CustomIconName;
  challengeName?: string;
  animateEntrance?: boolean;
  challengeLockedIcon?: CustomIconName;
}) {
  const flipRotateY    = useRef(new Animated.Value(0)).current;
  const flipScale      = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(animateEntrance ? 0.65 : 1)).current;
  const [showNewIcon, setShowNewIcon] = useState(!animateEntrance || !challengeLockedIcon);

  const useFlip = animateEntrance && challengeLockedIcon != null;

  // Reset when props change
  useEffect(() => {
    if (!animateEntrance || !challengeLockedIcon) {
      contentOpacity.setValue(1);
      flipRotateY.setValue(0);
      flipScale.setValue(1);
      setShowNewIcon(true);
      return;
    }
    contentOpacity.setValue(0.65);
    flipRotateY.setValue(0);
    flipScale.setValue(1);
    setShowNewIcon(false);
  }, [animateEntrance, challengeLockedIcon]);

  useEffect(() => {
    if (!animateEntrance || !challengeLockedIcon) return;

    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 4000,                 
      easing: Easing.out(Easing.cubic),  
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(flipRotateY, {
        toValue: 90,
        duration: FLIP_HALF_DURATION_MS, 
        easing: FLIP_EASING,             
        useNativeDriver: true,
      }),
      Animated.timing(flipScale, {
        toValue: FLIP_SCALE_PEAK,        
        duration: FLIP_HALF_DURATION_MS,
        easing: FLIP_EASING,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;

      setShowNewIcon(true);

      Animated.parallel([
        Animated.timing(flipRotateY, {
          toValue: 0,
          duration: FLIP_HALF_DURATION_MS, 
          easing: FLIP_EASING,             
          useNativeDriver: true,
        }),
        Animated.spring(flipScale, {
          toValue: 1,
          friction: BOUNCE_FRICTION, 
          tension: BOUNCE_TENSION,   
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [animateEntrance, challengeLockedIcon]);

  const flipRotateYDeg = flipRotateY.interpolate({
    inputRange: [0, 90],
    outputRange: ["0deg", "90deg"],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.specificSessionContainer, { gap: 16, backgroundColor: colors.white }]}>
      <Animated.View style={{ opacity: contentOpacity }}>
        {session.day_number === effectiveDay ? (
          <View style={styles.todayDotContainer}>
            <CustomIcon name="todayDot" size={6} color={colors.primary} />
            <Text style={styles.eyebrowText}>TODAY</Text>
          </View>
        ) : (
          <Text style={styles.eyebrowText}>SESSION {session.day_number}</Text>
        )}
      </Animated.View>

      <View style={styles.sessionCirclesContainer}>
        {useFlip ? (
          <View style={[StyleSheet.absoluteFill, styles.sessionCirclesContainer, styles.flipPerspective]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.sessionCirclesContainer,
                {
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ rotateY: flipRotateYDeg }, { scale: flipScale }],
                  backfaceVisibility: "hidden" as const,
                },
              ]}
              pointerEvents="none"
            >
              {showNewIcon ? (
                <>
                  <LottieView
                    source={getChallengeAssets(challengeName).unlockedSessionLottie}
                    autoPlay
                    loop
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.sessionCirclesTextOverlay}>
                    <Text style={styles.sessionCirclesText}>{session.day_number}</Text>
                  </View>
                </>
              ) : (
                <>
                  <CustomIcon style={{ opacity: 0.6 }} name={challengeLockedIcon!} size={71} color={colors.primary} />
                  <View style={styles.sessionCirclesTextOverlay}>
                    <Text style={styles.sessionCirclesText}>{session.day_number}</Text>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        ) : (
          <>
            <LottieView
              source={getChallengeAssets(challengeName).unlockedSessionLottie}
              autoPlay
              loop
              style={styles.sessionCirclesContainer}
            />
            <View style={styles.sessionCirclesTextOverlay}>
              <Text style={styles.sessionCirclesText}>{session.day_number}</Text>
            </View>
          </>
        )}
      </View>

      <Animated.View style={[styles.sessionContent, { opacity: contentOpacity }]}>
        <Text style={[styles.sessionTitleText, { color: getChallengeAssets(challengeName).weekStepperText }]}>{session.title}</Text>
        <Text style={[styles.sessionDescriptionText, { color: getChallengeAssets(challengeName).weekStepperText }]}>{session.description}</Text>
      </Animated.View>

      <Animated.View style={{ opacity: contentOpacity }}>
        <Pressable style={styles.primaryButton} onPress={onPress}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function LockedSession({
  session,
  challengeLockedIcon,
}: {
  session: ChallengeSession;
  challengeLockedIcon: CustomIconName;
}) {
  return (
    <View style={[styles.specificSessionContainer, styles.nonEffectiveSessionContainer ]}>
      <Text style={[styles.eyebrowText, styles.lockedText]}>SESSION {session.day_number}</Text>
      <View style={styles.sessionCirclesContainer}>
        <CustomIcon style={{ opacity: 0.6 }} name={challengeLockedIcon} size={71} color={colors.primary} />
      </View>
      <View style={styles.sessionContent}>
        <Text style={[styles.sessionTitleText, styles.lockedText]}>{session.title}</Text>
        <Text style={[styles.sessionDescriptionText, styles.lockedText]}>{session.description}</Text>
      </View>
    </View>
  );
}

/** Locked session card used only for the final (last) session in the challenge. */
export function LastLockedSession({
  session,
  challengeLockedIcon,
}: {
  session: ChallengeSession;
  challengeLockedIcon: CustomIconName;
}) {
  return (
    <View style={[styles.specificSessionContainer, styles.nonEffectiveSessionContainer]}>
      <Text style={[styles.eyebrowText, styles.lockedText]}>Session {session.day_number}</Text>
      <View style={styles.sessionCirclesContainer}>
        <View style={styles.trophyContainer}>
          <CustomIcon style={{ opacity: 0.6 }} name={challengeLockedIcon} size={55} color={colors.primary} />
          <Text style={styles.trophyText}>{session.day_number}</Text>
        </View>
      </View>
      <View style={styles.sessionContent}>
        <Text style={[styles.sessionTitleText, styles.lockedText]}>{session.title}</Text>
        <Text style={[styles.sessionDescriptionText, styles.lockedText]}>{session.description}</Text>
      </View>
    </View>
  );
}

export function CompletedSession({
  session,
  onPress,
  completedIcon,
  animateEntrance = false,
  challengeName = DEFAULT_CHALLENGE_NAME,
}: {
  session: ChallengeSession;
  onPress: () => void;
  completedIcon: CustomIconName;
  animateEntrance?: boolean;
  challengeName?: string;
}) {
  const flipRotateY = useRef(new Animated.Value(0)).current;
  const flipScale   = useRef(new Animated.Value(1)).current;
  const [showCompletedIcon, setShowCompletedIcon] = useState(!animateEntrance);

  // Reset when props change
  useEffect(() => {
    if (!animateEntrance) {
      flipRotateY.setValue(0);
      flipScale.setValue(1);
      setShowCompletedIcon(true);
      return;
    }
    flipRotateY.setValue(0);
    flipScale.setValue(1);
    setShowCompletedIcon(false);
  }, [animateEntrance]);

  useEffect(() => {
    if (!animateEntrance) return;

    Animated.parallel([
      Animated.timing(flipRotateY, {
        toValue: 90,
        duration: FLIP_HALF_DURATION_MS,
        easing: FLIP_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(flipScale, {
        toValue: FLIP_SCALE_PEAK,  
        duration: FLIP_HALF_DURATION_MS,
        easing: FLIP_EASING,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;

      setShowCompletedIcon(true);

      Animated.parallel([
        Animated.timing(flipRotateY, {
          toValue: 0,
          duration: FLIP_HALF_DURATION_MS,
          easing: FLIP_EASING,            
          useNativeDriver: true,
        }),
        Animated.spring(flipScale, {
          toValue: 1,
          friction: BOUNCE_FRICTION, 
          tension: BOUNCE_TENSION,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [animateEntrance]);

  const flipRotateYDeg = flipRotateY.interpolate({
    inputRange: [0, 90],
    outputRange: ["0deg", "90deg"],
    extrapolate: "clamp",
  });

  return (
    <Pressable
      style={[styles.specificSessionContainer, styles.nonEffectiveSessionContainer, { gap: 8, backgroundColor: getChallengeAssets(challengeName).completedSessionBackground }]}
      onPress={onPress}
    >
      <Text style={[styles.eyebrowText, { color: getChallengeAssets(challengeName).weekStepperText, opacity: 0.5 }]}>SESSION {session.day_number}</Text>

      <View style={styles.sessionCirclesContainer}>
        {animateEntrance ? (
          <View style={[StyleSheet.absoluteFill, styles.sessionCirclesContainer, styles.flipPerspective]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.sessionCirclesContainer,
                {
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ rotateY: flipRotateYDeg }, { scale: flipScale }],
                  backfaceVisibility: "hidden" as const,
                },
              ]}
              pointerEvents="none"
            >
              {showCompletedIcon ? (
                <CustomIcon name={completedIcon} size={100} color={colors.primary} />
              ) : (
                <>
                  <LottieView
                    source={getChallengeAssets(challengeName).unlockedSessionLottie}
                    autoPlay
                    loop={false}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.sessionCirclesTextOverlay}>
                    <Text style={styles.sessionCirclesText}>{session.day_number}</Text>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.sessionCirclesContainer, { justifyContent: "center", alignItems: "center" }]}>
            <CustomIcon name={completedIcon} size={100} color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.sessionContent}>
        <Text style={[styles.sessionTitleText, { color: getChallengeAssets(challengeName).weekStepperText }]}>{session.title}</Text>
        <Text style={[styles.sessionDescriptionText, { color: getChallengeAssets(challengeName).weekStepperText }]}>{session.description}</Text>
      </View>
    </Pressable>
  );
}

/** Shown when the last session in the challenge is completed (e.g. "You did it!" card). */
export function LastCompletedSession({
  session,
  onPress,
  completedIcon,
  challengeName = DEFAULT_CHALLENGE_NAME,
  animateEntrance = false,
}: {
  session: ChallengeSession;
  onPress: () => void;
  completedIcon: CustomIconName;
  challengeName?: string;
  animateEntrance?: boolean;
}) {
  return (
    <View
      style={[
        styles.specificSessionContainer,
        styles.nonEffectiveSessionContainer,
        { gap: 25, backgroundColor: getChallengeAssets(challengeName).completedSessionBackground },
      ]}
    >
      <View style={styles.todayDotContainer}>
        <CustomIcon name="todayDot" size={6} color={colors.primary} />
        <Text style={styles.eyebrowText}>TODAY</Text>
      </View>

      <View style={styles.sessionCirclesContainer}>
        <View style={[StyleSheet.absoluteFill, styles.sessionCirclesContainer, { justifyContent: "center", alignItems: "center" }]}>
          <CustomIcon name={completedIcon} size={100} color={colors.primary} />
        </View>
      </View>

      <View style={styles.sessionContent}>
        <Text style={[styles.sessionTitleText, { color: getChallengeAssets(challengeName).weekStepperText }]}>You did it!</Text>
        <Text style={[styles.sessionDescriptionText, { color: getChallengeAssets(challengeName).weekStepperText }]}>
          {session.day_number} days of choosing yourself.{"\n"}This is just the beginning
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={onPress}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  phaseHeaderCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 360,
    overflow: "hidden",
    gap: 16,
  },
  phaseHeaderEyebrow: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1,
    color: colors.black50,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  phaseHeaderTitle: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 24,
    lineHeight: 24 * 1.2,
  },
  specificSessionContainer: {
    width: "100%",
    borderRadius: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 70,
    borderWidth: 1,
    borderColor: colors.black5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 100,
  },
  nonEffectiveSessionContainer: {
    width: "88%",
    backgroundColor: colors.white,
  },
  sessionCirclesContainer: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  trophyContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    position: "relative",
    borderWidth: 1,
    borderColor: colors.black5,
  },
  trophyText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.white,
    textAlign: "center",
    position: "absolute",
    top: 14
  },
  flipPerspective: {
    transform: [{ perspective: 1000 }],
  },
  sessionCirclesTextOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionCirclesText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 24,
    lineHeight: 24 * 1.4,
    color: colors.white,
    textAlign: "center",
    zIndex: 1,
  },
  sessionContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2.5,
  },
  sessionTitleText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    textAlign: "center",
  },
  sessionDescriptionText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    textAlign: "center",
  },
  primaryButton: {
    width: 143,
    height: 53.25,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
  },
  primaryButtonText: {
    fontFamily: InterFont.BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.white,
    textAlign: "center",
    letterSpacing: 0.8,
  },
  eyebrowText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  todayDotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  lockedText: {
    color: colors.black50,
  },
  dashedConnectorContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  dashedSegment: {
    width: 4,
    height: 8,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
});