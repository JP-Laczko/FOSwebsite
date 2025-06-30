document.addEventListener("DOMContentLoaded", function () {
  // const API_BASE_URL = window.location.hostname === "127.0.0.1"
  //   ? "http://localhost:4000"
  //   : "https://fos-website.onrender.com";

  // const API_BASE_URL = "https://fos-website.onrender.com";
  const API_BASE_URL = "http://localhost:4000";

  const sportNames = {
    baseball: "Baseball",
    girlsSoccer: "Girls Soccer",
    football: "Football",
    boysLax: "Boys Lacrosse",
  };
  let currentBookingId = null;

  const loginForm = document.getElementById("admin-login-form");
  const passwordInput = document.getElementById("admin-password");
  const loginError = document.getElementById("login-error");
  const dashboard = document.getElementById("admin-dashboard");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = passwordInput.value;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        loginForm.classList.add("hidden");
        loginError.classList.add("hidden");
        document.querySelector(".login-container").remove();
        dashboard.classList.remove("hidden");

        loadCoaches();
        loadCalendar();
      } else {
        loginError.classList.remove("hidden");
      }
    } catch (err) {
      loginError.classList.remove("hidden" + err);
    }
  });

  document.getElementById("close-btn").addEventListener("click", (e) => {
    closeModal();
  });

  document.getElementById("view-close-btn").addEventListener("click", () => {
    document.getElementById("view-booking-modal").classList.add("hidden");
  });

  function loadCalendar() {
    const calendarEl = document.getElementById("calendar");

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      height: "auto",
      dateClick: (info) => {
        openModal(info.dateStr);
      },
      events: async function (fetchInfo, successCallback, failureCallback) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings`, {
            method: "GET",
            credentials: "include", // Include credentials (cookies)
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            throw new Error("Network response was not ok");
          }

          const data = await res.json();

          const events = data
            .map((booking) => {
              try {
                const dateOnly = booking.date.split("T")[0];
                const combined = `${dateOnly}T${booking.startTime}`;
                const isoStart = new Date(combined).toISOString();

                return {
                  id: booking._id,
                  title: `${booking.athleteName} - ${booking.coach}`,
                  start: isoStart,
                  extendedProps: {
                    athleteName: booking.athleteName,
                    coach: booking.coach,
                    date: dateOnly,
                    time: booking.startTime,
                    notes: booking.notes || "",
                  },
                };
              } catch (err) {
                return err;
              }
            })
            .filter(Boolean);

          successCallback(events);
        } catch (err) {
          failureCallback(err);
        }
      },
      eventClick: function (info) {
        const event = info.event;

        currentBookingId = event.id;

        document.getElementById("view-athleteName").textContent =
          event.extendedProps.athleteName || "N/A";
        document.getElementById("view-coach").textContent =
          event.extendedProps.coach || "N/A";
        document.getElementById("view-date").textContent =
          event.extendedProps.date || "N/A";
        document.getElementById("view-time").textContent =
          event.extendedProps.time || "N/A";
        document.getElementById("view-notes").textContent =
          event.extendedProps.notes || "None";

        document.getElementById("view-booking-modal").classList.remove("hidden");
      },
    });

    calendar.render();
  }

  function openModal(dateStr) {
    const modal = document.getElementById("booking-modal");
    modal.classList.remove("hidden");
    document.getElementById("bookingDate").value = dateStr;
  }

  function closeModal() {
    const modal = document.getElementById("booking-modal");
    modal.classList.add("hidden");
  }

  function loadCoaches() {
    const coachSelect = document.getElementById("admin-coach-select");

    fetch(
      "https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json"
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        coachSelect.innerHTML = '<option value="">Select a coach</option>';

        sorted.forEach((coach) => {
          if (coach.available === "yes") {
            const option = document.createElement("option");
            option.value = coach.name;
            const sportName = sportNames?.[coach.sport] || "No Sport";
            option.textContent = `${coach.name} (${sportName})`;
            coachSelect.appendChild(option);
          }
        });
      })
      .catch(() => {
        coachSelect.innerHTML = '<option value="">Error loading coaches</option>';
      });
  }

  document
    .getElementById("booking-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const coach = document.getElementById("admin-coach-select").value;
      const athleteName = document.getElementById("athleteName").value;
      const date = document.getElementById("bookingDate").value;
      const startTime = document.getElementById("startTime").value;
      const notes = document.getElementById("notes").value;

      if (!coach || !athleteName || !date || !startTime) {
        alert("Please fill in all required fields.");
        return;
      }

      const booking = {
        coach,
        athleteName,
        date,
        startTime,
        notes,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // important for session cookie
          body: JSON.stringify(booking),
        });

        if (!res.ok) throw new Error("Failed to create booking");

        alert("Booking added successfully!");

        closeModal();
        e.target.reset();

        loadCalendar();
      } catch (err) {
        alert("Error adding booking" + err);
      }
    });

  document.getElementById("delete-booking-btn").addEventListener("click", async () => {
    if (!currentBookingId) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${currentBookingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete booking");

      alert("Booking deleted successfully!");
      document.getElementById("view-booking-modal").classList.add("hidden");
      currentBookingId = null;

      loadCalendar();
    } catch (err) {
      alert("Error deleting booking" + err);
    }
  });
});
