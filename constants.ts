import { type CustomIconName } from "@/components/ui/IconCustom";
import { colors } from "@/constants/sharedStyles";

export type ChallengeAssets = {
  orb: any;
  background: any;
  backgroundList: any;
  backgroundCard: any;
  historyOrb: any;
  sessionIcon: CustomIconName;
  completedIcon: CustomIconName;
  progressColor: string;
  titleText: string;
  headerText: string;
  orbText: string;
  weekStepperText: string;
  taskBackground: string;
  restartGradient: string[];
  challengeLockedIcon: CustomIconName;
  icon: CustomIconName;
  orbIcon: CustomIconName;
  detailsCompletedIcon: CustomIconName;
  unlockedSessionLottie: any;
  completeBackground: string;
  completedSessionBackground: string;
  lastLockedSessionIcon: CustomIconName;
  fullGuideBackground: string;
};

export const DEFAULT_CHALLENGE_NAME = "Emotional Detox";

/** Coming-soon challenges: only specify assets that exist; rest fall back to DEFAULT_ASSETS. */
export type ComingSoonChallengeAssets = Partial<ChallengeAssets>;

export const CHALLENGE_ASSETS: Record<string, ChallengeAssets | ComingSoonChallengeAssets> = {
  "Emotional Detox": {
    orb: require("@/assets/images/challenge/emo-detox-orb.png"),
    background: require("@/assets/images/challenge/phase-orb-emo-detox.png"),
    backgroundList: require("@/assets/images/challenge/emo-detox-list.png"),
    backgroundCard: require("@/assets/images/challenge/emo-detox.png"),
    historyOrb: require("@/assets/images/challenge/emo-detox-orb-history.png"),
    sessionIcon: "emoDetoxSessionCircles",
    completedIcon: "emoDetoxSessionCompleted",
    progressColor: colors.lightSlateBlue,
    titleText: colors.white,
    headerText: colors.newGrey,
    orbText: colors.white,
    weekStepperText: colors.primary,
    taskBackground: colors.lightSlateBlue80,
    restartGradient: ["#80A2E7", "#E1EAFE", "#FFFFFF"],
    challengeLockedIcon: "challengeLockedEmoDetox",
    icon: "emotionalDetox",
    orbIcon: "emotionalDetoxWhite",
    detailsCompletedIcon: "emoDetoxCompletedSession",
    unlockedSessionLottie: require("@/assets/images/illustrations/challenge/unlockedSessionEmoDetoxLottie.json"),
    completeBackground: colors.lightSlateBlue,
    completedSessionBackground: colors.lightSlateBlue80,
    lastLockedSessionIcon: "emoDetoxTrophy",
    fullGuideBackground: colors.lightBlue80,
  },
  "Self-love": {
    orb: require("@/assets/images/challenge/self-love-orb.png"),
    background: require("@/assets/images/challenge/phase-orb-self-love.png"),
    backgroundList: require("@/assets/images/challenge/self-love-list.png"),
    backgroundCard: require("@/assets/images/challenge/self-love.png"),
    historyOrb: require("@/assets/images/challenge/self-love-orb-history.png"),
    sessionIcon: "selfLoveSessionCircles",
    completedIcon: "selfLoveSessionCompleted",
    progressColor: colors.lightPinkLight,
    titleText: colors.white,
    headerText: colors.newGrey,
    orbText: colors.white,
    weekStepperText: colors.purpleDark,
    taskBackground: colors.lightPink80,
    restartGradient: ["#C58BD2", "#F2D3FD", "#FFFFFF"],
    challengeLockedIcon: "challengeLockedSelfLove",
    icon: "selfLove",
    orbIcon: "selfLoveWhite",
    detailsCompletedIcon: "selfLoveCompletedSession",
    unlockedSessionLottie: require("@/assets/images/illustrations/challenge/unlockedSessionSelfLoveLottie.json"),
    completeBackground: colors.lightPink80,
    lastLockedSessionIcon: "selfLoveTrophy",
    fullGuideBackground: colors.lightPink80,
  },
  // Coming soon: only list/card assets; all other fields optional (fall back to DEFAULT_ASSETS).
  "Inner child healing": {
    titleText: colors.white,
    headerText: colors.newGrey,
    icon: "innerChildHealing",
    orbIcon: "innerChildHealingWhite",
    backgroundList: require("@/assets/images/challenge/inner-child-healing-list.png"),
  },
  "Boundaries": {
    titleText: colors.lightBlue,
    headerText: colors.white,
    icon: "boundaries",
    orbIcon: "boundariesWhite",
    backgroundList: require("@/assets/images/challenge/boundaries-list.png"),
  },
  "Confidence": {
    titleText: colors.lightBlue2,
    headerText: colors.white,
    icon: "confidence",
    orbIcon: "confidenceWhite",
    backgroundList: require("@/assets/images/challenge/confidence-list.png"),
  },
};

export const DEFAULT_ASSETS: ChallengeAssets = {
  orb: require("@/assets/images/challenge/emo-detox-orb.png"),
  background: require("@/assets/images/challenge/phase-orb-emo-detox.png"),
  backgroundList: require("@/assets/images/challenge/emo-detox-list.png"),
  backgroundCard: require("@/assets/images/challenge/emo-detox.png"),
  historyOrb: require("@/assets/images/challenge/emo-detox-orb-history.png"),
  sessionIcon: "emoDetoxSessionCircles",
  completedIcon: "emoDetoxSessionCompleted",
  progressColor: colors.lightSlateBlue,
  titleText: colors.white,
  headerText: colors.black,
  orbText: colors.white,
  weekStepperText: colors.primary,
  taskBackground: colors.lightSlateBlue,
  restartGradient: ["#80A2E7", "#E1EAFE", "#FFFFFF"],
  challengeLockedIcon: "challengeLockedEmoDetox",
  icon: "emotionalDetox",
  orbIcon: "emotionalDetoxWhite",
  detailsCompletedIcon: "emoDetoxCompletedSession",
  unlockedSessionLottie: require("@/assets/images/illustrations/challenge/unlockedSessionEmoDetoxLottie.json"),
  completeBackground: colors.lightSlateBlue,
  completedSessionBackground: colors.lightPink80,
  lastLockedSessionIcon: "emoDetoxTrophy",
  fullGuideBackground: colors.lightBlue80,
};

// Get assets for a challenge by name.
// Merges partial (coming-soon) entries with DEFAULT_ASSETS; full entries used as-is.
export function getChallengeAssets(challengeName: string): ChallengeAssets {
  const entry = CHALLENGE_ASSETS[challengeName];
  if (!entry) return DEFAULT_ASSETS;
  return { ...DEFAULT_ASSETS, ...entry } as ChallengeAssets;
}
