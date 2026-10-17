import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  History,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/format";
import { PageHeading } from "../components/AppShell";
import type { Checkin, Pact } from "../lib/api";

export function HistoryPage({
  pacts,
  checkins,
  loading,
}: {
  pacts: Pact[];
  checkins: Checkin[];
  loading: boolean;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const pactNames = useMemo(
    () => new Map(pacts.map((pact) => [pact.id, pact.title])),
    [pacts],
  );
  const visible = useMemo(
    () =>
      checkins
        .filter((checkin) => {
          const title = pactNames.get(checkin.pact_id) ?? "";
          return (
            (filter === "all" || checkin.pact_id === filter) &&
            `${title} ${checkin.note}`
              .toLocaleLowerCase("ru-RU")
              .includes(query.toLocaleLowerCase("ru-RU"))
          );
        })
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            b.created_at.localeCompare(a.created_at),
        ),
    [checkins, filter, query, pactNames],
  );

  return (
    <>
      <PageHeading
        eyebrow="ИСТОРИЯ"
        title="История отметок"
        description="Выполнения по датам."
      />
      <div className="history-summary">
        <span className="history-summary__icon">
          <History size={20} />
        </span>
        <div>
          <strong>{checkins.length}</strong>
          <span>
            {" "}
            {checkins.length === 1
              ? "отметка"
              : checkins.length >= 2 && checkins.length <= 4
                ? "отметки"
                : "отметок"}{" "}
            сохранено
          </span>
        </div>
        <span className="history-summary__divider" />
        <span className="history-summary__pacts">
          в {pacts.length} {pacts.length === 1 ? "обещании" : "обещаниях"}
        </span>
      </div>
      <div className="list-toolbar history-toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по заметкам"
            aria-label="Поиск по заметкам"
          />
        </div>
        <label className="select-wrap">
          <span className="sr-only">Фильтр по обещанию</span>
          <select
            className="filter-select"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Все обещания</option>
            {pacts.map((pact) => (
              <option key={pact.id} value={pact.id}>
                {pact.title}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>
      </div>
      {loading && !checkins.length ? (
        <div className="loading-state">
          <span className="spinner" /> Загружаем историю…
        </div>
      ) : visible.length ? (
        <section className="timeline" aria-label="История отметок">
          {visible.map((checkin, index) => (
            <article className="timeline-entry" key={checkin.id}>
              <div className="timeline-marker">
                <span>
                  <Check size={14} />
                </span>
                {index < visible.length - 1 && <i />}
              </div>
              <div className="timeline-content">
                <div className="timeline-date">
                  {formatDate(checkin.date, {
                    weekday: "long",
                    year: undefined,
                  })}
                </div>
                <div className="timeline-card">
                  <div className="timeline-card__main">
                    <Link
                      to={`/pacts/${checkin.pact_id}`}
                      className="timeline-title"
                    >
                      {pactNames.get(checkin.pact_id) ?? "Обещание"}
                      <ArrowUpRight size={14} />
                    </Link>
                    <p>{checkin.note || "Обещание выполнено"}</p>
                  </div>
                  <time>
                    {formatDate(checkin.created_at, { year: undefined })}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="empty-state empty-state--list">
          <div className="empty-mark">
            <History size={22} />
          </div>
          <h3>{checkins.length ? "Подходящих отметок нет" : "Нет отметок"}</h3>
          <p>
            {checkins.length
              ? "Попробуй изменить поиск или фильтр."
              : "Отметки появятся здесь после выполнения обещания."}
          </p>
          {!checkins.length && (
            <Link to="/pacts" className="text-link">
              К моим обещаниям <ChevronDown size={15} className="rotate-left" />
            </Link>
          )}
        </div>
      )}
    </>
  );
}
