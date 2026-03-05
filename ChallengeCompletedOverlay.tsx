import React from "react";
import { View, Text, Pressable, ImageBackground, StyleSheet } from "react-native";
import { getChallengeAssets } from "../constants";
import { ForrestFont, InterFont } from "@/constants/fonts";
import { colors } from "@/constants/sharedStyles";
import LottieView from "lottie-react-native";

export type ChallengeCompletedOverlayProps = {
  visible: boolean;
  onClose: () => void;
  userName: string;
  challengeName: string;
  tasksCompleted: number;
  daysOfShowingUp: number;
  onAccessWork: () => void;
};

export default function ChallengeCompletedOverlay({
  visible,
  onClose,
  userName,
  challengeName,
  tasksCompleted,
  daysOfShowingUp,
  onAccessWork,
}: ChallengeCompletedOverlayProps) {
  const handleAccessWork = () => {
    onAccessWork();
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: getChallengeAssets(challengeName).completeBackground }]} pointerEvents="box-none">
      <LottieView
        source={require("@/assets/images/illustrations/confetti-v2.json")}
        autoPlay
        loop={false}
        style={styles.confetti}
      />
      <View style={styles.content}>
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingText, { color: getChallengeAssets(challengeName).titleText }]}>
            {userName}, you completed the {challengeName} challenge!
          </Text>
        </View>
        
        {/* Tasks completed and days of showing up */}
        <View style={styles.tasksContainer}>
          <View style={styles.tasksItem}>
            <Text style={[styles.tasksItemText, { color: getChallengeAssets(challengeName).titleText }]}>{tasksCompleted}</Text>
            <Text style={[styles.tasksItemTextDescription, { color: getChallengeAssets(challengeName).titleText }]}>tasks completed</Text>
          </View>
          <View style={styles.tasksItem}>
            <Text style={[styles.tasksItemText, { color: getChallengeAssets(challengeName).titleText }]}>{daysOfShowingUp}</Text>
            <Text style={[styles.tasksItemTextDescription, { color: getChallengeAssets(challengeName).titleText }]}>days of showing up{'\n'}for yourself</Text>
          </View>
        </View>

        {/* Access your work button */}
        <Pressable style={styles.secondaryButton} onPress={handleAccessWork}>
          <Text style={styles.secondaryButtonText}>Access your work</Text>
        </Pressable>
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
    width: "100%",
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 22,
  },
  cardBackground: {
    flex: 1,
    width: "100%",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    fontSize: 28,
    fontFamily: ForrestFont.MEDIUM,
    lineHeight: 28 * 1.2,
    textAlign: "center",
  },
  greetingContainer: {
    paddingHorizontal: 24,
  },
  secondaryButton: {
    height: 53.25,
    width: "100%",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontFamily: InterFont.BOLD,
    color: colors.black,
    lineHeight: 18 * 1.4,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  tasksContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 40,
  },
  tasksItem: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  tasksItemText: {
    fontSize: 64,
    fontFamily: InterFont.BOLD,
    lineHeight: 64 * 1.1,
    textAlign: "center",
  },
  tasksItemTextDescription: {
    fontSize: 16,
    fontFamily: InterFont.REGULAR,
    lineHeight: 16 * 1.4,
    textAlign: "center",
  },
  confetti: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
});