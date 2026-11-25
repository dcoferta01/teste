import Link from 'next/link';
import { clearDemoAction, logoutAction } from '../app/actions.js';

export default function Shell({ children, settings }) {
  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brand">📊 {settings?.oferta_nome || 'Painel da Oferta'}</div>
          <nav className="tabs" aria-label="Seções">
            <Link href="/">Hoje</Link>
            <Link href="/anuncios">Anúncios</Link>
            <Link href="/pagina">Página</Link>
            <Link href="/mudancas">Mudanças</Link>
            <Link href="/config">Configurações</Link>
          </nav>
          <form action={logoutAction}><button type="submit" className="small">Sair</button></form>
        </div>
      </header>
      <main className="wrap">
        {settings?.demo ? (
          <div className="banner warn">
            <span className="grow"><strong>Dados de exemplo.</strong> Isto é uma simulação para você ver como o painel funciona. Os números não são reais.</span>
            <form action={clearDemoAction}>
              <button type="submit">Apagar dados de exemplo</button>
            </form>
          </div>
        ) : null}
        {children}
      </main>
    </>
  );
}
