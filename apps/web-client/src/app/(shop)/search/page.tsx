'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/ProductCard';
import { productsApi } from '@/lib/api/client';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;
  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ['search', q, page],
    queryFn: async () => {
      if (!q) return { data: [] };
      const res = await productsApi.search(q, page, 12);
      return res.data;
    },
    enabled: !!q,
  });

  const products = Array.isArray(data) ? data : data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Buscar Produtos</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
        <Input
          placeholder="O que você procura?"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="text-lg"
        />
        <Button type="submit">
          <SearchIcon className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </form>

      {q && (
        <p className="text-muted-foreground mb-6">
          Resultados para: <strong>&ldquo;{q}&rdquo;</strong>
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 && q ? (
        <div className="text-center py-16">
          <SearchIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Nenhum produto encontrado</p>
          <p className="text-muted-foreground">Tente buscar por outro termo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
