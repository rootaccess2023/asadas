import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import BottomSheetModal, { type BottomSheetModalRef } from "@/components/ui/BottomSheetModal";
import { colors } from "@/constants/sharedStyles";
import { ForrestFont, InterFont } from "@/constants/fonts";

type ArchiveChallengeProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function ArchiveChallenge({
  visible,
  onClose,
  onConfirm,
  onCancel,
}: ArchiveChallengeProps) {
  const modalRef = useRef<BottomSheetModalRef>(null);

  const handleConfirm = () => {
    modalRef.current?.closeWithAnimation(() => onConfirm());
  };

  const handleCancel = () => {
    modalRef.current?.closeWithAnimation(() => onCancel?.());
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      visible={visible}
      onClose={onClose}
      showHandle={true}
      closeButton={false}
      height={0.35}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Move to archive?</Text>
          <Text style={styles.description}>
            Your progress will be saved{'\n'}
            and can be resumed anytime.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={styles.linkText}>Cancel</Text>
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
    paddingVertical: 50,
    gap: 16,
  },
  headerContainer: {
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
    color: colors.primary,
    lineHeight: 16 * 1.4,
    marginBottom: 8,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    gap: 8,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 100,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: InterFont.BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
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
    color: colors.black50,
  },
});
