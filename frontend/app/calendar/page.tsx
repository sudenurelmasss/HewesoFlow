"use client";

import { useMemo, useState } from "react";

const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default function CalendarPage() {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const mondayBasedStart =
      firstDay === 0 ? 6 : firstDay - 1;

    const result: (number | null)[] = [];

    for (let i = 0; i < mondayBasedStart; i++) {
      result.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      result.push(day);
    }

    return result;
  }, [year, month]);

  function previousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="text-sm text-gray-500">
            HewesoFlow
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Takvim
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Proje ve görev tarihlerinizi takip edin.
          </p>
        </div>

        <section className="rounded-[32px] border border-gray-200 bg-white p-7">

          <div className="mb-7 flex items-center justify-between">

            <button
              onClick={previousMonth}
              className="rounded-xl border border-gray-200 px-4 py-2"
            >
              ←
            </button>

            <h2 className="text-xl font-semibold">
              {monthNames[month]} {year}
            </h2>

            <button
              onClick={nextMonth}
              className="rounded-xl border border-gray-200 px-4 py-2"
            >
              →
            </button>

          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400">
            <div>Pzt</div>
            <div>Sal</div>
            <div>Çar</div>
            <div>Per</div>
            <div>Cum</div>
            <div>Cmt</div>
            <div>Paz</div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">

            {days.map((day, index) => {
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-24 rounded-2xl border p-3 ${
                    day
                      ? "border-gray-200 bg-white"
                      : "border-transparent"
                  }`}
                >
                  {day && (
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                        isToday
                          ? "bg-black text-white"
                          : ""
                      }`}
                    >
                      {day}
                    </span>
                  )}
                </div>
              );
            })}

          </div>
        </section>
      </div>
    </main>
  );
}