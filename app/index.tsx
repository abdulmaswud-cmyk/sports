import { router } from 'expo-router';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

export default function IndexScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05070d' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 34, fontWeight: '800', letterSpacing: 0.3 }}>
          Lane Switch Sports
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 10, fontSize: 15, lineHeight: 20 }}>
          Swipe or tap to switch lanes, dodge obstacles, and collect sports knowledge power-ups.
        </Text>

        <View style={{ height: 22 }} />

        <Pressable
          onPress={() => router.push('/game')}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#0ea5e9' : '#22d3ee',
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 14,
            alignSelf: 'flex-start',
          })}>
          <Text style={{ color: '#06101f', fontSize: 16, fontWeight: '800' }}>Play</Text>
        </Pressable>

        <View style={{ height: 18 }} />

        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18 }}>
          Collectibles:{' '}
          <Text style={{ color: 'white' }}>
            ⚽🏀⚾
          </Text>{' '}
          trigger shield / slow-mo / score boosts plus a quick fact.
        </Text>
      </View>
    </SafeAreaView>
  );
}

