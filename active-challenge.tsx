import { View, StyleSheet, ScrollView, Animated, Easing, Dimensions, type NativeSyntheticEvent, type NativeScrollEvent, type LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getChallengeAssets } from "./constants";
import { useChallengeData } from "./hooks/useChallengeData";
import { useEntryAnimations } from "./hooks/useEntryAnimations";
import { useOverlayProgress } from "./hooks/useOverlayProgress";
import { groupSessionsByWeek } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChallengeSession } from "@/lib/api/response/challenge";
import TaskDetail from "./components/TaskDetail";
import ProgressOverlay from "./components/ProgressOverlay";
import ActionOptions from "@/components/ui/ActionOptions";
import ArchiveChallenge from "./components/ArchiveChallenge";
import ResetProgress from "./components/ResetProgress";
import ChallengeCompleteOption from "./components/ChallengeCompleteOption";
import ChallengeCompletedOverlay from "./components/ChallengeCompletedOverlay";
import ChallengeOrb from "./components/ChallengeOrb";
import ChallengeHeader from "./components/ChallengeHeader";
import JourneyOverlay from "./components/JourneyOverlay";
import SessionsList from "./components/SessionsList";
import FixedBottomCTA from "./components/FixedBottomCTA";
import { BottomSheetModalRef } from "@/components/ui/BottomSheetModal";
import { useAuthContext } from "@/components/AuthContext";
import { colors } from "@/constants/sharedStyles";
import { ToastHost, showToast } from "@/components/ui/Toast";

export type { ChallengeAssets } from "./constants";

// CONFIG
const SHOW_NAV_THRESHOLD = 150;
const HEADER_SCROLL_SENSITIVITY = 1 / 80;
const FADE_RANGE = 100;
const SCROLL_DURATION_MS = 1500;
const STICKY_HEADER_HEIGHT = 195;
const NAV_ROW_HEIGHT = 40;
const CIRCLE_ROW_HEIGHT = 48;

// Main component
export default function ActiveChallengeScreen() {
  // Routing & params
  const router = useRouter();
  const { slug, animate, challengeSlug: challengeSlugParam, reopenSession } = useLocalSearchParams<{
    slug?: string;
    animate?: string;
    challengeSlug?: string;
    reopenSession?: string;
  }>();
  const shouldAnimate = animate === "true";

  const { user } = useAuthContext();
  const {
    sessions,
    userTasks,
    userChallenge,
    challengeSlug,
    isResetting,
    isArchiving,
    refresh,
    reset,
    archive,
    complete,
  } = useChallengeData(slug, challengeSlugParam);

  // UI state
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [actionOptionsVisible, setActionOptionsVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [challengeCompleteOptionVisible, setChallengeCompleteOptionVisible] = useState(false);
  const [challengeCompletedOverlayVisible, setChallengeCompletedOverlayVisible] = useState(false);
  const [completedOverlayChallengeName, setCompletedOverlayChallengeName] = useState<string>("");
  const [completedOverlayDaysOfShowingUp, setCompletedOverlayDaysOfShowingUp] = useState(0);
  const [completedOverlayUserChallengeSlug, setCompletedOverlayUserChallengeSlug] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<ChallengeSession | null>(null);
  const taskDetailModalRef = useRef<BottomSheetModalRef>(null);
  const scrollToNextAfterCloseRef = useRef(false);
  const justCompletedDayRef = useRef<number | null>(null);
  const [transitionDaysToAnimate, setTransitionDaysToAnimate] = useState<{
    completedDay: number | null;
    unlockedDay: number | null;
  }>({ completedDay: null, unlockedDay: null });
  const scrollViewRef = useRef<ScrollView>(null);
  const sessionLayoutsRef = useRef<Record<number, number>>({});
  const sessionHeightsRef = useRef<Record<number, number>>({});
  const phaseLayoutsRef = useRef<Record<number, number>>({});
  const completedChallengeLayoutRef = useRef<{ y: number; height: number } | null>(null);
  const orbHeightRef = useRef(0);
  const lastActiveWeekIndexRef = useRef(0);
  const stepperScrollTargetRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollYRef = useRef(0);
  const scrollAnimRef = useRef(new Animated.Value(0)).current;
  
  // ANIMATIONS
  const restartProgress = useOverlayProgress(isResetting);
  const archiveProgress = useOverlayProgress(isArchiving);
  const {
    orbAnimDone,
    sessionsAnimationDone,
    countdown,
    showIntroText,
    orbTranslateY,
    orbScale,
    orbTextOpacity,
    orbRevealOpacity,
    journeyOverlayOpacity,
    sessionsTranslateY,
    sessionsOpacity,
  } = useEntryAnimations(shouldAnimate);

  // SCROLL
  const [scrollY, setScrollY] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);
  const scrollYAnimated = useRef(new Animated.Value(0)).current;
  const lastScrollYRef = useRef(0);
  const headerVisibleAmountRef = useRef(1);
  const showStickyNav = scrollY >= SHOW_NAV_THRESHOLD;

  const [headerContentVisible, setHeaderContentVisible] = useState(true);
  const headerContentVisibleAnim = useRef(new Animated.Value(1)).current;

  const navOpacity = scrollYAnimated.interpolate({
    inputRange: [Math.max(0, SHOW_NAV_THRESHOLD - FADE_RANGE), SHOW_NAV_THRESHOLD],
    outputRange: [0, 1],
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const navRowOpacity = headerContentVisibleAnim;
  const navRowMaxHeight = headerContentVisibleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, NAV_ROW_HEIGHT],
    extrapolate: "clamp",
  });
  const headerPaddingBottom = headerContentVisibleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
    extrapolate: "clamp",
  });

  const headerPaddingTop = headerContentVisibleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 60],
    extrapolate: "clamp",
  });

  const spaceBetweenNavAndStepper = headerContentVisibleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
    extrapolate: "clamp",
  });
  const circlesOpacity = headerContentVisibleAnim;
  const circleRowMaxHeight = headerContentVisibleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCLE_ROW_HEIGHT],
    extrapolate: "clamp",
  });
  const orbOpacity = scrollYAnimated.interpolate({
    inputRange: [Math.max(0, SHOW_NAV_THRESHOLD - FADE_RANGE), SHOW_NAV_THRESHOLD],
    outputRange: [1, 0],
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Smooth scroll to a given Y position
  const smoothScrollTo = (targetY: number, onComplete?: () => void) => {
    const currentY = scrollYRef.current;
    if (currentY === targetY) {
      onComplete?.();
      return;
    }
    isProgrammaticScrollRef.current = true;
    scrollAnimRef.setValue(currentY);
    const listenerId = scrollAnimRef.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({ y: value, animated: false });
      scrollYAnimated.setValue(value);
      setScrollY(value);
    });
    Animated.timing(scrollAnimRef, {
      toValue: targetY,
      duration: SCROLL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      scrollAnimRef.removeListener(listenerId);
      isProgrammaticScrollRef.current = false;
      if (finished) scrollYRef.current = targetY;
      onComplete?.();
    });
  };

  // DERIVED STATE
  const weekGroups = groupSessionsByWeek(sessions);
  const currentDay = userChallenge && challengeSlug === slug ? userChallenge.current_day : 0;
  const effectiveDay = Math.max(1, currentDay);
  const isSessionUnlocked = (session: ChallengeSession) => session.day_number <= effectiveDay;
  const isSessionCompleted = (session: ChallengeSession) => session.day_number < effectiveDay;
  const totalSessions = sessions.length;
  const completedSessions = effectiveDay - 1;
  const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const challengeName = userChallenge?.challenge?.name ?? "";
  const challengeAssets = getChallengeAssets(challengeName);

  const hasScrolledPastEffectiveDay = (() => {
    const phaseIndex = weekGroups.findIndex((w) =>
      w.sessions.some((s) => s.day_number === effectiveDay)
    );
    const phaseY = phaseLayoutsRef.current[phaseIndex];
    const sessionYInPhase = sessionLayoutsRef.current[effectiveDay];
    const sessionHeight = sessionHeightsRef.current[effectiveDay] ?? 280;

    if (phaseY === undefined || sessionYInPhase === undefined) return false;

    const sessionTopY = phaseY + sessionYInPhase;
    const threshold = sessionTopY + sessionHeight * 0.5;
    return scrollY > threshold;
  })();

  // EFFECTS
  // Keep week stepper index in sync with current day
  useEffect(() => {
    if (weekGroups.length === 0) return;
    const currentWeekIndex = weekGroups.findIndex((week) =>
      week.sessions.some((session) => session.day_number === effectiveDay)
    );
    if (currentWeekIndex !== -1) setActiveWeekIndex(currentWeekIndex);
  }, [effectiveDay, sessions]);

  // Auto-scroll to current day once when entering without animation (Continue flow); runs only after data + entry ready
  // When all sessions are completed, scroll to LastCompletedSession instead
  const hasAutoScrolledRef = useRef(false);
  const reopenOptionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (
      shouldAnimate ||
      !userChallenge ||
      !orbAnimDone ||
      !sessionsAnimationDone ||
      weekGroups.length === 0 ||
      hasAutoScrolledRef.current
    )
      return;

    const allSessionsCompleted = effectiveDay > totalSessions;
    const phaseIndex = weekGroups.findIndex((w) =>
      w.sessions.some((s) => s.day_number === effectiveDay)
    );

    if (allSessionsCompleted) return;

    if (phaseIndex < 0) return;

    const timeout = setTimeout(() => {
      const phaseY = phaseLayoutsRef.current[phaseIndex];
      const sessionYInPhase = sessionLayoutsRef.current[effectiveDay];
      const sessionHeight = sessionHeightsRef.current[effectiveDay];
      const targetY =
        phaseY !== undefined && sessionYInPhase !== undefined
          ? phaseY + sessionYInPhase
          : phaseY;
      if (targetY !== undefined) {
        hasAutoScrolledRef.current = true;
        const viewportHeight = Dimensions.get("window").height;
        const cardHeight = sessionHeight ?? 280;
        const scrollY = Math.max(
          0,
          targetY + cardHeight / 2 - viewportHeight / 2
        );
        setScrollingUp(true);
        smoothScrollTo(scrollY);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [shouldAnimate, userChallenge, orbAnimDone, sessionsAnimationDone, effectiveDay, sessions, totalSessions]);

  // Open task detail modal with selected session
  useEffect(() => {
    if (!reopenSession || sessions.length === 0) return;
    const session = sessions.find((s) => s.slug === reopenSession);
    if (session) {
      setSelectedSession(session);
      setTaskDetailVisible(true);
      router.setParams({ reopenSession: undefined });
    }
  }, [reopenSession, sessions]);

  // HANDLERS
  // Session
  const openTaskDetail = (session: ChallengeSession) => {
    setSelectedSession(session);
    setTaskDetailVisible(true);
  };

  const handleNextSession = () => {
    if (!selectedSession) return;
    const activeWeek = weekGroups[activeWeekIndex];
    const nextSession =
      activeWeek?.sessions.find(
        (s) => s.day_number === selectedSession.day_number + 1
      ) ??
      weekGroups
        .flatMap((w) => w.sessions)
        .find((s) => s.day_number === selectedSession.day_number + 1);

    if (nextSession && isSessionUnlocked(nextSession)) {
      setSelectedSession(nextSession);
    }
  };

  const handleWeekPress = (index: number) => {
    lastActiveWeekIndexRef.current = index;
    setActiveWeekIndex(index);
    stepperScrollTargetRef.current = index;
    const phaseY = phaseLayoutsRef.current[index];
    const onScrollDone = () => {
      stepperScrollTargetRef.current = null;
    };
    if (phaseY !== undefined) {
      const offset = showStickyNav ? STICKY_HEADER_HEIGHT : 0;
      smoothScrollTo(Math.max(0, phaseY - offset), onScrollDone);
    } else {
      smoothScrollTo(0, onScrollDone);
    }
  };

  // Scroll to the current session (effectiveDay) and center it in the viewport
  const scrollToEffectiveDay = () => {
    if (weekGroups.length === 0) return;
    const phaseIndex = weekGroups.findIndex((w) =>
      w.sessions.some((s) => s.day_number === effectiveDay)
    );
    if (phaseIndex < 0) return;
    const phaseY = phaseLayoutsRef.current[phaseIndex];
    const sessionYInPhase = sessionLayoutsRef.current[effectiveDay];
    const sessionHeight = sessionHeightsRef.current[effectiveDay];
    const targetY =
      phaseY !== undefined && sessionYInPhase !== undefined
        ? phaseY + sessionYInPhase
        : phaseY;
    if (targetY !== undefined) {
      const viewportHeight = Dimensions.get("window").height;
      const cardHeight = sessionHeight ?? 280;
      // Center the session card vertically: card center = viewport center
      const scrollY = Math.max(
        0,
        targetY + cardHeight / 2 - viewportHeight / 2
      );
      setScrollingUp(true);
      smoothScrollTo(scrollY);
    }
  };

  // Confirm actions
  const handleResetConfirm = async () => {
    if (reopenOptionsTimeoutRef.current) {
      clearTimeout(reopenOptionsTimeoutRef.current);
      reopenOptionsTimeoutRef.current = null;
    }
    setResetModalVisible(false);
    hasAutoScrolledRef.current = false;
    const success = await reset();
    if (!success) return;
    setTimeout(() => {
      hasAutoScrolledRef.current = true;
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 450);
  };

  const handleArchiveConfirm = async () => {
    if (reopenOptionsTimeoutRef.current) {
      clearTimeout(reopenOptionsTimeoutRef.current);
      reopenOptionsTimeoutRef.current = null;
    }
    setArchiveModalVisible(false);
    const success = await archive();
    if (success) {
      router.replace({
        pathname: "/challenge",
        params: { displayMode: "history", toast: "Challenge archived." },
      });
    }
  };

  // Scroll
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastScrollYRef.current;
    lastScrollYRef.current = y;
    scrollYRef.current = y;
    setScrollY(y);
    scrollYAnimated.setValue(y);
    if (!isProgrammaticScrollRef.current) {
      if (delta > 5) setScrollingUp(false);
      else if (delta < -5) setScrollingUp(true);
    }
    if (!isProgrammaticScrollRef.current) {
      const sens = HEADER_SCROLL_SENSITIVITY;
      let next = headerVisibleAmountRef.current;
      if (y < 30) {
        next = 1;
      } else {
        next = Math.max(0, Math.min(1, next - delta * sens));
      }
      headerVisibleAmountRef.current = next;
      headerContentVisibleAnim.setValue(next);
      if (next >= 0.5 && !headerContentVisible) setHeaderContentVisible(true);
      else if (next < 0.5 && headerContentVisible) setHeaderContentVisible(false);
    }
    if (stepperScrollTargetRef.current !== null) return;
    const effectiveY = y + (y >= SHOW_NAV_THRESHOLD ? STICKY_HEADER_HEIGHT : 0);
    const phases = Object.entries(phaseLayoutsRef.current).sort((a, b) => a[1] - b[1]);
    let newIndex = 0;
    for (let i = phases.length - 1; i >= 0; i--) {
      if (effectiveY >= Number(phases[i][1]) - 20) {
        newIndex = Number(phases[i][0]);
        break;
      }
    }
    if (newIndex !== lastActiveWeekIndexRef.current) {
      lastActiveWeekIndexRef.current = newIndex;
      setActiveWeekIndex(newIndex);
    }
  };

  const handleOrbLayout = (e: LayoutChangeEvent) => {
    orbHeightRef.current = e.nativeEvent.layout.height;
  };

  const handleCompleteChallenge = async () => {
    const nameForOverlay = userChallenge?.challenge?.name ?? challengeName;
    const daysOfShowingUp = userChallenge?.current_day ?? 0;
    const userChallengeSlug = userChallenge?.slug ?? "";
    await complete();
    setCompletedOverlayChallengeName(nameForOverlay);
    setCompletedOverlayDaysOfShowingUp(daysOfShowingUp);
    setCompletedOverlayUserChallengeSlug(userChallengeSlug);
    setChallengeCompletedOverlayVisible(true);
  };

  const handleOpenHistory = useCallback(() => {
    setChallengeCompleteOptionVisible(false);
    router.replace({ pathname: "/challenge", params: { displayMode: "history" } });
  }, [router]);

  const handleIllDoThisLater = useCallback(() => {
    setChallengeCompleteOptionVisible(false);
    router.replace("/challenge");
  }, [router]);

  // Modals
  const openActionOptions = () => setActionOptionsVisible(true);
  const closeActionOptions = () => setActionOptionsVisible(false);

  const openArchiveModal = () => {
    setTimeout(() => {
      setActionOptionsVisible(false);
      setTimeout(() => setArchiveModalVisible(true), 280);
    }, 100);
  };
  const closeArchiveModal = () => {
    setArchiveModalVisible(false);
    reopenOptionsTimeoutRef.current = setTimeout(() => setActionOptionsVisible(true), 280);
  };

  const openResetModal = () => {
    setTimeout(() => {
      setActionOptionsVisible(false);
      setTimeout(() => setResetModalVisible(true), 280);
    }, 100);
  };
  const closeResetModal = () => {
    setResetModalVisible(false);
    reopenOptionsTimeoutRef.current = setTimeout(() => setActionOptionsVisible(true), 280);
  };

  const closeTaskDetail = () => {
    setTaskDetailVisible(false);
    refresh();
  };

  // When modal was closed via back button with all today's tasks completed, scroll to next effective day and run transition animations
  const prevTaskDetailVisibleRef = useRef(taskDetailVisible);
  const TRANSITION_ANIM_DURATION_MS = 2200;
  useEffect(() => {
    const wasVisible = prevTaskDetailVisibleRef.current;
    prevTaskDetailVisibleRef.current = taskDetailVisible;
    if (wasVisible && !taskDetailVisible && scrollToNextAfterCloseRef.current) {
      scrollToNextAfterCloseRef.current = false;
      const completedDay = justCompletedDayRef.current;
      justCompletedDayRef.current = null;
      if (completedDay != null) {
        setTransitionDaysToAnimate({ completedDay, unlockedDay: completedDay + 1 });
        const clearTimeoutId = setTimeout(
          () => setTransitionDaysToAnimate({ completedDay: null, unlockedDay: null }),
          TRANSITION_ANIM_DURATION_MS
        );
        const scrollTimeoutId = setTimeout(() => {
          scrollToEffectiveDay();
        }, 100);
        return () => {
          clearTimeout(scrollTimeoutId);
          clearTimeout(clearTimeoutId);
        };
      } else {
        const timeout = setTimeout(() => scrollToEffectiveDay(), 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [taskDetailVisible]);

  const handleAccessWork = useCallback(() => {
    const targetSlug = completedOverlayUserChallengeSlug || challengeSlug || slug;
    if (targetSlug) {
      router.replace({
        pathname: "/challenge/challenge-details/[slug]",
        params: { slug: targetSlug, showDoneButton: "true" },
      });
    }
  }, [router, completedOverlayUserChallengeSlug, challengeSlug, slug]);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 110,
            zIndex: 1,
          },
          { opacity: navOpacity },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Archiving challenge overlay */}
      {isArchiving && (
        <ProgressOverlay
          title="Saving your progress..."
          subtitle="Your work is being safely archived"
          progress={archiveProgress}
          restartGradient={challengeAssets.restartGradient as [string, string, string]}
          titleText={challengeAssets.weekStepperText}
          showLottie={false}
        />
      )}

      {/* Restarting challenge overlay */}
      {isResetting && (
        <ProgressOverlay
          title="Restarting your challenge"
          subtitle="Starting fresh from day one"
          progress={restartProgress}
          restartGradient={challengeAssets.restartGradient as [string, string, string]}
          titleText={challengeAssets.weekStepperText}
          showLottie={true}
          onComplete={() => showToast("Challenge restarted.", 60)}
        />
      )}

      {/* Journey overlay + Countdown Overlay */}
      <JourneyOverlay
        opacity={journeyOverlayOpacity}
        countdown={countdown}
        showIntroText={showIntroText}
        titleTextColor={challengeAssets.titleText}
      />

      {/* Challenge completed overlay */}
      <ChallengeCompletedOverlay
        visible={challengeCompletedOverlayVisible}
        onClose={() => setChallengeCompletedOverlayVisible(false)}
        userName={user?.first_name ?? ""}
        challengeName={completedOverlayChallengeName || challengeName}
        tasksCompleted={userTasks.filter((t) => t.completed).length}
        daysOfShowingUp={completedOverlayDaysOfShowingUp}
        onAccessWork={handleAccessWork}
      />

      {/* Header (Hidden until orb animation completes) */}
      <ChallengeHeader
        showStickyNav={showStickyNav}
        orbAnimDone={orbAnimDone}
        challengeName={userChallenge?.challenge?.name}
        headerPaddingBottom={headerPaddingBottom}
        headerPaddingTop={headerPaddingTop}
        navOpacity={navOpacity}
        navRowOpacity={navRowOpacity}
        navRowMaxHeight={navRowMaxHeight}
        spaceBetweenNavAndStepper={spaceBetweenNavAndStepper}
        weekGroups={weekGroups}
        activeWeekIndex={activeWeekIndex}
        onWeekPress={handleWeekPress}
        effectiveDay={effectiveDay}
        titleTextColor={challengeAssets.weekStepperText}
        onBack={() => router.back()}
        onOpenOptions={openActionOptions}
      />
      
      {/* Scrollable content */}
      <ScrollView
        ref={scrollViewRef}
        scrollEnabled={orbAnimDone}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* Orb - Animated or Static */}
        <ChallengeOrb
          orbTranslateY={shouldAnimate ? orbTranslateY : undefined}
          orbScale={shouldAnimate ? orbScale : undefined}
          orbTextOpacity={shouldAnimate ? orbTextOpacity : undefined}
          orbRevealOpacity={shouldAnimate ? orbRevealOpacity : undefined}
          challengeAssets={challengeAssets}
          progressPercentage={progressPercentage}
          challengeName={userChallenge?.challenge?.name}
          shouldAnimate={shouldAnimate}
          showStickyNav={showStickyNav}
          orbOpacity={orbOpacity}
          onOrbLayout={handleOrbLayout}
        />

        {/* All challenge sessions by phase */}
        <SessionsList
          weekGroups={weekGroups}
          totalSessions={totalSessions}
          sessionsOpacity={sessionsOpacity}
          sessionsTranslateY={sessionsTranslateY}
          sessionsAnimationDone={sessionsAnimationDone}
          scrollYAnimated={scrollYAnimated}
          showNavThreshold={SHOW_NAV_THRESHOLD}
          challengeName={challengeName}
          challengeAssets={challengeAssets}
          effectiveDay={effectiveDay}
          isSessionUnlocked={isSessionUnlocked}
          isSessionCompleted={isSessionCompleted}
          onSessionPress={openTaskDetail}
          orbHeightRef={orbHeightRef}
          phaseLayoutsRef={phaseLayoutsRef}
          sessionLayoutsRef={sessionLayoutsRef}
          sessionHeightsRef={sessionHeightsRef}
          onCompletedChallengePress={handleCompleteChallenge}
          onCompletedChallengeLayout={(y, height) => {
            completedChallengeLayoutRef.current = { y, height };
          }}
          transitionAnimateCompletedDay={transitionDaysToAnimate.completedDay}
          transitionAnimateUnlockedDay={transitionDaysToAnimate.unlockedDay}
        />
      </ScrollView>

      {/* Action options (Archive / Reset) */}
      <ActionOptions
        visible={actionOptionsVisible}
        onClose={closeActionOptions}
        onArchiveChallenge={openArchiveModal}
        onResetProgress={openResetModal}
      />

      {/* Archive challenge confirmation */}
      <ArchiveChallenge
        visible={archiveModalVisible}
        onClose={closeArchiveModal}
        onConfirm={handleArchiveConfirm}
        onCancel={closeArchiveModal}
      />

      {/* Reset progress confirmation */}
      <ResetProgress
        visible={resetModalVisible}
        onClose={closeResetModal}
        onConfirm={handleResetConfirm}
        onCancel={closeResetModal}
      />

      {/* Challenge complete: Open History / I'll do this later (from Continue on completed card) */}
      <ChallengeCompleteOption
        visible={challengeCompleteOptionVisible}
        onClose={() => setChallengeCompleteOptionVisible(false)}
        onOpenHistory={handleOpenHistory}
        onIllDoThisLater={handleIllDoThisLater}
        primaryButtonColor={challengeAssets.weekStepperText}
      />

      {/* Task detail */}
      <TaskDetail
        challengeSlug={challengeSlug}
        challengeAssets={challengeAssets}
        modalRef={taskDetailModalRef}
        visible={taskDetailVisible}
        onClose={closeTaskDetail}
        onTaskToggled={refresh}
        session={selectedSession}
        onNextSession={handleNextSession}
        totalSessions={totalSessions}
        onBackPress={(allTodayCompleted) => {
          if (allTodayCompleted) {
            scrollToNextAfterCloseRef.current = true;
            if (selectedSession?.day_number != null) justCompletedDayRef.current = selectedSession.day_number;
          }
        }}
      />

      {/* Fixed bottom CTA — scrolls to current session */}
      <FixedBottomCTA
        currentSession={sessions.find((s) => s.day_number === effectiveDay)}
        onPress={() => scrollToEffectiveDay()}
        sessionsOpacity={sessionsOpacity}
        sessionsTranslateY={sessionsTranslateY}
        sessionsAnimationDone={sessionsAnimationDone}
        isVisible={hasScrolledPastEffectiveDay}
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
});