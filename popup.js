let currentSelectedInterval = 15 * 1000; // Default to 15 seconds in milliseconds
let randomMin = null;
let randomMax = null;
let autoRefreshTimeout = null;
let isAutoRefreshEnabled = false; // Track the state of auto-refresh

document.addEventListener("DOMContentLoaded", () => {
  const onOffToggle = document.getElementById("on-off-toggle");
  const intervalButtons = document.querySelectorAll(".interval-btn");
  const minIntervalInput = document.getElementById("min-interval");
  const maxIntervalInput = document.getElementById("max-interval");

  onOffToggle.addEventListener("change", toggleAutoRefresh);
  intervalButtons.forEach((button) =>
    button.addEventListener("click", setFixedInterval)
  );
  minIntervalInput.addEventListener("change", setRandomInterval);
  maxIntervalInput.addEventListener("change", setRandomInterval);

  loadSettings();
});

function setFixedInterval(event) {
  let refreshInterval =
    parseInt(event.target.getAttribute("data-interval"), 10) * 1000; // Convert to milliseconds
  currentSelectedInterval = refreshInterval;
  updateCountdownDisplay(currentSelectedInterval / 1000); // Display in seconds
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
}

function loadSettings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.storage.local.get([`settings_${tabId}`], (data) => {
      const settings = data[`settings_${tabId}`] || {};
      document.getElementById("on-off-toggle").checked =
        settings.isAutoRefreshEnabled || false;
      if (settings.isAutoRefreshEnabled) {
        currentSelectedInterval = settings.defaultInterval * 1000 || 15000; // Default to 15 seconds if not set
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
    if (isAutoRefreshEnabled) {
      let interval;
      if (randomMin === null || randomMax === null) {
        // Fixed interval mode
        interval = currentSelectedInterval;
      } else {
        // Random interval mode
        interval =
          Math.floor(Math.random() * (randomMax - randomMin + 1) + randomMin) *
          1000;
        updateCountdownDisplay(interval / 1000); // Display in seconds
      }
      countdown(interval);
    }
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
    clearTimeout(autoRefreshTimeout); // Clear the timeout to stop auto-refresh
    autoRefreshTimeout = null;
    updateCountdownDisplay(0); // Optionally update display to indicate that refresh is stopped
  }
}

function toggleAutoRefresh() {
  isAutoRefreshEnabled = !isAutoRefreshEnabled;
  if (isAutoRefreshEnabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

function updateCountdownDisplay(time) {
  document.getElementById("timer").textContent = Math.ceil(time); // Show time rounded up
}
