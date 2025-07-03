const sportNames = {
  baseball: "Baseball",
  girlsSoccer: "Girls Soccer",
  football: "Football",
  boysLax: "Boys Lacrosse",
  softball: "Softball",
  boysBasketball: "Boys Basketball",
};

const API_BASE_URL =
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://127.0.0.1:4000"
    : "https://fossportsacademy.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("schedule-form");
  
  // Using a coach select to prevent user error for sending emails to coaches
  const coachSelect = document.getElementById("coach");
  const coachParam = new URLSearchParams(window.location.search).get("coach");
  const checkBtn = document.getElementById("check-schedule-btn");
  

  coachSelect.addEventListener("change", () => {
    checkBtn.disabled = !coachSelect.value;
    checkBtn.textContent = coachSelect.value
      ? `Check ${coachSelect.value}'s Schedule`
      : "Please Select A Coach";
  });

  // Helper to format time
  function formatTime(hour) {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  checkBtn.addEventListener("click", () => {
    const selectedCoach = coachSelect.value;

    // Get the coaches sport
    const matchedCoach = sortedCoaches.find(c => c.name === selectedCoach);
    const selectedSport = matchedCoach ? matchedCoach.sport : "";

    if (!selectedCoach) return; // Must have coach selected

    // Save to sessionStorage so index.html knows what to open
    sessionStorage.setItem("openCoachModal", selectedCoach);
    sessionStorage.setItem("openSport", selectedSport);
    console.log("HIe");
    window.location.href = "index.html";
  });
  
  let sortedCoaches = [];

  fetch("https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json")
    .then(res => res.json())
    .then(data => {
      // Sort alphabetically by name
      sortedCoaches = data.sort((a, b) => a.name.localeCompare(b.name));
  
      // Clear loading option
      coachSelect.innerHTML = '<option value="">Select a coach</option>';
  
      sortedCoaches.forEach(coach => {
        if(coach.available === "yes") {
          const option = document.createElement("option");
          option.value = coach.name;
          const prettySport = sportNames[coach.sport] || "No Sport";
          option.textContent = `${coach.name} (${prettySport})`;
          if (coachParam && coachParam === coach.name) {
            option.selected = true;
          }
          coachSelect.appendChild(option);
        }
      });

      // Update button context
      if (coachSelect.value) {
        checkBtn.textContent = `Check ${coachSelect.value}'s Schedule`;
        checkBtn.disabled = false;
      } else {
        checkBtn.textContent = "Please Select A Coach";
        checkBtn.disabled = true;
      }

    })
    .catch(err => {
      console.error("Failed to load coaches:", err);
      coachSelect.innerHTML = '<option value="">Error loading coaches</option>';
    });  

  // Pre-fill coach name from the URL if available (it should be)
  const coachName = new URLSearchParams(window.location.search).get("coach");
  if (coachName) {
    document.getElementById("coach").value = coachName;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const name = document.getElementById("user_name").value;
    const email = document.getElementById("user_email").value;
    const user_phone = document.getElementById("user_phone").value;
    const coach = document.getElementById("coach").value;
    const matchedCoach = sortedCoaches.find(c => c.name === coach);
    let coach_email = matchedCoach ? matchedCoach.email : "not_provided@placeholder.com";
    coach_email = coach_email.replace(/^"(.*)"$/, '$1');
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const message = document.getElementById("message").value.trim();
  
    // Format date and time as ISO string or your backend expects
    const rawDate = new Date(`${date}T${time}`);

    // Make sure date is valid
    const now = new Date();

    if (rawDate < now) {
      alert("You cannot book a lesson in the past. Please select a valid date and time.");
      return; // stop form submission
    }

    const minAdvanceMs = 24 * 60 * 60 * 1000; // 24 hours in advance booking
    if (rawDate - now < minAdvanceMs) {
      alert("Please book at least 24 hours in advance.");
      return;
    }

    // Make sure coach is available on that day
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[rawDate.getDay()];

    const availability = matchedCoach.schedule?.[dayName];
    if (!availability) {
      alert(`Coach is not available on ${dayName}s. Please select another day.`);
      return;
    }
  
    try {
      // 1. Check availability API call
      const res = await fetch(`${API_BASE_URL}/api/bookings/check`, {        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          coach,
          datetime: rawDate.toISOString()
        })
      });
  
      if (!res.ok) {
        // Server error or something unexpected
        const text = await res.text();
        throw new Error(`Server responded with status ${res.status}: ${text}`);
      }
  
      const { available } = await res.json();
  
      if (!available) {
        alert("Sorry, this time slot is already booked. Please choose a different time.");
        return;
      }

      
      const bookingHour = rawDate.getHours();

      const startFormatted = formatTime(availability.start);
      const endFormatted = formatTime(availability.end);
      // Helper for user to see available hours on chosen day if they chose an invalid time
      if (bookingHour < availability.start || bookingHour >= availability.end) {
        alert(`Coach is available from ${startFormatted} to ${endFormatted} on ${dayName}s. Please select a time in that range.`);
        return;
      }
  
      // 2. If available, proceed to send email
      const formattedDate = rawDate.toLocaleDateString(undefined, {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
      const formattedTime = rawDate.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      });
  
      await emailjs.send("service_b2jlk03", "template_wfpkvcf", {
        user_name: name,
        user_email: email,
        user_phone: user_phone,
        coach: coach,
        coach_email: coach_email,
        formatted_date: formattedDate,
        formatted_time: formattedTime,
        message: message
      });
  
      // 3. After email success, save booking in DB 
      await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          coach,
          athleteName: name,
          date: rawDate.toISOString(),
          startTime: time,
          notes: message
        })
      });
  
      alert("Your request was sent successfully!");
      form.reset();
  
    } catch (error) {
      alert("Something went wrong. Please try again.");
      console.error(error);
    }
  });  
  
});
