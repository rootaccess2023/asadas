import { CustomIcon } from "@/components/ui/IconCustom";
import { colors } from "@/constants/sharedStyles";
import { fetchChallengesData, fetchUserChallenges, deleteChallenges } from "@/lib/api/challenge";
import { Challenge, ChallengesData, UserChallenge } from "@/lib/api/response/challenge";
import { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { InterFont } from "@/constants/fonts";
import { ToastHost, showToast } from "@/components/ui/Toast";
import ChallengeDetail from "@/app/challenge/components/ChallengeDetail";
import ChallengesView from "@/app/challenge/components/ChallengesView";
import ChallengeHistoryView from "@/app/challenge/components/ChallengeHistoryView";
import DeleteChallenge, { type DeleteChallengeModalRef } from "@/components/ui/DeleteChallenge";
import type { BottomSheetModalRef } from "@/components/ui/BottomSheetModal";

type DisplayMode = "challenges" | "history";

export default function ChallengeList() {
  const router = useRouter();
  const { displayMode: displayModeParam, toast: toastParam } = useLocalSearchParams<{
    displayMode?: string;
    toast?: string;
  }>();

  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    displayModeParam === "history" ? "history" : "challenges"
  );
  const [isHistorySelectMode, setIsHistorySelectMode] = useState(false);
  const [selectedPastChallengeSlugs, setSelectedPastChallengeSlugs] = useState<
    string[]
  >([]);
  const [deleteChallengeVisible, setDeleteChallengeVisible] = useState(false);
  const [isDeletingChallenges, setIsDeletingChallenges] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [comingSoonChallenges, setComingSoonChallenges] = useState<Challenge[]>(
    []
  );
  const [pastChallenges, setPastChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengeDetailVisible, setChallengeDetailVisible] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const detailModalRef = useRef<BottomSheetModalRef>(null);
  const deleteModalRef = useRef<DeleteChallengeModalRef>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const deleteToastOpacity = useRef(new Animated.Value(0)).current;
  const deleteToastTranslateY = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    fetchChallengesData().then((data: ChallengesData | null) => {
      if (data) {
        setActiveChallenges(data.data.active || []);
        setComingSoonChallenges(data.data.coming_soon || []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (displayModeParam === "history") setDisplayMode("history");
    else if (displayModeParam === "challenges") setDisplayMode("challenges");
  }, [displayModeParam]);

  useEffect(() => {
    if (toastParam && typeof toastParam === "string") {
      showToast(toastParam, 100);
    }
  }, [toastParam]);

  useEffect(() => {
    if (displayMode !== "history" && isHistorySelectMode) {
      setIsHistorySelectMode(false);
      setSelectedPastChallengeSlugs([]);
    }
  }, [displayMode, isHistorySelectMode]);

  useEffect(() => {
    if (!isHistorySelectMode && selectedPastChallengeSlugs.length > 0) {
      setSelectedPastChallengeSlugs([]);
    }
  }, [isHistorySelectMode, selectedPastChallengeSlugs.length]);

  useEffect(() => {
    fetchUserChallenges().then(({ pastChallenges }) => {
      setPastChallenges(pastChallenges);
    });
  }, []);

  const togglePastChallengeSelected = (slug: string) => {
    setSelectedPastChallengeSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const showDeleteSuccessToast = () => {
    showToast("Deleted successfully!", 100);
  };

  const handleConfirmDeletePastChallenges = async (slugs: string[]) => {
    if (slugs.length === 0) return;
    setIsDeletingChallenges(true);
    const success = await deleteChallenges(slugs);
    setIsDeletingChallenges(false);
    if (!success) return;
    deleteModalRef.current?.closeWithAnimation(() => {
      setDeleteChallengeVisible(false);
      setIsHistorySelectMode(false);
      setSelectedPastChallengeSlugs([]);
      fetchUserChallenges().then(({ pastChallenges: next }) =>
        setPastChallenges(next)
      );
      showDeleteSuccessToast();
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
        locations={[0, 1]}
        style={styles.topGradient}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.navigationContainer}>
        <Pressable style={{ width: 80 }} onPress={() => router.back()}>
          <CustomIcon name="arrowLeft" size={30} color={colors.primary} />
        </Pressable>
        <Text style={styles.navigationText}>
          {displayMode === "challenges" ? "Browse" : "History"}
        </Text>
        {displayMode === "challenges" ? (
          <View style={{ width: 80 }} />
        ) : (
          <Pressable style={styles.selectButton} onPress={() => setIsHistorySelectMode((v) => !v)}>
            <Text style={styles.selectText}>
              {isHistorySelectMode ? "Cancel" : "Select"}
            </Text>
          </Pressable>
        )}
      </View>

      {displayMode === "challenges" ? (
        <View style={[styles.scrollViewContent, styles.scrollViewGrow]}>
          <ChallengesView
            activeChallenges={activeChallenges}
            comingSoonChallenges={comingSoonChallenges}
            loading={loading}
            onOpenChallengeDetail={(challenge) => {
              setSelectedChallenge(challenge);
              setChallengeDetailVisible(true);
            }}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            styles.scrollViewGrow,
            isHistorySelectMode && styles.scrollViewContentSelectMode,
          ]}
        >
          <ChallengeHistoryView
            pastChallenges={pastChallenges}
            selectMode={isHistorySelectMode}
            selectedSlugs={selectedPastChallengeSlugs}
            onToggleSelect={togglePastChallengeSelected}
          />
        </ScrollView>
      )}

      {isHistorySelectMode ? (
        selectedPastChallengeSlugs.length > 0 && (
          <View style={[styles.segmentContainer, styles.deleteContainer]}>
            <BlurView intensity={20} tint="light" style={styles.deleteBlur}>
              <Pressable
                onPress={() => setDeleteChallengeVisible(true)}
                style={styles.deletePressable}
              >
                <CustomIcon name="trashRed" size={24} color={colors.white} />
              </Pressable>
            </BlurView>
          </View>
        )
      ) : (
        <View style={styles.segmentContainer}>
          <Pressable
            onPress={() => setDisplayMode("challenges")}
            style={[
              styles.segmentButton,
              displayMode === "challenges" && styles.segmentButtonActive,
            ]}
          >
            <View style={{ opacity: displayMode === "challenges" ? 1 : 0.5 }}>
              <CustomIcon name="challenges" size={20} color={colors.white} />
            </View>
            <Text
              style={[
                styles.segmentLabel,
                displayMode === "challenges" && styles.segmentLabelActive,
              ]}
            >
              Challenges
            </Text>
          </Pressable>
        <Pressable
            onPress={() => setDisplayMode("history")}
            style={[
              styles.segmentButton,
              displayMode === "history" && styles.segmentButtonActive,
            ]}
          >
            <View style={{ opacity: displayMode === "history" ? 1 : 0.5 }}>
              <CustomIcon name="historyIcon" size={20} color={colors.white} />
             </View>
             <Text
              style={[
                styles.segmentLabel,
                displayMode === "history" && styles.segmentLabelActive,
              ]}
            >
              History
            </Text>
          </Pressable>
        </View>
      )}

      {displayMode === "history" && isHistorySelectMode && (
        <View style={styles.selectionCountBar} pointerEvents="none">
          <Text style={styles.selectionCountText}>
            {selectedPastChallengeSlugs.length} item
            {selectedPastChallengeSlugs.length === 1 ? "" : "s"} selected
          </Text>
        </View>
      )}

      <DeleteChallenge
        ref={deleteModalRef}
        visible={deleteChallengeVisible}
        onClose={() => setDeleteChallengeVisible(false)}
        selectedSlugs={selectedPastChallengeSlugs}
        onConfirmDelete={handleConfirmDeletePastChallenges}
        isDeleting={isDeletingChallenges}
      />

      <ChallengeDetail
        modalRef={detailModalRef}
        visible={challengeDetailVisible}
        onClose={() => setChallengeDetailVisible(false)}
        onStartSuccess={() => {
          detailModalRef.current?.closeWithAnimation(() =>
            router.replace({
              pathname: "/challenge/active-challenge",
              params: { slug: selectedChallenge?.slug ?? "", animate: "true" },
            })
          );
        }}
        challenge={selectedChallenge}
      />

      <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    zIndex: 1,
  },
  scrollViewContent: {
    paddingTop: 100,
    paddingBottom: 120,
  },
  scrollViewContentSelectMode: {
    paddingBottom: 220,
  },
  scrollViewGrow: {
    flexGrow: 1,
  },
  navigationContainer: {
    height: 40,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    position: "absolute",
    zIndex: 2,
    top: 60,
  },
  navigationText: {
    fontFamily: InterFont.BOLD,
    fontSize: 18,
    letterSpacing: 0,
    textAlign: "center",
    color: colors.primary80,
  },
  navActionBlur: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.white50,
    width: 80,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    position: "absolute",
    bottom: 28,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    zIndex: 2,
    width: 202,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white50,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 100,
    padding: 4,
  },
  deleteContainer: {
    width: 140,
    bottom: 92,
  },
  segmentBlur: {
    width: "100%",
    borderRadius: 100,
    overflow: "hidden",
    flexDirection: "row",
    padding: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.white50,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 100,
    height: 54,
  },
  segmentButtonActive: {
    backgroundColor: colors.lightGray3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentLabel: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 10,
    lineHeight: 12,
    color: colors.black50,
  },
  segmentLabelActive: {
    color: colors.black,
  },
  selectButton: {
    backgroundColor: colors.white50,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 100,
    padding: 4,
    height: 40,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.primary,
  },
  deleteBlur: {
    width: 56,
    height: 56,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.white50,
  },
  deletePressable: {
    height: 56,
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  deleteText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.primary,
  },
  selectionCountBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  selectionCountText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    color: colors.black,
  },
});
