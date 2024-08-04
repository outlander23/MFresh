let currentSelectedInterval = 15 * 1000; // Default to 15 seconds in milliseconds
let randomMin = null;
let randomMax = null;
let autoRefreshTimeout = null;
let isAutoRefreshEnabled = false; // Track the state of auto-refresh
let randomInterval = false;

document.addEventListener("DOMContentLoaded", () => {
  const onOffToggle = document.getElementById("on-off-toggle");
  const randomOnOffToggle = document.getElementById("on-random-toggle");

  const intervalButtons = document.querySelectorAll(".interval-btn");
  const minIntervalInput = document.getElementById("min-interval");
  const maxIntervalInput = document.getElementById("max-interval");

  onOffToggle.addEventListener("change", toggleAutoRefresh);
  randomOnOffToggle.addEventListener("change", toggleRandomInterval);

  intervalButtons.forEach((button) =>
    button.addEventListener("click", setFixedInterval)
  );
  minIntervalInput.addEventListener("change", setRandomInterval);
  maxIntervalInput.addEventListener("change", setRandomInterval);

  loadSettings();
});

function toggleRandomInterval() {
  randomInterval = !randomInterval;
  if (randomInterval && (randomMin === null || randomMax === null)) {
    randomMin = 15;
    randomMax = 30;
    document.getElementById("min-interval").value = 15;
    document.getElementById("max-interval").value = 30;
  }
}

function setFixedInterval(event) {
  const refreshInterval =
    parseInt(event.target.getAttribute("data-interval"), 10) * 1000; // Convert to milliseconds
  currentSelectedInterval = refreshInterval;
  updateCountdownDisplay(currentSelectedInterval / 1000); // Display in seconds
  saveSettings();
}

function setRandomInterval() {
  const minInterval = parseInt(
    document.getElementById("min-interval").value,
    10
  );
  const maxInterval = parseInt(
    document.getElementById("max-interval").value,
    10
  );
  if (
    !isNaN(minInterval) &&
    !isNaN(maxInterval) &&
    minInterval <= maxInterval
  ) {
    randomMin = minInterval;
    randomMax = maxInterval;
  }
  saveSettings();
}

function loadSettings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.storage.local.get([`settings_${tabId}`], (data) => {
      const settings = data[`settings_${tabId}`] || {};
      document.getElementById("on-off-toggle").checked =
        settings.isAutoRefreshEnabled || false;
      randomInterval = settings.randomInterval || false;
      if (settings.isAutoRefreshEnabled) {
        currentSelectedInterval = settings.defaultInterval * 1000 || 15000; // Default to 15 seconds if not set
        randomMin = settings.randomMin;
        randomMax = settings.randomMax;
        startAutoRefresh();
      }
    });
  });
}

function saveSettings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    const settings = {
      isAutoRefreshEnabled: document.getElementById("on-off-toggle").checked,
      randomInterval,
      defaultInterval: currentSelectedInterval / 1000,
      randomMin,
      randomMax,
    };
    chrome.storage.local.set({ [`settings_${tabId}`]: settings });
  });
}

function startAutoRefresh() {
  if (autoRefreshTimeout) clearTimeout(autoRefreshTimeout); // Clear any existing timeouts

  function refreshPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id); // Reload the current active tab
    });

    let interval;
    if (randomInterval && randomMin !== null && randomMax !== null) {
      interval =
        Math.floor(Math.random() * (randomMax - randomMin + 1) + randomMin) *
        1000;
    } else {
      interval = currentSelectedInterval;
    }

    countdown(interval);
  }

  function countdown(time) {
    if (time <= 0) {
      refreshPage(); // Trigger page refresh when countdown ends
      return;
    }
    updateCountdownDisplay(Math.ceil(time / 1000)); // Display in seconds
    autoRefreshTimeout = setTimeout(() => {
      countdown(time - 1000); // Decrement time and continue countdown
    }, 1000); // Update countdown every second
  }

  refreshPage(); // Start the first refresh
}

function stopAutoRefresh() {
  if (autoRefreshTimeout) {
    clearTimeout(autoRefreshTimeout);
    autoRefreshTimeout = null;
    updateCountdownDisplay(currentSelectedInterval / 1000);
  }
}

function toggleAutoRefresh() {
  isAutoRefreshEnabled = !isAutoRefreshEnabled;
  const mainContent = document.getElementById("main-content");
  if (isAutoRefreshEnabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
  saveSettings();
}

function updateCountdownDisplay(time) {
  document.getElementById("timer").textContent = Math.ceil(time); // Show time rounded up
}
