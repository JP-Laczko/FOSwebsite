document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("schedule-form");
  const confirmation = document.getElementById("confirmation-message");

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
    emailjs.send("service_xo1n5fb", "template_qhdcutp", {
      user_name: name,
      user_email: email,
      coach: coach,
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
