let coaches = [];
let selectedSport = ""; // tracks currently selected sport
const API_BASE_URL =
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://127.0.0.1:4000"
    : "https://fossportsacademy.com";

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
  ],
  boysBasketball: [
    { title: "Shooting Technique", image: "Images/BBBShootingMachanics.jpeg" },
    { title: "Ball Handling", image: "Images/BBBBallHandling.jpeg" },
    { title: "Defensive Fundamentals", image: "Images/BBBDefensiveDrills.jpeg" },
  ],
  fieldHockey: [
    { title: "Stick Handling", image: "Images/FHStick.jpeg" },
    { title: "Shooting Mechanics", image: "Images/FHShooting.jpeg" },
    { title: "Defensive Strategies", image: "Images/FHDefense.jpeg" },
  ]
};

const performanceLabels = [
  "Career Pitching Stats",
  "Career Hitting Stats",
  "HS Career Batting Stats",
  "College Career Stats",
  "HS Career Stats",
  "College Career Pitching Stats",
  "HS Career Pitching Stats",
  "HS Hitting Stats",
];

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("coach-container");
  const modal = document.getElementById("bio-modal");
  const modalContent = modal.querySelector(".modal-content");
  const sportSelectMain = document.getElementById("sport-select-main");
  const coachInstruction = document.createElement('p');
  coachInstruction.className = 'coach-instruction';
  coachInstruction.textContent = 'Click on player cards to view their schedule';
  

  sportSelectMain.addEventListener("change", () => {
    selectedSport = sportSelectMain.value;
    if (selectedSport) {
      renderCoaches(coaches.filter(c => c.sport === selectedSport));
      renderServices(selectedSport);
      showSportSections();
    } else {
      hideSportSections();
    }
  });


  // Format hour (24→12h with AM/PM)
  function formatTime(hour) {
    const h = parseInt(hour, 10);
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH} ${period}`;
  }

  // Format time for calendar
  function formatTimeAmPm(hour, minute) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  }



  // Helper function to check if a coach has any availability during the week
  function hasAvailability(coach) {
    if (!coach.schedule) return false;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.some(day => {
      const daySchedule = coach.schedule[day];
      return daySchedule && daySchedule.start !== -1 && daySchedule.end !== -1 && 
             daySchedule.start !== null && daySchedule.end !== null &&
             daySchedule.start !== undefined && daySchedule.end !== undefined;
    });
  }

  // Build the coach cards
  function renderCoaches(list) {
    container.innerHTML = "";

    // Check if any coaches have availability - if none do, show popup
    if (list.length > 0 && !hasAnyAvailableCoaches(list)) {
      showNoCoachesPopup(selectedSport);
    }

    list.forEach(coach => {
      const card = document.createElement("div");
      card.className = "coach-card";
      
      // Add shimmer class if coach has availability
      if (hasAvailability(coach)) {
        card.classList.add("has-availability");
      }
      
      card.style.backgroundImage = `url('${coach.image}')`;

      card.innerHTML = `
        <div class="card-overlay">
          <div class="card-title">
            <h3>${coach.name}</h3>
          </div>
          <div class="card-info">
            <p><strong>Position:</strong> ${coach.position}</p>
            <p><strong>School:</strong> ${coach.school}</p>
            <p><strong>Achievement:</strong> ${coach.achievement}</p>
            <span class="click-hint">Click on my card!</span>
          </div>
        </div>
      `;

      // Open bio modal when clicking anywhere except the button
      card.addEventListener("click", e => {
        showBioModal(coach, e);
      });

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

  // Show no coaches available popup
  function showNoCoachesPopup(sport) {
    const sportNames = {
      baseball: "Baseball",
      girlsSoccer: "Girls Soccer", 
      football: "Football",
      boysLax: "Boys Lacrosse",
      softball: "Softball",
      boysBasketball: "Boys Basketball",
      fieldHockey: "Field Hockey"
    };

    const popup = document.createElement('div');
    popup.className = 'no-coaches-modal';
    popup.innerHTML = `
      <div class="no-coaches-content">
        <button class="close-btn">&times;</button>
        <h3>No Coaches Available</h3>
        <p>There are currently no coaches with availability for <strong>${sportNames[sport] || sport}</strong>.</p>
        <p>Please check back later or contact us for more information.</p>
      </div>
    `;

    // Close popup when clicking X or outside
    popup.addEventListener('click', (e) => {
      if (e.target === popup || e.target.classList.contains('close-btn')) {
        document.body.removeChild(popup);
      }
    });

    document.body.appendChild(popup);
  }

  // Check if any coaches in a list have availability
  function hasAnyAvailableCoaches(coachList) {
    return coachList.some(coach => hasAvailability(coach));
  }

  // hide and show coach cards for different sports
  function hideSportSections() {
    document.getElementById("services-section")?.classList.add("hidden");
    document.getElementById("pricing-contact")?.classList.add("hidden");
    document.getElementById("coach-section")?.classList.add("hidden");

    const coachSection = document.getElementById('coach-section');
    coachSection?.classList.remove('has-padding'); 

    // Clear the coach container
    container.innerHTML = "";

    const instruction = document.querySelector('.coach-instruction');
    if (instruction) instruction.remove();
    
    const filterControls = document.querySelector('.filter-controls-inline');
    if (filterControls) filterControls.remove();
  }
  
  function showSportSections() {
    document.getElementById("services-section")?.classList.remove("hidden");
    document.getElementById("pricing-contact")?.classList.remove("hidden");
    document.getElementById("coach-section")?.classList.remove("hidden");

    const coachSection = document.getElementById('coach-section');
    coachSection?.classList.add('has-padding'); 
    
    if (!document.querySelector('.coach-instruction')) {
      const coachWrapper = coachSection.querySelector('.coach-wrapper');
      coachSection.insertBefore(coachInstruction, coachWrapper);
    }
  }
  
  // Helper: format date display (Mon 7/1)
  function formatDateShort(date) {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
  }
  
  // Show coach bio + schedule in a modal
  async function showBioModal(coach, e) {

    const now = new Date();
    const startHour = 9;  
    const endHour = 20;   
    const daysToShow = 6;
  
    // Generate array of days from today
    let days = [];
    for (let d = 1; d <= daysToShow; d++) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      days.push(dayDate);
    }

    // Fetch bookings 
    const startISO = days[0].toISOString();
    const endISO = days[days.length - 1].toISOString();

    const bookings = await fetch(`${API_BASE_URL}/api/bookings/${encodeURIComponent(coach.name)}?start=${startISO}&end=${endISO}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .catch(err => {
      console.error("Failed to load bookings", err);
      return [];
    });

      const bookedSet = new Set();
      bookings.forEach(booking => {
        const dateStr = new Date(booking.date).toISOString().slice(0, 10);
        const [hourStr, minuteStr] = booking.startTime.split(":");
        let hour = parseInt(hourStr, 10);
        let minute = parseInt(minuteStr, 10);
      
        // Push 3 slots - change i for 1 hour bookings
        for (let i = 0; i < 3; i++) {
          const key = `${dateStr} ${hour + (minute === 30 ? 0.5 : 0)}`;
          bookedSet.add(key);
      
          // Increment time by 30 min
          minute += 30;
          if (minute >= 60) {
            hour += 1;
            minute = 0;
          }
        }
      });
  
    // Build time slots array (e.g. 8:00, 8:30, 9:00 ... 21:30)
    let times = [];
    for (let h = startHour; h <= endHour; h++) {
      times.push({ hour: h, minute: 0 });
      times.push({ hour: h, minute: 30 });
    } 
    // Add for 9:00 PM
    times.push({hour: 21, minute: 0});
  
    // Helper: get weekday string to match schedule keys (Monday, Tuesday...)
    function getWeekdayName(date) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    }
  
    // Build table headers for days
    let tableHtml = `<table class="schedule-table"><thead><tr><th>Time</th>`;
    days.forEach(day => {
      tableHtml += `<th>${formatDateShort(day)}</th>`;
    });
    tableHtml += "</tr></thead><tbody>";
  
    // Build table rows for each time slot
    times.forEach(({hour, minute}) => {
      const slotLabel = formatTimeAmPm(hour, minute);
      tableHtml += `<tr><td>${slotLabel}</td>`;
  
      days.forEach(day => {
        const dayName = getWeekdayName(day);
        const schedule = coach.schedule?.[dayName];
  
        // Check if the slot falls within availability window
        // schedule.start and schedule.end are integers in 24h time (e.g. 16 = 4 PM)
        let slotTime = hour + (minute === 30 ? 0.5 : 0);
  
        let isAvailable = false;
        let noAvailabilitySet = false;
        
        // Handle the three availability states:
        if (!schedule || (schedule.start === null && schedule.end === null)) {
          // Case 1: No schedule object OR schedule exists but with null values (missing from DB)
          // → Show as unavailable (red ×)
          isAvailable = false;
          noAvailabilitySet = false;
        } else if (schedule.start === -1 && schedule.end === -1) {
          // Case 2: Schedule exists but coach hasn't set availability (-1 values)
          // → Show as "Not Set" (orange)
          isAvailable = false;
          noAvailabilitySet = true;
        } else {
          // Case 3: Schedule exists with valid times
          // → Check if slot falls within availability window [start, end)
          isAvailable = slotTime >= schedule.start && slotTime <= schedule.end;
          noAvailabilitySet = false;
        }
  
        const slotDateIso = day.toISOString().slice(0,10); // yyyy-mm-dd
        const key = `${slotDateIso} ${slotTime}`;        
  
        if (isAvailable && !bookedSet.has(key)) {
          tableHtml += `<td class="available" data-date="${slotDateIso}" data-hour="${hour}" data-minute="${minute}">✔</td>`;
        } else if (bookedSet.has(key)) {
          tableHtml += `<td class="booked">Booked</td>`;
        } else if (noAvailabilitySet) {
          tableHtml += `<td class="noavailabilityset">Not Set</td>`;
        } else {
          tableHtml += `<td class="unavailable">×</td>`;
        }
      });
  
      tableHtml += "</tr>";
    });
  
    tableHtml += "</tbody></table>";
    // Wrap in scrollable div for mobile
    const scrollWrapper = `<div class="calendar-scroll">${tableHtml}</div>`;
  
    // Build the rest of the modal content - Calendar first, then player info
    let html = `
      <button class="close-btn">&times;</button>
      <h2>${coach.name}</h2>
      <h3>Availability</h3>
      ${window.innerWidth <= 768 ? '<p class="mobile-hint" style="font-size: 0.9rem; color: #666; text-align: center; margin: 0 0 1rem 0;">📱 Scroll left/right to view all days</p>' : ''}
      <div class="schedule-container">
          ${scrollWrapper}
        </div>
      <hr/>
    `;
  
    if (coach.bio?.performance) {
      const performance = coach.bio.performance;
      performanceLabels.forEach(label => {
        if (performance[label]) {
          html += `<p><strong>${label}:</strong> ${performance[label]}</p>`;
        }
      });
    }
  
    html += `
      <p>${coach.bio?.text || ""}</p>
      ${coach.instagram ? `<p><a href="${coach.instagram}" target="_blank">${coach.name}'s Instagram</a></p>` : ""}
    `;
  
    modalContent.innerHTML = html;
  
    // Show modal
    modal.style.display = "block";
    setTimeout(() => modal.classList.add("ready"), 10);
  
    // Close button
    modalContent.querySelector(".close-btn")
                .addEventListener("click", closeModal);
  
    // Add click listener to all available slots
    modalContent.querySelectorAll("td.available").forEach(cell => {
      cell.addEventListener("click", () => {
        console.log("cliked");
        const selectedDate = cell.getAttribute("data-date");
        const selectedHour = cell.getAttribute("data-hour");
        const selectedMinute = cell.getAttribute("data-minute");
  
        // Save info to sessionStorage to prefill the schedule form on schedule.html
        sessionStorage.setItem("selectedCoach", coach.name);
        sessionStorage.setItem("selectedDate", selectedDate);
        sessionStorage.setItem("selectedHour", selectedHour);
        sessionStorage.setItem("selectedMinute", selectedMinute);
  
        // Navigate to scheduling page
        window.location.href = `schedule.html?coach=${encodeURIComponent(coach.name)}`;
      });
    });
  }

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


  const autoCoach = sessionStorage.getItem("openCoachModal");
  const autoSport = sessionStorage.getItem("openSport");

  if (autoCoach && autoSport) {
    sessionStorage.removeItem("openCoachModal");
    sessionStorage.removeItem("openSport");

    document.getElementById("sport-select-main").value = autoSport;
    selectedSport = autoSport;
    showSportSections();
    renderCoaches(coaches.filter(c => c.sport === autoSport));

    // Delay to ensure coaches render before finding match
    setTimeout(() => {
      const match = coaches.find(c => c.name === autoCoach);
      if (match) showBioModal(match, { target: {} });
    }, 200);
  }

  // Load data 
  fetch("https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json")  .then(async res => {
    if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);
    const data = await res.json();
    coaches = data;

    try {
      const scheduleRes = await fetch(`${API_BASE_URL}/api/coach/schedules`);
      if (!scheduleRes.ok) throw new Error(`Schedule fetch failed: ${scheduleRes.status}`);
      const scheduleData = await scheduleRes.json();

      // Merge backend schedules into Gist coach data
      coaches.forEach(c => {
        const match = scheduleData.find(s => s.name === c.name);
        if (match) {
          c.schedule = match.schedule;
        }
      });
    } catch (err) {
      console.error("Failed to load schedules from backend:", err);
    }

    // Initial load complete
  })
    .catch(err => console.error("Error fetching coaches:", err));

});
