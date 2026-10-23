import { useState, type FormEvent } from "react";
import { ArrowUpRight, LockKeyhole, Mail } from "lucide-react";
import { motion } from "motion/react";
import { authenticate, type User } from "../lib/api";

type AuthPageProps = {
  onAuthenticated: (token: string, user: User) => void;
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await authenticate(mode, {
        email,
        password,
        ...(mode === "register" ? { name: name.trim() } : {}),
      });
      onAuthenticated(result.access_token, result.user);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не получилось выполнить вход",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Pact">
        <div className="brand brand--light">
          <span className="brand-mark">p</span>
          <span>
            pact<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="auth-story__copy">
          <div className="eyebrow eyebrow--light">ЛИЧНЫЕ ОБЯЗАТЕЛЬСТВА</div>
          <h1>
            Личные
            <br />
            <span>обязательства.</span>
          </h1>
          <p>Ежедневные и еженедельные обещания с отметками выполнения.</p>
        </div>
        <div className="story-note">
          <div className="story-note__top">
            <span className="live-dot" /> ТРИ ШАГА
          </div>
          <div className="story-week" aria-hidden="true">
            {["Создай", "Отмечай", "Смотри историю"].map((step, index) => (
              <span key={step}>
                <i>0{index + 1}</i>
                {step}
              </span>
            ))}
          </div>
        </div>
        <div className="auth-story__footer">
          <span>Обещания и отметки</span>
          <span>PACT</span>
        </div>
        <span className="story-orbit story-orbit--one" />
        <span className="story-orbit story-orbit--two" />
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand brand">
          <span className="brand-mark">p</span>
          <span>
            pact<span className="brand-dot">.</span>
          </span>
        </div>
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          key={mode}
        >
          <div className="auth-card__eyebrow">
            {mode === "login" ? "Вход" : "Регистрация"}
          </div>
          <h2>{mode === "login" ? "Войти в Pact" : "Создать аккаунт"}</h2>
          <p className="auth-card__intro">
            {mode === "login"
              ? "Введи email и пароль."
              : "Создай аккаунт, чтобы сохранять обещания."}
          </p>

          <form onSubmit={submit} className="form-stack">
            {mode === "register" && (
              <label className="field">
                <span>Как тебя зовут</span>
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Имя"
                  maxLength={100}
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <div className="input-with-icon">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>
            <label className="field">
              <span>Пароль</span>
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Не менее 8 символов"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="button button--primary button--wide"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Секунду…"
                : mode === "login"
                  ? "Войти"
                  : "Создать аккаунт"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="auth-switch">
            {mode === "login" ? "Впервые здесь?" : "Уже есть аккаунт?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Создать аккаунт" : "Войти"}
            </button>
          </div>
        </motion.div>
        <div className="auth-footer">
          <span>PACT / ЛИЧНЫЕ ОБЯЗАТЕЛЬСТВА</span>
        </div>
      </section>
    </main>
  );
}
