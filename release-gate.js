
(function () {
  var releaseDate = new Date("2026-07-11T12:00:00-04:00");
  var signupKey = "typeflow.releaseNotify.v1";
  var signupLimit = 100;

  if (new Date() >= releaseDate) {
    return;
  }

  function getEmails() {
    try {
      return JSON.parse(localStorage.getItem(signupKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveEmail(email) {
    var emails = getEmails();
    var cleanEmail = email.trim().toLowerCase();

    if (emails.length >= signupLimit && !emails.includes(cleanEmail)) {
      return false;
    }

    if (!emails.includes(cleanEmail)) {
      emails.push(cleanEmail);
      localStorage.setItem(signupKey, JSON.stringify(emails));
    }

    return true;
  }

  function showReleaseScreen() {
    document.body.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(180deg,#f8fcff,#eef7ff);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#143047;">
        <section style="width:min(100%,720px);background:white;border:1px solid #dceefa;border-radius:30px;padding:clamp(24px,5vw,48px);box-shadow:0 24px 70px rgba(28,94,153,.18);">
          <div style="display:inline-block;margin-bottom:16px;padding:8px 14px;border-radius:999px;background:#d9ecff;color:#155b9e;font-weight:800;">
            TypeFlow launch
          </div>

          <h1 style="margin:0 0 14px;font-size:clamp(42px,9vw,84px);line-height:.98;">
            Opening soon.
          </h1>

          <p style="margin:0;color:#5d758c;font-size:18px;line-height:1.6;">
            TypeFlow is getting polished up for a calm, focused typing experience.
          </p>

          <div style="margin:22px 0;padding:16px;border-radius:18px;background:#f7fbff;border:1px solid #dceefa;color:#155b9e;font-weight:900;">
            Site will release on July 11, 2026 at 12 PM EST.
          </div>

          <iframe name="buttondownFrame" style="display:none;"></iframe>

          <form id="releaseNotifyForm" action="https://buttondown.email/api/emails/embed-subscribe/air" method="post" target="buttondownFrame" style="display:grid;grid-template-columns:1fr auto;gap:12px;">
            <input id="releaseEmail" name="email" type="email" autocomplete="email" placeholder="Enter your email" required style="min-height:50px;border:2px solid #d6e8f8;border-radius:999px;padding:12px 16px;font:inherit;">
            <button type="submit" style="min-height:50px;border:0;border-radius:999px;padding:12px 20px;background:#2478c7;color:white;font:inherit;font-weight:800;cursor:pointer;">
              Notify me
            </button>
          </form>

          <p id="releaseMessage" style="min-height:24px;margin-top:14px;color:#155b9e;font-weight:800;"></p>
        </section>
      </main>
    `;

    document.getElementById("releaseNotifyForm").addEventListener("submit", function (event) {
      var input = document.getElementById("releaseEmail");
      var message = document.getElementById("releaseMessage");

      if (!input.checkValidity()) {
        event.preventDefault();
        message.textContent = "Please enter a valid email.";
        return;
      }

      if (!saveEmail(input.value)) {
        event.preventDefault();
        message.textContent = "All the email spots are taken. However, you can reach this site on July 11, 2026 at 12 PM EST.";
        return;
      }

      message.textContent = "You're on the list for the TypeFlow launch.";
      setTimeout(function () {
        input.value = "";
      }, 300);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showReleaseScreen);
  } else {
    showReleaseScreen();
  }
})();
