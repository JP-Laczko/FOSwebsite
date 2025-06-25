const sportNames = {
  baseball: "Baseball",
  girlsSoccer: "Girls Soccer",
  football: "Football",
  boysLax: "Boys Lacrosse"
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("schedule-form");
  
  // Using a coach select to prevent user error for sending emails to coaches
  const coachSelect = document.getElementById("coach");
  const coachParam = new URLSearchParams(window.location.search).get("coach");
  
  let sortedCoaches = [];

  fetch("https://gist.githubusercontent.com/JP-Laczko/6f6eb1038b031d4a217340edcb0d7d5c/raw/coaches.json")
    .then(res => res.json())
    .then(data => {
      // Sort alphabetically by name
      sortedCoaches = data.sort((a, b) => a.name.localeCompare(b.name));
  
      // Clear loading option
      coachSelect.innerHTML = '<option value="">Select a coach</option>';
  
      sortedCoaches.forEach(coach => {
        const option = document.createElement("option");
        option.value = coach.name;
        const prettySport = sportNames[coach.sport] || "No Sport";
        option.textContent = `${coach.name} (${prettySport})`;
        if (coachParam && coachParam === coach.name) {
          option.selected = true;
        }
        coachSelect.appendChild(option);
      });
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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
  
    const name = document.getElementById("user_name").value;
    const email = document.getElementById("user_email").value;
    const coach = document.getElementById("coach").value;
    // Search c where c.name = the selected coach, then get their email
    const matchedCoach = sortedCoaches.find(c => c.name === coach);
    let coach_email = matchedCoach ? matchedCoach.email : "not_provided@placeholder.com";
    coach_email = coach_email.replace(/^"(.*)"$/, '$1'); // Removes leading and trailing quotes 
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const message = document.getElementById("message").value.trim();
    const optionalMessage = message === "" ? "None" : message;

    // Format date and time
    const rawDate = new Date(`${date}T${time}`);
    const formattedDate = rawDate.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const formattedTime = rawDate.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
  
    // Send email
    emailjs.send("service_b2jlk03", "template_wfpkvcf", {
      user_name: name,
      user_email: email,
      coach: coach,
      coach_email: coach_email,
      formatted_date: formattedDate,
      formatted_time: formattedTime,
      optional_message: optionalMessage
    }).then(
      () => {
        alert("Your request was sent successfully!");
        form.reset();
      },
      (error) => {
        alert("Something went wrong. Please try again.");
        console.error("EmailJS Error:", error);
      }
    );
  });
  
});
