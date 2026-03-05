import { Challenge } from "@/lib/api/response/challenge";
import BottomSheetModal, { type BottomSheetModalRef } from "@/components/ui/BottomSheetModal";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { useState } from "react";
import { colors, sharedStyles } from "@/constants/sharedStyles";
import { ScrollView } from "react-native-gesture-handler";
import { CustomIcon, type CustomIconName } from "@/components/ui/IconCustom";
import { startChallenge } from "@/lib/api/challenge";
import { Alert } from "react-native";
import type { RefObject } from "react";
import LottieView from "lottie-react-native";
import { ForrestFont, InterFont } from "@/constants/fonts";
import { LinearGradient } from "expo-linear-gradient";

type ChallengeDetailProps = {
  visible: boolean;
  onClose: () => void;
  onStartSuccess?: () => void;
  challenge: Challenge | null;
  modalRef: RefObject<BottomSheetModalRef | null>;
};

export default function ChallengeDetail({ visible, onClose, onStartSuccess, challenge, modalRef }: ChallengeDetailProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 2;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    onClose();
  };

  const handleStartChallenge = async () => {
    if (!challenge?.slug) return;
    
    setIsLoading(true);
    
    try {
      await startChallenge(challenge.slug);
      onStartSuccess?.();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to start challenge. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    if (!challenge) return null;
    switch (currentStep) {
      case 1:
        return <EmotionalDetox
                challenge={challenge}
                setCurrentStep={setCurrentStep}
                handleClose={handleClose}
                handleStartChallenge={handleStartChallenge}
                />;
      case 2:
        return <LearnTheScience 
                challenge={challenge} 
                handleStartChallenge={handleStartChallenge}
                />;
      default:
        return null;
    }
  };

  return (
    <BottomSheetModal ref={modalRef} height={0.9} visible={visible} showHandle={false} onClose={handleClose} sheetPaddingHorizontal={false}>
      {/* Main container*/}
      <View style={{ flex: 1, gap: 10 }}>
        
        {/* Scrollable Content */}
        <View style={{ flex: 1 }}>
          {renderStepContent()}
        </View>

      </View>
    </BottomSheetModal>
  );
}

const PHASE_ICONS: Record<string, [CustomIconName, number][]> = {
  'Emotional Detox': [
    ['emoDetoxWeek1', 65],
    ['emoDetoxWeek2', 53],
    ['emoDetoxWeek3', 55],
    ['emoDetoxWeek4', 75],
  ],
  'Self-love': [
    ['selfLoveWeek1', 60],
    ['selfLoveWeek2', 48],
    ['selfLoveWeek3', 55],
    ['selfLoveWeek4', 50],
  ],
};

const DEFAULT_PHASE_ICONS: CustomIconName[] = ['emoDetoxWeek1', 'emoDetoxWeek2', 'emoDetoxWeek3', 'emoDetoxWeek4'];
const DEFAULT_PHASE_ICON_SIZE = 53;

const getPhaseIconName = (challengeName: string, index: number): CustomIconName => {
  return PHASE_ICONS[challengeName]?.[index]?.[0] ?? 'emoDetoxWeek1';
};

const getPhaseIconSize = (challengeName: string, index: number): number => {
  return PHASE_ICONS[challengeName]?.[index]?.[1] ?? DEFAULT_PHASE_ICON_SIZE;
};

function EmotionalDetox({ 
  challenge, 
  setCurrentStep, 
  handleClose,
  handleStartChallenge,
}: 
{ 
  challenge: Challenge, 
  setCurrentStep: (step: number) => void, 
  handleClose: () => void,
  handleStartChallenge: () => void,
}) {

  // Challenge Data
  const tagline = challenge.emotional_detox?.tagline ?? challenge.description;
  const introText = challenge.emotional_detox?.intro_text;
  const gains = challenge.emotional_detox?.gains ?? [];
  const weeks = challenge.emotional_detox?.weeks ?? [];

  // Lottie
  const EmotionalDetoxLottie = require('@/assets/images/illustrations/challenge/challengeEmotionalDetox.json');
  const SelfLoveLottie = require('@/assets/images/illustrations/challenge/challengeSelfLove.json');

  // Map challenge names to Lottie animations with config
  const lottieAnimations: Record<string, { source: any; width: number; height: number }> = {
    'Emotional Detox': 
      { source: EmotionalDetoxLottie, 
        width: 176, 
        height: 176 
      },
    'Self-love':
      { source: SelfLoveLottie,
        width: 197,
        height: 1000 
      },
  };

  // Default config
  const defaultLottieConfig = {
    source: EmotionalDetoxLottie,
    width: 176,
    height: 176,
  };

  // Get the appropriate Lottie animation, defaulting to EmotionalDetoxLottie
  const lottieIllustration = lottieAnimations[challenge.name] ?? defaultLottieConfig;

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.modalContainer]}
      >
        {/* Challenge Overview */}
        <View style={[styles.challengeOverviewContainer]}>

          {/* Lottie Animation */}
          <View style={styles.lottieContainer}>
            <LottieView
              source={lottieIllustration.source}
              autoPlay={true}
              loop={true}
              style={{ width: lottieIllustration.width, height: lottieIllustration.height }}
            />
          </View>
          <Text style={[styles.titleText, { marginBottom: 10}]}>
            {challenge.name}
          </Text>
          <View style={{ gap: 20}}>
            <Text style={[styles.paragraphText]}>
              {tagline}
            </Text>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
              <Text style={[styles.sessionText]}>
                {challenge.number_of_sessions} sessions
              </Text>
            </View>
          </View>
        </View>
        
        {/* What to expect */}
        <View style={{ width: '100%', marginTop: 100}}>
          <Text style={styles.eyebrowText}>
            WHAT TO EXPECT
          </Text>
        </View>

        {/* WHAT TO EXPECT CONTENT */}
        <View style={{ marginTop: 20 }}>
          {weeks.map((week, index) => (
            <View
              key={index}
              style={[styles.whatToExpectContainer, { marginBottom: 18 }]}
            >
              <View style={styles.whatToExpectIconContainer}>
                <CustomIcon
                  name={getPhaseIconName(challenge.name, index)}
                  size={getPhaseIconSize(challenge.name, index)}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignContent: 'center', gap: 8 }}>
                  <Text style={styles.whatToExpectPhaseText}>
                    Phase {index + 1}:
                  </Text>

                  <Text style={styles.whatToExpectTitleText}>
                    {week.title}
                  </Text>
                </View>

                <Text style={styles.whatToExpectDescriptionText}>
                  {week.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* What you'll gain */}
        {gains.length > 0 && (
          <>
            <View style={{ width: '100%', marginTop: 50, marginBottom: 20}}>
              <Text style={styles.eyebrowText}>
                WHAT YOU'LL GAIN
              </Text>
            </View>
            <View style={styles.whatYoullGainContainer}>
              {gains.map((gain, index) => {
                const isLastItem = index === gains.length - 1;
                return (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={styles.checkmarkCircle}>
                        <CustomIcon name="greenCheckMark" size={22} color={colors.white} />
                      </View>
                      {!isLastItem && <View style={styles.connectingLine} />}
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={styles.whatYoullGainText}>
                        {gain}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigationContainer}>
        <LinearGradient
            colors={["#e9e9e9", "#dde3f0CC", "#dde3f000"]}
            locations={[0, 0.8, 1]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
          />

        <Pressable onPress={handleStartChallenge} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start challenge</Text>
        </Pressable>

        <Pressable onPress={() => setCurrentStep(2)} style={styles.tertiaryButton}>
          <Text style={styles.tertiaryButtonText}>Learn the science</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Default science icon size and icons
const DEFAULT_SCIENCE_ICON_SIZE = 60;
const DEFAULT_SCIENCE_ICONS: CustomIconName[] = ['emoDetoxScience1', 'emoDetoxScience2', 'emoDetoxScience3', 'emoDetoxScience4'];

// Science icons for each challenge
const SCIENCE_ICONS: Record<string, CustomIconName[]> = {
  'Emotional Detox': ['emoDetoxScience1', 'emoDetoxScience2', 'emoDetoxScience3', 'emoDetoxScience4'],
  'Self-love':       ['selfLoveScience1', 'selfLoveScience2', 'selfLoveScience3'],
};

// Science icon sizes for each challenge
const SCIENCE_ICON_SIZES: Record<string, number[]> = {
  'Emotional Detox': [48, 75, 55, 60],
  'Self-love':       [60, 60, 60],
};

// Get the appropriate science icon name
const getScienceIconName = (challengeName: string, index: number): CustomIconName => {
  return SCIENCE_ICONS[challengeName]?.[index] ?? DEFAULT_SCIENCE_ICONS[index] ?? 'emoDetoxScience1';
};

// Get the appropriate science icon size
const getScienceIconSize = (challengeName: string, index: number): number => {
  return SCIENCE_ICON_SIZES[challengeName]?.[index] ?? DEFAULT_SCIENCE_ICON_SIZE;
};

function LearnTheScience({
    challenge, 
    handleStartChallenge,
  }: { 
    challenge: Challenge, 
    handleStartChallenge: () => void,
  }) {

  // Challenge Data
  const tagline = challenge.learn_the_science?.tagline ?? challenge.description;
  const topics = challenge.learn_the_science?.topics ?? [];

  // Lottie
  const LearnTheScienceLottie = require('@/assets/images/illustrations/challenge/challengeLearnTheScience.json');

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.modalContainer]}
      >
        {/* Challenge Overview */}
        <View style={styles.challengeOverviewContainer}>
          <View style={styles.lottieContainer}>
            {/* Lottie Animation */}
            <LottieView
              source={LearnTheScienceLottie}
              autoPlay={true}
              loop={true}
              style={{ width: 197, height: 197 }}
            />
          </View>
          <View style={{ gap: 10}}>
            <Text style={styles.titleText}>
              The science behind
            </Text>
            <Text style={styles.paragraphText}>
              {tagline}
            </Text>
          </View>
        </View>

        {/* Learn the science */}
        <View style={{ width: '100%', gap: 20, marginTop: 50 }}>
    
          {topics.map((topic, index) => (
            <View 
              key={index} 
              style={styles.learnTheScienceItemContainer}
            >
              <View style={styles.whatToExpectIconContainer}>
                <CustomIcon name={getScienceIconName(challenge.name, index)} size={getScienceIconSize(challenge.name, index)} color={colors.primary} />
              </View>
              <View style={styles.learnTheScienceTextContainer}>
                <Text style={styles.learnTheScienceTitleText}>
                  {topic.title}
                </Text>
                <Text style={styles.learnTheScienceDescriptionText}>
                  {topic.description}
                </Text>
              </View>
            </View>
          ))}

        </View>

        {/* Research Note */}
        <View style={styles.researchNoteContainer}>
          <View style={styles.researchNoteIconWrap}>
            <CustomIcon name="researchNote" opacity={0.5} size={12} color={colors.black50} />
          </View>
          <Text style={styles.researchNoteText}>
            Research suggests that structured interventions are more effective than relying on willpower alone.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNavigationContainer, { paddingBottom: 40 }]}>
        <LinearGradient
          colors={["#e9e9e9", "#dde3f0CC", "#dde3f000"]}
          locations={[0, 0.8, 1]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />

        <Pressable onPress={handleStartChallenge} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start challenge</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 28 * 1.2,
    color: colors.primary,
    textAlign: 'center',
  },
  paragraphText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sessionText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.black,
    textAlign: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.black5,
  },
  eyebrowText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1,
    color: colors.black50,
    textAlign: 'left',
    letterSpacing: 0.05,
  },
  modalContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 22,
    paddingBottom: 200
  },
  challengeOverviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Emotional Detox
  whatToExpectContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.black5,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  whatToExpectIconContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    width: 90,
    height: 90,
    flexShrink: 0,
  },
  whatToExpectTitleText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.black,
  },
  whatToExpectPhaseText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.black,
  },
  whatToExpectDescriptionText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 12,
    lineHeight: 12 * 1.2,
    color: colors.black50,
    letterSpacing: 0.5,
  },
  whatYoullGainContainer: {
    width: '100%',
    backgroundColor: colors.exploreHealing,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.appleGreen,
    paddingHorizontal: 12,
    paddingVertical: 14
  },
  whatYoullGainText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.black,
  },
  lottieContainer: {
    width: '100%',
    height: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
    position: 'relative',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
    width: 32,
  },
  checkmarkCircle: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  connectingLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#9CCB59',
    top: 4,
    left: 15,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 24,
  },
  primaryButton: {
    width: '100%',
    height: 53.25,
    backgroundColor: colors.primary,
    borderRadius: 100,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: InterFont.BOLD,
    lineHeight: 16 * 1.4,
    letterSpacing: 0.02,
  },
  tertiaryButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: colors.black50,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    letterSpacing: 0.02,
    fontFamily: InterFont.BOLD,
  },
  bottomNavigationContainer: {
    paddingTop: 34,
    paddingBottom: 20,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 1000,
    paddingHorizontal: 22,
  },

  // Learn the science
  learnTheScienceItemContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 13,
    overflow: 'hidden',
  },
  learnTheScienceTextContainer: {
    flex: 1,
    minWidth: 0,
    gap: 2.5,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  researchNoteContainer: {
    width: '100%',
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  researchNoteIconWrap: {
    height: 12 * 2.5,
    justifyContent: 'flex-start',
    marginTop: 2.5,
  },
  researchNoteText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 12,
    lineHeight: 12 * 1.1,
    color: colors.black50,
    letterSpacing: 0.5,
    textAlign: 'center',
    flexShrink: 1,
    maxWidth: 300,
  },
  learnTheScienceTitleText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.black,
    flexShrink: 1,
    width: '100%',
  },
  learnTheScienceDescriptionText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    letterSpacing: 0.02,
    color: colors.black,
    flexShrink: 1,
    width: '100%',
  },

});
