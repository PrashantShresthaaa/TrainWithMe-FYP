import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const statusStyles = {
  pending:   { pill: "bg-amber-50 text-amber-600 border border-amber-200",       label: "Pending"   },
  confirmed: { pill: "bg-emerald-50 text-emerald-600 border border-emerald-200", label: "Confirmed" },
  rejected:  { pill: "bg-red-50 text-red-500 border border-red-200",             label: "Rejected"  },
  cancelled: { pill: "bg-gray-100 text-gray-500 border border-gray-200",         label: "Cancelled" },
  completed: { pill: "bg-blue-50 text-blue-600 border border-blue-200",          label: "Completed" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// Try to parse sessionDate into a comparable format
function parseSessionDate(sessionDate) {
  if (!sessionDate) return null;
  // Try ISO format first
  const iso = new Date(sessionDate);
  if (!isNaN(iso)) return iso;
  return null;
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function ScheduleView() {
  const { getToken, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("month"); // "month" | "list"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = getToken();
        const res = await fetch("http://localhost:5000/api/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");
        // Filter only active bookings (not rejected/cancelled)
        const active = (Array.isArray(data) ? data : []).filter(
          (b) => b.status !== "rejected" && b.status !== "cancelled"
        );
        setBookings(active);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Get bookings for a specific calendar date
  const getBookingsForDate = (day) => {
    const target = new Date(year, month, day);
    return bookings.filter((b) => {
      const d = parseSessionDate(b.sessionDate);
      if (!d) return false;
      return isSameDay(d, target);
    });
  };

  // Upcoming bookings sorted for list view
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingBookings = bookings
    .filter((b) => {
      const d = parseSessionDate(b.sessionDate);
      return d && d >= today;
    })
    .sort((a, b) => parseSessionDate(a.sessionDate) - parseSessionDate(b.sessionDate));

  const selectedDayBookings = selectedDay ? getBookingsForDate(selectedDay) : [];

  const renderCalendar = () => {
    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg opacity-40" />);
    }
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dayBookings = getBookingsForDate(day);
      const isToday = isSameDay(new Date(year, month, day), new Date());
      const isSelected = selectedDay === day;

      cells.push(
        <div
          key={day}
          onClick={() => setSelectedDay(isSelected ? null : day)}
          className={`h-24 rounded-lg border p-1.5 cursor-pointer transition-all duration-150 hover:border-orange-300 hover:shadow-sm overflow-hidden
            ${isToday ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-white"}
            ${isSelected ? "ring-2 ring-orange-400 ring-offset-1" : ""}
          `}
        >
          <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
            ${isToday ? "bg-brandOrange text-white" : "text-gray-700"}`}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayBookings.slice(0, 2).map((b) => (
              <div
                key={b._id}
                className={`text-xs px-1 py-0.5 rounded truncate font-medium
                  ${b.status === "confirmed" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}
              >
                {b.trainerName || b.trainer?.name || "Trainer"} · {b.sessionTime}
              </div>
            ))}
            {dayBookings.length > 2 && (
              <div className="text-xs text-gray-400 pl-1">+{dayBookings.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brandOrange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <p className="text-lg font-medium">Failed to load schedule</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your upcoming training sessions</p>
        </div>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("month")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === "month" ? "bg-white text-brandOrange shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === "list" ? "bg-white text-brandOrange shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Upcoming", value: upcomingBookings.length, color: "text-brandOrange" },
          { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length, color: "text-emerald-600" },
          { label: "Pending", value: bookings.filter((b) => b.status === "pending").length, color: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {view === "month" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              ‹
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 p-3">
            {renderCalendar()}
          </div>

          {/* Selected day panel */}
          {selectedDay && (
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {MONTHS[month]} {selectedDay} — {selectedDayBookings.length} session{selectedDayBookings.length !== 1 ? "s" : ""}
              </h3>
              {selectedDayBookings.length === 0 ? (
                <p className="text-sm text-gray-400">No sessions on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayBookings.map((b) => (
                    <BookingCard key={b._id} booking={b} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // List view
        <div className="space-y-3">
          {upcomingBookings.length === 0 ? (
            <EmptyState />
          ) : (
            upcomingBookings.map((b) => (
              <BookingCard key={b._id} booking={b} showDate />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b, showDate = false }) {
  const style = statusStyles[b.status] || statusStyles.pending;
  const parsedDate = parseSessionDate(b.sessionDate);
  const dateStr = parsedDate
    ? parsedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : b.sessionDate;

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Time block */}
      <div className="flex-shrink-0 w-16 text-center">
        <div className="text-xs text-gray-400 font-medium">{b.sessionTime?.split(" ")[1] || ""}</div>
        <div className="text-sm font-bold text-gray-800">{b.sessionTime?.split(" ")[0] || b.sessionTime}</div>
        {showDate && (
          <div className="text-xs text-gray-400 mt-0.5">{dateStr}</div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-gray-100" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 text-sm truncate">
          {b.trainerName || b.trainer?.name || "Trainer"}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
            ${b.sessionType === "Online" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
            {b.sessionType === "Online" ? "🖥" : "📍"} {b.sessionType}
          </span>
          {b.packageName && (
            <span className="text-xs text-gray-400">· {b.packageName}</span>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${style.pill}`}>
          {style.label}
        </span>
      </div>

      {/* Price */}
      {b.price && (
        <div className="text-sm font-semibold text-gray-700 flex-shrink-0">
          Rs. {b.price.toLocaleString()}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
      <div className="text-5xl mb-4">📅</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No upcoming sessions</h3>
      <p className="text-sm text-gray-400">
        Book a session with a trainer to see it here.
      </p>
    </div>
  );
}