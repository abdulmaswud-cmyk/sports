import { Text, View } from 'react-native';

export function SportsItem(props: { x: number; y: number; size: number; emoji: string; color: string }) {
  const { x, y, size, emoji, color } = props;
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.35)',
      }}>
      <Text style={{ fontSize: Math.max(16, Math.floor(size * 0.5)), color: '#0b1220' }}>{emoji}</Text>
    </View>
  );
}

