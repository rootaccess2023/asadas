import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import BottomSheetModal, { type BottomSheetModalRef } from "@/components/ui/BottomSheetModal";
import { colors } from "@/constants/sharedStyles";
import { ForrestFont, InterFont } from "@/constants/fonts";

type ResetProgressProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function ResetProgress({
  visible,
  onClose,
  onConfirm,
  onCancel,
}: ResetProgressProps) {
  const modalRef = useRef<BottomSheetModalRef>(null);
  const skippingCancelRef = useRef(false);

  const handleConfirm = () => {
    skippingCancelRef.current = true;
    modalRef.current?.closeWithAnimation(() => {
      onConfirm();
      skippingCancelRef.current = false;
    });
  };

  const handleCancel = () => {
    modalRef.current?.closeWithAnimation(() => onCancel?.());
  };

  const handleBottomSheetClose = useCallback(() => {
    onClose();
    if (!skippingCancelRef.current) {
      onCancel?.();
    }
  }, [onClose, onCancel]);

  return (
    <BottomSheetModal
      ref={modalRef}
      visible={visible}
      onClose={handleBottomSheetClose}
      showHandle={true}
      closeButton={false}
      height={0.35}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Reset this challenge?</Text>
          <Text style={styles.description}>
            This will restart the challenge from day one and delete all your work and progress.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
          {onCancel && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          )}
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
  secondaryButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 100,
    backgroundColor: colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    letterSpacing: 0.5,
    color: colors.deleteRed,
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