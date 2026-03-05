import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CustomIcon } from '@/components/ui/IconCustom';
import { colors } from '@/constants/sharedStyles';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ForrestFont, InterFont } from '@/constants/fonts';

type StartChallengeCardProps = {
  onInfoPress?: () => void;
};

export default function StartChallengeCard({ onInfoPress }: StartChallengeCardProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View>
        <View style={styles.topRow}>
          <View style={{ width: 20 }} />
          <Text style={styles.topRowText}>CHALLENGE</Text>
          <Pressable hitSlop={12} onPress={onInfoPress}>
            <CustomIcon name="info" size={20} color={colors.newBlack80} />
          </Pressable>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.iconContainer}>
            <CustomIcon name="startChallenge" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>
            Start a challenge
          </Text>
          <Text style={styles.subtitle}>
            Evidence-based programs {"\n"}
            designed to build lasting change.
          </Text>
        </View>
      </View>

      {/* Browse Challenges Button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/challenge' as any)}>
          <Text style={styles.primaryButtonText}>
            Browse challenges
          </Text>
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
  centerSection: {
    alignItems: 'center',
    paddingTop: 4,
    gap: 12,
  },
  title: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 33.6,
    letterSpacing: 0,
    textAlign: 'center',
    color: colors.primary,
    paddingBottom: 8,
  },
  subtitle: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    color: colors.newGrey,
  },
  topRowText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 15,
    lineHeight: 15,
    letterSpacing: 0.75,
    textAlign: 'center',
    color: colors.primary80,
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
  iconContainer: {
    marginTop: 12
  },
});
