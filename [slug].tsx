import { View, Text, Pressable, ScrollView, StyleSheet, ImageBackground, Animated, Image, LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { colors } from "@/constants/sharedStyles";
import { ForrestFont, InterFont } from "@/constants/fonts";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomIcon } from "@/components/ui/IconCustom";
import ChallengeCompleteOption from "@/app/challenge/components/ChallengeCompleteOption";
import {
  fetchUserChallenges,
  fetchChallengeSessions,
  fetchSessionTasks,
  fetchUserTasks,
  reactivateChallenge,
} from "@/lib/api/challenge";
import type {
  UserChallenge,
  ChallengeSession,
  Task,
  UserTask,
} from "@/lib/api/response/challenge";
import { LinearGradient } from "expo-linear-gradient";
import { getChallengeAssets } from "../constants";
import { groupSessionsByWeek } from "@/lib/utils";
import { ChallengeProgressCircle } from "../components/ChallengeProgressCircle";

export default function ChallengeDetailsScreen() {

  // Router
  const router = useRouter();

  // Params
  const { slug, showDoneButton } = useLocalSearchParams<{ slug: string; showDoneButton?: string }>();
  const showDoneButtonAtBottom = showDoneButton === "true";

  // UI State
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [sessions, setSessions] = useState<ChallengeSession[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [sessionTasksMap, setSessionTasksMap] = useState<
    Record<number, Task[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const [isContinuing, setIsContinuing] = useState(false);
  const [accessHistoryModalVisible, setAccessHistoryModalVisible] = useState(false);
  const [circleSize, setCircleSize] = useState(280);
  const [headerContentVisible, setHeaderContentVisible] = useState(true);

  // Data
  const effectiveDay = userChallenge?.current_day ?? 1;
  

  // Header hide on scroll down, show on scroll up (same as active-challenge)
  const HEADER_SCROLL_SENSITIVITY = 1 / 80;
  const NAV_ROW_HEIGHT = 40;
  const lastScrollYRef = useRef(0);
  const headerVisibleAmountRef = useRef(1);
  const headerContentVisibleAnim = useRef(new Animated.Value(1)).current;
  const navRowOpacity = headerContentVisibleAnim;
  const navRowMaxHeight = headerContentVisibleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, NAV_ROW_HEIGHT],
    extrapolate: "clamp",
  });

  // Gradient opacity
  const scrollYAnimated = useRef(new Animated.Value(0)).current;
  const GRADIENT_SCROLL_THRESHOLD = 400;
  const GRADIENT_FADE_RANGE = 80;
  const gradientOpacity = scrollYAnimated.interpolate({
    inputRange: [
      GRADIENT_SCROLL_THRESHOLD - GRADIENT_FADE_RANGE,
      GRADIENT_SCROLL_THRESHOLD,
    ],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Toggle week expand
  const toggleWeekExpand = (weekNumber: number) =>
    setExpandedWeeks((prev) => ({ ...prev, [weekNumber]: !prev[weekNumber] }));

  // Completed task IDs for merge
  const completedTaskIds = new Set(
    userTasks.filter((t) => t.completed).map((t) => t.task_id)
  );

  // Analytics
  const totalSessions = sessions.length;
  const sessionsCompleted = Math.max(0, (userChallenge?.current_day ?? 1) - 1);
  const progressPercentage =
    totalSessions > 0 ? Math.round((sessionsCompleted / totalSessions) * 100) : 0;
  const sessionsRemaining = Math.max(0, totalSessions - sessionsCompleted);

  // Week groups
  const weekGroups = groupSessionsByWeek(sessions);
  const challengeName = userChallenge?.challenge?.name ?? "";
  const challengeAssets = getChallengeAssets(challengeName);

  // Progress circle: session ratio and phase title (mirrors ActiveChallengeCard)
  const sessionCompletionRatio =
    totalSessions > 0 ? Math.min(1, sessionsCompleted / totalSessions) : 0;
  const challenge = userChallenge?.challenge;
  const weeks = challenge?.emotional_detox?.weeks ?? [];
  const phaseCount = Math.max(1, weeks.length);
  const sessionsPerPhase = Math.ceil(totalSessions / phaseCount);
  const phaseIndex = Math.min(
    phaseCount - 1,
    Math.floor((effectiveDay - 1) / sessionsPerPhase)
  );
  const phase = weeks[phaseIndex];
  const phaseTitle = phase?.title ?? `Phase ${phaseIndex + 1}`;

  const handleCircleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const size = Math.min(width, height);
    if (size > 0) {
      setCircleSize(size);
    }
  };

  // Circle pill label: archived → percentage, completed → completion date, else → phase
  const circlePillLabel =
    userChallenge?.status === "archived"
      ? `${progressPercentage}% complete`
      : userChallenge?.status === "completed"
        ? userChallenge.completed_at
          ? `Completed ${new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(userChallenge.completed_at))}`
          : "Completed"
        : phaseTitle;

  // Fetch data
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);

    fetchUserChallenges()
      .then((challengesData) => {
        const allChallenges = [
          ...(challengesData.activeChallenge ? [challengesData.activeChallenge] : []),
          ...(challengesData.pastChallenges ?? []),
        ];
        const uc = allChallenges.find((c) => c.slug === slug);
        setUserChallenge(uc ?? null);
        if (!uc) {
          setLoading(false);
          return;
        }
        const challengeSlug = uc.challenge?.slug;
        return Promise.all([
          challengeSlug ? fetchChallengeSessions(challengeSlug) : Promise.resolve([]),
          fetchUserTasks(uc.slug),
        ]).then(([sessionsData, userTasksData]) => {
          setSessions(sessionsData ?? []);
          setUserTasks(userTasksData ?? []);

          if (sessionsData?.length) {
            return Promise.all(
              sessionsData.map((s) => fetchSessionTasks(s.slug ?? null))
            ).then((taskArrays) => {
              const map: Record<number, Task[]> = {};
              sessionsData.forEach((s, i) => {
                map[s.id] = taskArrays[i] ?? [];
              });
              setSessionTasksMap(map);
            });
          }
        });
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleOpenHistory = useCallback(() => {
    setAccessHistoryModalVisible(false);
    router.replace({
      pathname: "/challenge",
      params: { displayMode: "history" },
    });
  }, [router]);

  const handleIllDoThisLater = useCallback(() => {
    setAccessHistoryModalVisible(false);
    router.replace("/challenge");
  }, [router]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastScrollYRef.current;
    lastScrollYRef.current = y;
    scrollYAnimated.setValue(y);
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
  }, [scrollYAnimated, headerContentVisibleAnim, headerContentVisible]);

  // Loading state
  if (loading || !userChallenge) {
    return (
      <View style={styles.container}>
        <View style={styles.navigationContainer}>
          <Pressable onPress={() => router.back()}>
            <CustomIcon name="arrowLeft" size={30} color={colors.primary} />
          </Pressable>
          <Text style={styles.navigationText}>{loading ? "Loading..." : "Challenge not found."}</Text>
          <View style={{ opacity: 0 }}>
            <CustomIcon name="history" size={24} color={colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  // Handlers
  // Continue challenge session
  const handleContinueChallengeSession = async () => {
    if (!userChallenge || isContinuing) return;
    setIsContinuing(true);
    try {
      if (userChallenge.status !== "active") {
        const success = await reactivateChallenge(userChallenge.slug);
        if (!success) return;
      }
      router.replace({
        pathname: "/challenge/active-challenge",
        params: {
          slug: userChallenge.slug,
          challengeSlug: userChallenge.challenge?.slug ?? undefined,
        },
      });
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 110,
          zIndex: 1,
          opacity: gradientOpacity,
        }}
      >
        <LinearGradient
          colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Fixed Header: hide on scroll down, show on scroll up */}
      <Animated.View
        pointerEvents={headerContentVisible ? "auto" : "none"}
        style={[
          styles.navigationContainer,
          {
            opacity: navRowOpacity,
            maxHeight: navRowMaxHeight,
            overflow: "hidden",
          },
        ]}
      >
        {showDoneButtonAtBottom ? (
          <View style={{ opacity: 0 }}>
            <CustomIcon name="arrowLeft" size={24} color={colors.primary} />
          </View>
        ) : (
          <Pressable onPress={() => router.back()}>
            <CustomIcon name="arrowLeft" size={30} color={colors.primary} />
          </Pressable>
        )}
        <Text style={styles.navigationText}>
          {showDoneButtonAtBottom ? (
            "Your work"
          ) : (
            userChallenge.status === "archived" ? "Archived Challenge" : userChallenge.challenge?.name ?? "Challenge Details"
          )}

        </Text>
        <View style={{ opacity: 0 }}>
          <CustomIcon name="history" size={24} color={colors.primary} />
        </View>
      </Animated.View>

      {/* Bottom button: Done (from completed overlay) or Continue Session */}
      <View style={styles.fixedBottomContainer}>
        {showDoneButtonAtBottom ? (
          <Pressable
            style={[styles.fixedBottomButton, { backgroundColor: challengeAssets.weekStepperText }]}
            onPress={() => setAccessHistoryModalVisible(true)}
          >
            <Text style={styles.fixedBottomButtonText}>Done</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.fixedBottomButton, { backgroundColor: challengeAssets.weekStepperText }]}
            onPress={handleContinueChallengeSession}
          >
            <Text style={styles.fixedBottomButtonText}>
              Continue Session {effectiveDay}
            </Text>
            <CustomIcon name="arrowRightWhite" size={18} color={colors.white} />
          </Pressable>
        )}
      </View>

      {/* COMPLETED TASKS / Tasks list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        {/* Progress circle with icon, title, and phase pill */}
        <View style={styles.circleSection}>
          <View style={styles.circleContainer}>
            <Image
              source={challengeAssets.orb}
              style={styles.circleOrbImage}
              resizeMode="contain"
            />
            <View style={styles.circleWrapper} onLayout={handleCircleLayout}>
              <ChallengeProgressCircle
                progress={sessionCompletionRatio}
                size={circleSize}
                trackColor={colors.white20}
                progressColor={colors.white}
              >
                <CustomIcon name={challengeAssets.orbIcon} size={36} color={colors.white} />
                <Text style={[styles.circleTitle, { color: challengeAssets.orbText }]}>
                  {challengeName}
                </Text>
                <Text style={styles.circlePill}>
                  {circlePillLabel}
                </Text>
              </ChallengeProgressCircle>
            </View>
          </View>
        </View>
        
        <View style={{ paddingHorizontal: 24 }}>

          <View style={styles.tasksContainer}>
            {weekGroups.map((week) => {
              const isWeekExpanded = expandedWeeks[week.week_number];
              return (
              <View style={[isWeekExpanded && styles.mainWeekContainer, { borderWidth: 1, borderColor: colors.black5, borderRadius: 20 }]} key={week.week_number}>
                <Pressable
                  style={styles.weekContainer}
                  onPress={() => toggleWeekExpand(week.week_number)}
                >
                  <Text style={[styles.weekTitleText, { color: challengeAssets.weekStepperText }]}>
                    Phase {week.week_number}: {week.week_title ?? "Foundation"}
                  </Text>
                  <CustomIcon
                    style={{ transform: [{ rotate: isWeekExpanded ? "180deg" : "0deg" }] }}
                    name="chevronArrowDown"
                    size={16}
                    color={colors.black}
                  />
                </Pressable>

                {/* Session Content */}
                {isWeekExpanded && (
                <View>
                {week.sessions.map((session) => {
                  const tasks = sessionTasksMap[session.id] ?? [];
                  const sessionCompletedCount = tasks.filter((t) =>
                    completedTaskIds.has(t.id)
                  ).length;
                  const isSessionCompleted = sessionCompletedCount >= 2;

                  return (
                    <View style={styles.sessionContainer} key={session.id}>

                      {/* Session Title */}
                      <View style={styles.sessionTitleContainer}>
                        {isSessionCompleted ? (
                          <CustomIcon name={challengeAssets.detailsCompletedIcon} size={30} color="#487DED" />
                        ) : (
                          <View />
                        )}
                        <Text style={[styles.sessionTitleText, { color: challengeAssets.weekStepperText }]}>
                          Session {session.day_number}: {session.title}
                        </Text>
                      </View>

                      {/* Tasks List */}
                      <View style={styles.tasksList}>
                      {tasks.map((task) => {
                        const completed = completedTaskIds.has(task.id);
                        return (
                          <View key={task.id} style={[styles.taskRow]}>
                            {completed ? (
                              <CustomIcon
                                name="taskTicked"
                                size={22}
                                color="#22C55E"
                              />
                            ) : (
                              <CustomIcon
                                name="taskUnticked"
                                size={22}
                                color="#9CA3AF"
                              />
                            )}
                            <Text
                              style={[
                                styles.taskTitleText,
                                { color: challengeAssets.weekStepperText },
                                completed && styles.taskTitleTextCompleted,
                              ]}
                            >
                              {task.title}
                            </Text>
                          </View>
                        );
                      })}
                      </View>
                    </View>
                  );
                })}
                </View>
                )}
              </View>
            );
            })}
          </View>
        </View>
      </ScrollView>

      <ChallengeCompleteOption
        visible={accessHistoryModalVisible}
        onClose={() => setAccessHistoryModalVisible(false)}
        onOpenHistory={handleOpenHistory}
        onIllDoThisLater={handleIllDoThisLater}
        primaryButtonColor={challengeAssets.weekStepperText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  navigationContainer: {
    height: 40,
    width: '100%',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    position: 'absolute',
    zIndex: 2,
    top: 60
  },
  navigationText: {
    fontFamily: InterFont.BOLD,
    fontSize: 18,
    lineHeight: 0,
    letterSpacing: 0,
    textAlign: "center",
    color: colors.primary80,
  },
  scrollViewContainer: {
    paddingTop: 75,
    paddingBottom: 200,
  },
  circleSection: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  circleContainer: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 350,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  circleWrapper: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  circleOrbImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    transform: [{ scale: 2 }],
  },
  circleTitle: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 33.6,
    letterSpacing: 0,
    textAlign: "center",
    marginTop: 16,
  },
  circlePill: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 12,
    lineHeight: 12 * 1,
    letterSpacing: 0.5,
    textAlign: "center",
    color: colors.white,
    marginTop: 12,
  },
  headerContainer: {
    height: 500,
    width: '100%',
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  titleText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 28,
    lineHeight: 28 * 1.2,
    letterSpacing: 0,
    textAlign: "center",
    color: colors.primary,
  },
  descriptionText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 10,
    lineHeight: 12 * 1,
    letterSpacing: 0.6,
    textAlign: 'center',
    backgroundColor: colors.white50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  analyticsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 12,
    display: 'none',
  },
  analyticsItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.black5,
  },
  analyticsItemText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 24,
    lineHeight: 0,
    letterSpacing: 0,
    textAlign: "center",
  },
  analyticsItemDescriptionText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 0,
    letterSpacing: 0,
    textAlign: "center",
    color: colors.primary80,
  },
  eyebrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  eyebrowText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1,
    color: colors.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tasksContainer: {
    paddingTop: 24,
    gap: 20,
  },
  tasksList: {
    gap: 18,
    paddingHorizontal: 20,
  },
  mainWeekContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.black5,
  },
  weekContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: colors.white50,
  },
  weekTitleText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 16,
    lineHeight: 16 * 1.4,
  },
  sessionContainer: {
    borderBottomWidth: 1,
    borderColor: colors.black5,
    borderRadius: 20,
    paddingBottom: 34,
  },
  sessionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sessionTitleText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 16,
    lineHeight: 16 * 1.4,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.black5,
    backgroundColor: colors.lightGray,
  },
  taskTitleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: InterFont.MEDIUM,
    lineHeight: 14 * 1.4,
    color: colors.black,
  },
  taskTitleTextCompleted: {
    textDecorationLine: "line-through",
    color: colors.newGrey
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    textAlign: 'center',
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 16,
    zIndex: 2,
  },
  fixedBottomButton: {
    width: '100%',
    height: 58,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: -1, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fixedBottomButtonText: {
    fontFamily: InterFont.BOLD,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    color: colors.white,
    letterSpacing: 0.5,
  },
});
