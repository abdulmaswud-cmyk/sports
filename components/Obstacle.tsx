import { View } from 'react-native';

export function Obstacle(props: { x: number; y: number; size: number }) {
  const { x, y, size } = props;
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: '#fb7185',
        borderWidth: 2,
        borderColor: '#be123c',
      }}
    />
  );
}

