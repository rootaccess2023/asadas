import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CustomIcon } from '@/components/ui/IconCustom';
import { colors } from '@/constants/sharedStyles';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ForrestFont, InterFont } from '@/constants/fonts';
import type { UserChallenge } from '@/lib/api/response/challenge';
import { getChallengeAssets } from '../constants';

type CompletedChallengeCardProps = {
  challenge: UserChallenge;
  onCompleteChallenge?: (challenge: UserChallenge) => Promise<boolean> | boolean;
  infoPress?: () => void;
};

export default function CompletedChallengeCard({ challenge, onCompleteChallenge, infoPress }: CompletedChallengeCardProps) {
  const challengeName = challenge.challenge?.name ?? 'this challenge';
  const totalSessions = challenge.challenge?.number_of_sessions ?? 21;

  const handleStartNewChallenge = async () => {
    if (onCompleteChallenge) {
      const success = await onCompleteChallenge(challenge);
      if (!success) return;
    }
    router.push('/challenge' as any);
  };

  const handleReviewJourney = async () => {
    if (!challenge.slug) return;
    if (onCompleteChallenge) {
      const success = await onCompleteChallenge(challenge);
      if (!success) return;
    }
    router.push({
      pathname: '/challenge/challenge-details/[slug]',
      params: { slug: challenge.slug, showDoneButton: 'true' },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View>
        <View style={styles.topRow}>
          <View style={{ width: 20 }} />
          <Text style={styles.topRowText}>YOUR CHALLENGE</Text>
          <Pressable hitSlop={12} onPress={infoPress}>
            <CustomIcon name="info" size={20} color={colors.newBlack80} />
          </Pressable>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.iconContainer}>
            <CustomIcon name={getChallengeAssets(challengeName).orbIcon} size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: getChallengeAssets(challengeName).titleText }]}>Challenge {'\n'}completed!</Text>
          <Text style={[styles.subtitle, { color: getChallengeAssets(challengeName).titleText }]}>
            You've done all {totalSessions} sessions of {'\n'} the {challengeName} challenge.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.bottomSection}>
        <Pressable style={styles.primaryButton} onPress={handleStartNewChallenge}>
          <Text style={styles.primaryButtonText}>Start a new challenge</Text>
        </Pressable>
        <Pressable onPress={handleReviewJourney} style={styles.secondaryLink}>
          <Text style={styles.secondaryLinkText}>Review your journey</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 30,
    paddingHorizontal: 22,
  },
  topRowText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 15,
    lineHeight: 15,
    letterSpacing: 0.75,
    textAlign: 'center',
    color: colors.primary80,
  },
  centerSection: {
    alignItems: 'center',
    paddingTop: 4,
    gap: 20,
  },
  title: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 33.6,
    letterSpacing: 0,
    textAlign: 'center',
    paddingBottom: 8,
  },
  subtitle: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    letterSpacing: 0,
    textAlign: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    minWidth: 189,
    height: 53,
    borderRadius: 46.47,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontFamily: InterFont.BOLD,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: colors.newBlack,
  },
  secondaryLink: {
    paddingVertical: 8,
  },
  secondaryLinkText: {
    fontFamily: InterFont.BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    textAlign: 'center',
    color: colors.newGrey,
  },
  iconContainer: {
    marginTop: '20%',
  },
});
