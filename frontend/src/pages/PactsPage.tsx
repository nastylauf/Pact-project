import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Flame,
  Plus,
  Search,
  Target,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { formatDate, localDate, pactIsCheckedIn } from "../lib/format";
import { CheckinButton, PageHeading } from "../components/AppShell";
import type { Checkin, CreatePactInput, Pact } from "../lib/api";

type PactsPageProps = {
  pacts: Pact[];
  checkins: Checkin[];
  loading: boolean;
  onCreate: (input: CreatePactInput) => Promise<void>;
  onCheckin: (pactId: string, note: string) => Promise<void>;
};

export function PactsPage({
  pacts,
  checkins,
  loading,
  onCreate,
  onCheckin,
}: PactsPageProps) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPact, setSelectedPact] = useState<Pact | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const routeState = location.state as { openCreate?: boolean } | null;
  const createDialogOpen = dialogOpen || Boolean(routeState?.openCreate);
  const selected = pacts.find((pact) => pact.id === id);
  const filtered = useMemo(
    () =>
      pacts
        .filter((pact) => {
          const matchesQuery = `${pact.title} ${pact.description}`
            .toLocaleLowerCase("ru-RU")
            .includes(query.toLocaleLowerCase("ru-RU"));
          return matchesQuery && (status === "all" || pact.status === status);
        })
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [pacts, query, status],
  );

  function closeCreateDialog() {
    setDialogOpen(false);
    if (routeState?.openCreate) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }

  if (loading && pacts.length === 0)
    return (
      <div className="loading-state">
        <span className="spinner" /> Загружаем обещания…
      </div>
    );

  if (id && selected) {
    const history = checkins
      .filter((checkin) => checkin.pact_id === selected.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const checked = pactIsCheckedIn(selected, history);
    return (
      <>
        <button
          type="button"
          className="back-link"
          onClick={() => navigate("/pacts")}
        >
          <ArrowLeft size={16} /> Все обещания
        </button>
        <div className="detail-heading">
          <div>
            <div className="eyebrow">
              {selected.frequency === "daily"
                ? "ЕЖЕДНЕВНОЕ ОБЕЩАНИЕ"
                : "ЕЖЕНЕДЕЛЬНОЕ ОБЕЩАНИЕ"}
            </div>
            <h1>{selected.title}</h1>
            <p>
              {selected.description ||
                "Ты создал это обещание для себя. Каждый выполненный шаг имеет значение."}
            </p>
          </div>
          <CheckinButton
            checked={checked}
            onClick={() => setSelectedPact(selected)}
          />
        </div>
        <section className="detail-stats">
          <div>
            <span>Текущая серия</span>
            <strong>
              <Flame size={20} /> {selected.current_streak}{" "}
              <small>{selected.frequency === "daily" ? "дн." : "нед."}</small>
            </strong>
          </div>
          <div>
            <span>Личный рекорд</span>
            <strong>
              {selected.longest_streak}{" "}
              <small>{selected.frequency === "daily" ? "дн." : "нед."}</small>
            </strong>
          </div>
          <div>
            <span>Отметок всего</span>
            <strong>{history.length}</strong>
          </div>
          <div>
            <span>Начато</span>
            <strong className="detail-date">
              {formatDate(selected.start_date)}
            </strong>
          </div>
        </section>
        <section className="detail-history section-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ТВОИ ШАГИ</div>
              <h2>История отметок</h2>
            </div>
            <span className="history-count">
              {history.length}{" "}
              {plural(history.length, "отметка", "отметки", "отметок")}
            </span>
          </div>
          {history.length ? (
            <div className="checkin-history">
              {history.map((checkin) => (
                <article className="checkin-entry" key={checkin.id}>
                  <span className="checkin-entry__mark">
                    <Check size={15} />
                  </span>
                  <div>
                    <strong>
                      {formatDate(checkin.date, { weekday: "long" })}
                    </strong>
                    <span>{checkin.note || "Обещание выполнено"}</span>
                  </div>
                  <time>{formatDate(checkin.date, { year: undefined })}</time>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              <p>Первый шаг начинается с первой отметки.</p>
              <button
                type="button"
                className="text-link"
                onClick={() => setSelectedPact(selected)}
              >
                Отметиться сегодня <ChevronRight size={15} />
              </button>
            </div>
          )}
        </section>
        <AnimatePresence>
          {selectedPact && (
            <CheckinDialog
              pact={selectedPact}
              onClose={() => setSelectedPact(null)}
              onSubmit={onCheckin}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="ТВОИ ОБЕЩАНИЯ"
        title="Держи курс."
        description="То, что ты пообещал себе. Без лишнего шума."
        action={
          <button
            type="button"
            className="button button--primary"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={17} /> Новое обещание
          </button>
        }
      />
      <div className="list-toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти обещание"
            aria-label="Найти обещание"
          />
        </div>
        <select
          className="filter-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Фильтр по статусу"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="completed">Завершённые</option>
          <option value="failed">Не выполнены</option>
          <option value="archived">В архиве</option>
        </select>
        <span className="result-count">
          {filtered.length}{" "}
          {plural(filtered.length, "обещание", "обещания", "обещаний")}
        </span>
      </div>
      {filtered.length ? (
        <div className="pact-list">
          {filtered.map((pact, index) => {
            const checked = pactIsCheckedIn(pact, checkins);
            return (
              <motion.article
                className="pact-card"
                key={pact.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.045, 0.2) }}
              >
                <Link
                  to={`/pacts/${pact.id}`}
                  className={`pact-card__symbol pact-card__symbol--${index % 4}`}
                >
                  <Target size={19} strokeWidth={1.8} />
                </Link>
                <div className="pact-card__main">
                  <div className="pact-card__title-row">
                    <Link to={`/pacts/${pact.id}`} className="pact-card__title">
                      {pact.title}
                    </Link>
                    <span className={`status-tag status-tag--${pact.status}`}>
                      {statusLabel(pact.status)}
                    </span>
                  </div>
                  <p>
                    {pact.description || "У этого обещания пока нет описания."}
                  </p>
                  <div className="pact-card__meta">
                    <span>
                      <CalendarDays size={13} />{" "}
                      {pact.frequency === "daily"
                        ? "Каждый день"
                        : "Каждую неделю"}
                    </span>
                    <i /> <span>С {formatDate(pact.start_date)}</span>
                    {pact.current_streak > 0 && (
                      <>
                        <i />
                        <span>
                          <Flame size={13} /> {pact.current_streak}{" "}
                          {pact.frequency === "daily" ? "дн." : "нед."} подряд
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {pact.status === "active" ? (
                  <CheckinButton
                    checked={checked}
                    onClick={() => setSelectedPact(pact)}
                    compact
                  />
                ) : (
                  <Link
                    to={`/pacts/${pact.id}`}
                    className="icon-link"
                    aria-label="Открыть обещание"
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                )}
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state empty-state--list">
          <div className="empty-mark">
            <Target size={22} />
          </div>
          <h3>
            {pacts.length ? "Ничего не найдено" : "Здесь начнётся твоя история"}
          </h3>
          <p>
            {pacts.length
              ? "Измени запрос или фильтр, чтобы увидеть обещания."
              : "Запиши одно обещание и преврати намерение в действие."}
          </p>
          {!pacts.length && (
            <button
              type="button"
              className="button button--primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus size={16} /> Создать обещание
            </button>
          )}
        </div>
      )}
      <div className="api-note">
        <span className="api-note__dot" /> Обещания сохраняются в твоём аккаунте
        Pact.
      </div>
      <AnimatePresence>
        {createDialogOpen && (
          <CreatePactDialog onClose={closeCreateDialog} onSubmit={onCreate} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedPact && (
          <CheckinDialog
            pact={selectedPact}
            onClose={() => setSelectedPact(null)}
            onSubmit={onCheckin}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export function CheckinDialog({
  pact,
  onClose,
  onSubmit,
}: {
  pact: Pact;
  onClose: () => void;
  onSubmit: (pactId: string, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(pact.id, note.trim());
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось сохранить отметку",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-kicker">
        <span className="modal-icon modal-icon--lime">
          <Check size={18} />
        </span>
        <span>ОБЕЩАНИЕ ВЫПОЛНЕНО</span>
      </div>
      <h2>Зафиксируй этот шаг.</h2>
      <p className="modal-intro">{pact.title}</p>
      <form onSubmit={submit} className="form-stack">
        <label className="field">
          <span>
            Заметка <small>необязательно</small>
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            placeholder="Что помогло тебе сегодня?"
            rows={3}
          />
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button button--quiet"
            onClick={onClose}
          >
            Не сейчас
          </button>
          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
          >
            {saving ? "Сохраняем…" : "Сохранить отметку"}
            <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreatePactDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: CreatePactInput) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Pact["frequency"]>("daily");
  const [startDate, setStartDate] = useState(localDate());
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        frequency,
        start_date: startDate,
        ...(endDate ? { end_date: endDate } : {}),
      });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось создать обещание",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-kicker">
        <span className="modal-icon">
          <Plus size={18} />
        </span>
        <span>НОВОЕ ОБЕЩАНИЕ</span>
      </div>
      <h2>Что ты выбираешь делать?</h2>
      <p className="modal-intro">
        Сформулируй ясно. Это обещание — прежде всего тебе.
      </p>
      <form onSubmit={submit} className="form-stack">
        <label className="field">
          <span>Я обещаю себе</span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, читать 20 минут перед сном"
            maxLength={200}
            required
          />
        </label>
        <label className="field">
          <span>
            Немного контекста <small>необязательно</small>
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Почему это важно для тебя?"
            maxLength={5000}
            rows={3}
          />
        </label>
        <fieldset className="field frequency-field">
          <legend>Как часто?</legend>
          <div className="frequency-options">
            <button
              type="button"
              className={
                frequency === "daily"
                  ? "frequency-choice is-selected"
                  : "frequency-choice"
              }
              onClick={() => setFrequency("daily")}
            >
              <span className="frequency-dot" />
              Каждый день
            </button>
            <button
              type="button"
              className={
                frequency === "weekly"
                  ? "frequency-choice is-selected"
                  : "frequency-choice"
              }
              onClick={() => setFrequency("weekly")}
            >
              <span className="frequency-dot" />
              Каждую неделю
            </button>
          </div>
        </fieldset>
        <div className="date-fields">
          <label className="field">
            <span>Начать</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>
              Завершить <small>если нужно</small>
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              min={startDate}
            />
          </label>
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button button--quiet"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
          >
            {saving ? "Создаём…" : "Создать обещание"}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>
        {children}
      </motion.section>
    </div>
  );
}

function statusLabel(status: Pact["status"]) {
  return {
    active: "В процессе",
    completed: "Завершено",
    failed: "Не выполнено",
    archived: "В архиве",
  }[status];
}

function plural(count: number, one: string, few: string, many: string) {
  const remainder = count % 10;
  const hundred = count % 100;
  if (remainder === 1 && hundred !== 11) return one;
  if (remainder >= 2 && remainder <= 4 && (hundred < 12 || hundred > 14))
    return few;
  return many;
}
