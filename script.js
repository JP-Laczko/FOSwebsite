document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.menu-btn');
    const container = document.getElementById("coach-container");
    const checkboxGroup = document.getElementById("day-checkboxes");
    const modal = document.getElementById('bio-modal');
    const modalContent = modal.querySelector('.modal-content');
  
    // Toggle sidebar menu
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  
    // Render coaches function
    function renderCoaches(selectedDays = []) {
      try {
        if (!coaches || !Array.isArray(coaches)) {
          console.error("Coaches array not found or invalid");
          return;
        }
        container.innerHTML = "";
  
        // If no filter days selected, show all coaches
        const filtered = selectedDays.length === 0
          ? coaches
          : coaches.filter(coach =>
              selectedDays.some(day => (coach.schedule || []).includes(day))
            );
  
        filtered.forEach(coach => {
          const card = document.createElement("div");
          card.className = "coach-card";
  
          // Set background image and style
          card.style.backgroundImage = `url('${coach.image}')`;
          card.style.backgroundSize = 'cover';
          card.style.backgroundPosition = 'center';
          card.style.color = 'white';
  
          // Insert overlay HTML with coach info
          card.innerHTML = `
            <div class="card-overlay">
              <h3>${coach.name}</h3>
              <p><strong>Position:</strong> ${coach.position}</p>
              <p><strong>School:</strong> ${coach.school}</p>
              <p><strong>Achievement:</strong> ${coach.achievement}</p>
              <a class="schedule-btn" href="schedule.html?coach=${encodeURIComponent(coach.name)}">Schedule Lesson</a>
            </div>
          `;

          // Click to open bio modal
          card.addEventListener('click', (e) => showBioModal(coach, e));
  
          container.appendChild(card);
        });
      } catch (err) {
        console.error("Error rendering coaches:", err);
      }
    }
  
    // Show bio modal, conditionally show text if data exists
    function showBioModal(coach, e) {
      if (e.target.closest(".schedule-btn")) return;

      const pitching = coach.bio?.performance?.pitching
        ? `<p><strong>Pitching:</strong> ${coach.bio.performance.pitching}</p>`
        : '';
      const hitting = coach.bio?.performance?.hitting
        ? `<p><strong>Hitting:</strong> ${coach.bio.performance.hitting}</p>`
        : '';
      const summary = coach.bio?.text || '';
      const instagramLink = coach.instagram
      ? `<p><strong>Instagram:</strong> <a href="${coach.instagram}" target="_blank" rel="noopener noreferrer">${coach.name}'s Instagram</a></p>`
      : '';
      console.log(coach.instagram);
      modalContent.innerHTML = `
        <button class="close-btn" aria-label="Close modal">&times;</button>
        <h2>${coach.name}</h2>
        ${pitching}
        ${hitting}
        ${instagramLink}
        <p>${summary}</p>
      `;
  
      modal.style.display = 'block';

      // timer to allow the modal to popup without closing so I can add functionality to make it close when clicked anywhere outside of modal
      setTimeout(() => {
        // Wait 10 ms then add this to check in the action event listener to close the modal
        modal.classList.add("ready");
      }, 10);
  
      // Add event listener for close button (new content, so add here)
      modalContent.querySelector('.close-btn').addEventListener('click', closeModal);
    }
  
    // Close modal function
    function closeModal() {
      modal.classList.remove("ready");
      modal.style.display = 'none';
    }
    
    // close the modal if clicking anywhere outside of it
    document.addEventListener('click', (e) => {
      if (modal.classList.contains("ready") && !modal.querySelector('.modal-content').contains(e.target)) {
        closeModal();
      } 
    });

    // Checkbox filtering
    checkboxGroup.addEventListener("change", () => {
      const selectedDays = Array.from(
        checkboxGroup.querySelectorAll("input[type='checkbox']:checked")
      ).map(cb => cb.value);
      renderCoaches(selectedDays);
    });
  
    // Select All button
    document.getElementById('select-all').addEventListener('click', () => {
      document.querySelectorAll('#day-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
      renderCoaches(); // no filter, show all
    });
  
    // Clear All button
    document.getElementById('clear-all').addEventListener('click', () => {
      document.querySelectorAll('#day-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
      renderCoaches(); // no filter, show all
    });
  
    // Initial render of all coaches on page load
    renderCoaches();
  });
  