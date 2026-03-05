import { View, StyleSheet, Animated } from "react-native";
import type { ChallengeSession } from "@/lib/api/response/challenge";
import type { ChallengeAssets } from "../constants";
import type { WeekGroup } from "./WeekStepper";
import {
  DashedConnector,
  PhaseHeaderCard,
  UnlockedSession,
  LockedSession,
  LastLockedSession,
  CompletedSession,
  LastCompletedSession,
} from "./SessionCards";

export type SessionsListProps = {
  weekGroups: WeekGroup[];
  totalSessions: number;
  sessionsOpacity: Animated.Value;
  sessionsTranslateY: Animated.Value;
  sessionsAnimationDone: boolean;
  scrollYAnimated: Animated.Value;
  showNavThreshold: number;
  challengeName: string;
  challengeAssets: ChallengeAssets;
  effectiveDay: number;
  isSessionUnlocked: (session: ChallengeSession) => boolean;
  isSessionCompleted: (session: ChallengeSession) => boolean;
  onSessionPress: (session: ChallengeSession) => void;
  orbHeightRef: React.MutableRefObject<number>;
  phaseLayoutsRef: React.MutableRefObject<Record<number, number>>;
  sessionLayoutsRef: React.MutableRefObject<Record<number, number>>;
  sessionHeightsRef: React.MutableRefObject<Record<number, number>>;
  onCompletedChallengePress?: () => void;
  /** Called when the LastCompletedSession card layout is measured (y from scroll content top, height) */
  onCompletedChallengeLayout?: (y: number, height: number) => void;
  /** Day number that just transitioned to completed (animate entrance) */
  transitionAnimateCompletedDay?: number | null;
  /** Day number that just transitioned to unlocked (animate entrance) */
  transitionAnimateUnlockedDay?: number | null;
};

export default function SessionsList({
  weekGroups,
  totalSessions,
  sessionsOpacity,
  sessionsTranslateY,
  sessionsAnimationDone,
  scrollYAnimated,
  showNavThreshold,
  challengeName,
  challengeAssets,
  effectiveDay,
  isSessionUnlocked,
  isSessionCompleted,
  onSessionPress,
  orbHeightRef,
  phaseLayoutsRef,
  sessionLayoutsRef,
  sessionHeightsRef,
  onCompletedChallengePress,
  onCompletedChallengeLayout,
  transitionAnimateCompletedDay,
  transitionAnimateUnlockedDay,
}: SessionsListProps) {
  const isLastSession = (session: ChallengeSession) =>
    totalSessions > 0 && session.day_number === totalSessions;

  return (
    <Animated.View
      style={[
        styles.sessionsContainer,
        {
          opacity: sessionsOpacity,
          transform: [{ translateY: sessionsTranslateY }],
          pointerEvents: sessionsAnimationDone ? "auto" : "none",
        },
      ]}
    >
      {weekGroups.map((week, weekIndex) => {
        const sessionRange = {
          min: Math.min(...week.sessions.map((s) => s.day_number)),
          max: Math.max(...week.sessions.map((s) => s.day_number)),
        };
        return (
          <View
            key={`phase-${week.week_number}`}
            style={styles.phaseBlock}
            onLayout={(e) => {
              phaseLayoutsRef.current[weekIndex] =
                orbHeightRef.current + e.nativeEvent.layout.y;
            }}
          >
            {weekIndex > 0 && <DashedConnector />}

            {week.week_number !== 1 && (
              <PhaseHeaderCard
                weekNumber={week.week_number}
                weekTitle={week.week_title}
                challengeName={challengeName}
                titleTextColor={challengeAssets.weekStepperText}
              />
            )}
            
            {week.sessions.map((session, sessionIndex) => {
              const unlocked = isSessionUnlocked(session);

              return (
                <View
                  key={session.id}
                  style={styles.sessionRow}
                  onLayout={(e) => {
                    const { y, height } = e.nativeEvent.layout;
                    sessionLayoutsRef.current[session.day_number] = y;
                    sessionHeightsRef.current[session.day_number] = height;
                  }}
                >
                  {(weekIndex > 0 || sessionIndex > 0) && <DashedConnector />}
                  {unlocked ? (
                    isSessionCompleted(session) ? (
                      isLastSession(session) ? (
                        <LastCompletedSession
                          session={session}
                          onPress={onCompletedChallengePress ?? (() => onSessionPress(session))}
                          completedIcon={challengeAssets.completedIcon}
                          challengeName={challengeName}
                          animateEntrance={session.day_number === transitionAnimateCompletedDay}
                        />
                      ) : (
                        <CompletedSession
                          session={session}
                          onPress={() => onSessionPress(session)}
                          completedIcon={challengeAssets.detailsCompletedIcon}
                          animateEntrance={session.day_number === transitionAnimateCompletedDay}
                          challengeName={challengeName}
                        />
                      )
                    ) : (
                      <UnlockedSession
                        session={session}
                        effectiveDay={effectiveDay}
                        onPress={() => onSessionPress(session)}
                        sessionIcon={challengeAssets.sessionIcon}
                        challengeName={challengeName}
                        animateEntrance={session.day_number === transitionAnimateUnlockedDay}
                        challengeLockedIcon={session.day_number === transitionAnimateUnlockedDay ? challengeAssets.challengeLockedIcon : undefined}
                      />
                    )
                  ) : isLastSession(session) ? (
                    <LastLockedSession
                      session={session}
                      challengeLockedIcon={challengeAssets.lastLockedSessionIcon}
                    />
                  ) : (
                    <LockedSession
                      session={session}
                      challengeLockedIcon={challengeAssets.challengeLockedIcon}
                    />
                  )}
                  {sessionIndex !== week.sessions.length - 1 && <DashedConnector />}
                </View>
              );
            })}
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sessionsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 21,
    paddingTop: 40,
  },
  phaseBlock: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionRow: {
    width: "100%",
    alignItems: "center",
  },
});
