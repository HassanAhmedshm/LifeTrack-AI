import { useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, Pressable, View } from "react-native";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

interface FlowSliderProps {
  scrollX: SharedValue<number>;
  maxScroll: number;
  onSeek: (targetX: number) => void;
}

const THUMB_WIDTH = 44;

export function FlowSlider({ scrollX, maxScroll, onSeek }: FlowSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const dragStartThumbX = useRef(0);

  const availableTrackWidth = Math.max(trackWidth - THUMB_WIDTH, 0);

  const thumbStyle = useAnimatedStyle(() => {
    const clampedScroll = Math.max(0, Math.min(scrollX.value, maxScroll));
    const ratio = maxScroll > 0 ? clampedScroll / maxScroll : 0;
    const translateX = ratio * availableTrackWidth;
    return { transform: [{ translateX }] };
  }, [availableTrackWidth, maxScroll]);

  const seekFromTrackX = (trackX: number) => {
    if (maxScroll <= 0 || availableTrackWidth <= 0) {
      onSeek(0);
      return;
    }
    const clampedTrackX = Math.max(0, Math.min(trackX, availableTrackWidth));
    const ratio = clampedTrackX / availableTrackWidth;
    onSeek(ratio * maxScroll);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          const ratio = maxScroll > 0 ? scrollX.value / maxScroll : 0;
          dragStartThumbX.current = ratio * availableTrackWidth;
        },
        onPanResponderMove: (_, gestureState) => {
          seekFromTrackX(dragStartThumbX.current + gestureState.dx);
        },
      }),
    [availableTrackWidth, maxScroll, scrollX]
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="px-4">
      <View
        className="h-8 justify-center"
        onLayout={onTrackLayout}
      >
        <Pressable
          className="absolute inset-0 justify-center"
          onPress={(event) =>
            seekFromTrackX(event.nativeEvent.locationX - THUMB_WIDTH / 2)
          }
        >
          <View className="h-1.5 rounded-full border border-white/20 bg-white/10" />
        </Pressable>
        <Animated.View
          {...panResponder.panHandlers}
          className="absolute h-4 rounded-full border border-black/40 bg-brand"
          style={[{ width: THUMB_WIDTH, top: 8 }, thumbStyle]}
        />
      </View>
    </View>
  );
}
