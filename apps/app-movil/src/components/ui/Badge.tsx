import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ text, variant = 'default', size = 'sm', style }: BadgeProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {text}
      </Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  base: {
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  // Variants
  default: {
    backgroundColor: colors.primary[100],
  },
  success: {
    backgroundColor: '#dcfce7',
  },
  warning: {
    backgroundColor: '#fef3c7',
  },
  destructive: {
    backgroundColor: '#fee2e2',
  },
  info: {
    backgroundColor: '#dbeafe',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Sizes
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  // Text
  text: {
    fontWeight: '600',
  },
  text_default: {
    color: colors.primary[700],
  },
  text_success: {
    color: '#15803d',
  },
  text_warning: {
    color: '#92400e',
  },
  text_destructive: {
    color: '#dc2626',
  },
  text_info: {
    color: '#1d4ed8',
  },
  text_outline: {
    color: colors.gray[600],
  },
  textSize_sm: {
    fontSize: 11,
  },
  textSize_md: {
    fontSize: 13,
  },
});
