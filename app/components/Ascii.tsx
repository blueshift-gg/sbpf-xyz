"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "motion/react";
import { BRAND_COLOURS } from "@blueshift-gg/ui-components";

interface CharGroup {
  char: string;
  count: number;
  index: number;
}

// Animation configuration per character type
interface CharAnimation {
  // Color animation: array of colors to cycle through
  colors?: string[];
  // Character swap: cycle through different characters
  swapChars?: string[];
  // Animation speed in ms per frame
  interval?: number;
  // Stagger delay in ms between each group
  staggerDelay?: number;
  // Pause duration in ms between animation cycles
  pauseDuration?: number;
}

type AnimationConfig = {
  [char: string]: CharAnimation;
};

interface AsciiAnimationProps {
  textPath: string;
  color: keyof typeof BRAND_COLOURS;
  // Optional animation config - if not provided, uses defaults
  animationConfig?: AnimationConfig;
}

// Default animation configuration
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  "=": {
    colors: ["#00ffff", "rgba(0,255,255,0.25)", "#00ffff", "rgba(0,255,255,0.25)", "#00ffff", "rgba(0,255,255,0.25)"],
    swapChars: ["=", "+", "="],
    interval: 100,
    staggerDelay: 60,
    pauseDuration: 1000,
  },
};

// Parse text into groups of consecutive identical characters
const parseAsciiToGroups = (text: string): CharGroup[][] => {
  const lines = text.split("\n");
  let globalIndex = 0;

  return lines.map((line) => {
    const groups: CharGroup[] = [];
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      let count = 1;

      // Count consecutive identical characters
      while (i + count < line.length && line[i + count] === char) {
        count++;
      }

      groups.push({
        char,
        count,
        index: globalIndex++,
      });

      i += count;
    }

    return groups;
  });
};

// Calculate frame based on elapsed time (keeps everything in sync)
const calculateFrame = (
  timestamp: number,
  config: CharAnimation,
  staggerOffset: number
): number => {
  const interval = config.interval || 200;
  const pauseDuration = config.pauseDuration || 0;
  const maxFrames = Math.max(
    config.colors?.length || 1,
    config.swapChars?.length || 1
  );

  // Apply stagger offset
  const adjustedTime = timestamp - staggerOffset;
  if (adjustedTime < 0) return 0;

  // Total cycle duration = animation time + pause time
  const animationDuration = interval * maxFrames;
  const cycleDuration = animationDuration + pauseDuration;

  // Where are we in the current cycle?
  const timeInCycle = adjustedTime % cycleDuration;

  // If we're in the pause phase, show frame 0
  if (timeInCycle >= animationDuration) {
    return 0;
  }

  // Otherwise calculate which frame we're on
  return Math.floor(timeInCycle / interval) % maxFrames;
};

// Animated character span component
const AnimatedCharSpan = ({
  group,
  config,
  baseColor,
  charTypeIndex,
  timestamp,
}: {
  group: CharGroup;
  config?: CharAnimation;
  baseColor: string;
  charTypeIndex: number;
  timestamp: number;
}) => {
  // If no animation config, render static
  if (!config) {
    return (
      <span data-char={group.char} data-index={group.index}>
        {group.char.repeat(group.count)}
      </span>
    );
  }

  const staggerOffset = charTypeIndex * (config.staggerDelay || 0);
  const frame = calculateFrame(timestamp, config, staggerOffset);

  const currentColor = config.colors?.[frame % (config.colors?.length || 1)];
  const currentChar =
    config.swapChars?.[frame % (config.swapChars?.length || 1)] || group.char;

  return (
    <span
      data-char={group.char}
      data-index={group.index}
      style={{
        color: currentColor || baseColor,
      }}
    >
      {currentChar.repeat(group.count)}
    </span>
  );
};

const AsciiAnimation = ({
  textPath,
  color,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
}: AsciiAnimationProps) => {
  const preRef = useRef<HTMLPreElement>(null);
  const [text, setText] = useState<string>("");
  const [timestamp, setTimestamp] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Single animation loop for the entire component
  useEffect(() => {
    const animate = (time: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = time;
      }
      setTimestamp(time - startTimeRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetch(`/ascii/${textPath}.txt`)
      .then((res) => res.text())
      .then((text) => {
        setText(text);
      });
  }, [textPath]);

  const parsedLines = useMemo(() => parseAsciiToGroups(text), [text]);

  // Build a map of char -> index for staggering (tracks order of appearance per char type)
  const charTypeIndexMap = useMemo(() => {
    const map = new Map<number, number>(); // group.index -> charTypeIndex
    const charCounters: { [char: string]: number } = {};

    parsedLines.flat().forEach((group) => {
      if (animationConfig[group.char]) {
        charCounters[group.char] = (charCounters[group.char] || 0);
        map.set(group.index, charCounters[group.char]);
        charCounters[group.char]++;
      }
    });

    return map;
  }, [parsedLines, animationConfig]);

  const baseColor = BRAND_COLOURS[color];

  return (
    <motion.div
      style={{ color: baseColor }}
      className="flex justify-center items-center absolute inset-0 w-full mask-[linear-gradient(60deg,transparent_10%,black_40%,black_60%,transparent_100%)] overflow-hidden"
    >
      <pre
        ref={preRef}
        className="absolute text-[9px] tracking-wider text-current"
      >
        {parsedLines.map((lineGroups, lineIndex) => (
          <div key={lineIndex} className="whitespace-pre">
            {lineGroups.map((group) => (
              <AnimatedCharSpan
                key={group.index}
                group={group}
                config={animationConfig[group.char]}
                baseColor={baseColor}
                charTypeIndex={charTypeIndexMap.get(group.index) ?? 0}
                timestamp={timestamp}
              />
            ))}
          </div>
        ))}
      </pre>
    </motion.div>
  );
};

export default AsciiAnimation;
