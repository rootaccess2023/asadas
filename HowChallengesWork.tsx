import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import type { BottomSheetModalRef } from "@/components/ui/BottomSheetModal";
import BottomSheetModalComponent from "@/components/ui/BottomSheetModal";
import { colors } from "@/constants/sharedStyles";
import { ForrestFont, InterFont } from "@/constants/fonts";
import { CustomIcon } from "@/components/ui/IconCustom";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

type HowChallengesWorkProps = {
  visible: boolean;
  onClose: () => void;
};

function SlideOne() {
  return (
    <View style={styles.slide}>
      <Text style={styles.titleText}>How challenges work</Text>
      <View style={styles.lottieContainer}>
        <LottieView
          source={require('@/assets/images/illustrations/unlocked.json')}
          autoPlay
          loop={true}
          style={styles.icon}
        />
      </View>
      <View style={styles.subTitleContainer}>
        <Text style={styles.subTitleText}>Unlock sessions as you go</Text>
        <Text style={styles.subDescriptionText}>
          Finish today's tasks to unlock the next session. Optional exercises are there if you want to go deeper.
        </Text>
      </View>
    </View>
  );
}

function SlideTwo() {
  return (
    <View style={styles.slide}>
      <Text style={styles.titleText}>How challenges work</Text>
      <CustomIcon name="triangleMark" size={80} color={colors.primary} />
      <View style={styles.subTitleContainer}>
        <Text style={styles.subTitleText}>Build momentum</Text>
        <Text style={styles.subDescriptionText}>
          Taking breaks is fine, but regular progress helps the ideas settle and shape behavior.
        </Text>
      </View>
    </View>
  );
}

function SlideThree() {
  return (
    <View style={styles.slide}>
      <Text style={styles.titleText}>Nothing gets lost</Text>
      <View style={styles.listContainerWrapper}>
        <View style={styles.listContainer}>
          <View style={styles.listContent}>
            <View style={styles.iconContainer}>
              <CustomIcon name="bookPrimary" size={24} color={colors.primary} />
            </View>
            <Text>
              <Text style={styles.listText}>Journal entries</Text> → Saved in Journal
            </Text>
          </View>
        </View>
        <View style={styles.listContainer}>
          <View style={styles.listContent}>
            <View style={styles.iconContainer}>
              <CustomIcon name="upload" size={24} color={colors.primary} />
            </View>
            <Text>
              <Text style={styles.listText}>Uploads</Text> → Saved in Evidence Vault
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const SLIDES = [SlideOne, SlideTwo, SlideThree];

export default function HowChallengesWork({ visible, onClose }: HowChallengesWorkProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const modalRef = useRef<BottomSheetModalRef>(null);

  const isLast = currentIndex === SLIDES.length - 1;

  const goToNext = () => {
    if (isLast) {
      modalRef.current?.closeWithAnimation();
    } else {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <BottomSheetModalComponent ref={modalRef} showHandle={false} height={0.5} visible={visible} sheetPaddingHorizontal={false} onClose={onClose}>
      <View style={styles.container}>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          renderItem={({ item: SlideComponent }) => <SlideComponent />}
        />

        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={goToNext}>
          <Text style={styles.primaryButtonText}>{isLast ? "Got it" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModalComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
  },
  slide: {
    width,
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 32,
  },
  listContainerWrapper: {
    width: "100%",
    gap: 18,
  },
  listContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.black5,
    alignItems: "center",
  },
  listContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  listText: {
    fontFamily: InterFont.SEMI_BOLD,
    fontSize: 14,
    lineHeight: 14 * 1.4,
  },
  iconContainer: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  titleText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 24,
    lineHeight: 24 * 1.2,
    color: colors.primary,
  },
  subTitleContainer: {
    alignItems: "center",
    gap: 8,
  },
  subTitleText: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 20,
    lineHeight: 20 * 1.2,
    color: colors.primary,
    alignItems: "center",
  },
  subDescriptionText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.newGrey,
    textAlign: "center",
    paddingHorizontal: 28,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  dotActive: {
    backgroundColor: "#1a2e5a",
  },
  primaryButton: {
    marginHorizontal: 22,
    backgroundColor: colors.primary,
    height: 53.25,
    borderRadius: 46.47,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 18 * 1.4,
    fontFamily: InterFont.BOLD,
  },
  lottieContainer: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  icon: {
    width: 110,
    height: 110,
    position: "absolute",
  },
});