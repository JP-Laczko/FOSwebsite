document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL =
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "http://127.0.0.1:4000"
      : "https://fossportsacademy.com";

  const sportNames = {
    baseball: "Baseball",
    girlsSoccer: "Girls Soccer",
    football: "Football",
    boysLax: "Boys Lacrosse",
    boysBasketball: "Boys Basketball",
    softball: "Softball",
  };

  let deleteConfirmActive = false;
  let deleteConfirmTimeout = null;
  let currentBookingId = null;

  const loginForm = document.getElementById("admin-login-form");
  const passwordInput = document.getElementById("admin-password");
  const loginError = document.getElementById("login-error");
  const dashboard = document.getElementById("admin-dashboard");
  const editBtn = document.getElementById("edit-booking-btn");
  const saveBtn = document.getElementById("save-booking-btn");
  const cancelBtn = document.getElementById("cancel-booking-btn");

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
        const coachSelect = document.getElementById("admin-coach-select");
        loadCoaches(coachSelect);
        loadCalendar();
        loadLessonCounts();
      } else {
        console.warn("⚠️ Login failed");
        loginError.classList.remove("hidden");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      loginError.classList.remove("hidden");
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
      editable: true,
      eventStartEditable: true,
      dateClick: (info) => {
        openModal(info.dateStr);
      },
      events: async function (fetchInfo, successCallback, failureCallback) {

        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
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
                    guardianName: booking.guardianName,
                    athleteName: booking.athleteName,
                    coach: booking.coach,
                    numPlayers: booking.numPlayers,
                    date: dateOnly,
                    time: booking.startTime,
                    notes: booking.notes || "",
                  },
                };
              } catch (err) {
                console.error("⚠️ Error mapping booking:", err);
                return null;
              }
            })
            .filter(Boolean);

          successCallback(events);
        } catch (err) {
          console.error("❌ Failed to fetch bookings:", err);
          failureCallback(err);
        }
      },
      eventClick: function (info) {
        const event = info.event;
        currentBookingId = event.id;

        document.getElementById("view-guardianName").textContent =
          event.extendedProps.guardianName || "N/A";
        document.getElementById("view-athleteName").textContent =
          event.extendedProps.athleteName || "N/A";
        document.getElementById("view-coach").textContent =
          event.extendedProps.coach || "N/A";
        document.getElementById("view-numPlayers").textContent =
          event.extendedProps.numPlayers || "N/A";
        document.getElementById("view-date").textContent =
          event.extendedProps.date || "N/A";
        document.getElementById("view-time").textContent =
          event.extendedProps.time || "N/A";
        document.getElementById("view-notes").textContent =
          event.extendedProps.notes || "None";

        document.getElementById("view-booking-modal").classList.remove("hidden");
      },
      eventDrop: async function (info) {
        const event = info.event;
        const newDate = event.start;
    
        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings/${event.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              date: newDate.toISOString().split("T")[0],
              startTime: newDate.toISOString().split("T")[1].slice(0, 5),
            }),
          });
    
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error("Failed to update booking: " + errorText);
          }          
    
          alert("Booking updated via drag-and-drop");
        } catch (err) {
          console.error("❌ Error updating booking:", err);
          alert("Drag-and-drop update failed. Reloading calendar.");
          info.revert(); // 🎯 Revert change if it fails
        }
      },
    });

    calendar.render();
  }

  // Function to toggle between view and edit modes
function toggleEditMode(isEditing) {

  const athleteNameEl = document.getElementById("view-athleteName");
  const coachEl = document.getElementById("view-coach");
  const numPlayersEl = document.getElementById("view-numPlayers");
  const dateEl = document.getElementById("view-date");
  const timeEl = document.getElementById("view-time");
  const notesEl = document.getElementById("view-notes");

  if (isEditing) {
    const currentCoach = coachEl.textContent.trim();
  
    athleteNameEl.innerHTML = `<input id="edit-athleteName" type="text" value="${athleteNameEl.textContent}" />`;
  
    coachEl.innerHTML = `<select id="edit-coach"></select>`;
    const coachSelect = document.getElementById("edit-coach");
  
    loadCoaches(coachSelect).then(() => {
      coachSelect.value = currentCoach;
    });

    numPlayersEl.innerHTML = `<input id="edit-numPlayers" type="number" min="1" max="99" value="${numPlayersEl.textContent || 1}" />`;
    dateEl.innerHTML = `<input id="edit-date" type="date" value="${dateEl.textContent}" />`;
    timeEl.innerHTML = `<input id="edit-time" type="time" value="${timeEl.textContent}" />`;
    notesEl.innerHTML = `<textarea id="edit-notes">${notesEl.textContent === "None" ? "" : notesEl.textContent}</textarea>`;
  
    editBtn.classList.add("hidden");
    saveBtn.classList.remove("hidden");
    cancelBtn.classList.remove("hidden");
  } else {
    // Revert inputs back to text
    const athleteNameInput = document.getElementById("edit-athleteName");
    const coachInput = document.getElementById("edit-coach");
    const numPlayersInput = document.getElementById("edit-numPlayers");
    const dateInput = document.getElementById("edit-date");
    const timeInput = document.getElementById("edit-time");
    const notesInput = document.getElementById("edit-notes");

    athleteNameEl.textContent = athleteNameInput.value;
    coachEl.textContent = coachInput.value;
    numPlayersEl.textContent = numPlayersInput.value || "1";
    dateEl.textContent = dateInput.value;
    timeEl.textContent = timeInput.value;
    notesEl.textContent = notesInput.value || "None";

    editBtn.classList.remove("hidden");
    saveBtn.classList.add("hidden");
    cancelBtn.classList.add("hidden");
  }
}

// Click listeners

editBtn.addEventListener("click", () => {
  toggleEditMode(true);
});

cancelBtn.addEventListener("click", () => {
  toggleEditMode(false);
});

saveBtn.addEventListener("click", async () => {
  const updatedBooking = {
    athleteName: document.getElementById("edit-athleteName").value.trim(),
    coach: document.getElementById("edit-coach").value.trim(),
    numPlayers: parseInt(document.getElementById("edit-numPlayers").value, 10) || 1,
    date: document.getElementById("edit-date").value,
    startTime: document.getElementById("edit-time").value,
    notes: document.getElementById("edit-notes").value.trim(),
  };

  // Basic validation
  if (
    !updatedBooking.athleteName ||
    !updatedBooking.coach ||
    !updatedBooking.numPlayers || 
    updatedBooking.numPlayers < 1 ||
    !updatedBooking.date ||
    !updatedBooking.startTime
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bookings/${currentBookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updatedBooking),
    });

    if (!res.ok) throw new Error("Failed to update booking");

    alert("Booking updated successfully!");
    toggleEditMode(false);
    loadCalendar();
    loadLessonCounts();
  } catch (err) {
    console.error("❌ Error updating booking:", err);
    alert("Error updating booking: " + err);
  }
}); 

  function openModal(dateStr) {
    const modal = document.getElementById("booking-modal");
    modal.classList.remove("hidden");
    document.getElementById("bookingDate").value = dateStr;
  }

  function closeModal() {
    const modal = document.getElementById("booking-modal");
    modal.classList.add("hidden");
  }

  function loadCoaches(selectElement) {
    const coachSelect = document.getElementById("admin-coach-select");

    return fetch("https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        selectElement.innerHTML = '<option value="">Select a coach</option>';

        sorted.forEach((coach) => {
          if (coach.available === "yes") {
            const option = document.createElement("option");
            option.value = coach.name;
            const sportName = sportNames?.[coach.sport] || "No Sport";
            option.textContent = `${coach.name} (${sportName})`;
            selectElement.appendChild(option);
          }
        });
      })
      .catch((err) => {
        console.error("❌ Error loading coaches:", err);
        coachSelect.innerHTML = '<option value="">Error loading coaches</option>';
      });
  }

  document.getElementById("booking-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const coach = document.getElementById("admin-coach-select").value;
    const guardianName = document.getElementById("guardianName").value;
    const athleteName = document.getElementById("athleteName").value;
    const date = document.getElementById("bookingDate").value;
    const startTime = document.getElementById("startTime").value;
    const notes = document.getElementById("notes").value;

    if (!coach || !guardianName || !athleteName || !date || !startTime) {
      alert("Please fill in all required fields.");
      return;
    }

    const booking = {
      coach,
      guardianName,
      athleteName,
      date,
      startTime,
      notes,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(booking),
      });

      if (!res.ok) throw new Error("Failed to create booking");

      alert("Booking added successfully!");
      closeModal();
      e.target.reset();

      loadCalendar();
      loadLessonCounts();
    } catch (err) {
      console.error("❌ Error adding booking:", err);
      alert("Error adding booking: " + err);
    }
  });

  document.getElementById("delete-booking-btn").addEventListener("click", async () => {
    const deleteBtn = document.getElementById("delete-booking-btn");
  
    if (!deleteConfirmActive) {
      // First click: ask for confirmation
      deleteBtn.textContent = "Confirm Delete?";
      deleteBtn.classList.add("bg-red-600"); // optional styling
      deleteConfirmActive = true;
  
      // Reset after 5 seconds if no second click
      deleteConfirmTimeout = setTimeout(() => {
        deleteBtn.textContent = "Delete Booking";
        deleteBtn.classList.remove("bg-red-600");
        deleteConfirmActive = false;
      }, 5000);
  
      return;
    }
  
    // Second click: proceed with deletion
    clearTimeout(deleteConfirmTimeout);
    deleteBtn.textContent = "Deleting...";
    deleteBtn.disabled = true;
  
    if (!currentBookingId) {
      console.warn("No booking selected to delete");
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
      loadLessonCounts();
    } catch (err) {
      console.error("❌ Error deleting booking:", err);
      alert("Error deleting booking: " + err);
    } finally {
      deleteBtn.textContent = "Delete Booking";
      deleteBtn.disabled = false;
      deleteBtn.classList.remove("bg-red-600");
      deleteConfirmActive = false;
    }
  });

  async function loadLessonCounts() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/lesson-counts`);
      const data = await res.json();
      console.log('Lesson counts data:', data);
      const tableBody = document.getElementById("lesson-counts-body");
      tableBody.innerHTML = "";
  
      data.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.name}</td>
          <td>${entry.totalLessons}</td>
        `;
        tableBody.appendChild(row);
      });

    } catch (err) {
      console.error("Error loading lesson counts:", err);
    }
  }
  
});
