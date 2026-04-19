import { Text, View } from "react-native";

type ExerciseCardProps = {
  exercise: any;
  isExpanded: boolean;
  isDimmed: boolean;
  onToggleExpand: () => void;
  highlightSetIds: number[];
  highlightToken: number;
};

export function ExerciseCard(props: ExerciseCardProps) {
  return (
    <View>
      <Text>Exercise Card (Disabled)</Text>
    </View>
  );
}
