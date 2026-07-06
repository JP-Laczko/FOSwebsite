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
    fieldHockey: "Field Hockey",
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
    // Fetch coaches from API (now stored in database instead of Gist)
    return fetch(`${API_BASE_URL}/api/coach/all`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('API fetch failed');
        return res.json();
      })
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
        console.error("API fetch failed, trying Gist fallback:", err);
        // Fallback to Gist if API fails
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
          .catch((fallbackErr) => {
            console.error("❌ Error loading coaches from fallback:", fallbackErr);
            selectElement.innerHTML = '<option value="">Error loading coaches</option>';
          });
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

  // ============================================
  // COACH MANAGEMENT
  // ============================================

  let coachToDelete = null;

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all tabs and contents
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Activate clicked tab
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');

      // Load coaches when switching to coaches tab
      if (tabId === 'coaches-tab') {
        loadCoachesTable();
      }
    });
  });

  // Load coaches table
  async function loadCoachesTable() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/admin/all`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch coaches');

      const coaches = await res.json();
      const tbody = document.getElementById('coaches-table-body');
      tbody.innerHTML = '';

      coaches.forEach(coach => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${coach.name}</td>
          <td>${sportNames[coach.sport] || coach.sport}</td>
          <td>${coach.school || '-'}</td>
          <td>${coach.username}</td>
          <td class="${coach.available === 'yes' ? 'status-yes' : 'status-no'}">
            ${coach.available === 'yes' ? 'Yes' : 'No'}
          </td>
          <td class="action-btns">
            <button class="edit-btn" data-id="${coach._id}">Edit</button>
            <button class="delete-btn" data-id="${coach._id}" data-name="${coach.name}">Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      // Attach edit listeners
      tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditCoachModal(btn.dataset.id));
      });

      // Attach delete listeners
      tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
      });

    } catch (err) {
      console.error('Error loading coaches:', err);
      alert('Failed to load coaches');
    }
  }

  // Add coach button
  document.getElementById('add-coach-btn').addEventListener('click', () => {
    openAddCoachModal();
  });

  // Import from Gist button
  document.getElementById('import-gist-btn').addEventListener('click', async () => {
    if (!confirm('This will import all coaches from the Gist. Existing coaches will be updated. Continue?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/admin/import-from-gist`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Import failed');

      alert(`Import complete!\nImported: ${data.imported}\nUpdated: ${data.updated}\nTotal: ${data.total}`);
      loadCoachesTable();
    } catch (err) {
      console.error('Import error:', err);
      alert('Import failed: ' + err.message);
    }
  });

  // Open add coach modal
  function openAddCoachModal() {
    document.getElementById('coach-modal-title').textContent = 'Add New Coach';
    document.getElementById('coach-form').reset();
    document.getElementById('coach-id').value = '';
    document.getElementById('coach-image').value = '';
    document.getElementById('coach-password').required = true;
    document.getElementById('coach-password').placeholder = 'Enter password';
    document.getElementById('password-hint').classList.add('hidden');
    // Clear image preview
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('upload-status').textContent = '';
    document.getElementById('upload-status').className = '';
    document.getElementById('coach-modal').classList.remove('hidden');
  }

  // Open edit coach modal
  async function openEditCoachModal(coachId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/admin/${coachId}`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch coach');

      const coach = await res.json();

      document.getElementById('coach-modal-title').textContent = 'Edit Coach';
      document.getElementById('coach-id').value = coach._id;
      document.getElementById('coach-name').value = coach.name || '';
      document.getElementById('coach-sport').value = coach.sport || '';
      document.getElementById('coach-username').value = coach.username || '';
      document.getElementById('coach-password').value = '';
      document.getElementById('coach-password').required = false;
      document.getElementById('coach-password').placeholder = 'Leave blank to keep current';
      document.getElementById('password-hint').classList.remove('hidden');
      document.getElementById('coach-position').value = coach.position || '';
      document.getElementById('coach-school').value = coach.school || '';
      document.getElementById('coach-achievement').value = coach.achievement || '';
      document.getElementById('coach-available').value = coach.available || 'yes';
      document.getElementById('coach-email').value = coach.email || '';
      document.getElementById('coach-instagram').value = coach.instagram || '';
      document.getElementById('coach-image').value = coach.image || '';
      document.getElementById('coach-bio').value = coach.bio?.text || '';

      // Show existing image preview if there is one
      const previewEl = document.getElementById('image-preview');
      const previewImg = document.getElementById('preview-img');
      const pathDisplay = document.getElementById('image-path-display');
      const statusEl = document.getElementById('upload-status');

      if (coach.image) {
        previewImg.src = coach.image;
        pathDisplay.textContent = coach.image;
        previewEl.classList.remove('hidden');
        statusEl.textContent = 'Current image (upload new to replace)';
        statusEl.className = '';
      } else {
        previewEl.classList.add('hidden');
        statusEl.textContent = '';
        statusEl.className = '';
      }

      document.getElementById('coach-modal').classList.remove('hidden');

    } catch (err) {
      console.error('Error fetching coach:', err);
      alert('Failed to load coach data');
    }
  }

  // Close coach modal
  document.getElementById('coach-modal-close').addEventListener('click', () => {
    document.getElementById('coach-modal').classList.add('hidden');
  });

  document.getElementById('coach-cancel-btn').addEventListener('click', () => {
    document.getElementById('coach-modal').classList.add('hidden');
  });

  // Handle image file upload
  document.getElementById('coach-image-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('upload-status');
    const previewEl = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const pathDisplay = document.getElementById('image-path-display');
    const hiddenInput = document.getElementById('coach-image');

    // Show uploading status
    statusEl.textContent = 'Uploading...';
    statusEl.className = 'uploading';
    previewEl.classList.add('hidden');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/api/coach/admin/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Success - show preview and set hidden input
      hiddenInput.value = data.imagePath;
      previewImg.src = data.imagePath;
      pathDisplay.textContent = data.imagePath;
      previewEl.classList.remove('hidden');
      statusEl.textContent = 'Uploaded successfully!';
      statusEl.className = 'success';

    } catch (err) {
      console.error('Upload error:', err);
      statusEl.textContent = 'Upload failed: ' + err.message;
      statusEl.className = 'error';
    }
  });

  // Submit coach form
  document.getElementById('coach-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const coachId = document.getElementById('coach-id').value;
    const isEditing = !!coachId;

    const coachData = {
      name: document.getElementById('coach-name').value.trim(),
      sport: document.getElementById('coach-sport').value,
      username: document.getElementById('coach-username').value.trim(),
      position: document.getElementById('coach-position').value.trim(),
      school: document.getElementById('coach-school').value.trim(),
      achievement: document.getElementById('coach-achievement').value.trim(),
      available: document.getElementById('coach-available').value,
      email: document.getElementById('coach-email').value.trim(),
      instagram: document.getElementById('coach-instagram').value.trim(),
      image: document.getElementById('coach-image').value.trim(),
      bio: { text: document.getElementById('coach-bio').value.trim(), performance: {} }
    };

    const password = document.getElementById('coach-password').value;
    if (password) {
      coachData.password = password;
    }

    try {
      let res;
      if (isEditing) {
        res = await fetch(`${API_BASE_URL}/api/coach/admin/${coachId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(coachData)
        });
      } else {
        if (!password) {
          alert('Password is required for new coaches');
          return;
        }
        res = await fetch(`${API_BASE_URL}/api/coach/admin/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(coachData)
        });
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Save failed');

      alert(isEditing ? 'Coach updated successfully!' : 'Coach created successfully!');
      document.getElementById('coach-modal').classList.add('hidden');
      loadCoachesTable();

    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save coach: ' + err.message);
    }
  });

  // Open delete modal
  function openDeleteModal(coachId, coachName) {
    coachToDelete = coachId;
    document.getElementById('delete-coach-name').textContent = coachName;
    document.getElementById('delete-coach-modal').classList.remove('hidden');
  }

  // Delete modal buttons
  document.getElementById('delete-cancel-btn').addEventListener('click', () => {
    document.getElementById('delete-coach-modal').classList.add('hidden');
    coachToDelete = null;
  });

  document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
    if (!coachToDelete) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/coach/admin/${coachToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Delete failed');

      alert('Coach deleted successfully!');
      document.getElementById('delete-coach-modal').classList.add('hidden');
      coachToDelete = null;
      loadCoachesTable();

    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete coach: ' + err.message);
    }
  });

});
