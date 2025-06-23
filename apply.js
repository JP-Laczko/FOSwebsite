document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("apply-form");
  const confirmation = document.getElementById("confirmation-message");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
        const name = document.getElementById("user_name").value;
        const email = document.getElementById("user_email").value;
        const school = document.getElementById("school").value;
        const year = document.getElementById("year").value;
        const experience = document.getElementById("experience").value;
        const message = document.getElementById("message").value;

        emailjs.send("service_xo1n5fb", "template_hcljljr", {
            user_name: name,
            user_email: email,
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
  