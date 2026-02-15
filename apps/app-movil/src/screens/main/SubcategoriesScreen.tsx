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

type Props = NativeStackScreenProps<CategoriesStackParamList, 'Subcategories'>;

export function SubcategoriesScreen({ route, navigation }: Props) {
  const { categoryId, categoryName } = route.params;
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubcategories();
  }, [categoryId]);

  const loadSubcategories = async () => {
    try {
      const { data } = await categoriesApi.getById(categoryId);
      setSubcategories(data?.children || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  if (subcategories.length === 0) {
    return (
      <EmptyState
        icon={<Grid3X3 size={48} color={colors.gray[300]} />}
        title="Nenhuma subcategoria"
      />
    );
  }

  const handlePress = (item: any) => {
    if (item.children && item.children.length > 0) {
      navigation.push('Subcategories', {
        categoryId: item.id,
        categoryName: item.name,
      });
    } else {
      navigation.navigate('CategoryProducts', {
        categoryId: item.id,
        categoryName: item.name,
      });
    }
  };

  return (
    <FlatList
      style={styles.container}
      data={subcategories}
      numColumns={2}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <TouchableOpacity
          style={[styles.allCard, shadow.sm]}
          onPress={() =>
            navigation.navigate('CategoryProducts', {
              categoryId,
              categoryName: `Todos em ${categoryName}`,
            })
          }
          activeOpacity={0.7}
        >
          <Grid3X3 size={20} color={colors.primary[600]} />
          <Text style={styles.allText}>Ver todos os produtos</Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.card, shadow.sm]}
          onPress={() => handlePress(item)}
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
  allCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  allText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
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
