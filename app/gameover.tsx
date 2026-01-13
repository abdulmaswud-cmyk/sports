import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

import { HIGH_SCORE_KEY } from '@/utils/constants';

export default function GameOverScreen() {
  const params = useLocalSearchParams<{ score?: string }>();
  const score = useMemo(() => {
    const n = Number(params.score ?? 0);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }, [params.score]);

  const [highScore, setHighScore] = useState<number>(0);
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        const existing = raw ? Number(raw) : 0;
        const existingNum = Number.isFinite(existing) ? Math.max(0, Math.floor(existing)) : 0;
        const next = Math.max(existingNum, score);

        if (next !== existingNum) {
          await AsyncStorage.setItem(HIGH_SCORE_KEY, String(next));
        }
        if (!alive) return;
        setHighScore(next);
      } catch {
        if (!alive) return;
        setHighScore(score);
      } finally {
        if (!alive) return;
        setSaving(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [score]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05070d' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 34, fontWeight: '900' }}>Game Over</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 10, fontSize: 15 }}>
          You crashed into an obstacle.
        </Text>

        <View style={{ height: 22 }} />

        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
          }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' }}>SCORE</Text>
          <Text style={{ color: 'white', fontSize: 40, fontWeight: '900', marginTop: 2 }}>{score}</Text>

          <View style={{ height: 10 }} />

          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' }}>
            HIGH SCORE {saving ? '(saving...)' : ''}
          </Text>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', marginTop: 2 }}>{highScore}</Text>
        </View>

        <View style={{ height: 18 }} />

        <Pressable
          onPress={() => router.replace('/game')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#0ea5e9' : '#22d3ee',
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 14,
            alignSelf: 'flex-start',
          })}>
          <Text style={{ color: '#06101f', fontSize: 16, fontWeight: '900' }}>Play again</Text>
        </Pressable>

        <View style={{ height: 12 }} />

        <Pressable
          onPress={() => router.replace('/')}
          style={({ pressed }) => ({
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 14,
            alignSelf: 'flex-start',
            backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
          })}>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>Back to menu</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

