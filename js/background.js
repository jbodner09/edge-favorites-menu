// Put this at the top of every js file to enable cross-browser interop
window.browser = window.browser || window.chrome;

// Load the dark theme icon upon startup if the dark theme option is set
function initializeStorage () {
	browser.storage.local.get("theme", function (result) {
		if (result && result.theme) {
			if (result.theme == "dark") {
				browser.browserAction.setIcon({path:{
					"16": "/images/icon16_dark.png",
					"32": "/images/icon32_dark.png"}});
			}
		}
		else {
			browser.storage.local.set({"theme": "light"});
		}
	});
	
	// Also initialize the cache and scroll memory if necessary
	browser.storage.local.get("cache", function (result) {
		if (!(result && result.cache)) {
			browser.storage.local.set({"cache": {}});
		}
	});
	browser.storage.local.get("scrollMemory", function (result) {
		if (!(result && result.scrollMemory)) {
			browser.storage.local.set({"scrollMemory": "true"});
		}
	});
}
browser.runtime.onStartup.addListener(initializeStorage);
browser.runtime.onInstalled.addListener(initializeStorage);
