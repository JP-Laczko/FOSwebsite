document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("apply-form");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
        const name = document.getElementById("user_name").value;
        const email = document.getElementById("user_email").value;
        const sport = document.getElementById("user_sport").value;
        const school = document.getElementById("school").value;
        const year = document.getElementById("year").value;
        const experience = document.getElementById("experience").value;
        const message = document.getElementById("message").value;

        emailjs.send("service_b2jlk03", "template_r2jjjcx", {
            user_name: name,
            user_email: email,
            user_sport: sport,
            school: school,
            year: year,
            experience: experience,
            message: message,
        }).then(
        () => {
            alert("Thanks for applying! We'll do our best to contact you soon about details.");
            form.reset();
          },
          (error) => {
            alert("Something went wrong. Please try again.");
            console.error("EmailJS Error:", error);
          }
        );
    });
});
  