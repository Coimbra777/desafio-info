import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../../components/Toast";
import { ErrorBanner, Plate } from "../../components/ui";

type Mode = "login" | "register";

export function LoginPage() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("aivacol@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isRegister = mode === "register";

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    if (next === "register") setEmail("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          nickname: nickname.trim() || undefined,
          password,
        });
        toast.success("Conta criada com sucesso. Bem-vindo!");
      } else {
        await login(email.trim(), password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          isRegister ? "Não foi possível criar a conta." : "Credenciais inválidas.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <section className="login-side">
        <div className="kicker">Aivacol · Fleet Console</div>
        <div>
          <h1>Sua frota sob controle.</h1>
          <p className="lede">
            Cadastro, auditoria e telemetria de veículos em escala — marcas, modelos e
            placas em um só painel.
          </p>
          <div className="login-plate-demo">
            <Plate>ABC1D23</Plate>
            <Plate>RIO2A18</Plate>
            <Plate>BRA0S17</Plate>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#7d8b95" }}>
          desafio-info · API + console
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <h2>{isRegister ? "Criar conta" : "Entrar"}</h2>
          <p className="sub">
            {isRegister
              ? "Cadastre-se para acessar o console."
              : "Acesse o console com suas credenciais."}
          </p>
          {error && <ErrorBanner message={error} />}
          <form onSubmit={submit}>
            {isRegister && (
              <div className="field">
                <label htmlFor="name">Nome</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  autoComplete="name"
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {isRegister && (
              <div className="field">
                <label htmlFor="nickname">Nickname (opcional)</label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  autoComplete="nickname"
                  onChange={(event) => setNickname(event.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete={isRegister ? "new-password" : "current-password"}
                onChange={(event) => setPassword(event.target.value)}
              />
              {isRegister && <div className="hint">Mínimo de 8 caracteres.</div>}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
              disabled={loading}
            >
              {loading
                ? isRegister
                  ? "Criando…"
                  : "Entrando…"
                : isRegister
                  ? "Criar conta"
                  : "Entrar no console"}
            </button>
          </form>

          <div className="auth-switch">
            {isRegister ? (
              <>
                Já tem conta?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Entrar
                </button>
              </>
            ) : (
              <>
                Não tem conta?{" "}
                <button type="button" onClick={() => switchMode("register")}>
                  Criar conta
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
