import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  LockKeyhole,
  Mail,
  MoveRight,
  Sparkles,
} from "lucide-react";
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
      <section className="auth-story" aria-label="О Pact">
        <div className="brand brand--light">
          <span className="brand-mark">p</span>
          <span>
            pact<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="auth-story__copy">
          <div className="eyebrow eyebrow--light">
            <Sparkles size={14} /> маленькие обещания, большие перемены
          </div>
          <h1>
            Слово себе
            <br />
            <span>имеет вес.</span>
          </h1>
          <p>
            Преврати намерение в обязательство. Отмечай каждый шаг и смотри, как
            растёт твоя последовательность.
          </p>
        </div>
        <div className="story-note">
          <div className="story-note__top">
            <span className="live-dot" /> твой ритм, твои правила
          </div>
          <div className="story-streak">
            <span className="streak-number">07</span>
            <span>
              дней подряд
              <br />
              держу слово
            </span>
            <MoveRight size={20} />
          </div>
          <div className="story-week" aria-hidden="true">
            {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((day, index) => (
              <span key={day} className={index < 5 ? "is-filled" : ""}>
                {day}
                <i>{index < 5 ? <Check size={12} /> : ""}</i>
              </span>
            ))}
          </div>
        </div>
        <div className="auth-story__footer">
          <span>Личное обещание — личная сила.</span>
          <span>01 / 03</span>
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
            {mode === "login" ? "С возвращением" : "Начни с одного обещания"}
          </div>
          <h2>{mode === "login" ? "Войти в Pact" : "Создать аккаунт"}</h2>
          <p className="auth-card__intro">
            {mode === "login"
              ? "Продолжи там, где остановился."
              : "Пространство, чтобы держать слово себе."}
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
          <div className="auth-legal">
            Продолжая, ты создаёшь личное пространство для своих обещаний.
          </div>
        </motion.div>
        <div className="auth-footer">
          <span>PACT / PERSONAL COMMITMENTS</span>
          <span>
            Сделано для последовательности{" "}
            <span className="footer-spark">✳</span>
          </span>
        </div>
      </section>
    </main>
  );
}
