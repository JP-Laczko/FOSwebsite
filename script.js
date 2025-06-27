let coaches = [];
let selectedSport = ""; // tracks currently selected sport

const sportServices = {
  baseball: [
    { title: "Swing Mechanics", image: "Images/Hitting.jpeg" },
    { title: "Pitching Mechanics", image: "Images/Pitching.jpeg" },
    { title: "Fielding Drills", image: "Images/Fielding.jpeg" },
  ],
  softball: [
    { title: "Swing Mechanics", image: "Images/SBHitting.jpeg" },
    { title: "Pitching Mechanics", image: "Images/SBPitching.jpeg" },
    { title: "Fielding Drills", image: "Images/SBFielding.jpeg" },
  ],
  football: [
    { title: "Throwing Mechanics", image: "Images/FBThrowing.jpeg" },
    { title: "Receiving Drills", image: "Images/FBCatching.jpeg" },
    { title: "Defensive Drills", image: "Images/FBDrills.jpeg" },
  ],
  girlsSoccer: [
    { title: "Footwork", image: "Images/GSFootwork.jpeg" },
    { title: "Shooting Drills", image: "Images/GSShooting.jpeg" },
    { title: "Defensive Positioning", image: "Images/GSDefensive.jpeg" },
  ],
  boysLax: [
    { title: "Stick Handling", image: "Images/BLStick.jpeg" },
    { title: "Shooting Drills", image: "Images/BLShooting.jpeg" },
    { title: "Defensive Strategies", image: "Images/BLDefensive.jpeg" },
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const menuBtn = document.querySelector(".menu-btn");
  const container = document.getElementById("coach-container");
  const modal = document.getElementById("bio-modal");
  const modalContent = modal.querySelector(".modal-content");
  const dayDropdown = document.getElementById("day-select");
  const sportSelectSidebar = document.getElementById("sport-select-sidebar");
  const sportSelectMain = document.getElementById("sport-select-main");
  
  // Populate time dropdowns
  const startSelect = document.getElementById('start-select');
  for (let h = 6; h <= 22; h++) {
    const fmt = formatTime(h);
    startSelect.options.add(new Option(fmt, h));
  }

  // Used to sync the 2 dropdowns
  function syncSportSelects(source, target) {
    target.value = source.value;
    selectedSport = source.value;
    filterAndRender();
    renderServices(selectedSport);
    showSportSections();
  }
  
  sportSelectMain.addEventListener("change", () => {
    syncSportSelects(sportSelectMain, sportSelectSidebar)
    filterAndRender();
  });
  
  sportSelectSidebar.addEventListener("change", () => {
    syncSportSelects(sportSelectSidebar, sportSelectMain)
    filterAndRender();
  });

  document.querySelector(".secondary-menu-btn").addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("open");

    if (sidebar.classList.contains("open")) {
      secondaryMenuBtn?.classList.add("hide-on-sidebar");
    } else {
      secondaryMenuBtn?.classList.remove("hide-on-sidebar");
    }
  });

    if (selectedSport) {
      filterAndRender();
      renderServices(selectedSport);
      showSportSections();
    } else {
      container.innerHTML = ""; // hide coach cards
      hideSportSections();
    }


  // Format hour (24→12h with AM/PM)
  function formatTime(hour) {
    const h = parseInt(hour, 10);
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH} ${period}`;
  }

  const secondaryMenuBtn = document.querySelector(".secondary-menu-btn");

  // Sidebar toggle
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");

    if (sidebar.classList.contains("open")) {
      secondaryMenuBtn?.classList.add("hide-on-sidebar");
    } else {
      secondaryMenuBtn?.classList.remove("hide-on-sidebar");
    }

  });

  // Main filter + render
  function filterAndRender() {
    const selectedDay = dayDropdown.value;
    const startT = parseInt(startSelect.value);
    const selectedSport = document.getElementById("sport-select-main").value;

    if (selectedSport === "") {
      container.innerHTML = "";
      hideSportSections();
    } else {
  
      let filtered = coaches.filter(c => {
        const isAvailable = c.available === "yes";
        const matchesSport = c.sport === selectedSport;

        // Filter by day availability
        const hasDay = selectedDay !== "" && c.schedule?.[selectedDay];
        if (selectedDay && !hasDay) return false;

        let matchesTime = true;
        if (selectedDay !== "" && startT) {
          const slot = c.schedule?.[selectedDay];
          matchesTime = slot && startT >= slot.start
        } 
    
        return isAvailable && matchesSport && matchesTime;
      });

      if (filtered.length === 0) {
        container.innerHTML = ""; 
        const p = document.createElement('p');
        p.className = 'no-results';
        p.innerHTML = `
          <strong>No coaches available at this time.</strong><br>
        `;
        container.appendChild(p);
      } else {
        renderCoaches(filtered);
      }
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
           <span class="click-hint">Click on my card!</span>
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

  // Render service section with the 3 images and text for the different sports
  function renderServices(sport) {
    const serviceList = sportServices[sport] || [];
    const container = document.getElementById("services-container");
    container.innerHTML = "";
  
    serviceList.forEach(service => {
      const div = document.createElement("div");
      div.className = "service-item";
      div.innerHTML = `
        <img src="${service.image}" alt="${service.title}" />
        <h3>${service.title}</h3>
      `;
      container.appendChild(div);
    });
  }

  // hide and show coach cards for different sports
  function hideSportSections() {
    document.getElementById("services-section")?.classList.add("hidden");
    document.getElementById("pricing-contact")?.classList.add("hidden");

    const coachSection = document.getElementById('coach-section');
    coachSection?.classList.remove('has-padding'); // remove padding when hidden
  }
  
  function showSportSections() {
    document.getElementById("services-section")?.classList.remove("hidden");
    document.getElementById("pricing-contact")?.classList.remove("hidden");

    const coachSection = document.getElementById('coach-section');
    coachSection?.classList.add('has-padding'); // add padding when shown
  }
  
  // Show coach bio + schedule in a modal
  function showBioModal(coach, e) {
    if (e.target.closest(".schedule-btn")) return;

    const rows = Object.entries(coach.schedule || {}).map(
      ([day, slot]) =>
        `<tr><td>${day}</td><td>${formatTime(slot.start)} - ${formatTime(slot.end)}</td></tr>`
    ).join("");

        let html = `
      <button class="close-btn">&times;</button>
      <h2>${coach.name}</h2>
    `;

    if (coach.bio?.performance?.hitting) {
      html += `<p><strong>Hitting:</strong> ${coach.bio.performance.hitting}</p>`;
    }
    if (coach.bio?.performance?.pitching) {
      html += `<p><strong>Pitching:</strong> ${coach.bio.performance.pitching}</p>`;
    }

    html += `
      <p>${coach.bio?.text || ""}</p>
      ${coach.instagram ? `<p><a href="${coach.instagram}" target="_blank">${coach.name}'s Instagram</a></p>` : ""}
      <hr/>
      <h3>Availability</h3>
      <table class="schedule-table">${rows}</table>
    `;

    modalContent.innerHTML = html;

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
  startSelect.addEventListener("change", filterAndRender);

  // Load data and kick off
  fetch("https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json")
    .then(r => r.json())
    .then(data => {
      coaches = data;
      filterAndRender();
    })
    .catch(err => console.error("Error fetching coaches:", err));

});
