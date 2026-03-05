import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/constants/sharedStyles";
import { InterFont } from "@/constants/fonts";
import type { ChallengeSession } from "@/lib/api/response/challenge";

export type WeekGroup = {
  week_number: number;
  week_title: string | null;
  week_description: string | null;
  sessions: ChallengeSession[];
};

type WeekStepperProps = {
  weekGroups: WeekGroup[];
  activeWeekIndex: number;
  onWeekPress: (index: number) => void;
  effectiveDay: number;
  titleTextColor: string;
};

export default function WeekStepper({
  weekGroups,
  activeWeekIndex,
  onWeekPress,
  effectiveDay,
  titleTextColor,
}: WeekStepperProps) {
  return (
    <View style={styles.stepperContainer}>
      {weekGroups.map((week, index) => {
        const isActive = index === activeWeekIndex;
        const isCurrentPhase = week.sessions.some(
          (s) => s.day_number === effectiveDay
        );

        return (
          <Pressable
            key={`step-${week.week_number}`}
            style={styles.stepperStepItem}
            onPress={() => onWeekPress(index)}
          >
            <View
              style={[
                styles.stepperStepItemContent,
                !isCurrentPhase && styles.inactiveStepperStepItemContent,
              ]}
            >
              <View
                style={[
                  styles.currentPhaseDot,
                  { opacity: isCurrentPhase ? 1 : 0 },
                ]}
              />
              <Text
                style={[
                  styles.stepperLabel,
                  { color: titleTextColor },
                  { opacity: isActive ? 1 : 0.5 },
                  isActive && {
                    color: titleTextColor,
                    fontFamily: InterFont.SEMI_BOLD,
                  },
                ]}
              >
                {week.week_title ?? `Week ${week.week_number}`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepperContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperStepItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperLabel: {
    fontSize: 12,
    lineHeight: 12 * 1.2,
    flexShrink: 1,
    textAlign: "center",
    fontFamily: InterFont.MEDIUM,
  },
  currentPhaseDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.appleGreen2,
  },
  stepperStepItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.black5,
  },
  inactiveStepperStepItemContent: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
});