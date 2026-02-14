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
import { colors, shadow } from '@/theme';
import { Grid3X3 } from 'lucide-react-native';
import { getImageUrl } from '@/config/env';

type Props = NativeStackScreenProps<CategoriesStackParamList, 'Categories'>;

export function CategoriesScreen({ navigation }: Props) {
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
          onPress={() =>
            navigation.navigate('CategoryProducts', {
              categoryId: item.id,
              categoryName: item.name,
            })
          }
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: getImageUrl(item.imageUrl)! }}
                style={styles.categoryImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.emoji}>{item.icon || '📦'}</Text>
            )}
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {item._count?.products != null && (
            <Text style={styles.count}>
              {item._count.products} produtos
            </Text>
          )}
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}

const styles = StyleSheet.create({
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
    padding: 16,
    margin: 4,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
  count: {
    fontSize: 12,
    color: colors.gray[400],
  },
});
