import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./components/AuthPage";
import { HistoryPage } from "./pages/HistoryPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PactsPage } from "./pages/PactsPage";
import {
  ApiError,
  createCheckin,
  createPact,
  getCheckins,
  getPacts,
  type Checkin,
  type CreatePactInput,
  type Pact,
  type User,
} from "./lib/api";
import { localDate } from "./lib/format";

const TOKEN_KEY = "pact.access_token";
const USER_KEY = "pact.user";

function readUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(readUser);

  function signIn(accessToken: string, nextUser: User) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(accessToken);
    setUser(nextUser);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {token ? (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Workspace token={token} user={user} onSignOut={signOut} />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthPage onAuthenticated={signIn} />
          </motion.div>
        )}
      </AnimatePresence>
    </BrowserRouter>
  );
}

type WorkspaceProps = {
  token: string;
  user: User | null;
  onSignOut: () => void;
};

function Workspace({ token, user, onSignOut }: WorkspaceProps) {
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let current = true;

    async function loadWorkspace() {
      setLoading(true);
      setError("");
      try {
        const nextPacts = await getPacts(token);
        const histories = await Promise.all(
          nextPacts.map((pact) => getCheckins(token, pact.id)),
        );
        if (current) {
          setPacts(nextPacts);
          setCheckins(histories.flat());
        }
      } catch (cause) {
        if (!current) return;
        if (cause instanceof ApiError && cause.status === 401) {
          onSignOut();
          return;
        }
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось загрузить данные",
        );
      } finally {
        if (current) setLoading(false);
      }
    }

    void loadWorkspace();
    return () => {
      current = false;
    };
  }, [token, onSignOut]);

  async function refreshWorkspace() {
    const nextPacts = await getPacts(token);
    const histories = await Promise.all(
      nextPacts.map((pact) => getCheckins(token, pact.id)),
    );
    setPacts(nextPacts);
    setCheckins(histories.flat());
  }

  async function handleCreate(input: CreatePactInput) {
    await createPact(token, input);
    await refreshWorkspace();
    setNotice("Обещание добавлено");
  }

  async function handleCheckin(pactId: string, note: string) {
    await createCheckin(token, pactId, { date: localDate(), note });
    await refreshWorkspace();
    setNotice("Отметка сохранена");
  }

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <>
      <Routes>
        <Route
          element={<AppShell user={user} pacts={pacts} onSignOut={onSignOut} />}
        >
          <Route
            index
            element={
              <OverviewPage
                pacts={pacts}
                checkins={checkins}
                loading={loading}
                onCheckin={handleCheckin}
              />
            }
          />
          <Route
            path="pacts"
            element={
              <PactsPage
                pacts={pacts}
                checkins={checkins}
                loading={loading}
                onCreate={handleCreate}
                onCheckin={handleCheckin}
              />
            }
          />
          <Route
            path="pacts/:id"
            element={
              <PactsPage
                pacts={pacts}
                checkins={checkins}
                loading={loading}
                onCreate={handleCreate}
                onCheckin={handleCheckin}
              />
            }
          />
          <Route
            path="history"
            element={
              <HistoryPage
                pacts={pacts}
                checkins={checkins}
                loading={loading}
              />
            }
          />
          <Route
            path="*"
            element={
              <OverviewPage
                pacts={pacts}
                checkins={checkins}
                loading={loading}
                onCheckin={handleCheckin}
              />
            }
          />
        </Route>
      </Routes>
      {error && (
        <div className="toast toast--error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="toast__action"
            onClick={() => window.location.reload()}
          >
            Повторить
          </button>
        </div>
      )}
      {notice && (
        <div className="toast toast--success" role="status">
          {notice}
        </div>
      )}
    </>
  );
}

export default App;
