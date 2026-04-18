import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Text, View } from "react-native";

interface MacroGaugeProps {
  label: string;
  value: number;
  target: number;
}

function describeSemiPath(
  centerX: number,
  centerY: number,
  radius: number,
  progress: number,
  segments: number = 64
) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const maxSegmentIndex = Math.max(1, Math.round(segments * clampedProgress));
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= maxSegmentIndex; i += 1) {
    const t = (i / segments) * clampedProgress;
    const angle = Math.PI - t * Math.PI;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY - radius * Math.sin(angle),
    });
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function MacroGauge({ label, value, target }: MacroGaugeProps) {
  const safeTarget = target > 0 ? target : 1;
  const progress = Math.max(0, Math.min(100, (value / safeTarget) * 100));
  const gradientId = `macroGlow-${label.toLowerCase()}`;
  const baseArc = describeSemiPath(65, 65, 48, 1);
  const progressArc = describeSemiPath(65, 65, 48, progress / 100);

  return (
    <View className="items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-3">
      <Svg width={130} height={90}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF7A00" stopOpacity={0.35} />
            <Stop offset="50%" stopColor="#FF7A00" stopOpacity={1} />
            <Stop offset="100%" stopColor="#FF7A00" stopOpacity={0.35} />
          </LinearGradient>
        </Defs>

        <Path
          d={baseArc}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />

        {progress > 0 ? (
          <>
            <Path
              d={progressArc}
              stroke="#FF7A00"
              strokeWidth={16}
              fill="none"
              strokeLinecap="round"
              opacity={0.2}
            />
            <Path
              d={progressArc}
              stroke={`url(#${gradientId})`}
              strokeWidth={9}
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : null}

        <SvgText
          x="65"
          y="59"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="#F8F8F8"
        >
          {Math.round(progress)}%
        </SvgText>
      </Svg>

      <Text className="text-xs font-semibold uppercase tracking-wider text-white/75">
        {label}
      </Text>
      <Text className="text-sm font-semibold text-white">
        {value}g
        <Text className="text-xs font-medium text-white/60"> / {target}g</Text>
      </Text>
    </View>
  );
}
