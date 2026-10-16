
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  let tickets = [
    { id: 101, title: "Water leakage suspected", location: "Engineering Block", priority: "High", status: "Open" },
    { id: 102, title: "Energy usage anomaly", location: "Library", priority: "Medium", status: "Open" }
  ];
  let ticketCounter = 103;
  let activeSection = "overview";
  let cameraStream = null;
  let chart = null;

  function toast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    $("#toastContainer").appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function updateClock() {
    $("#clock").textContent = new Date().toLocaleString([], {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }
  updateClock();
  setInterval(updateClock, 30000);

  function navigate(id) {
    const section = document.getElementById(id);
    if (!section || !section.classList.contains("page-section")) return;

    activeSection = id;
    $$(".page-section").forEach(s => s.hidden = s.id !== id);
    $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.target === id));
    $("#pageName").textContent = id.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
    $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (id === "resources") updateSimulation();
    if (id === "maintenance") renderTickets();
    if (id === "overview") setTimeout(renderChart, 50);
  }

  $$("[data-target]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.target));
  });

  $("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

  document.addEventListener("click", event => {
    if (window.innerWidth <= 760 &&
        !$("#sidebar").contains(event.target) &&
        !$("#menuBtn").contains(event.target)) {
      $("#sidebar").classList.remove("open");
    }
  });

  // Accessible modal helpers
  const backdrop = $("#modalBackdrop");
  let modalAction = null;

  function openModal({ title, description, body = "", confirm = "Continue ↗", action = null }) {
    $("#modalTitle").textContent = title;
    $("#modalDescription").textContent = description;
    $("#modalBody").innerHTML = body;
    $("#confirmModal").textContent = confirm;
    modalAction = action;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    $("#closeModal").focus();
  }

  function closeModal() {
    backdrop.hidden = true;
    document.body.style.overflow = "";
    modalAction = null;
  }

  $("#closeModal").addEventListener("click", closeModal);
  $("#cancelModal").addEventListener("click", closeModal);
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !backdrop.hidden) closeModal();
  });

  $("#confirmModal").addEventListener("click", () => {
    const action = modalAction;
    if (action) {
      const result = action();
      if (result === false) return;
    }
    closeModal();
  });

  $("#quickAction").addEventListener("click", () => {
    openModal({
      title: "Quick action center",
      description: "What would you like to do?",
      body: `<div class="quick-actions">
        <button class="secondary-button full-width" id="qaTicket">＋ Create maintenance ticket</button>
        <button class="secondary-button full-width" id="qaSim">⌁ Open savings simulator</button>
        <button class="secondary-button full-width" id="qaMonitor">◉ Open monitoring</button>
      </div>`,
      confirm: "Close",
      action: () => true
    });
    $("#qaTicket").onclick = () => { closeModal(); newTicket(); };
    $("#qaSim").onclick = () => { closeModal(); navigate("resources"); };
    $("#qaMonitor").onclick = () => { closeModal(); navigate("monitoring"); };
  });

  $$("[data-open='missionModal']").forEach(button => {
    button.addEventListener("click", () => openModal({
      title: "Your campus impact mission",
      description: "A practical route from detection to verified improvement.",
      body: `<div class="scenario-result">
        <p>01 · Detect an issue with a real camera or sensor.</p>
        <p>02 · Assign a maintenance ticket to the responsible team.</p>
        <p>03 · Record the repair and verify the readings afterward.</p>
        <p>04 · Compare resource use before and after the intervention.</p>
      </div>`,
      confirm: "Open maintenance",
      action: () => navigate("maintenance")
    }));
  });

  $("#settingsBtn").addEventListener("click", () => openModal({
    title: "Dashboard settings",
    description: "Prototype configuration",
    body: `<p class="muted">The dashboard currently uses illustrative values. Replace demo data with your authenticated backend and actual sensors before using it for real operations.</p>`,
    confirm: "Got it"
  }));

  $("#notificationsBtn").addEventListener("click", () => openModal({
    title: "Notifications",
    description: "Items that may need attention",
    body: `<div class="scenario-result"><p>⚠ Water leakage suspected — Engineering Block</p><p>⚡ Energy usage anomaly — Library</p><p class="muted">These are example alerts, not live sensor detections.</p></div>`,
    confirm: "Review tickets",
    action: () => navigate("maintenance")
  }));

  // Chart.js visualisation
  function renderChart() {
    const canvas = $("#resourceChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (chart) chart.destroy();

    const count = Number($("#chartPeriod").value);
    const labels = Array.from({ length: count }, (_, i) => `Day ${i + 1}`);
    const energy = labels.map((_, i) => Math.round(150 + 32 * Math.sin(i * .9) + Math.random() * 28));
    const water = labels.map((_, i) => Math.round(70 + 13 * Math.cos(i * .7) + Math.random() * 12));

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Energy (kWh)", data: energy, borderColor: "#a184ff",
            backgroundColor: "rgba(161,132,255,.12)", fill: true, tension: .42,
            pointRadius: 2, borderWidth: 2 },
          { label: "Water (hundreds of L)", data: water, borderColor: "#46d9e8",
            backgroundColor: "rgba(70,217,232,.05)", fill: true, tension: .42,
            pointRadius: 2, borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: "#20243a", padding: 12, cornerRadius: 9 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#858ba9", maxTicksLimit: 7 } },
          y: { beginAtZero: true, grid: { color: "rgba(150,160,200,.09)" },
            ticks: { color: "#858ba9" } }
        }
      }
    });
  }

  $("#chartPeriod").addEventListener("change", renderChart);
  renderChart();

  // Maintenance: alert -> ticket -> status -> resolution
  function updateTicketStats() {
    const open = tickets.filter(t => t.status === "Open").length;
    const progress = tickets.filter(t => t.status === "In progress").length;
    const resolved = tickets.filter(t => t.status === "Resolved").length;
    $("#openTickets").textContent = open;
    $("#progressTickets").textContent = progress;
    $("#resolvedTickets").textContent = resolved;
    $("#ticketBadge").textContent = open + progress;
    $("#issueValue").textContent = String(open + progress).padStart(2, "0");
  }

  function renderTickets() {
    const list = $("#ticketList");
    list.replaceChildren();

    if (!tickets.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No tickets yet. Create a ticket from an alert or using New ticket.";
      list.appendChild(empty);
    }

    tickets.forEach(ticket => {
      const card = document.createElement("div");
      card.className = "ticket-card";

      const icon = document.createElement("span");
      icon.className = "alert-symbol " + (ticket.priority === "High" ? "red" : "yellow");
      icon.textContent = ticket.priority === "High" ? "!" : "⚡";

      const info = document.createElement("div");
      const id = document.createElement("span");
      id.className = "ticket-id";
      id.textContent = `TASK-${ticket.id}`;
      const title = document.createElement("strong");
      title.textContent = ticket.title;
      const detail = document.createElement("p");
      detail.textContent = `${ticket.location} · ${ticket.priority} priority`;
      info.append(id, document.createElement("br"), title, detail);

      const select = document.createElement("select");
      select.setAttribute("aria-label", `Status for ${ticket.title}`);
      ["Open", "In progress", "Resolved"].forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = ticket.status === status;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        ticket.status = select.value;
        renderTickets();
        toast(`TASK-${ticket.id} status updated to ${ticket.status}.`);
        if (ticket.status === "Resolved") {
          toast("Demo resolution recorded. Verify actual sensor readings in a real deployment.");
        }
      });

      card.append(icon, info, select);
      list.appendChild(card);
    });
    updateTicketStats();
  }

  function newTicket(prefill = "") {
    openModal({
      title: "Create maintenance ticket",
      description: "Record an issue and assign it for follow-up.",
      body: `<label for="ticketTitle">Issue title</label>
        <input id="ticketTitle" maxlength="120" required placeholder="e.g. Water leak in Block A">
        <label for="ticketLocation">Campus location</label>
        <select id="ticketLocation">
          <option>Engineering Block</option><option>Library</option>
          <option>Science Lab</option><option>Study Hall</option>
          <option>Cafeteria</option><option>Administration</option>
        </select>
        <label for="ticketPriority">Priority</label>
        <select id="ticketPriority"><option>Medium</option><option>High</option><option>Low</option></select>`,
      confirm: "Create ticket",
      action: () => {
        const title = $("#ticketTitle").value.trim();
        if (!title) {
          $("#ticketTitle").focus();
          toast("Please enter an issue title.");
          return false;
        }
        tickets.unshift({
          id: ticketCounter++, title,
          location: $("#ticketLocation").value,
          priority: $("#ticketPriority").value,
          status: "Open"
        });
        renderTickets();
        toast("Maintenance ticket created in the demo.");
        return true;
      }
    });
    $("#ticketTitle").value = prefill;
    setTimeout(() => $("#ticketTitle")?.focus(), 30);
  }

  $("#newTicketBtn").addEventListener("click", () => newTicket());
  $$("[data-ticket]").forEach(button => button.addEventListener("click", () => {
    newTicket(button.dataset.ticket);
  }));
  renderTickets();

  // Savings simulator
  function updateSimulation() {
    const baseline = 1284;
    const percent = Number($("#energyReduction").value);
    const rate = Math.max(0, Number($("#unitRate").value) || 0);
    const saved = baseline * percent / 100;
    $("#reductionLabel").textContent = `${percent}%`;
    $("#savedEnergy").textContent = `${saved.toFixed(1)} kWh`;
    $("#savedMoney").textContent = saved.toLocaleString("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0
    });
    $("#newEnergy").textContent = `${(baseline - saved).toFixed(1)} kWh`;
    $("#costValue").textContent = (baseline * rate).toLocaleString("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0
    });
  }
  $("#energyReduction").addEventListener("input", updateSimulation);
  $("#unitRate").addEventListener("input", updateSimulation);
  updateSimulation();

  // Camera: request real browser camera permission, never fake a real feed
  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }

  $("#connectCamera").addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("Camera access needs HTTPS or localhost in a supported browser.");
      return;
    }

    try {
      stopCamera();
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true, audio: false
      });
      const video = $("#cameraVideo");
      video.srcObject = cameraStream;
      await video.play();
      video.hidden = false;
      $("#cameraScreen").classList.remove("demo-mode");
      $("#cameraScreen").replaceChildren(video);
      video.style.display = "block";
      video.style.width = "100%";
      video.style.minHeight = "340px";
      video.style.objectFit = "cover";
      $("#cameraStatus").textContent = "Browser camera connected";
      $("#cameraBadge").textContent = "CONNECTED";
      $("#cameraBadge").className = "pill green-pill";
      toast("Camera connected. Allow camera permission if prompted.");
    } catch (error) {
      toast(error.name === "NotAllowedError"
        ? "Camera permission denied. Allow access in browser settings."
        : "Could not connect the camera. Check device access and whether another app is using it.");
    }
  });

  $("#demoCamera").addEventListener("click", () => {
    stopCamera();
    const screen = $("#cameraScreen");
    screen.classList.add("demo-mode");
    screen.replaceChildren();

    const message = document.createElement("div");
    message.className = "camera-message";
    const icon = document.createElement("div");
    icon.className = "camera-emoji";
    icon.textContent = "◉";
    const heading = document.createElement("h3");
    heading.textContent = "Visual demo mode";
    const paragraph = document.createElement("p");
    paragraph.textContent = "This animated preview is illustrative only. No real campus activity is being detected.";
    message.append(icon, heading, paragraph);
    screen.appendChild(message);

    const overlay = document.createElement("div");
    overlay.className = "camera-overlay";
    overlay.textContent = "DEMO PREVIEW · NOT LIVE FOOTAGE";
    screen.appendChild(overlay);
    $("#cameraVideo").hidden = true;
    $("#cameraStatus").textContent = "Animated visual demo";
    $("#cameraBadge").textContent = "DEMO";
    $("#cameraBadge").className = "pill yellow-pill";
    toast("Visual demo started.");
  });

  window.addEventListener("beforeunload", stopCamera);

  $("#refreshSensors").addEventListener("click", () => {
    $("#flowReading").textContent = `${(8 + Math.random() * 8).toFixed(1)} L/min`;
    $("#powerReading").textContent = `${(12 + Math.random() * 12).toFixed(1)} kW`;
    $("#tempReading").textContent = `${(22 + Math.random() * 5).toFixed(1)} °C`;
    $("#occupancyReading").textContent = `${Math.floor(20 + Math.random() * 50)} people`;
    toast("Illustrative sensor readings refreshed.");
  });

  // Room popups
  $$(".building-room").forEach(room => room.addEventListener("click", () => {
    const name = room.dataset.room;
    openModal({
      title: name,
      description: "Campus room details — illustrative prototype data",
      body: `<div class="scenario-result"><p>Room: ${name}</p><p>Review the associated resource readings and investigate unusual changes.</p><p>Next step: create a maintenance ticket if an issue is confirmed.</p></div>`,
      confirm: "Create ticket",
      action: () => newTicket(`Inspect ${name}`)
    });
  }));

  // Rule-based scenario simulator
  $("#runScenario").addEventListener("click", () => {
    const scenario = $("#scenario").value;
    const results = {
      rooms: "Recommendation: compare after-hours energy use with room occupancy and scheduled operating hours before switching equipment off. No savings are guaranteed by this demo.",
      leak: "Recommendation: compare water flow against normal usage and investigate a sustained unexplained flow. Confirm the leak on-site before closing the issue.",
      lighting: "Recommendation: measure current lighting consumption, compare suitable efficient alternatives, and calculate savings using verified operating hours and tariffs."
    };
    $("#scenarioResult").textContent = results[scenario];
    toast("Illustrative scenario completed.");
  });

  // CSV report download
  $("#downloadReport").addEventListener("click", () => {
    const rows = [
      ["EcoPulse Campus Impact Report"],
      ["Data type", "Illustrative value"],
      ["Energy consumption", "1284 kWh"],
      ["Water usage", "8420 L"],
      ["Estimated carbon emissions", "246 kg CO2"],
      ["Green score", "82/100"],
      ["Open and in-progress tickets", tickets.filter(t => t.status !== "Resolved").length],
      ["Important note", "Demo values; replace with verified campus measurements."]
    ];
    const csv = rows.map(row => row.map(value =>
      `"${String(value).replace(/"/g, '""')}"`
    ).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ecopulse-campus-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast("Demo report downloaded.");
  });

  toast("EcoPulse dashboard ready.");
});

