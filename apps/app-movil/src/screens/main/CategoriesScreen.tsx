import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CategoriesStackParamList } from '@/navigation/types';
import { Loading, EmptyState } from '@/components';
import { categoriesApi } from '@/api';
import { shadow, useTheme } from '@/theme';
import { Grid3X3 } from 'lucide-react-native';
import { getImageUrl } from '@/config/env';

type Props = NativeStackScreenProps<CategoriesStackParamList, 'Categories'>;

export function CategoriesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesApi.getAll();
      setCategories(data || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<Grid3X3 size={48} color={colors.gray[300]} />}
        title="Nenhuma categoria"
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={categories}
      numColumns={2}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.card, shadow.sm]}
          onPress={() => {
            if (item.children && item.children.length > 0) {
              navigation.navigate('Subcategories', {
                categoryId: item.id,
                categoryName: item.name,
              });
            } else {
              navigation.navigate('CategoryProducts', {
                categoryId: item.id,
                categoryName: item.name,
              });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: getImageUrl(item.imageUrl)! }}
                style={styles.categoryImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.emoji}>{item.icon || '📦'}</Text>
            )}
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  list: {
    padding: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8, // reducido de 16 a 8
    margin: 4,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 92,
    height: 92,
    borderRadius: 24,
  },
  emoji: {
    fontSize: 32,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 4,
  },
});
