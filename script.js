// --- FILE: script.js ---

let coaches = [];

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const menuBtn = document.querySelector(".menu-btn");
  const container = document.getElementById("coach-container");
  const modal = document.getElementById("bio-modal");
  const modalContent = modal.querySelector(".modal-content");

  const dayDropdown = document.getElementById("day-select");
  const timeSlider = document.getElementById("time-slider");
  const timeDisplay = document.getElementById("time-display");

  // Format hour (24→12h with AM/PM)
  function formatTime(hour) {
    const h = parseInt(hour, 10);
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH} ${period}`;
  }

  // Update the time text below the slider
  function updateTimeDisplay(value) {
    const start = parseInt(value, 10);
    const end = (start + 1) % 24;
    timeDisplay.textContent = `${formatTime(start)} – ${formatTime(end)}`;
  }

  // Sidebar toggle
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Main filter + render
  function filterAndRender() {
    const selectedDay = dayDropdown.value;    // "" means All Days
    const selectedTime = parseInt(timeSlider.value, 10);

    // 1) Only coaches marked available
    let filtered = coaches.filter(c => c.available === "yes");

    // 2) If a specific day is chosen, apply schedule filter
    if (selectedDay) {
      filtered = filtered.filter(c => {
        const slot = c.schedule?.[selectedDay];
        return slot &&
               selectedTime >= slot.start &&
               (selectedTime + 1) <= slot.end;
      });
    }

    // 3) Render or show no-results
    if (filtered.length === 0) {
      container.innerHTML = `
        <p class="no-results">
          No coaches are available at this time. Please try a different time or day.
        </p>`;
    } else {
      renderCoaches(filtered);
    }
  }

  // Build the coach cards
  function renderCoaches(list) {
    container.innerHTML = "";
    list.forEach(coach => {
      const card = document.createElement("div");
      card.className = "coach-card";
      card.style.backgroundImage = `url('${coach.image}')`;

      card.innerHTML = `
        <div class="card-overlay">
          <div class="card-info">
            <h3>${coach.name}</h3>
            <p><strong>Position:</strong> ${coach.position}</p>
            <p><strong>School:</strong> ${coach.school}</p>
            <p><strong>Achievement:</strong> ${coach.achievement}</p>
          </div>
          <a class="schedule-btn" href="schedule.html?coach=${encodeURIComponent(coach.name)}">
            Schedule Lesson
          </a>
        </div>
      `;

      // Open bio modal when clicking anywhere except the button
      card.addEventListener("click", e => showBioModal(coach, e));

      // Prevent card click from blocking the link
      card.querySelector(".schedule-btn")
          .addEventListener("click", e => e.stopPropagation());

      container.appendChild(card);
    });
  }

  // Show coach bio + schedule in a modal
  function showBioModal(coach, e) {
    if (e.target.closest(".schedule-btn")) return;

    const rows = Object.entries(coach.schedule || {}).map(
      ([day, slot]) =>
        `<tr><td>${day}</td><td>${formatTime(slot.start)} - ${formatTime(slot.end)}</td></tr>`
    ).join("");

    modalContent.innerHTML = `
      <button class="close-btn">&times;</button>
      <h2>${coach.name}</h2>
      <p><strong>Pitching:</strong> ${coach.bio.performance.pitching || "N/A"}</p>
      <p><strong>Hitting:</strong> ${coach.bio.performance.hitting || "N/A"}</p>
      <p>${coach.bio.text || ""}</p>
      ${coach.instagram ? `<p><a href="${coach.instagram}" target="_blank">${coach.name}'s Instagram</a></p>` : ""}
      <hr/>
      <h3>Availability</h3>
      <table class="schedule-table">${rows}</table>
    `;

    // Show modal
    modal.style.display = "block";
    setTimeout(() => modal.classList.add("ready"), 10);

    // Close button
    modalContent.querySelector(".close-btn")
                .addEventListener("click", closeModal);
  }

  // Close modal logic
  function closeModal() {
    modal.classList.remove("ready");
    modal.style.display = "none";
  }

  // close the modal when clicking somewhere else (not another modal)
  document.addEventListener("click", e => {if (
    modal.classList.contains("ready") &&
    !modalContent.contains(e.target) &&
    !e.target.closest(".coach-card") &&
    !e.target.closest(".schedule-btn")
  ) {
    closeModal();
  }
});

  // Listen to filters
  dayDropdown.addEventListener("change", filterAndRender);
  timeSlider.addEventListener("input", () => {
    updateTimeDisplay(timeSlider.value);
    filterAndRender();
  });

  // Initial time label
  updateTimeDisplay(timeSlider.value);

  // Load data and kick off
  fetch("https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json")
    .then(r => r.json())
    .then(data => {
      coaches = data;
      filterAndRender();
    })
    .catch(err => console.error("Error fetching coaches:", err));
});
