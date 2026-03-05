import { CustomIcon } from "@/components/ui/IconCustom";
import { colors } from "@/constants/sharedStyles";
import { getChallengeAssets } from "../constants";
import { UserChallenge } from "@/lib/api/response/challenge";
import { Text, View, Pressable, ImageBackground, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ForrestFont, InterFont } from "@/constants/fonts";
import LottieView from "lottie-react-native";

export type ChallengeHistoryViewProps = {
  pastChallenges: UserChallenge[];
  selectMode?: boolean;
  selectedSlugs?: string[];
  onToggleSelect?: (slug: string) => void;
};

export default function ChallengeHistoryView({
  pastChallenges,
  selectMode = false,
  selectedSlugs = [],
  onToggleSelect,
}: ChallengeHistoryViewProps) {
  const router = useRouter();

  if (pastChallenges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LottieView
          source={require('@/assets/images/illustrations/challenge/empty-box.json')}
          autoPlay
          loop
          style={styles.emptyLottie}
        />
        <Text style={styles.emptyText}>
          You have not completed or achived any{"\n"}
          challenges yet. 
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listWrapper}>
      {pastChallenges.map((challenge) => {
        const challengeName = challenge.challenge?.name ?? "";
        const challengeAssets = getChallengeAssets(challengeName);
        const isSelected = selectedSlugs.includes(challenge.slug);
        const dateStr =
          challenge.status === "completed" ? challenge.completed_at : challenge.archived_at;
        return (
          <View key={challenge.slug} style={styles.cardWrapper}>
            <ImageBackground
              source={challengeAssets.historyOrb}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              imageStyle={styles.cardImage}
            />
            <Pressable
              onPress={() => {
                if (selectMode) onToggleSelect?.(challenge.slug);
                else router.push(`/challenge/challenge-details/${challenge.slug}`);
              }}
              style={styles.cardContent}
            >
              <View style={styles.iconContainer}>
                <CustomIcon
                  name={challengeAssets.icon}
                  size={36}
                  color={challengeAssets.titleText}
                />
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[styles.title, { color: challengeAssets.weekStepperText }]}
                  numberOfLines={1}
                >
                  {challenge.challenge.name}
                </Text>
                <Text
                  style={[
                    styles.description,
                    { color: challengeAssets.weekStepperText },
                  ]}
                  numberOfLines={2}
                >
                  {challenge.challenge.description}
                </Text>
                <Text style={styles.date}>
                  {challenge.status === "completed" ? "Completed" : "Archived"}{" "}
                  {dateStr
                    ? new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(dateStr))
                    : "—"}
                </Text>
              </View>
              {!selectMode && (
                <View style={styles.arrowContainer}>
                  <CustomIcon
                    name="chevronArrowRightBlack"
                    size={28}
                    color={colors.primary}
                  />
                </View>
              )}

              {selectMode && (
                <>
                  {isSelected && <View style={styles.selectedOverlay} pointerEvents="none" />}
                  <View
                    style={[
                      styles.selectBadge,
                      isSelected && styles.selectBadgeSelected,
                    ]}
                    pointerEvents="none"
                  >
                    {isSelected && (
                      <CustomIcon
                        name="checkMarkBlack"
                        size={14}
                        color={colors.white}
                      />
                    )}
                  </View>
                </>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyLottie: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: InterFont.MEDIUM,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    color: colors.black,
    textAlign: "center",
  },
  listWrapper: {
    gap: 12,
    paddingTop: 40,
    width: "100%",
    paddingHorizontal: 22,
  },
  cardWrapper: {
    width: "100%",
    height: 175,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImage: {
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 24,
    height: 175,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 20,
    gap: 8,
  },
  title: {
    fontFamily: ForrestFont.MEDIUM,
    fontSize: 24,
    lineHeight: 24 * 1.2,
  },
  description: {
    fontFamily: InterFont.REGULAR,
    fontSize: 16,
    lineHeight: 16 * 1.4,
    marginBottom: 4,
  },
  date: {
    alignSelf: "flex-start",
    fontFamily: InterFont.MEDIUM,
    fontSize: 10,
    lineHeight: 10,
    color: colors.black,
    backgroundColor: colors.appleGreen2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    textAlign: "center",
  },
  arrowContainer: {
    width: 24,
    alignSelf: "center",
    paddingTop: 2,
  },
  iconContainer: {
    width: 36,
    alignItems: "center",
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  selectBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectBadgeSelected: {
    backgroundColor: colors.white,
  },
});
