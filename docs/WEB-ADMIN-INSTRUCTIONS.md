# Web Admin - Next.js (Panel de Gestión)

## Contexto del Proyecto
Panel administrativo completo para gestionar todas las operaciones del supermercado: inventario, ventas, usuarios, reportes, configuración, etc.

## Objetivos del Panel Admin
- Dashboard con métricas en tiempo real
- Gestión completa de inventario
- Procesamiento y seguimiento de órdenes
- Gestión de usuarios y empleados
- Reportes y analytics avanzados
- Configuración del sistema
- Interfaz intuitiva y eficiente

## Stack Tecnológico
- **Framework**: Next.js 14+ (App Router)
- **React**: 18+
- **TypeScript**: 5+
- **Estilos**: Tailwind CSS + Shadcn/ui
- **Estado**: Zustand
- **Tablas**: TanStack Table
- **Formularios**: React Hook Form + Zod
- **HTTP**: TanStack Query
- **Charts**: Recharts / Chart.js
- **Auth**: NextAuth.js (role-based)
- **File Upload**: Uploadthing / AWS S3
- **Excel Export**: xlsx / ExcelJS
- **PDF Generation**: jsPDF / Puppeteer
- **Real-time**: Socket.io-client

## Estructura del Proyecto

```
web-admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                 # Dashboard principal
│   │   ├── layout.tsx               # Layout con sidebar
│   │   ├── products/
│   │   │   ├── page.tsx             # Lista de productos
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # Crear producto
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # Editar producto
│   │   │   └── import/
│   │   │       └── page.tsx         # Importar productos
│   │   ├── categories/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── inventory/
│   │   │   ├── page.tsx             # Gestión de inventario
│   │   │   ├── movements/
│   │   │   │   └── page.tsx         # Historial de movimientos
│   │   │   ├── alerts/
│   │   │   │   └── page.tsx         # Alertas de stock bajo
│   │   │   └── adjust/
│   │   │       └── page.tsx         # Ajustes de inventario
│   │   ├── orders/
│   │   │   ├── page.tsx             # Lista de órdenes
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # Detalle y gestión de orden
│   │   │   └── pending/
│   │   │       └── page.tsx         # Órdenes pendientes
│   │   ├── customers/
│   │   │   ├── page.tsx             # Lista de clientes
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Detalle de cliente
│   │   ├── users/
│   │   │   ├── page.tsx             # Gestión de usuarios/empleados
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── purchase-orders/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── delivery/
│   │   │   ├── page.tsx             # Gestión de entregas
│   │   │   ├── assign/
│   │   │   │   └── page.tsx         # Asignar repartidores
│   │   │   └── drivers/
│   │   │       └── page.tsx         # Gestión de repartidores
│   │   ├── promotions/
│   │   │   ├── discounts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   └── coupons/
│   │   │       ├── page.tsx
│   │   │       └── new/
│   │   │           └── page.tsx
│   │   ├── reviews/
│   │   │   ├── page.tsx             # Moderación de reseñas
│   │   │   └── pending/
│   │   │       └── page.tsx
│   │   ├── analytics/
│   │   │   ├── sales/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   └── page.tsx
│   │   │   ├── customers/
│   │   │   │   └── page.tsx
│   │   │   └── inventory/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── sales/
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx
│   │   │   └── financial/
│   │   │       └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx             # Configuración general
│   │       ├── store/
│   │       │   └── page.tsx
│   │       ├── payment/
│   │       │   └── page.tsx
│   │       ├── shipping/
│   │       │   └── page.tsx
│   │       └── taxes/
│   │           └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── upload/
│   │   │   └── route.ts
│   │   └── export/
│   │       ├── products/
│   │       │   └── route.ts
│   │       └── orders/
│   │           └── route.ts
│   ├── layout.tsx
│   └── error.tsx
├── components/
│   ├── ui/                          # Shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── UserMenu.tsx
│   │   └── Breadcrumbs.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── RecentOrders.tsx
│   │   ├── SalesChart.tsx
│   │   ├── TopProducts.tsx
│   │   ├── LowStockAlert.tsx
│   │   └── ActivityFeed.tsx
│   ├── products/
│   │   ├── ProductsTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductImageUpload.tsx
│   │   ├── BulkActions.tsx
│   │   └── ImportDialog.tsx
│   ├── orders/
│   │   ├── OrdersTable.tsx
│   │   ├── OrderDetail.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   ├── OrderTimeline.tsx
│   │   └── UpdateStatusDialog.tsx
│   ├── inventory/
│   │   ├── InventoryTable.tsx
│   │   ├── MovementForm.tsx
│   │   ├── StockAdjustment.tsx
│   │   └── LowStockAlerts.tsx
│   ├── customers/
│   │   ├── CustomersTable.tsx
│   │   ├── CustomerDetail.tsx
│   │   └── CustomerStats.tsx
│   ├── analytics/
│   │   ├── SalesChart.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── ProductPerformance.tsx
│   │   └── DateRangePicker.tsx
│   ├── reports/
│   │   ├── ReportBuilder.tsx
│   │   ├── ExportButton.tsx
│   │   └── ReportPreview.tsx
│   └── common/
│       ├── DataTable.tsx            # Tabla reutilizable
│       ├── SearchInput.tsx
│       ├── FilterDropdown.tsx
│       ├── Pagination.tsx
│       ├── Loading.tsx
│       └── ConfirmDialog.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── inventory.ts
│   │   ├── users.ts
│   │   ├── analytics.ts
│   │   └── reports.ts
│   ├── validations/
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── inventory.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── exporters.ts            # Excel/PDF export
│   │   ├── permissions.ts
│   │   └── constants.ts
│   └── hooks/
│       ├── usePermissions.ts
│       ├── useRealtime.ts
│       └── useExport.ts
├── store/
│   ├── ui-store.ts
│   ├── notifications-store.ts
│   └── filters-store.ts
├── types/
│   ├── api.ts
│   ├── models.ts
│   └── index.ts
├── middleware.ts
├── next.config.js
└── package.json
```

## Dashboard Principal

### Componentes del Dashboard:

#### Stats Cards
```typescript
export function DashboardStats() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Ventas Hoy"
        value={formatCurrency(stats?.todaySales)}
        change={stats?.salesChange}
        icon={DollarSign}
      />
      <StatsCard
        title="Órdenes Pendientes"
        value={stats?.pendingOrders}
        icon={ShoppingCart}
      />
      <StatsCard
        title="Stock Bajo"
        value={stats?.lowStock}
        icon={AlertTriangle}
        variant="warning"
      />
      <StatsCard
        title="Clientes Activos"
        value={stats?.activeCustomers}
        icon={Users}
      />
    </div>
  );
}
```

#### Gráfico de Ventas
```typescript
'use client';

import { Line } from 'react-chartjs-2';

export function SalesChart({ data }: Props) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Ventas',
        data: data.map(d => d.revenue),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas de los últimos 30 días</CardTitle>
      </CardHeader>
      <CardContent>
        <Line data={chartData} />
      </CardContent>
    </Card>
  );
}
```

#### Órdenes Recientes
```typescript
export function RecentOrders() {
  const { data: orders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => getOrders({ limit: 5, status: 'PENDING' }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.user.name}</TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

## Gestión de Productos

### Tabla de Productos
```typescript
'use client';

import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'image',
    header: 'Imagen',
    cell: ({ row }) => (
      <Image
        src={row.original.mainImageUrl}
        alt={row.original.name}
        width={50}
        height={50}
        className="rounded"
      />
    ),
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ row }) => row.original.category.name,
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    cell: ({ row }) => formatCurrency(row.original.price),
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => {
      const stock = row.original.stock;
      const minStock = row.original.minStock;
      
      return (
        <Badge variant={stock <= minStock ? 'destructive' : 'default'}>
          {stock}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'secondary'}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => router.push(`/products/${row.original.id}`)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicateProduct(row.original.id)}>
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => deleteProduct(row.original.id)}
          >
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function ProductsTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState({});
  
  const { data, isLoading } = useQuery({
    queryKey: ['products', pagination, filters],
    queryFn: () => getProducts({ ...pagination, ...filters }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SearchInput
          placeholder="Buscar productos..."
          onChange={(value) => setFilters({ ...filters, search: value })}
        />
        <div className="flex gap-2">
          <FilterDropdown
            label="Categoría"
            options={categories}
            onChange={(value) => setFilters({ ...filters, category: value })}
          />
          <FilterDropdown
            label="Estado"
            options={statuses}
            onChange={(value) => setFilters({ ...filters, status: value })}
          />
          <Button onClick={() => router.push('/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.products || []}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={data?.pageCount}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Formulario de Producto
```typescript
const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string(),
  brandId: z.string().optional(),
  price: z.number().positive(),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  unit: z.string(),
  weight: z.number().optional(),
  images: z.array(z.string()).min(1),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']),
});

export function ProductForm({ product }: Props) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {},
  });

  const onSubmit = async (data: ProductFormData) => {
    if (product) {
      await updateProduct(product.id, data);
    } else {
      await createProduct(data);
    }
    router.push('/products');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Más campos... */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precios e Inventario</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      multiple
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit">
            {product ? 'Actualizar' : 'Crear'} Producto
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

## Gestión de Órdenes

### Tabla de Órdenes con Filtros
```typescript
export function OrdersTable() {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: { from: null, to: null },
    search: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <SearchInput
          placeholder="Buscar por número de orden o cliente..."
          onChange={(value) => setFilters({ ...filters, search: value })}
        />
        
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="CONFIRMED">Confirmado</SelectItem>
            <SelectItem value="PROCESSING">En proceso</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">En camino</SelectItem>
            <SelectItem value="DELIVERED">Entregado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <DateRangePicker
          value={filters.dateRange}
          onChange={(range) => setFilters({ ...filters, dateRange: range })}
        />
      </div>

      <DataTable columns={orderColumns} data={data?.orders || []} />
    </div>
  );
}
```

### Detalle y Gestión de Orden
```typescript
export function OrderDetail({ orderId }: Props) {
  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
  });

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', orderId]);
      toast.success('Estado actualizado');
    },
  });

  if (!order) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orden #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Creada {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <UpdateStatusDialog
            currentStatus={order.status}
            onUpdate={updateStatus.mutate}
          />
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna 1: Información de la orden */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Image
                          src={item.product.mainImageUrl}
                          alt={item.product.name}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                        <span>{item.product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos:</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columna 2: Timeline y detalles */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.user.name}</p>
              <p className="text-sm text-muted-foreground">{order.user.email}</p>
              <p className="text-sm text-muted-foreground">{order.user.phone}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => router.push(`/customers/${order.user.id}`)}
              >
                Ver perfil
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dirección de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <address className="text-sm not-italic">
                {order.address.street}<br />
                {order.address.city}, {order.address.state}<br />
                {order.address.zipCode}
              </address>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Método:</span>
                <span>{order.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <Badge variant={order.payment.status === 'PAID' ? 'success' : 'warning'}>
                  {order.payment.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

## Analytics y Reportes

### Dashboard de Ventas
```typescript
export function SalesAnalytics() {
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  
  const { data } = useQuery({
    queryKey: ['sales-analytics', dateRange],
    queryFn: () => getSalesAnalytics(dateRange),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics de Ventas</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Ingresos Totales"
          value={formatCurrency(data?.totalRevenue)}
          change={data?.revenueChange}
        />
        <StatsCard
          title="Órdenes"
          value={data?.totalOrders}
          change={data?.ordersChange}
        />
        <StatsCard
          title="Ticket Promedio"
          value={formatCurrency(data?.averageOrderValue)}
          change={data?.aovChange}
        />
        <StatsCard
          title="Conversión"
          value={`${data?.conversionRate}%`}
          change={data?.conversionChange}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data?.dailySales} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={data?.topProducts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={data?.salesByCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodsChart data={data?.paymentMethods} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Generador de Reportes
```typescript
export function ReportGenerator() {
  const form = useForm({
    defaultValues: {
      type: 'sales',
      dateRange: { from: null, to: null },
      format: 'pdf',
      includeCharts: true,
    },
  });

  const generateReport = useMutation({
    mutationFn: async (data: ReportConfig) => {
      const report = await createReport(data);
      if (data.format === 'pdf') {
        downloadPDF(report);
      } else {
        downloadExcel(report);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Reporte</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(generateReport.mutate)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Reporte</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sales">Ventas</SelectItem>
                        <SelectItem value="inventory">Inventario</SelectItem>
                        <SelectItem value="customers">Clientes</SelectItem>
                        <SelectItem value="financial">Financiero</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rango de Fechas</FormLabel>
                    <FormControl>
                      <DateRangePicker {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Generar Reporte
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## Real-time con WebSockets

```typescript
'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function RealtimeProvider({ children }: Props) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: {
        token: getAuthToken(),
      },
    });

    // Nueva orden
    socket.on('order:new', (order) => {
      queryClient.invalidateQueries(['orders']);
      toast.info('Nueva orden recibida', {
        description: `Orden #${order.orderNumber}`,
        action: {
          label: 'Ver',
          onClick: () => router.push(`/orders/${order.id}`),
        },
      });
    });

    // Stock bajo
    socket.on('inventory:low', (product) => {
      toast.warning('Stock bajo', {
        description: `${product.name} tiene solo ${product.stock} unidades`,
      });
    });

    // Pago recibido
    socket.on('payment:received', (payment) => {
      queryClient.invalidateQueries(['orders', payment.orderId]);
      toast.success('Pago recibido', {
        description: `$${payment.amount} - Orden #${payment.orderNumber}`,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <>{children}</>;
}
```

## Sistema de Permisos

```typescript
// lib/utils/permissions.ts
export enum Permission {
  VIEW_DASHBOARD = 'view:dashboard',
  MANAGE_PRODUCTS = 'manage:products',
  MANAGE_ORDERS = 'manage:orders',
  MANAGE_INVENTORY = 'manage:inventory',
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics',
  EXPORT_DATA = 'export:data',
  MANAGE_SETTINGS = 'manage:settings',
}

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: Object.values(Permission),
  MANAGER: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
  ],
  EMPLOYEE: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_ORDERS,
    Permission.MANAGE_INVENTORY,
  ],
  CUSTOMER: [],
  DELIVERY: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// Hook
export function usePermissions() {
  const { data: session } = useSession();
  
  const can = (permission: Permission) => {
    return hasPermission(session?.user?.role, permission);
  };

  return { can };
}
```

## Export de Datos

### Export a Excel
```typescript
import * as XLSX from 'xlsx';

export async function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Uso en componente
export function ProductsExport() {
  const handleExport = async () => {
    const products = await getProducts({ all: true });
    const exportData = products.map(p => ({
      SKU: p.sku,
      Nombre: p.name,
      Categoría: p.category.name,
      Precio: p.price,
      Stock: p.stock,
      Estado: p.status,
    }));
    
    await exportToExcel(exportData, 'productos');
  };

  return (
    <Button onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Exportar a Excel
    </Button>
  );
}
```

## Pasos de Implementación

### Fase 1: Setup y Layout (Semana 1)
1. Inicializar Next.js
2. Configurar Tailwind + Shadcn/ui
3. Layout con sidebar
4. Autenticación con roles

### Fase 2: Dashboard (Semana 1-2)
1. Dashboard principal
2. Stats cards
3. Gráficos
4. Órdenes recientes

### Fase 3: Productos e Inventario (Semana 2-4)
1. CRUD de productos
2. Gestión de inventario
3. Categorías y marcas
4. Import/Export

### Fase 4: Órdenes (Semana 4-5)
1. Gestión de órdenes
2. Cambio de estados
3. Asignación de delivery

### Fase 5: Usuarios y Clientes (Semana 5-6)
1. Gestión de usuarios
2. Perfiles de clientes
3. Sistema de permisos

### Fase 6: Analytics (Semana 6-7)
1. Dashboard de analytics
2. Gráficos avanzados
3. Generador de reportes

### Fase 7: Features Avanzadas (Semana 7-8)
1. WebSockets
2. Notificaciones real-time
3. Export avanzado

### Fase 8: Testing y Deploy (Semana 8-9)
1. Tests
2. Optimización
3. Deploy

## Recursos Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [TanStack Table](https://tanstack.com/table)
- [Recharts](https://recharts.org/)
- [Socket.io](https://socket.io/)
