// Put this at the top of every js file to enable cross-browser interop
window.browser = window.browser || window.chrome;

// When the options page loads, get the state of the toggles
document.addEventListener("DOMContentLoaded", function (event) {
	browser.storage.local.get(["theme", "scrollMemory"], function (result) {
		var darkThemeToggle = document.getElementById("darkThemeToggle");
		var scrollMemoryToggle = document.getElementById("scrollMemoryToggle");
		var resetCacheButton = document.getElementById("resetCacheButton");
		var trimCacheButton = document.getElementById("trimCacheButton");
		if (result && result.theme) {
			if (result.theme == "dark") {
				darkThemeToggle.dataset["checked"] = "true";
				darkThemeToggle.children[0].dataset["checked"] = "true";
				darkThemeToggle.children[1].dataset["checked"] = "true";
				document.getElementById("popup").className = "dark";
				darkThemeToggle.children[0].className = "darkBar";
				darkThemeToggle.children[1].className = "darkBar";
				scrollMemoryToggle.children[0].className = "darkBar";
				scrollMemoryToggle.children[1].className = "darkBar";
				document.getElementById("resetCacheButton").className = "darkButton";
				document.getElementById("trimCacheButton").className = "darkButton";
			}
		}
		else {
			browser.storage.local.set({"theme": "light"});
		}
		if (result && result.scrollMemory) {
			if (result.scrollMemory == "true") {
				scrollMemoryToggle.dataset["checked"] = "true";
				scrollMemoryToggle.children[0].dataset["checked"] = "true";
				scrollMemoryToggle.children[1].dataset["checked"] = "true";
			}
		}
		else {
			browser.storage.local.set({"scrollMemory": "true"});
			scrollMemoryToggle.dataset["checked"] = "true";
			scrollMemoryToggle.children[0].dataset["checked"] = "true";
			scrollMemoryToggle.children[1].dataset["checked"] = "true";
		}
		
		// Add the click handler for when the dark theme button is toggled
		darkThemeToggle.addEventListener("click", function (e) {
			var darkThemeToggle = document.getElementById("darkThemeToggle");
			if (darkThemeToggle.dataset["checked"] == "true") {
				darkThemeToggle.dataset["checked"] = "false";
				darkThemeToggle.children[0].dataset["checked"] = "false";
				darkThemeToggle.children[1].dataset["checked"] = "false";
				document.getElementById("popup").className = "";
				var darkThemeToggle = document.getElementById("darkThemeToggle");
				darkThemeToggle.children[0].className = "";
				darkThemeToggle.children[1].className = "";
				var scrollMemoryToggle = document.getElementById("scrollMemoryToggle");
				scrollMemoryToggle.children[0].className = "";
				scrollMemoryToggle.children[1].className = "";
				document.getElementById("resetCacheButton").className = "";
				document.getElementById("trimCacheButton").className = "";
				browser.storage.local.set({"theme": "light"});
				browser.browserAction.setIcon({path:{
					"16": "/images/icon16.png",
					"32": "/images/icon32.png"}});
			}
			else {
				darkThemeToggle.dataset["checked"] = "true";
				darkThemeToggle.children[0].dataset["checked"] = "true";
				darkThemeToggle.children[1].dataset["checked"] = "true";
				document.getElementById("popup").className = "dark";
				var darkThemeToggle = document.getElementById("darkThemeToggle");
				darkThemeToggle.children[0].className = "darkBar";
				darkThemeToggle.children[1].className = "darkBar";
				var scrollMemoryToggle = document.getElementById("scrollMemoryToggle");
				scrollMemoryToggle.children[0].className = "darkBar";
				scrollMemoryToggle.children[1].className = "darkBar";
				document.getElementById("resetCacheButton").className = "darkButton";
				document.getElementById("trimCacheButton").className = "darkButton";
				browser.storage.local.set({"theme": "dark"});
				browser.browserAction.setIcon({path:{
					"16": "/images/icon16_dark.png",
					"32": "/images/icon32_dark.png"}});
			}
		});
		
		// Add the click handler for when the scroll memory button is toggled
		scrollMemoryToggle.addEventListener("click", function (e) {
			var scrollMemoryToggle = document.getElementById("scrollMemoryToggle");
			if (scrollMemoryToggle.dataset["checked"] == "true") {
				scrollMemoryToggle.dataset["checked"] = "false";
				scrollMemoryToggle.children[0].dataset["checked"] = "false";
				scrollMemoryToggle.children[1].dataset["checked"] = "false";
				browser.storage.local.set({"scrollMemory": "false"});
			}
			else {
				scrollMemoryToggle.dataset["checked"] = "true";
				scrollMemoryToggle.children[0].dataset["checked"] = "true";
				scrollMemoryToggle.children[1].dataset["checked"] = "true";
				browser.storage.local.set({"scrollMemory": "true"});
				browser.storage.local.set({"scrollPosition": ""});
			}
		});
		
		// Add the click handler for the cache reset button
		resetCacheButton.addEventListener("click", function (e) {
			browser.storage.local.set({"cache": {}});
		});
		
		// Add the click handler for the cache trim button
		// Removes any id entries from the cache that don't have corresponding favorite ids
		trimCacheButton.addEventListener("click", function (e) {
			browser.bookmarks.search({}, function (list) {
				if (list && list.length > 0) {
					browser.storage.local.get("cache", function (result) {
						if (result && result.cache) {
							var cacheKeys = Object.keys(result.cache);
							var freshCache = result.cache;
							var allIds = ["1", "2"];
							for (const item of list) {
								allIds.push(item.id);
							}
							for (const key of cacheKeys) {
								if (!allIds.includes(key)) {
									delete freshCache[key];
								}
							}
							browser.storage.local.set({"cache": freshCache});
						}
					});
				}
			});
		});
	});
});
