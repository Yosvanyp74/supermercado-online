import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Sobre Nós | SuperMercado Online',
  description: 'Conheça o SuperMercado Online - sua loja de confiança em Venâncio Aires.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sobre Nós</h1>

        <div className="prose prose-green max-w-none space-y-6">
          <p className="text-lg text-muted-foreground">
            O SuperMercado Online é a sua loja de confiança em Venâncio Aires, RS.
            Com anos de tradição no comércio local, agora trazemos a comodidade das
            compras online direto para a sua casa.
          </p>

          <h2 className="text-xl font-semibold mt-8">Nossa Missão</h2>
          <p className="text-muted-foreground">
            Oferecer produtos de qualidade com preços justos, facilitando o dia a dia
            dos nossos clientes através de uma experiência de compra online prática,
            segura e eficiente.
          </p>

          <h2 className="text-xl font-semibold mt-8">Por que escolher o SuperMercado?</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              Produtos selecionados com qualidade garantida
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              Preços competitivos e ofertas exclusivas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              Entrega rápida na região de Venâncio Aires
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              Programa de fidelidade com acúmulo de pontos
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              Opção de retirada na loja sem custo de frete
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">Informações da Loja</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-sm text-muted-foreground">
                    Rua Osvaldo Aranha, 1234<br />
                    Centro, Venâncio Aires - RS<br />
                    CEP 95800-000
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Horário de Funcionamento</p>
                  <p className="text-sm text-muted-foreground">
                    Seg a Sex: 8h às 20h<br />
                    Sáb: 8h às 18h<br />
                    Dom: 9h às 13h
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">(51) 3741-1234</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">contato@supermercado.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
