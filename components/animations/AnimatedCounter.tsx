import React, { useEffect, useRef, useState } from "react";
import { Text, type TextStyle, type StyleProp } from "react-native";

type Props = {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  formatter?: (n: number) => string;
};

export function AnimatedCounter({
  value,
  duration = 600,
  style,
  formatter = (n) => String(Math.round(n)),
}: Props) {
  const [display, setDisplay] = useState(formatter(value));
  const prevRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = to;
    if (from === to) {
      setDisplay(formatter(to));
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(formatter(current));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <Text style={style}>{display}</Text>;
}
