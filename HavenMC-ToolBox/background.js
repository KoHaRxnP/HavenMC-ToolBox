chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_PLAYER_COUNT") {
    fetch('https://api.havenmc.jp/status')
      .then(res => res.json())
      .then(data => {
        console.log("HavenMC Official API Response:", data);
        sendResponse({ success: true, data: data });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.toString() });
      });
    return true;
  }
});