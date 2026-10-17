import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Home,
  LogOut,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Pact, User } from "../lib/api";

type AppShellProps = {
  user: User | null;
  pacts: Pact[];
  onSignOut: () => void;
};

const navigation = [
  { to: "/", label: "Обзор", icon: Home, end: true },
  { to: "/pacts", label: "Мои обещания", icon: Target },
  { to: "/history", label: "История", icon: Activity },
];

export function AppShell({ user, pacts, onSignOut }: AppShellProps) {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const pageTitle = location.pathname.startsWith("/history")
    ? "История"
    : location.pathname.startsWith("/pacts")
      ? "Мои обещания"
      : "Обзор";
  const activeCount = pacts.filter((pact) => pact.status === "active").length;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Друг";

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <NavLink to="/" className="brand brand--sidebar">
          <span className="brand-mark">p</span>
          <span>
            pact<span className="brand-dot">.</span>
          </span>
        </NavLink>
        <div className="workspace-label">ТВОЁ ПРОСТРАНСТВО</div>
        <nav className="side-nav" aria-label="Основная навигация">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `side-link${isActive ? " is-active" : ""}`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Мои обещания" && (
                <span className="side-count">{activeCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-prompt">
          <div className="sidebar-prompt__icon">
            <Sparkles size={16} />
          </div>
          <span className="sidebar-prompt__label">С чего начать?</span>
          <p>Одно честное обещание лучше десяти идеальных планов.</p>
          <NavLink to="/pacts" className="sidebar-prompt__link">
            Записать обещание <ArrowUpRight size={14} />
          </NavLink>
        </div>

        <div className="sidebar-bottom">
          <a
            className="side-link side-link--muted"
            href="https://github.com/nastylauf/Pact-project"
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={17} />
            <span>О проекте</span>
            <ArrowUpRight size={13} />
          </a>
          <div className="profile-wrap">
            {profileOpen && (
              <div className="profile-menu">
                <div className="profile-menu__identity">
                  <strong>{user?.name || "Аккаунт"}</strong>
                  <span>{user?.email}</span>
                </div>
                <button type="button" onClick={onSignOut}>
                  <LogOut size={15} /> Выйти из аккаунта
                </button>
              </div>
            )}
            <button
              type="button"
              className="profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
            >
              <span className="avatar">
                {firstName.slice(0, 1).toLocaleUpperCase("ru-RU")}
              </span>
              <span className="profile-copy">
                <strong>{firstName}</strong>
                <small>Личный аккаунт</small>
              </span>
              <ChevronDown
                size={15}
                className={profileOpen ? "chevron is-open" : "chevron"}
              />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand brand">
            <span className="brand-mark">p</span>
            <span>
              pact<span className="brand-dot">.</span>
            </span>
          </div>
          <div className="breadcrumb">
            <span>Пространство</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{pageTitle}</strong>
          </div>
          <NavLink
            to="/pacts"
            state={{ openCreate: true }}
            className="button button--primary button--top"
          >
            <Plus size={17} strokeWidth={2.3} />
            <span>Новое обещание</span>
          </NavLink>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>
            PACT <i>·</i> держи слово себе
          </span>
          <span>Пока только ты и твой следующий шаг.</span>
        </footer>
      </div>

      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mobile-nav__link${isActive ? " is-active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-heading__action">{action}</div>}
    </div>
  );
}

export function CheckinButton({
  checked,
  disabled,
  onClick,
  compact = false,
}: {
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`button ${checked ? "button--checked" : "button--outline"}${compact ? " button--compact" : ""}`}
      onClick={onClick}
      disabled={checked || disabled}
    >
      {checked ? (
        <>
          <Check size={15} /> Готово сегодня
        </>
      ) : (
        <>
          <Check size={15} /> Отметиться
        </>
      )}
    </button>
  );
}
