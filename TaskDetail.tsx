import BottomSheetModalComponent, { BottomSheetModalRef } from "@/components/ui/BottomSheetModal";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import type { ChallengeSession, Task } from "@/lib/api/response/challenge";
import { fetchSessionTasks, toggleUserTask } from "@/lib/api/challenge";
import { RefObject, useEffect, useRef, useState } from "react";
import { ForrestFont, InterFont } from "@/constants/fonts";
import { colors } from "@/constants/sharedStyles";
import { CustomIcon } from "@/components/ui/IconCustom";
import type { ChallengeAssets } from "../constants";
import LottieView from "lottie-react-native";

type TaskDetailProps = {
  visible: boolean;
  onClose: () => void;
  session?: ChallengeSession | null;
  modalRef: RefObject<BottomSheetModalRef | null>;
  onTaskToggled?: () => void;
  onNextSession?: () => void;
  totalSessions?: number;
  challengeAssets: ChallengeAssets;
  onBackPress?: (allTodayCompleted: boolean) => void;
  challengeSlug?: string;
};

const BANNER_SLIDE_DURATION_MS = 380;
const BANNER_CONTENT_DELAY_MS = 60;
const BANNER_CONTENT_FADE_MS = 200;
const BANNER_MAX_HEIGHT = 120;

export default function TaskDetail({ visible, onClose, session, modalRef, onTaskToggled, onNextSession, totalSessions, challengeAssets, onBackPress, challengeSlug }: TaskDetailProps) {
  const router = useRouter();

  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [fullGuideTaskSlug, setFullGuideTaskSlug] = useState<string | null>(null);


  // Selected task for full guide (derived from tasks)
  const fullGuideTask = fullGuideTaskSlug ? tasks.find((t) => t.slug === fullGuideTaskSlug) ?? null : null;

  console.log(fullGuideTask);

  // Grouped tasks
  const todayTasks = tasks.filter((task) => (task.task_type ?? "today") === "today");
  const goDeepTasks = tasks.filter((task) => task.task_type === "go_deeper");

  // Handle next stage: only show when all "today" tasks are completed
  const todayCompletedCount = todayTasks.filter((t) => completedTasks[t.slug]).length;
  const allTodayCompleted = todayTasks.length > 0 && todayCompletedCount === todayTasks.length;
  const showNextStage = allTodayCompleted;

  // Challenge completed: last session and all today tasks completed
  const isLastSession = session != null && totalSessions != null && session.day_number === totalSessions;
  const showChallengeCompleted = isLastSession && allTodayCompleted;

  // Derived banner visibility
  const showBanner = showChallengeCompleted || showNextStage;

  // BANNER ANIMATIONS
  const bannerTranslateY = useRef(new Animated.Value(-24)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.96)).current;
  const bannerContentOpacity = useRef(new Animated.Value(0)).current;
  // Container height so content below slides down smoothly (layout anim — native driver not possible)
  const bannerContainerHeight = useRef(new Animated.Value(0)).current;
  const markCompleteScaleAnim = useRef(new Animated.Value(1)).current;

  // Track previous banner visibility to only animate on transition
  const prevShowBannerRef = useRef(false);

  // Slide-out when user taps Next Stage
  const nextStageSlideX = useRef(new Animated.Value(0)).current;
  const nextStageOpacity = useRef(new Animated.Value(1)).current;
  const handleNextStagePress = () => {
    Animated.parallel([
      Animated.timing(nextStageSlideX, {
        toValue: -360,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(nextStageOpacity, {
        toValue: 0.75,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      nextStageSlideX.setValue(0);
      nextStageOpacity.setValue(1);
      onNextSession?.();
    });
  };

  useEffect(() => {
    const wasVisible = prevShowBannerRef.current;
    prevShowBannerRef.current = showBanner;

    if (showBanner && !wasVisible) {
      bannerTranslateY.setValue(-24);
      bannerOpacity.setValue(0);
      bannerScale.setValue(0.96);
      bannerContentOpacity.setValue(0);
      bannerContainerHeight.setValue(0);

      const slideEasing = Easing.out(Easing.cubic);
      // Banner slide/opacity/scale on native driver; container height animates in sync so content below slides smoothly
      Animated.parallel([
        Animated.timing(bannerTranslateY, {
          toValue: 0,
          duration: BANNER_SLIDE_DURATION_MS,
          easing: slideEasing,
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: BANNER_SLIDE_DURATION_MS,
          easing: slideEasing,
          useNativeDriver: true,
        }),
        Animated.timing(bannerScale, {
          toValue: 1,
          duration: BANNER_SLIDE_DURATION_MS,
          easing: slideEasing,
          useNativeDriver: true,
        }),
        Animated.timing(bannerContentOpacity, {
          toValue: 1,
          duration: BANNER_CONTENT_FADE_MS,
          delay: BANNER_CONTENT_DELAY_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bannerContainerHeight, {
          toValue: BANNER_MAX_HEIGHT,
          duration: BANNER_SLIDE_DURATION_MS,
          easing: slideEasing,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (!showBanner && wasVisible) {
      bannerTranslateY.setValue(-24);
      bannerOpacity.setValue(0);
      bannerScale.setValue(0.96);
      bannerContentOpacity.setValue(0);
      bannerContainerHeight.setValue(0);
    }
  }, [showBanner]);

  // TASK ANIMATION REFS
  const taskScaleAnims = useRef<Record<string, Animated.Value>>({});
  const taskStrikeAnims = useRef<Record<string, Animated.Value>>({});
  const taskStrikeCompleteAnims = useRef<Record<string, Animated.Value>>({});
  const taskTextHeights = useRef<Record<string, number>>({});
  const taskTextWidths = useRef<Record<string, number>>({});
  const taskLineLayoutsRef = useRef<Record<string, Array<{ width: number; x: number; y: number; height: number }>>>({});

  // Per-line layout for strikethrough
  const [taskLineLayouts, setTaskLineLayouts] = useState<Record<string, Array<{ width: number; x: number; y: number; height: number }>>>({});

  const getTaskScaleAnim = (slug: string) => {
    if (!taskScaleAnims.current[slug]) {
      taskScaleAnims.current[slug] = new Animated.Value(1);
    }
    return taskScaleAnims.current[slug];
  };

  const getTaskStrikeAnim = (slug: string) => {
    if (!taskStrikeAnims.current[slug]) {
      taskStrikeAnims.current[slug] = new Animated.Value(0);
    }
    return taskStrikeAnims.current[slug];
  };

  const getTaskStrikeCompleteAnim = (slug: string) => {
    if (!taskStrikeCompleteAnims.current[slug]) {
      taskStrikeCompleteAnims.current[slug] = new Animated.Value(0);
    }
    return taskStrikeCompleteAnims.current[slug];
  };

  // Lottie animation
  const challengeUnlockedLottie = require('@/assets/images/illustrations/challenge/challengeUnlocked.json');

  // Reset full guide when modal closes or session changes
  useEffect(() => {
    if (!visible) setFullGuideTaskSlug(null);
  }, [visible]);
  useEffect(() => {
    setFullGuideTaskSlug(null);
  }, [session?.slug]);

  useEffect(() => {
    const hasSession = session && (session.slug || session.id != null);
    if (!hasSession || !visible) {
      setTasks([]);
      return;
    }
    setLoading(true);
    fetchSessionTasks(session.slug ?? null)
      .then((data) => {
        setTasks(data ?? []);
        const initialCompleted: Record<string, boolean> = {};
        (data ?? []).forEach((task) => {
          initialCompleted[task.slug] = task.completed ?? false;
        });
        setCompletedTasks(initialCompleted);
        setLoading(false);
      })
      .catch(() => {
        setTasks([]);
        setCompletedTasks({});
        setLoading(false);
      });
  }, [session?.slug, visible]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleToggleTask = async (taskSlug: string) => {
    const result = await toggleUserTask(taskSlug);
    if (result) {
      setCompletedTasks((prev) => ({ ...prev, [taskSlug]: result.completed }));
      onTaskToggled?.();

      if (result.completed) {
        // Checkbox spring bounce
        const scaleAnim = getTaskScaleAnim(taskSlug);
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.75,
            useNativeDriver: true,
            speed: 50,
            bounciness: 18,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 10,
          }),
        ]).start();

        // Strikethrough sweep — one line at a time, then fade color
        const strikeAnim = getTaskStrikeAnim(taskSlug);
        const strikeCompleteAnim = getTaskStrikeCompleteAnim(taskSlug);
        strikeAnim.setValue(0);
        strikeCompleteAnim.setValue(0);

        const lineCount = Math.max(1, taskLineLayoutsRef.current[taskSlug]?.length ?? 1);
        const strikeDuration = 500 * lineCount;

        Animated.sequence([
          Animated.timing(strikeAnim, {
            toValue: 1,
            duration: strikeDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(strikeCompleteAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        getTaskStrikeAnim(taskSlug).setValue(0);
        getTaskStrikeCompleteAnim(taskSlug).setValue(0);
      }
    }
  };

  // Close modal and open journal entry screen
  const handleOpenJournal = (task: Task) => {
    modalRef.current?.closeWithAnimation();
    setTimeout(() => {
      router.push({
        pathname: "/journal/create-entry",
        params: {
          taskSlug: task.slug,
          taskTitle: task.action_type_title,
          taskId: task.id,
          ...(task.user_task_id != null && { userTaskId: String(task.user_task_id) }),
          sessionSlug: session?.slug,
          challengeSlug: challengeSlug,
        },
      });
    }, 300);
  };

  const renderTask = (task: Task) => {
    const scaleAnim = getTaskScaleAnim(task.slug);
    const strikeAnim = getTaskStrikeAnim(task.slug);
    const strikeCompleteAnim = getTaskStrikeCompleteAnim(task.slug);
    const isCompleted = completedTasks[task.slug];

    const textColor = strikeCompleteAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.black, colors.black50],
    });

    return (
      <View key={task.id}>
        <View style={[
          styles.taskTitleContainer,
          { backgroundColor: challengeAssets.taskBackground },
          expanded[task.id.toString()]
            ? { borderTopLeftRadius: 20, borderTopRightRadius: 20 }
            : { borderRadius: 20 }
        ]}>
          <View style={styles.taskTitleContentContainer}>

            {/* Animated checkbox */}
            <TouchableOpacity 
              onPress={() => handleToggleTask(task.slug)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <CustomIcon
                  name={isCompleted ? "taskTicked" : "taskUnticked"}
                  size={22}
                  color={isCompleted ? colors.primary : colors.black}
                />
              </Animated.View>
            </TouchableOpacity>

            <View style={{ flex: 1, gap: 8 }}>
              <TouchableOpacity
                onPress={() => toggleExpand(task.id.toString())}
                style={[styles.taskTitleExpandRow, { flex: 1 }]}
              >
                <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
                  <Animated.Text
                    style={[styles.taskTitleText, { color: textColor, flexShrink: 1 }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    onLayout={(e) => {
                      taskTextWidths.current[task.slug] = e.nativeEvent.layout.width;
                      taskTextHeights.current[task.slug] = e.nativeEvent.layout.height;
                    }}
                    onTextLayout={(e) => {
                      const lines = e.nativeEvent.lines.map((l) => ({
                        width: l.width,
                        x: l.x,
                        y: l.y,
                        height: l.height,
                      }));
                      taskLineLayoutsRef.current[task.slug] = lines;
                      setTaskLineLayouts((prev) => ({ ...prev, [task.slug]: lines }));
                    }}
                  >
                    {task.title}
                  </Animated.Text>
                  {(() => {
                    const lines = taskLineLayouts[task.slug];
                    if (!lines?.length) return null;
                    const n = lines.length;
                    return lines.map((line, i) => (
                      <Animated.View
                        key={i}
                        style={{
                          position: 'absolute',
                          left: line.x,
                          top: line.y + line.height / 2 - 0.75,
                          backgroundColor: colors.black50,
                          height: 1.5,
                          width: strikeAnim.interpolate({
                            inputRange: [i / n, (i + 1) / n],
                            outputRange: [0, line.width],
                            extrapolate: 'clamp',
                          }),
                        }}
                      />
                    ));
                  })()}
                </View>

                <CustomIcon
                  style={[
                    styles.taskTitleChevron,
                    { transform: [{ rotate: expanded[task.id.toString()] ? '180deg' : '0deg' }] }
                  ]}
                  name="chevronArrowDown"
                  size={16}
                  color={colors.black}
                />
              </TouchableOpacity>
              {task.action_type === "journal" && (
                <TouchableOpacity
                  style={styles.taskDurationTextContainer}
                  onPress={() => {
                    if (task.journal_slug) {
                      modalRef.current?.closeWithAnimation();
                      setTimeout(() => {
                        router.push({
                          pathname: "/journal/show-entry",
                          params: { 
                            slug: task.journal_slug,
                            sessionSlug: session?.slug,
                            challengeSlug: challengeSlug,
                          },
                        });
                      }, 300);
                    } else {
                      handleOpenJournal(task);
                    }
                  }}
                >
                  <Text style={styles.linkText}>
                    {task.journal_slug ? "View Journal" : "Open Journal"}
                  </Text>
                  <CustomIcon name="externalLink" size={12} color={colors.newGrey} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {expanded[task.id.toString()] && (
          <View style={[styles.taskDescriptionContainer, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]}>
            <Text style={styles.taskDescriptionText}>{task.description}</Text>
            <Pressable
              style={styles.taskDescriptionLinkContainer}
              onPress={() => setFullGuideTaskSlug(task.slug)}
            >
              <Text style={styles.taskDescriptionLinkText}>View full guide</Text>
              <CustomIcon name="arrowGuide" size={16} color={colors.newGrey} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Render banner content based on state
  const renderBannerContent = () => {
    if (showChallengeCompleted) {
      return (
        <Animated.View style={[
          styles.nextStageBanner,
          { flexDirection: 'column', alignItems: 'center', gap: 12 },
          {
            opacity: bannerOpacity,
            transform: [{ translateY: bannerTranslateY }, { scale: bannerScale }],
          }
        ]}>
          <Animated.View style={{ opacity: bannerContentOpacity, alignItems: 'center', gap: 12 }}>
            <Text style={styles.challengeCompletedText}>Challenge Completed</Text>
            <Text style={styles.challengeCompletedSubtitleText}>You've finished this challenge.</Text>
          </Animated.View>
        </Animated.View>
      );
    }

    if (showNextStage) {
      return (
        <Animated.View style={[
          styles.nextStageBannerPressable,
          {
            opacity: bannerOpacity,
            transform: [{ translateY: bannerTranslateY }, { scale: bannerScale }],
          }
        ]}>
          <Pressable style={styles.nextStageBannerInner} onPress={handleNextStagePress}>
            <Animated.View style={{ opacity: bannerContentOpacity, flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
              <View style={styles.nextStageLottieContainer}>
                <LottieView source={challengeUnlockedLottie} autoPlay loop style={{ width: 50, height: 50 }} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.nextStageTitleText}>Next stage unlocked!</Text>
                <Text style={styles.nextStageSubtitleText}>Move on to Session {(session?.day_number ?? 0) + 1}</Text>
              </View>
              <CustomIcon name="nextStage" size={16} color={colors.black} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      );
    }

    return null;
  };

  // Full guide view when user taps "View full guide"
  if (fullGuideTask && session) {
    const isCompleted = completedTasks[fullGuideTask.slug];
    return (
      <BottomSheetModalComponent
        height={0.9}
        visible={visible}
        onClose={onClose}
        closeButton={false}
        sheetPaddingHorizontal={false}
        ref={modalRef}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.taskNavigation}>
            <Pressable onPress={() => setFullGuideTaskSlug(null)}>
              <CustomIcon name="backButton" size={30} color={colors.primary} />
            </Pressable>
            <Text style={styles.taskNavigationText}>
              Session {session.day_number}
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.container}>
            <View style={[styles.taskHeader, { gap: 8, marginBottom: 30, borderTopWidth: 1, borderTopColor: colors.black5, backgroundColor: challengeAssets.fullGuideBackground }]}>
              <Text style={styles.eyebrowText2}>FULL GUIDE</Text>
              <Text style={styles.challengeTitleText}>{fullGuideTask.title}</Text>
              {fullGuideTask.duration_label ? (
                <View style={styles.taskDurationTextContainer}>
                  <Text style={styles.taskDurationText}>
                    {fullGuideTask.duration_label}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.fullGuideTaskDescriptionText}>{fullGuideTask.why_this_matters ?? fullGuideTask.description}</Text>
            </View>

            <View style={styles.fullGuideContent}>

              {fullGuideTask.what_to_do ? (
                <View style={styles.fullGuideSection}>
                  <Text style={styles.eyebrowText2}>WHAT TO DO</Text>
                  <View style={styles.fullGuideSectionContent}>
                    <Text style={styles.taskDescriptionText}>
                      {fullGuideTask.what_to_do}
                    </Text>
                  </View>
                </View>
              ) : null}

              {fullGuideTask.if_this_feels_hard ? (
                <View style={styles.fullGuideSection}>
                  <Text style={styles.eyebrowText2}>IF THIS FEELS HARD</Text>
                  <View style={styles.fullGuideSectionContent}>
                    <Text style={styles.taskDescriptionText}>
                      {fullGuideTask.if_this_feels_hard}
                    </Text>
                  </View>
                </View>
              ) : null}

              {!fullGuideTask.why_this_matters && !fullGuideTask.what_to_do && !fullGuideTask.if_this_feels_hard && !fullGuideTask.description ? (
                <View>
                  <Text>No additional guide content yet.</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.fullGuideBottomCTA}>
            <Animated.View style={{ transform: [{ scale: markCompleteScaleAnim }] }}>
              <Pressable
                style={[
                  styles.markCompleteButton,
                  isCompleted && styles.markCompleteButtonDone,
                ]}
                onPress={async () => {
                  if (fullGuideTask && !isCompleted) {
                    // Button pop animation
                    Animated.sequence([
                      Animated.spring(markCompleteScaleAnim, {
                        toValue: 0.94,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 8,
                      }),
                      Animated.spring(markCompleteScaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 30,
                        bounciness: 12,
                      }),
                    ]).start();

                    await handleToggleTask(fullGuideTask.slug);

                    // Short delay so user sees "Completed!" state before navigating back
                    setTimeout(() => {
                      setFullGuideTaskSlug(null);
                    }, 800);
                  }
                }}
              >
                {!isCompleted && (
                  <CustomIcon name="checkMarkSmall" size={16} color={colors.white} />
                )}
                <Text style={styles.markCompleteButtonText}>
                  {isCompleted ? "Completed!" : "Mark complete"}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </BottomSheetModalComponent>
    );
  }

  return (
    <BottomSheetModalComponent
      height={0.9}
      visible={visible}
      onClose={onClose}
      closeButton={false}
      sheetPaddingHorizontal={false}
      ref={modalRef}
    >
      <Animated.View style={[styles.container, { opacity: nextStageOpacity, transform: [{ translateX: nextStageSlideX }] }]}>
      {/* Header */}
      {session && (
        <View style={styles.taskNavigation}>
          <Pressable
            onPress={() => {
              onBackPress?.(allTodayCompleted);
              modalRef.current?.closeWithAnimation();
            }}
          >
            <CustomIcon name="backButton" size={30} color={colors.primary} />
          </Pressable>
          <Text style={styles.taskNavigationText}>
            Session {session.day_number}
          </Text>
        </View>
      )}

        {/* Scrollable content */}
        <ScrollView style={styles.container}>

          {/* Animated banner — container height animates so content below slides down smoothly */}
          {showBanner && (
            <Animated.View style={{ height: bannerContainerHeight, overflow: 'hidden' }}>
              {renderBannerContent()}
            </Animated.View>
          )}

          {session && (
            <View style={styles.taskHeader}>
              <Text style={styles.challengeTitleText}>{session.title}</Text>
              <Text style={styles.challengeDescriptionText}>{session.description}</Text>
            </View>
          )}

          <View style={{ gap: 40, paddingBottom: 100, paddingTop: 20, paddingHorizontal: 20 }}>

            {/* TODAY'S TASKS section */}
            {todayTasks.length > 0 && (
              <View style={{ gap: 12 }}>
                <View style={styles.todayTaskContainer}>
                  <Text style={styles.eyebrowText}>TODAY'S TASKS</Text>
                    {!allTodayCompleted && todayTasks.length > 0 && (
                      <Text style={styles.todayTaskInstructionsText}>Complete to continue</Text>
                    )}
                </View>
                {todayTasks.map(renderTask)}
              </View>
            )}

            {/* GO DEEPER section */}
            {goDeepTasks.length > 0 && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.eyebrowText, { marginBottom: 12, paddingLeft: 4 }]}>GO DEEPER</Text>
                {goDeepTasks.map(renderTask)}
              </View>
            )}

          </View>
        </ScrollView>
      </Animated.View>

    </BottomSheetModalComponent>
  );
}

const TASK_TITLE_LINE_HEIGHT = 14 * 1.4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskHeader: {
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 6,
  },
  challengeTitleText: {
    fontSize: 24,
    fontFamily: ForrestFont.MEDIUM,
    lineHeight: 24 * 1.2,
    color: colors.black,
  },
  challengeDescriptionText: {
    fontSize: 16,
    fontFamily: InterFont.REGULAR,
    lineHeight: 16 * 1.4,
    color: colors.black,
  },
  eyebrowText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1,
    color: colors.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  eyebrowText2: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1,
    color: colors.newGrey,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  todayTaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingRight: 8,
    paddingLeft: 4,
  },
  todayTaskInstructionsText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 12,
    lineHeight: 12 * 1,
    color: colors.black,
    letterSpacing: 0.5,
  },
  taskTitleText: {
    fontSize: 14,
    fontFamily: InterFont.SEMI_BOLD,
    lineHeight: TASK_TITLE_LINE_HEIGHT,
  },
  fullGuideTaskDescriptionText: {
    fontSize: 16,
    fontFamily: InterFont.REGULAR,
    lineHeight: 16 * 1.4,
    color: colors.newGrey,
    letterSpacing: 0.5,
  },
  taskDescriptionText: {
    fontSize: 14,
    fontFamily: InterFont.REGULAR,
    lineHeight: 14 * 1.4,
    color: colors.black,
    letterSpacing: 0.5,
  },
  taskDurationTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  taskDurationText: {
    fontSize: 10,
    fontFamily: InterFont.MEDIUM,
    lineHeight: 10 * 1,
    color: colors.black,
    alignSelf: 'flex-start',
  },
    linkText: {
    fontSize: 12,
    fontFamily: InterFont.MEDIUM,
    lineHeight: 12 * 1,
    color: colors.newGrey,
    alignSelf: 'flex-start',
  },
  taskDescriptionLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
  },
  taskDescriptionLinkText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 14,
    color: colors.newGrey,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  taskTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  taskTitleContentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    flex: 1,
  },
  taskTitleExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
    minWidth: 0,
  },
  taskTitleChevron: {
    marginLeft: 6,
  },
  taskDescriptionContainer: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  taskNavigation: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 18,
    paddingVertical: 28,
    position: 'relative',
    left: 0,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    gap: 8,
  },
  taskNavigationText: {
    fontSize: 18,
    fontFamily: InterFont.SEMI_BOLD,
    lineHeight: 18 * 1.4,
    color: colors.primary,
  },
  // Banner wrapper — carries the entrance animation transforms
  nextStageBanner: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    gap: 12,
    marginTop: 36,
    borderWidth: 1,
    borderColor: colors.black5,
  },
  nextStageBannerPressable: {
    marginHorizontal: 20,
    marginTop: 36,
    borderRadius: 20,
    overflow: 'hidden',
  },
  nextStageBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.black5,
  },
  nextStageLottieContainer: {
    width: 50,
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStageTitleText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 18,
    color: colors.black,
    lineHeight: 18 * 1.4,
  },
  nextStageSubtitleText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 12,
    color: colors.black,
    letterSpacing: 0.5,
  },
  challengeCompletedText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 24,
    color: colors.black,
    lineHeight: 24 * 1.2,
  },
  challengeCompletedSubtitleText: {
    fontFamily: InterFont.REGULAR,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.black,
    letterSpacing: 0.5,
  },
  fullGuideContent: {
    gap: 28,
  },
  fullGuideSection: {
    paddingHorizontal: 20,
    gap: 20,
  },
  fullGuideSectionContent: {
    backgroundColor: colors.lightGray,
    padding: 20,
    borderRadius: 16,
  },
  fullGuideBottomCTA: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
  },
  markCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  markCompleteButtonDone: {
    backgroundColor: colors.appleGreen2,
  },
  markCompleteButtonText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    color: colors.white,
    letterSpacing: 0.25,
  },
});