import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { CustomIcon } from "@/components/ui/IconCustom";
import { colors } from "@/constants/sharedStyles";
import { InterFont } from "@/constants/fonts";
import WeekStepper, { type WeekGroup } from "./WeekStepper";
import { LinearGradient } from "expo-linear-gradient";

export type ChallengeHeaderProps = {
  showStickyNav: boolean;
  orbAnimDone: boolean;
  challengeName: string | null | undefined;
  headerPaddingBottom: Animated.AnimatedInterpolation<number>;
  headerPaddingTop: Animated.AnimatedInterpolation<number>;
  navOpacity: Animated.AnimatedInterpolation<number>;
  navRowOpacity: Animated.Value | Animated.AnimatedInterpolation<number>;
  navRowMaxHeight: Animated.AnimatedInterpolation<number>;
  spaceBetweenNavAndStepper: Animated.AnimatedInterpolation<number>;
  weekGroups: WeekGroup[];
  activeWeekIndex: number;
  onWeekPress: (index: number) => void;
  effectiveDay: number;
  titleTextColor: string;
  onBack: () => void;
  onOpenOptions: () => void;
};

export default function ChallengeHeader({
  showStickyNav,
  orbAnimDone,
  challengeName,
  headerPaddingBottom,
  headerPaddingTop,
  navOpacity,
  navRowOpacity,
  navRowMaxHeight,
  spaceBetweenNavAndStepper,
  weekGroups,
  activeWeekIndex,
  onWeekPress,
  effectiveDay,
  titleTextColor,
  onBack,
  onOpenOptions,
}: ChallengeHeaderProps) {
  return (
    <Animated.View
      style={[
        styles.mainNavigationContainer,
        {
          opacity: orbAnimDone ? 1 : 0,
          pointerEvents: orbAnimDone ? "auto" : "none",
          paddingBottom: headerPaddingBottom,
          paddingTop: headerPaddingTop,
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.lightGray,
            opacity: navOpacity,
            pointerEvents: showStickyNav ? "auto" : "none",
          },
        ]}
      />
      <Animated.View
        style={[
          styles.navigationContainer,
          {
            opacity: navRowOpacity,
            maxHeight: navRowMaxHeight,
            overflow: "hidden",
          },
        ]}
      >
        <Pressable onPress={onBack}>
          <CustomIcon name="arrowLeft" size={30} color={colors.primary} />
        </Pressable>
        <Animated.View
          style={{ opacity: navOpacity, pointerEvents: showStickyNav ? "auto" : "none" }}
        >
          <Text style={styles.navigationText}>{challengeName}</Text>
        </Animated.View>
        <Pressable onPress={onOpenOptions}>
          <CustomIcon name="challengeEllipsis" size={30} color={colors.primary} />
        </Pressable>
      </Animated.View>
      <Animated.View style={{ height: spaceBetweenNavAndStepper }} />
      <Animated.View
        style={{
          opacity: navOpacity,
          pointerEvents: showStickyNav ? "auto" : "none",
          width: "100%",
        }}
      >
        <WeekStepper
          weekGroups={weekGroups}
          activeWeekIndex={activeWeekIndex}
          onWeekPress={onWeekPress}
          effectiveDay={effectiveDay}
          titleTextColor={titleTextColor}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mainNavigationContainer: {
    position: "absolute",
    width: "100%",
    zIndex: 2,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  navigationContainer: {
    height: 40,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  navigationText: {
    fontFamily: InterFont.BOLD,
    fontSize: 18,
    lineHeight: 0,
    letterSpacing: 0,
    textAlign: "center",
    color: colors.primary80,
  },
});
