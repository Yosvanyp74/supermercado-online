import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-white">SuperMercado</span>
            </div>
            <p className="text-sm mb-4">
              Seu supermercado online com os melhores produtos e preços.
              Entrega rápida e segura na sua casa.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Venâncio Aires, RS</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(51) 3741-0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contato@supermercado.com</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white">Produtos</Link></li>
              <li><Link href="/products?isFeatured=true" className="hover:text-white">Destaques</Link></li>
              <li><Link href="/products?isOrganic=true" className="hover:text-white">Orgânicos</Link></li>
              <li><Link href="/about" className="hover:text-white">Sobre Nós</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contato</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4">Minha Conta</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/account/profile" className="hover:text-white">Meu Perfil</Link></li>
              <li><Link href="/account/orders" className="hover:text-white">Meus Pedidos</Link></li>
              <li><Link href="/account/wishlist" className="hover:text-white">Lista de Desejos</Link></li>
              <li><Link href="/account/addresses" className="hover:text-white">Endereços</Link></li>
              <li><Link href="/account/loyalty" className="hover:text-white">Programa de Fidelidade</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Informações</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white cursor-pointer">Política de Privacidade</span></li>
              <li><span className="hover:text-white cursor-pointer">Termos de Uso</span></li>
              <li><span className="hover:text-white cursor-pointer">Trocas e Devoluções</span></li>
              <li><span className="hover:text-white cursor-pointer">FAQ</span></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row items-center justify-between text-sm">
          <p>&copy; {new Date().getFullYear()} SuperMercado. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span>Pagamentos seguros</span>
            <span>•</span>
            <span>Entrega garantida</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
