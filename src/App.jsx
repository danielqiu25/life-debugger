import { useEffect, useMemo, useState, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Bug, AlertTriangle, Info, CheckCircle2, Terminal, Moon, Briefcase, Dumbbell, Smartphone, Coffee, Send, Loader2, Plus, MessageSquare } from "lucide-react";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const todayStr = () => new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, "0");

const GREETING = { role: "assistant", content: "Log a few days in the diary tab, then ask me things like \"why am I so tired today\" and I'll look for patterns in your logs." };

function computeEnergy({ sleep, work, exercise, screen, caffeine }) {
  const sleepDebt = Math.max(0, 7.5 - sleep) * 8;
  const overtime = Math.max(0, work - 8) * 5;
  const screenPenalty = Math.max(0, screen - 1) * 4;
  const caffeinePenalty = caffeine > 3 ? (caffeine - 3) * 4 : 0;
  const exerciseBonus = Math.min(exercise, 60) * 0.3;
  const score = clamp(100 - sleepDebt - overtime - screenPenalty - caffeinePenalty + exerciseBonus, 0, 100);
  return { score: Math.round(score) };
}

function buildErrors({ sleep, work, exercise, screen, caffeine }) {
  const errors = [];
  if (sleep < 7) {
    const deficit = (7.5 - sleep).toFixed(1);
    errors.push({
      severity: sleep < 5.5 ? "critical" : "warning",
      type: "SleepDebtError",
      trace: `deficit of ${deficit}h vs recommended 7.5h`,
      patch: `Shift bedtime earlier by ~${Math.round((7.5 - sleep) * 30)}min for the next 3 nights`,
    });
  }
  if (work > 9) {
    errors.push({
      severity: work > 11 ? "critical" : "warning",
      type: "OvertimeOverflowError",
      trace: `${(work - 8).toFixed(1)}h beyond an 8h workday`,
      patch: "Block one task to delegate or defer tomorrow morning",
    });
  }
  if (screen > 2) {
    errors.push({
      severity: "warning",
      type: "ScreenBeforeBedWarning",
      trace: `${screen.toFixed(1)}h of screens after 8pm, delaying sleep onset`,
      patch: "Set a screen cutoff 45min before target bedtime",
    });
  }
  if (caffeine > 3) {
    errors.push({
      severity: "warning",
      type: "CaffeineOverloadWarning",
      trace: `${caffeine} cups today, ${caffeine - 3} past the recommended buffer`,
      patch: "Cap intake at 3 cups, none after 2pm",
    });
  }
  if (exercise < 20) {
    errors.push({
      severity: "info",
      type: "SedentaryNotice",
      trace: `only ${exercise}min of movement logged`,
      patch: "A 15min walk after lunch recovers most of the exercise bonus",
    });
  }
  if (errors.length === 0) {
    errors.push({
      severity: "ok",
      type: "NoExceptionsRaised",
      trace: "all tracked routines within healthy range",
      patch: "Keep current routine, re-check tomorrow",
    });
  }
  return errors;
}

const severityStyle = {
  critical: { border: "border-red-500", text: "text-red-400", Icon: Bug },
  warning: { border: "border-amber-500", text: "text-amber-400", Icon: AlertTriangle },
  info: { border: "border-sky-500", text: "text-sky-400", Icon: Info },
  ok: { border: "border-emerald-500", text: "text-emerald-400", Icon: CheckCircle2 },
};

function Slider({ label, icon: Icon, value, onChange, min, max, step, unit }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-xs text-slate-400 tracking-wide">
          <Icon size={14} className="text-slate-500" />
          {label}
        </span>
        <span className="text-xs text-slate-200">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: "#34d399" }}
        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
}

function MiniCalendar({ entries, selectedDate, onSelect }) {
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  useEffect(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    setViewDate({ year: y, month: m - 1 });
  }, [selectedDate]);

  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach((e) => { map[e.date] = e.score; });
    return map;
  }, [entries]);

  const { year, month } = viewDate;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
  const todayIso = todayStr();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isoFor = (d) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const scoreColor = (score) => {
    if (score == null) return "";
    if (score > 70) return "bg-emerald-500";
    if (score > 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewDate({ year: y, month: m });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => shiftMonth(-1)} className="text-slate-500 hover:text-slate-300 text-xs px-2">‹</button>
        <p className="text-xs text-slate-400">{monthLabel}</p>
        <button onClick={() => shiftMonth(1)} className="text-slate-500 hover:text-slate-300 text-xs px-2">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-600 mb-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const iso = isoFor(d);
          const score = entryMap[iso];
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          return (
            <button
              key={i}
              onClick={() => onSelect(iso)}
              className={`relative h-7 text-[11px] rounded flex items-center justify-center ${
                isSelected ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:bg-slate-800"
              } ${isToday && !isSelected ? "ring-1 ring-slate-600" : ""}`}
            >
              {d}
              {score != null && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${scoreColor(score)}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SYSTEM_PROMPT = `You are the "ask" panel inside a demo app called Life Debugger.
You are a lifestyle-pattern assistant, NOT a doctor and not a diagnostic tool. You have the user's
logged daily routine entries (sleep hours, work hours, exercise minutes, screen time after 8pm,
caffeine cups, computed energy score) as JSON context below.

When the user describes a symptom (e.g. "why do I have a headache"), look for plausible lifestyle
contributors in the logged data (sleep debt, overtime, screen time, caffeine, low activity) and explain
them in plain, warm, concise language (3-5 sentences). Frame findings as "possible contributors based on
your logs" not diagnoses. Never name or rule out medical conditions. If the entries don't cover enough
days, say so plainly rather than guessing. Always close with a brief, non-alarming note that persistent,
severe, or worsening symptoms are worth mentioning to a doctor.`;

function ChatPanel({ entries, messages, onMessagesChange }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    onMessagesChange(newMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const contextNote = entries.length
        ? `Logged entries (most recent last): ${JSON.stringify(entries.slice(-7))}`
        : "No entries logged yet.";
      const apiUrl = import.meta.env.PROD ? "/api/chat" : "http://localhost:3001/api/chat";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `${SYSTEM_PROMPT}\n\n${contextNote}`,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const replyText = data.text || "Sorry, I didn't get a usable response back.";
      onMessagesChange([...newMessages, { role: "assistant", content: replyText }]);
    } catch (e) {
      setError("Couldn't reach the assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[280px] max-h-[420px]">
        {messages.map((m, i) => (
          <div key={i} className="text-xs leading-relaxed">
            <span className={m.role === "user" ? "text-emerald-400" : "text-sky-400"}>
              {m.role === "user" ? "> you" : "$ assistant"}
            </span>
            <p className="text-slate-300 mt-0.5 whitespace-pre-wrap break-words">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 size={13} className="animate-spin" /> thinking...
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-slate-800 pt-3 mt-3">
        <span className="text-emerald-400 text-xs">{">"}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="why do I have a headache right now?"
          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none"
        />
        <button onClick={send} disabled={loading} className="text-slate-500 hover:text-emerald-400 disabled:opacity-40">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function makeChat() {
  return { id: Date.now().toString(), title: "New chat", messages: [GREETING] };
}

function ChatHistorySidebar({ chats, currentChatId, onSelect, onNew }) {
  return (
    <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col">
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded py-1.5 px-2 mb-3 hover:bg-emerald-500/20 justify-center"
      >
        <Plus size={13} /> new chat
      </button>
      <p className="text-[10px] text-slate-600 tracking-widest mb-2">CHAT HISTORY</p>
      <div className="space-y-1 overflow-y-auto max-h-[380px]">
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left flex items-start gap-1.5 text-[11px] rounded px-2 py-1.5 ${
              c.id === currentChatId ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
            }`}
          >
            <MessageSquare size={12} className="mt-0.5 shrink-0" />
            <span className="truncate">{c.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("diary");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [sleep, setSleep] = useState(7);
  const [work, setWork] = useState(8);
  const [exercise, setExercise] = useState(30);
  const [screen, setScreen] = useState(1);
  const [caffeine, setCaffeine] = useState(2);
  const [entries, setEntries] = useState([]);
  const [saveNote, setSaveNote] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const inputs = { sleep, work, exercise, screen, caffeine };
  const breakdown = useMemo(() => computeEnergy(inputs), [sleep, work, exercise, screen, caffeine]);
  const errors = useMemo(() => buildErrors(inputs), [sleep, work, exercise, screen, caffeine]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("diary-entries");
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) { /* no entries yet */ }

    try {
      const savedChats = localStorage.getItem("chat-history");
      if (savedChats) {
        const parsed = JSON.parse(savedChats);
        if (parsed.length > 0) {
          setChats(parsed);
          setCurrentChatId(parsed[0].id);
          return;
        }
      }
    } catch (e) { /* no chats yet */ }

    const first = makeChat();
    setChats([first]);
    setCurrentChatId(first.id);
  }, []);

  useEffect(() => {
    const match = entries.find((e) => e.date === selectedDate);
    if (match) {
      setSleep(match.sleep);
      setWork(match.work);
      setExercise(match.exercise);
      setScreen(match.screen);
      setCaffeine(match.caffeine);
    } else {
      setSleep(7);
      setWork(8);
      setExercise(30);
      setScreen(1);
      setCaffeine(2);
    }
  }, [selectedDate, entries]);

  const trend = useMemo(() => {
    if (entries.length > 0) {
      return [...entries]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7)
        .map((e) => ({ day: e.date.slice(5), energy: e.score }));
    }
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((d, i) => {
      const wobble = Math.sin(i * 1.3 + breakdown.score) * 6;
      return { day: d, energy: Math.round(clamp(breakdown.score + wobble - i * 1.2, 5, 100)) };
    });
  }, [entries, breakdown.score]);

  function logEntry() {
    const entry = { date: selectedDate, sleep, work, exercise, screen, caffeine, score: breakdown.score };
    const next = [...entries.filter((e) => e.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date));
    setEntries(next);
    try {
      localStorage.setItem("diary-entries", JSON.stringify(next));
      setSaveNote(`saved entry for ${selectedDate}`);
    } catch (e) {
      setSaveNote("couldn't save (storage unavailable)");
    }
    setTimeout(() => setSaveNote(""), 2000);
  }

  function persistChats(next) {
    setChats(next);
    try {
      localStorage.setItem("chat-history", JSON.stringify(next));
    } catch (e) { /* storage unavailable */ }
  }

  function handleNewChat() {
    const chat = makeChat();
    persistChats([chat, ...chats]);
    setCurrentChatId(chat.id);
  }

  function handleMessagesChange(newMessages) {
    const next = chats.map((c) => {
      if (c.id !== currentChatId) return c;
      let title = c.title;
      if (title === "New chat") {
        const firstUser = newMessages.find((m) => m.role === "user");
        if (firstUser) title = firstUser.content.slice(0, 32) + (firstUser.content.length > 32 ? "…" : "");
      }
      return { ...c, title, messages: newMessages };
    });
    persistChats(next);
  }

  const currentChat = chats.find((c) => c.id === currentChatId);
  const scoreColor = breakdown.score > 70 ? "text-emerald-400" : breakdown.score > 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 bg-slate-900 rounded-t-lg border border-slate-800 px-4 py-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-3 flex items-center justify-between flex-1 text-xs">
            <span className="flex items-center gap-1">
              <button
                onClick={() => setTab("diary")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t ${tab === "diary" ? "bg-slate-950 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Terminal size={11} /> moms-routine.log
              </button>
              <button
                onClick={() => setTab("ask")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t ${tab === "ask" ? "bg-slate-950 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Terminal size={11} /> ask.sh
              </button>
            </span>
            <a
              href="https://github.com/danielqiu25/life-debugger"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-500 hover:text-slate-300 pr-1"
            >
              Github Link to Repository
            </a>
          </span>
        </div>

        <div className="border border-t-0 border-slate-800 rounded-b-lg bg-slate-900/40 p-4 sm:p-6">
          {tab === "diary" ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">$ life-debugger --analyze --date={selectedDate}</p>
                  <p className="text-xs text-slate-600">
                    running static analysis<span className="animate-pulse">_</span>
                  </p>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-3 tracking-widest">CALENDAR</p>
                  <MiniCalendar entries={entries} selectedDate={selectedDate} onSelect={setSelectedDate} />

                  <p className="text-xs text-slate-500 mb-4 mt-6 tracking-widest">EDIT ROUTINE</p>
                  <Slider label="Sleep" icon={Moon} value={sleep} onChange={setSleep} min={3} max={10} step={0.1} unit="h" />
                  <Slider label="Work hours" icon={Briefcase} value={work} onChange={setWork} min={4} max={14} step={0.5} unit="h" />
                  <Slider label="Exercise" icon={Dumbbell} value={exercise} onChange={setExercise} min={0} max={90} step={5} unit="m" />
                  <Slider label="Screen after 8pm" icon={Smartphone} value={screen} onChange={setScreen} min={0} max={6} step={0.5} unit="h" />
                  <Slider label="Caffeine" icon={Coffee} value={caffeine} onChange={setCaffeine} min={0} max={6} step={1} unit=" cups" />

                  <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500 mb-1">ENERGY SCORE</p>
                    <p className={`text-4xl font-bold ${scoreColor}`}>{breakdown.score}</p>
                  </div>
                  <button
                    onClick={logEntry}
                    className="w-full mt-4 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded py-2 hover:bg-emerald-500/20"
                  >
                    save entry for {selectedDate}
                  </button>
                  {saveNote && <p className="text-[11px] text-slate-500 text-center mt-2">{saveNote}</p>}
                </div>

                <div className="lg:col-span-3 space-y-3">
                  <p className="text-xs text-slate-500 tracking-widest mb-1">TRACEBACK (most recent life)</p>
                  {errors.map((err, i) => {
                    const s = severityStyle[err.severity];
                    const Icon = s.Icon;
                    return (
                      <div key={i} className={`border-l-2 ${s.border} bg-slate-900/60 rounded-r-md p-3`}>
                        <div className="flex items-start gap-2">
                          <Icon size={15} className={`${s.text} mt-0.5 shrink-0`} />
                          <div className="text-xs leading-relaxed min-w-0">
                            <p className={`${s.text} font-semibold`}>{err.type}</p>
                            <p className="text-slate-400 break-words">{err.trace}</p>
                            <p className="text-slate-300 mt-1">
                              <span className="text-slate-500">→ patch:</span> {err.patch}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 mt-4">
                    <p className="text-xs text-slate-500 tracking-widest mb-3">
                      {entries.length ? "LOGGED ENERGY TREND" : "7-DAY ENERGY TREND (preview)"}
                    </p>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis
                          stroke="#475569"
                          tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          width={34}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                        />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6, fontSize: 12 }} labelStyle={{ color: "#94a3b8" }} />
                        <Area type="monotone" dataKey="energy" stroke="#34d399" strokeWidth={2} fill="url(#energyFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-1">$ life-debugger --ask</p>
              <p className="text-xs text-slate-600 mb-4">
                reasoning over {entries.length} logged {entries.length === 1 ? "entry" : "entries"}<span className="animate-pulse">_</span>
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <ChatHistorySidebar chats={chats} currentChatId={currentChatId} onSelect={setCurrentChatId} onNew={handleNewChat} />
                <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                  {currentChat && (
                    <ChatPanel
                      key={currentChat.id}
                      entries={entries}
                      messages={currentChat.messages}
                      onMessagesChange={handleMessagesChange}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          <p className="text-[11px] text-slate-600 mt-6 border-t border-slate-800 pt-3">
            This is a lifestyle pattern demo, not medical advice — the assistant looks for correlations in logged routines, it doesn't diagnose. Persistent or severe symptoms are worth mentioning to a doctor.
          </p>
        </div>
      </div>
    </div>
  );
}