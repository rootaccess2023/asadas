import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import BottomSheetModal, { type BottomSheetModalRef } from "@/components/ui/BottomSheetModal";
import { colors } from "@/constants/sharedStyles";
import { ForrestFont, InterFont } from "@/constants/fonts";

type ChallengeCompleteOptionProps = {
  visible: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onIllDoThisLater: () => void;
  /** Optional accent color for the primary button (e.g. challenge theme) */
  primaryButtonColor?: string;
};

export default function ChallengeCompleteOption({
  visible,
  onClose,
  onOpenHistory,
  onIllDoThisLater,
  primaryButtonColor = colors.primary,
}: ChallengeCompleteOptionProps) {
  const modalRef = useRef<BottomSheetModalRef>(null);

  const handleOpenHistory = useCallback(() => {
    modalRef.current?.closeWithAnimation(() => onOpenHistory());
  }, [onOpenHistory]);

  const handleIllDoThisLater = useCallback(() => {
    modalRef.current?.closeWithAnimation(() => onIllDoThisLater());
  }, [onIllDoThisLater]);

  return (
    <BottomSheetModal
      ref={modalRef}
      visible={visible}
      onClose={onClose}
      showHandle={false}
      closeButton={true}
      height={0.37}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Access your completed challenges!</Text>
          <Text style={styles.description}>
            Look back on the times on how you did the work! View your history and archives now.
          </Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryButtonColor ?? colors.primary }]}
            onPress={handleOpenHistory}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Open History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleIllDoThisLater}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>I'll do this later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  header: {
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 24,
    color: colors.primary,
    lineHeight: 24 * 1.2,
    textAlign: "center",
  },
  description: {
    fontFamily: InterFont.REGULAR,
    fontSize: 16,
    color: colors.primary80,
    lineHeight: 16 * 1.4,
    marginBottom: 8,
    textAlign: "center",
  },
  buttons: {
    width: "100%",
    gap: 8,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: InterFont.BOLD,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    letterSpacing: 0.5,
    color: colors.white,
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: InterFont.BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    letterSpacing: 0.5,
    color: colors.newGrey,
  },
});
