import { useMemo, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pause, Play } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type WaveformPlayerProps = {
  sourceUrl: string;
  title?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const createWaveformHeights = (count: number, seed = 23) => {
  let state = seed;
  return Array.from({ length: count }).map(() => {
    state = (state * 48271) % 2147483647;
    return 18 + (state % 72);
  });
};

const formatMillis = (millis: number) => {
  const seconds = Math.floor(millis / 1000);
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}:${String(rem).padStart(2, "0")}`;
};

export function WaveformPlayer({
  sourceUrl,
  title = "Recovery Breath Track",
}: WaveformPlayerProps) {
  const player = useAudioPlayer(sourceUrl, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [trackWidth, setTrackWidth] = useState(0);
  const spikes = useMemo(() => createWaveformHeights(52), []);

  const togglePlay = async () => {
    if (!status.isLoaded) {
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }

    if (status.didJustFinish || status.currentTime >= status.duration) {
      await player.seekTo(0);
    }
    player.play();
  };

  const durationMillis = status.duration * 1000;
  const positionMillis = status.currentTime * 1000;
  const progress = clamp(positionMillis / Math.max(durationMillis, 1), 0, 1);
  const pulseLeft = trackWidth > 0 ? progress * trackWidth : 0;
  const showDuration = status.isLoaded && status.duration > 0;

  return (
    <View className="mb-4 rounded-3xl border border-white/10 bg-white/10 px-4 py-3">
      <Text className="mb-3 text-xs uppercase tracking-[1.4px] text-brand/90">
        {title}
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={togglePlay}
          disabled={!status.isLoaded}
          className={`h-10 w-10 items-center justify-center rounded-full ${
            status.isLoaded ? "bg-brand" : "bg-card"
          }`}
        >
          {status.playing ? (
            <Pause size={18} color="#FFFFFF" />
          ) : (
            <Play size={18} color="#FFFFFF" />
          )}
        </Pressable>

        <View
          className="relative h-10 flex-1 flex-row items-end overflow-hidden"
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        >
          {spikes.map((height, index) => (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={`spike-${index}`}
              className={`mr-[2px] w-[3px] rounded-sm ${
                index / spikes.length <= progress ? "bg-brand/95" : "bg-white/40"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
          <View
            className="absolute top-1/2 h-4 w-4 -translate-y-2 rounded-full bg-brand shadow-lg shadow-brand"
            style={{ left: pulseLeft - 8 }}
          />
        </View>

        <Text className="min-w-[48px] text-right text-xs text-white/80">
          {showDuration ? formatMillis(durationMillis - positionMillis) : "--:--"}
        </Text>
      </View>
    </View>
  );
}
