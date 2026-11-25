import { loginAction } from '../actions.js';
import { passwordConfigured } from '../../lib/auth.js';

export const dynamic = 'force-dynamic';

export default async function Login({ searchParams }) {
  const sp = await searchParams;
  return (
    <main className="wrap" style={{ maxWidth: 380, paddingTop: 80 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Painel da Oferta</h1>
        {!passwordConfigured() ? (
          <p className="sub">Defina a variável <code>DASHBOARD_PASSWORD</code> no projeto da Vercel para liberar o acesso.</p>
        ) : (
          <form action={loginAction} className="stack">
            <label className="field">Senha<input type="password" name="senha" autoFocus required /></label>
            {sp?.erro ? <p className="neg small" style={{ margin: 0 }}>Senha incorreta.</p> : null}
            <button type="submit" className="primary">Entrar</button>
          </form>
        )}
      </div>
    </main>
  );
}
