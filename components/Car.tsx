import { View } from 'react-native';

export function Car(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  shieldActive: boolean;
}) {
  const { x, y, width, height, shieldActive } = props;
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: 10,
        backgroundColor: '#22d3ee',
        borderWidth: 2,
        borderColor: '#0ea5e9',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View
        style={{
          width: width * 0.7,
          height: 10,
          borderRadius: 6,
          backgroundColor: '#0f172a',
          opacity: 0.6,
        }}
      />
      {shieldActive ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: -10,
            top: -10,
            right: -10,
            bottom: -10,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: '#a78bfa',
            shadowColor: '#a78bfa',
            shadowOpacity: 0.9,
            shadowRadius: 10,
          }}
        />
      ) : null}
    </View>
  );
}

