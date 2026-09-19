import { ActivityIndicator, Pressable, ScrollView, Text, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, withAlpha } from '@/theme';

// ---------------------------------------------------------------- Screen

export function Screen({
  style,
  children,
  ...rest
}: ViewProps & { children: React.ReactNode }) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: Colors.bg }, style]} {...rest}>
      {children}
    </SafeAreaView>
  );
}

export function ScreenScroll({
  style,
  contentStyle,
  children,
  edges,
}: {
  style?: ViewProps['style'];
  contentStyle?: ViewProps['style'];
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: Colors.bg }, style]}
      edges={edges ?? ['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          { padding: Spacing.three, paddingBottom: Spacing.six, flexGrow: 1 },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------- Card

export function Card({
  style,
  children,
  tone = 'surface',
}: {
  style?: ViewProps['style'];
  children: React.ReactNode;
  tone?: 'surface' | 'alt' | 'raised';
}) {
  const bg =
    tone === 'alt' ? Colors.surfaceAlt : tone === 'raised' ? Colors.surfaceRaised : Colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: Spacing.three,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------- Button

export type ButtonVariant = 'primary' | 'subtle' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  children,
}: {
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewProps['style'];
  children?: React.ReactNode;
}) {
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? Colors.amber
      : variant === 'subtle'
        ? Colors.surfaceAlt
        : variant === 'danger'
          ? 'rgba(224,122,122,0.12)'
          : 'transparent';
  const fg =
    variant === 'primary'
      ? '#0b0f14'
      : variant === 'danger'
        ? Colors.red
        : Colors.text;
  const glow = variant === 'primary' && !isDisabled ? `0 0 24px ${withAlpha(Colors.amber, '33')}` : 'none';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: variant === 'primary' ? 'transparent' : variant === 'danger' ? 'rgba(224,122,122,0.35)' : Colors.borderStrong,
          paddingVertical: 13,
          paddingHorizontal: Spacing.three,
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.one,
          opacity: isDisabled ? 0.45 : pressed ? 0.8 : 1,
          shadowColor: '#fbbf24',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: variant === 'primary' ? 0.25 : 0,
          shadowRadius: 12,
          elevation: variant === 'primary' ? 6 : 0,
          // web-only glow
          boxShadow: glow,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {children}
          {label ? (
            <Text
              style={{
                color: fg,
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}>
              {label}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------- Badge

export function Badge({
  label,
  color,
  style,
}: {
  label: string;
  color?: string;
  style?: ViewProps['style'];
}) {
  const c = color ?? Colors.slate;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: withAlpha(c, '66'),
          backgroundColor: withAlpha(c, '1f'),
          paddingVertical: 3,
          paddingHorizontal: 10,
        },
        style,
      ]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c, marginRight: 6 }} />
      <Text style={{ color: c, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------- Meters

export function Meter({
  label,
  value,
  max = 10,
  color = Colors.blue,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  const cells = Array.from({ length: max }, (_, i) => i < filled);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {label}
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: 10, fontWeight: 600 }}>
          {filled}/{max}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {cells.map((on, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 2,
              backgroundColor: on ? color : 'rgba(255,255,255,0.07)',
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Misc

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: ViewProps['style'] }) {
  return (
    <Text
      style={[
        {
          color: Colors.textMuted,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: Spacing.two,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View
      style={{
        paddingVertical: Spacing.four,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 14,
        borderStyle: 'dashed',
      }}>
      <Text style={{ color: Colors.textMuted, fontSize: 14, fontWeight: 600 }}>{title}</Text>
      {hint ? (
        <Text style={{ color: Colors.textFaint, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <View
      style={{
        backgroundColor: 'rgba(224,122,122,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(224,122,122,0.3)',
        borderRadius: 10,
        padding: Spacing.two,
      }}>
      <Text style={{ color: Colors.red, fontSize: 13, lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <View style={{ paddingVertical: Spacing.four, alignItems: 'center', gap: Spacing.two }}>
      <ActivityIndicator color={Colors.amber} />
      {label ? (
        <Text style={{ color: Colors.textMuted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? withAlpha(Colors.amber, 'aa') : Colors.border,
          backgroundColor: active ? Colors.amberSoft : 'rgba(255,255,255,0.03)',
          paddingVertical: 7,
          paddingHorizontal: 14,
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      <Text
        style={{
          color: active ? Colors.amber : Colors.textMuted,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}
