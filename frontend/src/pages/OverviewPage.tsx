import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  Plus,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useMemo, useState } from "react";
import { formatDate, localDate, pactIsCheckedIn } from "../lib/format";
import { CheckinButton, PageHeading } from "../components/AppShell";
import type { Checkin, Pact } from "../lib/api";
import { CheckinDialog } from "./PactsPage";

type OverviewPageProps = {
  pacts: Pact[];
  checkins: Checkin[];
  loading: boolean;
  onCheckin: (pactId: string, note: string) => Promise<void>;
};

export function OverviewPage({
  pacts,
  checkins,
  loading,
  onCheckin,
}: OverviewPageProps) {
  const [selectedPact, setSelectedPact] = useState<Pact | null>(null);
  const [now] = useState(() => new Date());
  const activePacts = pacts.filter((pact) => pact.status === "active");
  const todayCount = checkins.filter(
    (checkin) => checkin.date.slice(0, 10) === localDate(),
  ).length;
  const recordPact = pacts.reduce<Pact | null>(
    (best, pact) =>
      !best || pact.longest_streak > best.longest_streak ? pact : best,
    null,
  );
  const today = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const lastSevenDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now.getTime());
        date.setDate(date.getDate() - (6 - index));
        const key = localDate(date);
        return {
          date,
          key,
          count: checkins.filter((checkin) => checkin.date.slice(0, 10) === key)
            .length,
        };
      }),
    [checkins, now],
  );
  const highestDay = Math.max(1, ...lastSevenDays.map((day) => day.count));

  if (loading && pacts.length === 0)
    return (
      <div className="loading-state">
        <span className="spinner" /> Загрузка…
      </div>
    );

  return (
    <>
      <PageHeading
        eyebrow={today}
        title="Обзор"
        description="Активные обещания и отметки."
        action={
          <NavLink
            to="/pacts"
            state={{ openCreate: true }}
            className="button button--primary"
          >
            <Plus size={17} /> Новое обещание
          </NavLink>
        }
      />

      <section className="stats-grid" aria-label="Текущие показатели">
        <article className="stat-tile stat-tile--ink">
          <div className="stat-tile__top">
            <span>Активные</span>
            <Target size={17} />
          </div>
          <strong>{activePacts.length.toString().padStart(2, "0")}</strong>
          <div className="stat-tile__foot">
            <span className="stat-tile__dot" /> Обещания в работе
          </div>
        </article>
        <article className="stat-tile stat-tile--lime">
          <div className="stat-tile__top">
            <span>Отметки сегодня</span>
            <Zap size={17} />
          </div>
          <strong>{todayCount.toString().padStart(2, "0")}</strong>
          <div className="stat-tile__foot">За сегодня</div>
        </article>
        <article className="stat-tile stat-tile--paper">
          <div className="stat-tile__top">
            <span>Личный рекорд</span>
            <Flame size={17} />
          </div>
          <strong>
            {recordPact?.longest_streak ?? 0}
            <small>
              {recordPact?.frequency === "weekly" ? " нед." : " дн."}
            </small>
          </strong>
          <div className="stat-tile__foot">
            <Trophy size={13} /> По сериям обещаний
          </div>
        </article>
      </section>

      <div className="overview-grid">
        <section className="section-block today-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ДЕНЬ ЗА ДНЁМ</div>
              <h2>Активные обещания</h2>
            </div>
            <Link to="/pacts" className="text-link">
              Все обещания <ArrowRight size={15} />
            </Link>
          </div>
          {activePacts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-mark">
                <Target size={22} />
              </div>
              <h3>{pacts.length ? "Нет активных обещаний" : "Нет обещаний"}</h3>
              <p>
                {pacts.length
                  ? "Создай новое обещание."
                  : "Добавь первое обещание."}
              </p>
              <Link to="/pacts" className="button button--primary">
                <Plus size={16} /> Создать обещание
              </Link>
            </div>
          ) : (
            <div className="focus-list">
              {activePacts.slice(0, 5).map((pact, index) => {
                const checked = pactIsCheckedIn(pact, checkins);
                return (
                  <article className="focus-row" key={pact.id}>
                    <span className={`focus-index focus-index--${index % 3}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="focus-main">
                      <Link to={`/pacts/${pact.id}`} className="focus-title">
                        {pact.title}
                      </Link>
                      <span className="focus-meta">
                        {pact.frequency === "daily"
                          ? "Каждый день"
                          : "Каждую неделю"}
                        <i />
                        {pact.current_streak > 0
                          ? `${pact.current_streak} ${pact.frequency === "daily" ? "дн." : "нед."} подряд`
                          : "Нет отметок за период"}
                      </span>
                    </div>
                    <CheckinButton
                      checked={checked}
                      onClick={() => setSelectedPact(pact)}
                      compact
                    />
                  </article>
                );
              })}
            </div>
          )}
          {activePacts.length > 5 && (
            <Link to="/pacts" className="list-more">
              Ещё {activePacts.length - 5} обещаний <ArrowRight size={14} />
            </Link>
          )}
        </section>

        <aside className="rhythm-panel">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ПОСЛЕДНИЕ 7 ДНЕЙ</div>
              <h2>Отметки</h2>
            </div>
            <span className="rhythm-icon">
              <Flame size={18} />
            </span>
          </div>
          <p className="rhythm-caption">За последние 7 дней</p>
          <div
            className="week-chart"
            aria-label="Отметки за последние семь дней"
          >
            {lastSevenDays.map((day) => (
              <div className="week-chart__day" key={day.key}>
                <div className="week-chart__bar-wrap">
                  <span
                    className={`week-chart__bar${day.count ? " has-value" : ""}`}
                    style={{
                      height: `${Math.max(8, (day.count / highestDay) * 100)}%`,
                    }}
                    title={`${day.count} отметок`}
                  />
                </div>
                <span className="week-chart__label">
                  {new Intl.DateTimeFormat("ru-RU", { weekday: "short" })
                    .format(day.date)
                    .replace(".", "")}
                </span>
              </div>
            ))}
          </div>
          <div className="rhythm-total">
            <strong>
              {lastSevenDays.reduce((sum, day) => sum + day.count, 0)}
            </strong>
            <span>отметок за неделю</span>
            <ArrowUpRight size={16} />
          </div>
        </aside>
      </div>

      <section className="recent-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">ИЗМЕНЕНИЯ</div>
            <h2>Последние изменения</h2>
          </div>
          <Link to="/history" className="text-link">
            История отметок <ArrowRight size={15} />
          </Link>
        </div>
        {pacts.length ? (
          <div className="recent-list">
            {[...pacts]
              .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
              .slice(0, 3)
              .map((pact) => (
                <Link
                  to={`/pacts/${pact.id}`}
                  className="recent-row"
                  key={pact.id}
                >
                  <span className="recent-mark">
                    <Target size={17} />
                  </span>
                  <span className="recent-copy">
                    <strong>{pact.title}</strong>
                    <small>
                      {pact.status === "active"
                        ? "В процессе"
                        : pact.status === "completed"
                          ? "Завершено"
                          : pact.status === "failed"
                            ? "Не выполнено"
                            : "В архиве"}
                    </small>
                  </span>
                  <span className="recent-date">
                    {formatDate(pact.updated_at, { year: undefined })}
                  </span>
                  <ArrowUpRight size={15} className="recent-arrow" />
                </Link>
              ))}
          </div>
        ) : (
          <p className="muted-empty">
            Здесь будут последние изменения обещаний.
          </p>
        )}
      </section>

      {selectedPact && (
        <CheckinDialog
          pact={selectedPact}
          onClose={() => setSelectedPact(null)}
          onSubmit={onCheckin}
        />
      )}
    </>
  );
}
