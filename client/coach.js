const API_BASE_URL =
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://127.0.0.1:4000"
    : "https://fossportsacademy.com";

let coachName = "";
let day = "";
let calendar;
let selectedDate = null;
let weeklyAvailabilityMap = {}; // key: "Monday", value: { start, end }

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("coach-login-form");
  const loginContainer = document.getElementById("login-container");
  const dashboard = document.getElementById("coach-dashboard");
  const nameDisplay = document.getElementById("coach-name-display");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Invalid login");

      const data = await res.json();
      coachName = data.coachName;
      nameDisplay.textContent = coachName;
      loginContainer.classList.add("hidden");
      dashboard.classList.remove("hidden");
      
      // Show mobile hint on small screens
      if (window.innerWidth <= 768) {
        document.getElementById("mobile-calendar-hint").style.display = "block";
      }
      
      initCalendar();
    } catch (err) {
      document.getElementById("login-error").classList.remove("hidden");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch(`${API_BASE_URL}/api/coach/logout`, { method: "POST", credentials: "include" });
    coachName = "";
    dashboard.classList.add("hidden");
    loginContainer.classList.remove("hidden");
  });
});

function getDateFromTomorrow(targetDayIndex) {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
  
    for (let i = 0; i < 7; i++) {
      const d = new Date(tomorrow);
      d.setDate(d.getDate() + i);
      if (d.getDay() === targetDayIndex) {
        return d.toISOString().split("T")[0]; // e.g. "2025-07-10"
      }
    }
  
    return tomorrow.toISOString().split("T")[0]; // fallback
  } 

  function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) {
      console.error("Calendar element not found");
      return;
    }
  
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
  
    const sixDaysLater = new Date(tomorrow);
    sixDaysLater.setDate(sixDaysLater.getDate() + 5);
  
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGrid",
      headerToolbar: false,
      height: "auto",
      visibleRange: {
        start: tomorrow.toISOString().split("T")[0],
        end: new Date(sixDaysLater.getTime() + 24*60*60*1000).toISOString().split("T")[0], // add 1 day to include last day fully
      },
      dateClick: (info) => openModal(info.dateStr),
      eventClick: (info) => openModal(info.event.startStr.split("T")[0]),
      events: fetchAvailabilityEvents,
      eventDisplay: 'block',
      dayMaxEvents: false,
      moreLinkClick: 'popover',
      // Mobile optimizations
      aspectRatio: window.innerWidth < 768 ? 1.2 : 1.35,
      dayHeaderFormat: window.innerWidth < 768 ? { weekday: 'short' } : { weekday: 'short', month: 'numeric', day: 'numeric' }
    });
  
    calendar.render();
  
    document.getElementById("saveAvailabilityBtn").addEventListener("click", async () => {
      const start = parseFloat(document.getElementById("startHour").value);
      const end = parseFloat(document.getElementById("endHour").value);
  
      if (isNaN(start) || isNaN(end)) {
        alert("Please enter both start and end times.");
        return;
      }
  
      if (start < 9 || end > 22 || start >= end) {
        alert("Availability must be between 9AM and 10PM, with end time after start.");
        return;
      }
  
      try {
        const res = await fetch(`${API_BASE_URL}/api/coach/updateScheduleDay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            coachName,
            day,
            start,
            end,
            remove: false,
          }),
        });
  
        if (!res.ok) throw new Error("Failed to update availability");
  
        alert("Updated!");
        closeModal();
        calendar.refetchEvents();
      } catch (err) {
        console.error(err);
        alert("Failed to update availability");
      }
    });
  }

  document.getElementById("removeAvailabilityBtn").addEventListener("click", async () => {
    if (!day || !coachName) return;
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/updateScheduleDay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          coachName,
          day,
          remove: true
        }),
      });
  
      if (!res.ok) throw new Error("Failed to remove availability");
      
      alert("Availability removed! Day is now marked as 'Not Available'.");
      closeModal();
      calendar.refetchEvents();
    } catch (err) {
      console.error(err);
      alert("Error removing availability");
    }
  });
  
  function fetchAvailabilityEvents(fetchInfo, successCallback, failureCallback) {
    fetch(`${API_BASE_URL}/api/coach/availability`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch availability");
        return res.json();
      })
      .then(data => {
        const events = [];
        weeklyAvailabilityMap = {}; // Clear old map
  
        const today = new Date();
        today.setDate(today.getDate() + 1); // Tomorrow
        const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Create a map of existing entries by dayIndex
        const availabilityMap = {};
        data.weeklyAvailability.forEach(entry => {
          availabilityMap[entry.dayIndex] = entry;
        });

        // Process all 7 days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const date = new Date(baseDate);
          date.setDate(baseDate.getDate() + ((dayIndex - baseDate.getDay() + 7) % 7));
          
          const dateStr = date.toISOString().split("T")[0];
          const weekdayName = date.toLocaleDateString("en-US", { weekday: "long" });
          
          const entry = availabilityMap[dayIndex];
          console.log(entry);
          
          if (!entry) {
            // Day missing from data - show red "No availability"
            events.push({ 
              title: "No availability", 
              start: dateStr, 
              allDay: true,
              backgroundColor: '#f44336',
              borderColor: '#f44336',
              textColor: '#fff',
              extendedProps: {
                type: 'no-availability'
              }
            });
            weeklyAvailabilityMap[weekdayName] = { start: null, end: null };
          } else if (entry.start === -1 || entry.end === -1) {
            // -1,-1 means no availability set - show orange
            events.push({ 
              title: "No availability set", 
              start: dateStr, 
              allDay: true,
              backgroundColor: '#ff9800',
              borderColor: '#ff9800',
              textColor: '#fff',
              extendedProps: {
                type: 'no-availability-set'
              }
            });
            weeklyAvailabilityMap[weekdayName] = { start: -1, end: -1 };
          } else if (entry.start === null || entry.end === null) {
            // null means not available - show red
            events.push({ 
              title: "No availability", 
              start: dateStr, 
              allDay: true,
              backgroundColor: '#f44336',
              borderColor: '#f44336',
              textColor: '#fff',
              extendedProps: {
                type: 'no-availability'
              }
            });
            weeklyAvailabilityMap[weekdayName] = { start: null, end: null };
          } else {
            // Regular availability event
            const start = `${dateStr}T${String(entry.start).padStart(2, "0")}:00:00`;
            const end = `${dateStr}T${String(entry.end).padStart(2, "0")}:00:00`;
            events.push({ 
              title: `Available ${formatHour(entry.start)} - ${formatHour(entry.end)}`, 
              start, 
              end, 
              allDay: false,
              backgroundColor: '#28a745',
              borderColor: '#28a745',
              textColor: '#fff',
              extendedProps: {
                type: 'available'
              }
            });
            weeklyAvailabilityMap[weekdayName] = { start: entry.start, end: entry.end };
          }
        }
  
        successCallback(events);
      })
      .catch(failureCallback);
  }
   
  // Helper to format hours in AM/PM
  function formatHour(hour24) {
    const ampm = hour24 >= 12 ? "PM" : "AM";
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}${ampm}`;
  }

  function openModal(dateStr) {
    selectedDate = dateStr;
    const [year, month, dayNum] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, dayNum); // local time, no timezone shift
  
    day = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  
    document.getElementById("modalDate").textContent = `Editing ${day} (${dateStr})`;
  
    const startInput = document.getElementById("startHour");
    const endInput = document.getElementById("endHour");
    const availability = weeklyAvailabilityMap[day];
  
    if (availability) {
      if (availability.start === null || availability.end === null || availability.start === -1 || availability.end === -1) {
        startInput.value = "";
        endInput.value = "";
      } else {
        startInput.value = availability.start;
        endInput.value = availability.end;
      }
    } else {
      startInput.value = "";
      endInput.value = "";
    }
  
    document.getElementById("modalBackdrop").style.display = "block";
    document.getElementById("editModal").style.display = "block";
  }

function closeModal() {
  document.getElementById("modalBackdrop").style.display = "none";
  document.getElementById("editModal").style.display = "none";
}
