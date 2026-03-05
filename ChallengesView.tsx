import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Easing,
} from "react-native";
import { Challenge } from "@/lib/api/response/challenge";
import { colors } from "@/constants/sharedStyles";
import { getChallengeAssets } from "../constants";
import { CustomIcon } from "@/components/ui/IconCustom";
import { ForrestFont, InterFont } from "@/constants/fonts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Card dimensions — active card takes ~80% screen width, left-aligned with padding
const SIDE_PADDING = 24;
const CARD_WIDTH = SCREEN_WIDTH - SIDE_PADDING * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.56;

// How far peek cards are offset (stacked behind to the right)
const PEEK_OFFSET_1 = 36; // 1st peek card X nudge
const PEEK_OFFSET_2 = 64; // 2nd peek card X nudge

// Drag distance per "page" so position moves 1.0 per full card width
const DRAG_SCALE = 0.85; // Slight resistance so a full swipe ≈ 1 card

const ORB_SIZE: Record<string, number> = {
  "Emotional Detox": 36,
  "Self-love": 36,
  "Inner child healing": 40,
  "Boundaries": 40,
  "Confidence": 55,
};

export type ChallengesViewProps = {
  onOpenChallengeDetail?: (challenge: Challenge) => void;
  activeChallenges: Challenge[];
  comingSoonChallenges: Challenge[];
};

export default function ChallengesView({onOpenChallengeDetail, activeChallenges, comingSoonChallenges }: ChallengesViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const allChallenges = [
    ...activeChallenges.map((c) => ({ ...c, isComingSoon: false })),
    ...comingSoonChallenges.map((c) => ({ ...c, isComingSoon: true })),
  ];
  const allChallengesRef = useRef(allChallenges);
  allChallengesRef.current = allChallenges;
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const isDragging = useRef(false);
  const dragStartTime = useRef(0);

  // Single continuous "position" (float): 0 = first card active, 1 = second, etc.
  // All card transforms are derived from this so the deck moves as one (browsing feel).
  const position = useRef(new Animated.Value(0)).current;

  // Set initial position when challenges load (e.g. async)
  React.useEffect(() => {
    if (allChallenges.length > 0) {
      position.setValue(activeIndexRef.current);
    }
  }, [allChallenges.length, position]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5,

      onPanResponderGrant: () => {
        isDragging.current = true;
        dragStartTime.current = Date.now();
      },

      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const activeI = activeIndexRef.current;
        const len = allChallengesRef.current.length;
        // Move position with finger: drag left (dx < 0) → position increases (next card)
        const dragDelta = (-dx / CARD_WIDTH) * DRAG_SCALE;
        const nextPos = Math.max(0, Math.min(len - 1, activeI + dragDelta));
        position.setValue(nextPos);
      },

      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        const velocity = gestureState.vx;
        const dx = gestureState.dx;
        const len = allChallengesRef.current.length;

        // Read current position (we'll get it from a listener or assume activeIndex + remainder)
        const dragDelta = (-dx / CARD_WIDTH) * DRAG_SCALE;
        const currentPos = activeIndexRef.current + dragDelta;
        const threshold = Math.abs(dx) > 60 || Math.abs(velocity) > 0.35;

        let targetIndex = Math.round(currentPos);
        if (threshold && dx < 0 && activeIndexRef.current < len - 1) {
          targetIndex = Math.min(len - 1, activeIndexRef.current + 1);
        } else if (threshold && dx > 0 && activeIndexRef.current > 0) {
          targetIndex = Math.max(0, activeIndexRef.current - 1);
        } else {
          targetIndex = Math.max(0, Math.min(len - 1, Math.round(currentPos)));
        }

        setActiveIndex(targetIndex);
        // Single smooth animation to target index — one continuous motion, no shuffle
        Animated.timing(position, {
          toValue: targetIndex,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },

      onPanResponderTerminate: () => {
        isDragging.current = false;
        const targetIndex = activeIndexRef.current;
        Animated.timing(position, {
          toValue: targetIndex,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const jumpToIndex = useCallback(
    (i: number) => {
      setActiveIndex(i);
      Animated.timing(position, {
        toValue: i,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [position]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerSubtitleText}>
          Browse from our collection of challenges{"\n"}to kickstart your healing.
        </Text>
      </View>

      {/* Carousel — each card's transform derived from single position (browsing feel) */}
      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        {allChallenges.map((challenge, index) => {
          const diff = index - activeIndex;
          const isHidden = diff < 0 || diff > 2;
          const challengeAssets = getChallengeAssets(challenge.name);
          // diff = index - position (animated) so all cards move in one continuous motion
          const animDiff = Animated.add(Animated.multiply(position, -1), index);
          const translateX = animDiff.interpolate({
            inputRange: [-1, 0, 1, 2, 3],
            outputRange: [-CARD_WIDTH, 0, PEEK_OFFSET_1, PEEK_OFFSET_2, PEEK_OFFSET_2 + 20],
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = animDiff.interpolate({
            inputRange: [-1, 0, 1, 2, 3],
            outputRange: [0.75, 1, 0.9, 0.8, 0.72],
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const opacity = animDiff.interpolate({
            inputRange: [-1, 0, 1, 2, 3],
            outputRange: [0, 1, 1, 0.7, 0],
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <Animated.View
              key={challenge.name}
              pointerEvents={isHidden ? "none" : "auto"}
              style={[
                styles.cardWrapper,
                {
                  zIndex: 30 - diff * 10,
                  transform: [{ translateX }, { scale }],
                  opacity,
                },
              ]}
            >
              <ImageBackground
                source={challengeAssets.backgroundList}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                imageStyle={styles.cardBackgroundImage}
              />
              <View style={styles.card}>

                {/* Top row */}
                <View style={styles.topRow}/>

                {/* Center */}
                <View style={styles.centerContent}>
                  <CustomIcon
                    name={challengeAssets.orbIcon}
                    size={ORB_SIZE[challenge.name]}
                    color={challengeAssets.titleText}
                  />
                  <Text style={[styles.cardTitleText, { color: challengeAssets.titleText }]}>
                    {challenge.name}
                  </Text>
                  <Text style={[styles.cardDescriptionText, { color: challengeAssets.titleText }]}>
                    {challenge.description}
                  </Text>
                </View>

                {/* Button */}
                <View style={styles.buttonRow}>
                  <Pressable
                    disabled={challenge.isComingSoon}
                    onPress={() => onOpenChallengeDetail?.(challenge)}
                    style={[styles.primaryButton, { opacity: challenge.isComingSoon ? 0.5 : 1 }]}
                  >
                    <Text style={styles.buttonText}>
                      {challenge.isComingSoon ? "Coming Soon" : "Open Plan"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {allChallenges.map((_, i) => (
          <Pressable key={i} onPress={() => jumpToIndex(i)}>
            <View
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "flex-start",
    backgroundColor: colors.lightGray,
  },
  headerContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 22,
    marginBottom: 36,
    paddingTop: 20,
    gap: 10,
  },
  headerTitleText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 24,
    color: colors.primary,
    lineHeight: 24 * 1.2,
  },
  headerSubtitleText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.newGrey,
    textAlign: "center",
  },
  carouselContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginLeft: SIDE_PADDING,
    position: "relative",
  },
  cardWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  cardBackgroundImage: {
    borderRadius: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    opacity: 0,
  },
  topRowLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  infoIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  cardTitleText: {
    fontSize: 24,
    fontFamily: ForrestFont.MEDIUM,
    lineHeight: 24 * 1.4,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  cardDescriptionText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    paddingHorizontal: 20,
    textAlign: "center",
    opacity: 0.5
  },
  buttonRow: {
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: colors.white,
    width: 189,
    height: 53,
    borderRadius: 46.47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: InterFont.BOLD,
    lineHeight: 16 * 1.4,
    letterSpacing: 0.3,
    color: colors.black,
  },
  ctaButtonTextDisabled: {
    opacity: 0.45,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 36,
    width: "100%",
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 7,
    backgroundColor: colors.black,
  },
  dotInactive: {
    width: 7,
    backgroundColor: colors.black30,
  },
});