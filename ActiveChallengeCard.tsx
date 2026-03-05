import React, { useState } from "react";
import { UserChallenge } from "@/lib/api/response/challenge";
import { Pressable, Text, View, StyleSheet, Image, LayoutChangeEvent } from "react-native";
import { CustomIcon } from "@/components/ui/IconCustom";
import { colors } from "@/constants/sharedStyles";
import { router } from "expo-router";
import { ForrestFont, InterFont } from "@/constants/fonts";
import { getChallengeAssets } from "../constants";
import { ChallengeProgressCircle } from "./ChallengeProgressCircle";

function usePhaseProgress(challenge: UserChallenge) {
  const { current_day } = challenge;
  const { number_of_sessions, emotional_detox } = challenge.challenge;
  const weeks = emotional_detox?.weeks ?? [];
  const totalSessions = number_of_sessions;

  // Estimate current phase (assume sessions distributed evenly across phases)
  const phaseCount = Math.max(1, weeks.length);
  const sessionsPerPhase = Math.ceil(totalSessions / phaseCount);
  const phaseIndex = Math.min(
    phaseCount - 1,
    Math.floor((current_day - 1) / sessionsPerPhase)
  );
  const phase = weeks[phaseIndex];
  const phaseTitle = phase?.title ?? `Phase ${phaseIndex + 1}`;
  const phaseLabel = `Phase ${phaseIndex + 1}: ${phaseTitle}`;

  // Session completion: current_day is 1-based (day you're on), so completed = current_day - 1
  const completedSessions = Math.max(0, current_day - 1);
  const progressFraction = `${String(current_day).padStart(2, "0")}/${totalSessions}`;
  // Fill = actual % of sessions completed (0 to 1), capped so ring never exceeds full
  const sessionCompletionRatio =
    totalSessions > 0 ? Math.min(1, completedSessions / totalSessions) : 0;

  return { phaseLabel, phaseTitle, progressFraction, sessionCompletionRatio };
}

type ActiveChallengeCardProps = {
  challenge: UserChallenge;
  onInfoPress?: () => void;
};

export default function ActiveChallengeCard({ challenge, onInfoPress }: ActiveChallengeCardProps) {
  const challengeData = challenge.challenge;
  const { phaseTitle, sessionCompletionRatio } = usePhaseProgress(challenge);
  const assets = getChallengeAssets(challengeData.name);
  const [circleSize, setCircleSize] = useState(280);

  const handleCircleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const size = Math.min(width, height);
    if (size > 0) {
      setCircleSize(size);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topRow}>
        <View style={{ width: 20 }} />
        <Text style={[styles.topRowText, { color: assets.headerText }]}>YOUR CHALLENGE</Text>
        <Pressable hitSlop={12} onPress={onInfoPress}>
          <CustomIcon name="info" size={20} color={colors.newBlack80} />
        </Pressable>
      </View>

      {/* Progress circle with icon, title, and phase pill */}
      <View style={styles.circleSection}>
        <View style={styles.circleContainer}>
          <Image
              source={assets.orb}
              style={styles.circleOrbImage}
              resizeMode="contain"
            />
          <View style={styles.circleWrapper} onLayout={handleCircleLayout}>
            <ChallengeProgressCircle
              progress={sessionCompletionRatio}
              size={circleSize}
              trackColor={colors.white20}
              progressColor={colors.white}
            >
              <CustomIcon name={assets.orbIcon} size={36} color={colors.white} />
              <Text style={[styles.circleTitle, { color: assets.orbText }]}>
                {challengeData.name}
              </Text>
              <Text style={styles.circlePill}>
                {phaseTitle}
              </Text>
            </ChallengeProgressCircle>
          </View>
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          onPress={() => router.push({ pathname: '/challenge/active-challenge', params: { slug: challengeData.slug } })}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    paddingBottom: 47,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    zIndex: 1,
  },
  topRowText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 15,
    lineHeight: 15,
    letterSpacing: 0.75,
    textAlign: 'center',
  },
  circleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  circleContainer: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 350,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  circleWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOrbImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    transform: [{ scale: 2.05 }],
  },
  circleTitle: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 33.6,
    letterSpacing: 0,
    textAlign: 'center',
    marginTop: 16,
  },
  circlePill: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.75,
    textAlign: 'center',
    color: colors.black,
    backgroundColor: colors.white50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 12,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: 189,
    height: 53,
    borderRadius: 46.47,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: InterFont.BOLD,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: colors.newBlack,
  },
});