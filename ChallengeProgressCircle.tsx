import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/constants/sharedStyles";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DEFAULT_SIZE = 280;
const DEFAULT_STROKE_WIDTH = 20;
const FILL_ANIMATION_DURATION = 800;

type ChallengeProgressCircleProps = {
  /** Progress from 0 to 1 */
  progress: number;
  /** Diameter of the circle in px. Default 280 */
  size?: number;
  /** Stroke width of the ring. Default 20 */
  strokeWidth?: number;
  /** Color of the track (unfilled) ring */
  trackColor?: string;
  /** Color of the progress (filled) ring */
  progressColor?: string;
  /** Duration of the fill animation in ms. Default 800 */
  animationDuration?: number;
  /** Content rendered in the center (icon, title, badge, etc.) */
  children?: React.ReactNode;
};

export function ChallengeProgressCircle({
  progress,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  trackColor = colors.lightGray,
  progressColor = colors.white50,
  animationDuration = FILL_ANIMATION_DURATION,
  children,
}: ChallengeProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  useEffect(() => {
    const target = Math.min(1, Math.max(0, progress));
    Animated.timing(animatedProgress, {
      toValue: target,
      duration: animationDuration,
      useNativeDriver: false,
    }).start();
  }, [progress, animationDuration]);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle - drawn clockwise from top, animated */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset as unknown as number}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerContent} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
