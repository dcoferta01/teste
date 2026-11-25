import './globals.css';

export const metadata = { title: 'Painel da Oferta', description: 'Otimização diária da oferta: anúncios e página' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
