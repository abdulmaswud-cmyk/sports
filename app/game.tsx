import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, SafeAreaView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Car } from '@/components/Car';
import { Obstacle } from '@/components/Obstacle';
import { SportsItem } from '@/components/SportsItem';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useSportsData, type SportsFact } from '@/hooks/useSportsData';
import { rectsIntersect } from '@/utils/collision';
import {
  BASE_SPEED_PX_PER_SEC,
  CAR_HEIGHT,
  CAR_WIDTH,
  DIFFICULTY_RAMP_SECONDS,
  ITEM_SIZE,
  ITEM_SPAWN_MS_MAX,
  ITEM_SPAWN_MS_MIN,
  LANES,
  OBSTACLE_SIZE,
  OBSTACLE_SPAWN_MS_MIN,
  OBSTACLE_SPAWN_MS_START,
  ROAD_MAX_WIDTH,
  ROAD_SIDE_PADDING,
  SPEED_RAMP_PX_PER_SEC_PER_SEC,
  type Lane,
} from '@/utils/constants';

type Ob = { id: number; lane: Lane; y: number };
type ItemKind = 'shield' | 'slow' | 'boost' | 'trivia';
type It = { id: number; lane: Lane; y: number; kind: ItemKind; fact: SportsFact };

function clampLane(n: number): Lane {
  return (Math.max(0, Math.min(2, n)) as unknown) as Lane;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function msRange(min: number, max: number) {
  return randInt(min, max);
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function itemEmoji(kind: ItemKind, base: string) {
  switch (kind) {
    case 'shield':
      return '🛡️';
    case 'slow':
      return '🐢';
    case 'boost':
      return '✨';
    case 'trivia':
    default:
      return base;
  }
}

export default function GameScreen() {
  const { facts, loading: sportsLoading, error: sportsError } = useSportsData();

  const factsPool = useMemo(() => (facts.length ? facts : []), [facts]);

  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [lane, setLane] = useState<Lane>(1);
  const laneRef = useRef<Lane>(1);

  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  const [shieldActive, setShieldActive] = useState(false);
  const [slowUntilMs, setSlowUntilMs] = useState(0);

  const [toast, setToast] = useState<{ title: string; subtitle?: string; emoji: string } | null>(null);
  const toastUntilRef = useRef(0);

  const obstaclesRef = useRef<Ob[]>([]);
  const itemsRef = useRef<It[]>([]);
  const nextIdRef = useRef(1);

  const elapsedSecRef = useRef(0);
  const lastObstacleSpawnMsRef = useRef(0);
  const nextItemSpawnMsRef = useRef(0);
  const lastRenderMsRef = useRef(0);
  const [, forceRender] = useState(0);

  const road = useMemo(() => {
    const w = Math.max(0, layout.w);
    const h = Math.max(0, layout.h);
    const roadW = Math.max(240, Math.min(ROAD_MAX_WIDTH, w - ROAD_SIDE_PADDING * 2));
    const roadX = (w - roadW) / 2;
    const laneW = roadW / LANES;
    return { w, h, roadW, roadX, laneW };
  }, [layout]);

  const car = useMemo(() => {
    const xCenter = road.roadX + road.laneW * (lane + 0.5);
    const x = xCenter - CAR_WIDTH / 2;
    const y = Math.max(road.h - CAR_HEIGHT - 36, 60);
    return { x, y };
  }, [lane, road.h, road.laneW, road.roadX]);

  const panResponder = useMemo(() => {
    let startX = 0;
    let startLane: Lane = 1;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 30,
      onPanResponderGrant: (_, g) => {
        startX = g.x0;
        startLane = laneRef.current;
      },
      onPanResponderMove: (_, g) => {
        const dx = g.moveX - startX;
        if (Math.abs(dx) < 40) return;
        const dir = dx > 0 ? 1 : -1;
        const next = clampLane(startLane + dir);
        if (next !== laneRef.current) {
          laneRef.current = next;
          setLane(next);
        }
      },
      onPanResponderTerminationRequest: () => true,
    });
  }, []);

  const endGame = useCallback(
    (finalScore: number) => {
      setRunning(false);
      // Keep navigation as a replace so "back" doesn't resume the loop.
      router.replace({ pathname: '/gameover', params: { score: String(finalScore) } });
    },
    [router]
  );

  const maybeShowToast = useCallback((fact: SportsFact, kind: ItemKind) => {
    const emoji = itemEmoji(kind, fact.emoji);
    const title =
      kind === 'shield'
        ? 'Shield!'
        : kind === 'slow'
          ? 'Slow-mo!'
          : kind === 'boost'
            ? 'Score boost!'
            : 'Trivia!';

    setToast({ title, subtitle: `${emoji} ${fact.title}${fact.subtitle ? ` — ${fact.subtitle}` : ''}`, emoji });
    toastUntilRef.current = Date.now() + 2000;
  }, []);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  useEffect(() => {
    // reset timers on mount
    lastObstacleSpawnMsRef.current = 0;
    nextItemSpawnMsRef.current = 0;
    elapsedSecRef.current = 0;
    lastRenderMsRef.current = 0;
    toastUntilRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    obstaclesRef.current = [];
    itemsRef.current = [];
    nextIdRef.current = 1;
  }, []);

  useGameLoop(running && road.w > 0 && road.h > 0, ({ dtSec, nowMs }) => {
    elapsedSecRef.current += dtSec;

    // Difficulty ramp: speed increases + obstacle spawn gets faster.
    const rampT = Math.min(1, elapsedSecRef.current / DIFFICULTY_RAMP_SECONDS);
    const baseSpeed = BASE_SPEED_PX_PER_SEC + SPEED_RAMP_PX_PER_SEC_PER_SEC * elapsedSecRef.current;
    const slowActive = nowMs < slowUntilMs;
    const speed = baseSpeed * (slowActive ? 0.65 : 1);

    const obstacleSpawnMs = Math.floor(lerp(OBSTACLE_SPAWN_MS_START, OBSTACLE_SPAWN_MS_MIN, rampT));

    // Spawn obstacles.
    if (lastObstacleSpawnMsRef.current === 0) lastObstacleSpawnMsRef.current = nowMs;
    if (nowMs - lastObstacleSpawnMsRef.current >= obstacleSpawnMs) {
      lastObstacleSpawnMsRef.current = nowMs;
      const id = nextIdRef.current++;
      const obLane = randInt(0, 2) as Lane;
      obstaclesRef.current.push({ id, lane: obLane, y: -OBSTACLE_SIZE });
    }

    // Spawn sports items.
    if (nextItemSpawnMsRef.current === 0) nextItemSpawnMsRef.current = nowMs + msRange(900, 1500);
    if (nowMs >= nextItemSpawnMsRef.current && factsPool.length) {
      nextItemSpawnMsRef.current = nowMs + msRange(ITEM_SPAWN_MS_MIN, ITEM_SPAWN_MS_MAX);
      const id = nextIdRef.current++;
      const itLane = randInt(0, 2) as Lane;
      const kinds: ItemKind[] = ['shield', 'slow', 'boost', 'trivia'];
      const kind = pickRandom(kinds);
      itemsRef.current.push({ id, lane: itLane, y: -ITEM_SIZE, kind, fact: pickRandom(factsPool) });
    }

    // Move obstacles/items.
    const ob = obstaclesRef.current;
    const it = itemsRef.current;
    for (const o of ob) o.y += speed * dtSec;
    for (const s of it) s.y += speed * 0.9 * dtSec;

    obstaclesRef.current = ob.filter((o) => o.y < road.h + OBSTACLE_SIZE);
    itemsRef.current = it.filter((s) => s.y < road.h + ITEM_SIZE);

    // Score increases over time (survival).
    scoreRef.current += 10 * dtSec;

    // Clear toast if expired.
    if (toastUntilRef.current && Date.now() >= toastUntilRef.current) {
      toastUntilRef.current = 0;
      setToast(null);
    }

    // Collision checks.
    const carRect = { x: car.x, y: car.y, w: CAR_WIDTH, h: CAR_HEIGHT };

    // Items first.
    if (itemsRef.current.length) {
      const remaining: It[] = [];
      for (const s of itemsRef.current) {
        const xCenter = road.roadX + road.laneW * (s.lane + 0.5);
        const x = xCenter - ITEM_SIZE / 2;
        const r = { x, y: s.y, w: ITEM_SIZE, h: ITEM_SIZE };
        if (rectsIntersect(carRect, r)) {
          // Apply effect + show fact.
          if (s.kind === 'shield') setShieldActive(true);
          if (s.kind === 'slow') setSlowUntilMs(Date.now() + 3200);
          if (s.kind === 'boost') scoreRef.current += 150;
          if (s.kind === 'trivia') scoreRef.current += 60;
          maybeShowToast(s.fact, s.kind);
        } else {
          remaining.push(s);
        }
      }
      itemsRef.current = remaining;
    }

    // Obstacles (end game unless shield).
    if (obstaclesRef.current.length) {
      const remaining: Ob[] = [];
      let hit = false;
      for (const o of obstaclesRef.current) {
        const xCenter = road.roadX + road.laneW * (o.lane + 0.5);
        const x = xCenter - OBSTACLE_SIZE / 2;
        const r = { x, y: o.y, w: OBSTACLE_SIZE, h: OBSTACLE_SIZE };
        if (!hit && rectsIntersect(carRect, r)) {
          if (shieldActive) {
            setShieldActive(false);
            hit = true; // consume shield, remove this obstacle
          } else {
            endGame(Math.floor(scoreRef.current));
            return;
          }
        } else {
          remaining.push(o);
        }
      }
      obstaclesRef.current = remaining;
    }

    // Throttle re-render to ~30 FPS.
    if (nowMs - lastRenderMsRef.current >= 33) {
      lastRenderMsRef.current = nowMs;
      const nextScore = Math.floor(scoreRef.current);
      setScore(nextScore);
      forceRender((n) => (n + 1) % 1_000_000);
    }
  });

  const switchLane = useCallback((dir: -1 | 1) => {
    const next = clampLane(laneRef.current + dir);
    laneRef.current = next;
    setLane(next);
  }, []);

  const uiHint = useMemo(() => {
    if (sportsLoading) return 'Loading sports facts…';
    if (sportsError) return `Sports API unavailable (${sportsError}). Using fallback facts.`;
    return 'Collect ⚽🏀⚾ items for power-ups + facts.';
  }, [sportsLoading, sportsError]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05070d' }}>
      <View style={{ flex: 1 }} onLayout={(e) => setLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {/* HUD */}
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            right: 12,
            zIndex: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>{score}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{uiHint}</Text>
          </View>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => ({
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
            })}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Exit</Text>
          </Pressable>
        </View>

        {/* Road */}
        <View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            left: road.roadX,
            top: 0,
            width: road.roadW,
            height: road.h,
            backgroundColor: '#0b1020',
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderColor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
          {/* Lane dividers */}
          <View
            style={{
              position: 'absolute',
              left: road.laneW,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: road.laneW * 2,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />

          {/* Obstacles */}
          {obstaclesRef.current.map((o) => {
            const xCenter = road.laneW * (o.lane + 0.5);
            const x = xCenter - OBSTACLE_SIZE / 2;
            return <Obstacle key={o.id} x={x} y={o.y} size={OBSTACLE_SIZE} />;
          })}

          {/* Sports items */}
          {itemsRef.current.map((s) => {
            const xCenter = road.laneW * (s.lane + 0.5);
            const x = xCenter - ITEM_SIZE / 2;
            const emoji = itemEmoji(s.kind, s.fact.emoji);
            return <SportsItem key={s.id} x={x} y={s.y} size={ITEM_SIZE} emoji={emoji} color={s.fact.color} />;
          })}

          {/* Car */}
          <Car x={car.x - road.roadX} y={car.y} width={CAR_WIDTH} height={CAR_HEIGHT} shieldActive={shieldActive} />
        </View>

        {/* Toast */}
        {toast ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              top: 78,
              zIndex: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: 'rgba(2,6,23,0.85)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}>
            <Text style={{ color: 'white', fontWeight: '900' }}>{toast.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.82)', marginTop: 2 }} numberOfLines={2}>
              {toast.subtitle}
            </Text>
          </View>
        ) : null}

        {/* Controls */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 20,
            paddingHorizontal: 18,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Pressable
            onPress={() => switchLane(-1)}
            style={({ pressed }) => ({
              width: 84,
              height: 54,
              borderRadius: 16,
              backgroundColor: pressed ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
            })}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>◀</Text>
          </Pressable>

          <Pressable
            onPress={() => switchLane(1)}
            style={({ pressed }) => ({
              width: 84,
              height: 54,
              borderRadius: 16,
              backgroundColor: pressed ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
            })}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>▶</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

