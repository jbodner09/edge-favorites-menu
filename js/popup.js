// Future work:
// Right-click popup for editing, deleting, etc. on everything
//     Right click in empty space gives create new folder, sort by name, add current page?
//     Right click a folder gives open all (+window, private), rename, delete, new folder, sort by name, add?
//     Right click an item gives open in new tab (+), edit URL, delete, rename, create new folder, sort by name
//     On an item, I also want open in current tab, copy/move to folder, ensure sort is for current folder only
//     I don't want the Favorites Bar/Other Favorites folders to be deletable, movable...
// Theme work
//     See if there's an API to query theme so I can swap out the icon and theme automatically
//     Style the scrollbars
//     Style the tooltip better (for light and dark themes, which are now different!)
//     Do I want a deeper indent than 12px?
//     Use colored folder icons like I saw in one dev build? (if not, get rid of icon file)
// Favicons
//     Switch to fetch instead of XHR
//     Or just use Manifest V3 chrome.favicon API
//     Cache the last time the favorite was modified, then update the icon if the favorite has changed
//     Find a way to grab bigger/multiple sizes for high DPI screens
//     Automatically clear favicon cache of any favicons for deleted favorites so cache doesn't grow forever
//     Also use add/delete event handlers to automatically add favicon for new favorites?
//     It looks like ids may be reused even though they're not supposed to be, making this crucial...
//     Figure out how to get favicons from the network for intranet/short URL websites (already open tabs?)
//     Pages hidden behind a login get the favicon of the login redirect, not the final site
// Polish and bugs:
//     Test in InPrivate
//     Touch-screen support/touch events
//     Add and use high-DPI images from my resources when on a high-DPI screen
//     BUG?: The first time I open the panel, an empty tooltip appears if I hover where there are no entries...
//     BUG?: Weird scrolling glitch when I hit the bottom (and right), possibly due to touch scrolling
//     BUG: Clicking in the bottom-right corner where the scroll bars meet launches whatever's underneath it
//     BUG: I only support 10 levels of indent; anything deeper will mess up
//     Will also need to consider indent deeper than body width (min-width < 0)
//     BUG: The horizontal scrollbar sometimes appears even though it shouldn't (lots of white space on the right)
//     Also, sometimes horizontal scrolling is possible, but the scrollbar doesn't appear (not a lot of white space)
//     BUG: If a website changes its favicon, we'll never update it automatically
//     BUG: Scroll position will be incorrect if the favorites change between popup openings
//     BUG: When (Chrome) is in dark theme, the default dark icon on the options/details pages is invisible
// Advanced things:
//     Warnings when opening/deleting multiple items (via context menu)
//     Delete duplicate entries, delete old/unvisited entries, delete broken entries buttons to options page
//     Links to import/export in Settings
//     Other competitor features (like Firefox separators)
//     Drag and drop behavior
//     Multi-select
//     Keyboard shortcuts? (Ctrl+A, Del, Esc, Ctrl+C, arrows, space/enter, etc.)
//     Accessibility (keyboarding, screen readers, high contrast themes)
//     Animations (during drag and drop, when loading favicons from network, etc.)
//     Switch to promises after Manifest V3 is released
//     Rest of hub entries (history, downloads, reading list)

// Version History:
// 0.1:
// Basic viewing and opening functionality with all favorites listed in a flat table,
// pane interaction behavioral parity with old Edge, and visual parity with new Edge.
// 0.2:
// Upgraded table to nested divs, fixed visual and behavior bugs, added indents and a dark theme.
// 0.3:
// Added folder collapsing, favicons, and tooltips for full read-only Edge parity.
// 0.4:
// Added context menus (excluding editing), a few management options, and keyboard scrolling/focus.

// Put this at the top of every js file to enable cross-browser interop
window.browser = window.browser || window.chrome;

// Global variables
var theme = "light";
const noFavicon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABs0lEQVR4AWL4//8/" + 
	"RRjO8Iucx+noO0O2qmlbUEnt5r3Juas+hsQD6KaG7dqCKPgx72Pe9GIY27btZBrbtm3btm0nO12D7tVXe63jqtqqU/iDw9K58sE" + 
	"ruKkngH0DBljOE+T/qqx/Ln718RZOFasxyd3XRbWzlFMxRbgOTx9QWFzHtZlD+aqLb108sOAIAai6+NbHW7lUHaZkDFJt+wp1DG" + 
	"7R1d0b7Z88EOL08oXwjokcOvvUxYMjBFCamWP5KjKBjKOpZx2HEPj+Ieod26U+dpg6lK2CIwTQH0oECGT5eHj+IgSueJ5fPaPg6" + 
	"PZrz6DGHiGAISE7QPrIvIKVrSvCe2DNHSsehIDatOBna/+OEOgTQE6WAy1AAFiVcf6PhgCGxEvlA9QngLlAQCkLsNWhBZIDz/zg" + 
	"4ggmjHfYxoPGEMPZECW+zjwmFk6Ih194y7VHYGOPvEYlTAJlQwI4MEhgTOzZGiNalRpGgsOYFw5lEfTKybgfBtmuTNdI3MrOTAQ" + 
	"mYf/DNcAwDeycVjROgZFt18gMso6V5Z8JpcEk2LPKpOAH0/4bKMCAYnuqm7cHOGHJTBRhAEJN9d/t5zCxAAAAAElFTkSuQmCC";

// Recursive function to list the tree hierarchy
// Used when opening entire folder(s) of favorites at once
function openFolder (localTabList, nodeArray) {
	for (const node of nodeArray) {
		if (node.url) {
			localTabList.push(node.url);
		}
		else {
			if (node.children && node.children.length > 0) {
				openFolder(localTabList, node.children);
			}
		}
	}
}

// Recursive function to build the tree hierarchy on page load
function parseFolder (nodeArray, parentFolder, indentLevel) {
	for (const node of nodeArray) {
		
		// Start creating the base div and image to hold a particular entry
		var entry = document.createElement("div");
		var favLink = document.createElement("div");
		favLink.id = node.id;
		var themeString;
		if (theme == "dark") {
			themeString = "tableHoverDark";
		}
		else {
			themeString = "tableHover";
		}
		var classString = "tableEntry " + themeString + " indent" + indentLevel;
		var icon = document.createElement("img");
		
		// For favorites, add the click handlers for opening the "links" in various ways
		// Link behavior for left click is to open in the current tab then close the popup
		// Modifier keys are ctrl for new tab, shift for new window (with ctrl taking precedence)
		// For middle-click, open a new background tab and keep the popup open (same as ctrl above)
		// Right click opens a "context menu" with various editing and opening options
		if (node.url) {
			favLink.onmouseup = function (e) {
				if (e) {
					
					// Left click
					if (e.which == 1 || e.button === 0) {
						if (e.ctrlKey) {
							browser.tabs.create({url: node.url, active: false});
						}
						else if (e.shiftKey) {
							browser.windows.getCurrent(function (currentWindow) {
								var winHeight = currentWindow.height;
								var winWidth = currentWindow.width;
								browser.windows.create({height: winHeight, width: winWidth, url: node.url});
							});
						}
						else {
							browser.tabs.update({url: node.url});
							window.close();
						}
					}
					
					// Middle click (button === 4 in old IE, but we don't care about that)
					else if (e.which == 2 || e.button === 1 ) {
						browser.tabs.create({url: node.url, active: false});
					}
					
					// Right click
					else if (e.which == 3 || e.button === 2 ) {
						
					}
				}
			};
			
			// Add the finishing touches: the tooltip and the default icon (to be replaced later)
			favLink.dataset["url"] = node.url;
			favLink.title = node.title + "\n" + node.url;
			if (theme == "dark") {
				icon.src = browser.runtime.getURL("/images/defaultFavicon16_dark.png");
			}
			else {
				icon.src = browser.runtime.getURL("/images/defaultFavicon16.png");
			}
			icon.className += "favoriteIcon";
			classString += " favorite";
		}
		
		// For folders, make them collapsible when they're left clicked
		// For middle-click, open all of the contents in background tabs
		// Modifier key is ctrl to open all contents in new tabs (same as middle click, shift does nothing)
		// Right click opens a "context menu" with various editing and opening options
		else {
			favLink.onmouseup = function (e) {
				if (e) {
					
					// ctrl+click or middle click (button === 4 in old IE, but we don't care about that)
					// Also make sure that if the click happens on the image, we get the id properly
					if (((e.which == 1 || e.button === 0) && (e.ctrlKey)) || (e.which == 2 || e.button === 1 )) {
						if (e.target) {
							var nodeId = e.target.id;
							if (e.target.tagName.toLowerCase() == "img") {
								nodeId = e.target.parentElement.id;
							}
							browser.bookmarks.getSubTree(nodeId, function (subTree) {
								if (subTree && subTree[0].children && subTree[0].children.length > 0) {
									var tabList = [];
									openFolder(tabList, subTree[0].children);
									for (const tabUrl of tabList) {
										browser.tabs.create({url: tabUrl, active: false});
									}
								}
							});
						}
					}
					
					// Left click (but only if the folder isn't empty)
					// If for some reason this entry isn't in the cache, close the folder
					// Also make sure that if the click happens on the image, we get the id properly
					else if (e.which == 1 || e.button === 0) {
						if (e.target) {
							var nodeId = e.target.id;
							if (e.target.tagName.toLowerCase() == "img") {
								nodeId = e.target.parentElement.id;
							}
							browser.storage.local.get("cache", function (result) {
								if (result && result.cache) {
									var folder = document.getElementById(nodeId);
									var cache = result.cache;
									if (nodeId in cache) {
										if (cache[nodeId] === "open") {
											if (theme == "dark") {
												folder.children[0].src = browser.runtime.getURL("/images/folderClosed16_dark.png");
											}
											else {
												folder.children[0].src = browser.runtime.getURL("/images/folderClosed16.png");
											}
											folder.parentNode.children[1].className = "invisible";
											cache[nodeId] = "closed";
										}
										else if (cache[nodeId] === "closed") {
											if (theme == "dark") {
												folder.children[0].src = browser.runtime.getURL("/images/folderOpen16_dark.png");
											}
											else {
												folder.children[0].src = browser.runtime.getURL("/images/folderOpen16.png");
											}
											folder.parentNode.children[1].className = "";
											cache[nodeId] = "open";
										}
									}
									else {
										if (theme == "dark") {
											folder.children[0].src = browser.runtime.getURL("/images/folderClosed16_dark.png");
										}
										else {
											folder.children[0].src = browser.runtime.getURL("/images/folderClosed16.png");
										}
										folder.parentNode.children[1].className = "invisible";
										cache[nodeId] = "closed";
									}
									browser.storage.local.set({"cache": cache});
								}
								else {
									browser.storage.local.set({"cache": {}});
								}
							});
						}
					}
					
					// Right click
					else if (e.which == 3 || e.button === 2 ) {
						
					}
				}
			};
			
			// Add the finishing touches: the tooltip and the default icon (to be replaced later)
			// Empty folders will display as closed and won't do anything when clicked
			favLink.title = node.title;
			if (node.children && node.children.length > 0) {
				if (theme == "dark") {
					icon.src = browser.runtime.getURL("/images/folderClosed16_dark.png");
				}
				else {
					icon.src = browser.runtime.getURL("/images/folderClosed16.png");
				}
			}
			else {
				if (theme == "dark") {
					icon.src = browser.runtime.getURL("/images/folderClosedNoArrow16_dark.png");
				}
				else {
					icon.src = browser.runtime.getURL("/images/folderClosedNoArrow16.png");
				}
			}
			icon.className += "folderIcon";
			classString += " folder";
		}
		
		// Add the entry to the page
		favLink.className += classString;
		favLink.appendChild(icon);
		favLink.appendChild(document.createTextNode(node.title));
		entry.appendChild(favLink);
		parentFolder.appendChild(entry);
		
		// If there are any child folders, keep parsing them
		if (!(node.url) && node.children && node.children.length > 0) {
			var entryChildren = document.createElement("div");
			entry.appendChild(entryChildren);
			parseFolder(node.children, entryChildren, indentLevel+1);
		}
	}
}

// Helper function to load the favicons
// First grab all the images on the page, and add anything that's in the cache to the page
// If the website doesn't have a favicon, ignore the cache and keep the default
// If there's something on the page without a cache entry, add it to the retrieval list
function populateIcons (cache) {
	var imgList = document.getElementsByClassName("favorite");
	var noFavs = [];
	for (const img of imgList) {
		var id = img.id;
		if (id in cache) {
			if (cache[id] == "error1" || cache[id] == "error2") {
				var URL = img.dataset["url"];
				var splitPos = 0;
				if (URL.split("://").length > 1) {
					splitPos = 1;
				}
				var entry = {"id": id, "url": URL.split("://")[splitPos].split("/")[0]};
				noFavs.push(entry);
			}
			else if (cache[id] !== "none") {
				img.children[0].src = cache[id];
			}
		}
		else {
			var URL = img.dataset["url"];
			var splitPos = 0;
			if (URL.split("://").length > 1) {
				splitPos = 1;
			}
			var entry = {"id": id, "url": URL.split("://")[splitPos].split("/")[0]};
			noFavs.push(entry);
		}
	}
	
	// If there's anything left in the image list that's not in the cache, hit the network
	// Make sure we space out the requests so we don't hit any API rate limiting
	// Once the data comes back, parse it into a base64 string to set as the image source
	// If we get back a "default" image, just ignore it
	// If we have trouble decoding the image, set an error state so we try again
	var i = 1;
	for (const currentEntry of noFavs) {
		setTimeout(function () {
			var httpRequest = new XMLHttpRequest();
			httpRequest.onreadystatechange = function () {
				if (httpRequest.readyState === XMLHttpRequest.DONE) {
					if (httpRequest.status === 200) {
						var reader = new FileReader();
						reader.onloadend = function () {
							if (reader.error && reader.error.name != "") {
								browser.storage.local.get("cache", function (result) {
									if (result && result.cache) {
										var freshCache = result.cache;
										if (currentEntry["id"] in freshCache) {
											if (freshCache[currentEntry["id"]] == "error1") {
												freshCache[currentEntry["id"]] = "error2";
											}
											else if (freshCache[currentEntry["id"]] == "error2") {
												freshCache[currentEntry["id"]] = "none";
											}
										}
										else {
											freshCache[currentEntry["id"]] = "error1";
										}
										browser.storage.local.set({"cache": freshCache});
									}
									else {
										browser.storage.local.set({"cache": {}});
									}
								});
							}
							else {
								var imgURL = reader.result;
								if (imgURL !== noFavicon) {
									document.getElementById(currentEntry["id"]).children[0].src = imgURL;
								}
								
								// When we get a new image, update the cache
								// Don't store a "default" image though
								// Also, get a fresh cache each time in case we add multiple entries
								browser.storage.local.get("cache", function (result) {
									if (result && result.cache) {
										var freshCache = result.cache;
										if (imgURL === noFavicon) {
											freshCache[currentEntry["id"]] = "none";
										}
										else {
											freshCache[currentEntry["id"]] = imgURL;
										}
										browser.storage.local.set({"cache": freshCache});
									}
									else {
										browser.storage.local.set({"cache": {}});
									}
								});
							}
						};
						reader.readAsDataURL(httpRequest.response);
					}
					
					// If something goes wrong with the network request, set state to retry up to 3 times
					// After that, just set it to use the default icon
					else if (httpRequest.status >= 300) {
						browser.storage.local.get("cache", function (result) {
							if (result && result.cache) {
								var freshCache = result.cache;
								if (currentEntry["id"] in freshCache) {
									if (freshCache[currentEntry["id"]] == "error1") {
										freshCache[currentEntry["id"]] = "error2";
									}
									else if (freshCache[currentEntry["id"]] == "error2") {
										freshCache[currentEntry["id"]] = "none";
									}
								}
								else {
									freshCache[currentEntry["id"]] = "error1";
								}
								browser.storage.local.set({"cache": freshCache});
							}
							else {
								browser.storage.local.set({"cache": {}});
							}
						});
					}
				}
			};
			httpRequest.open("GET", "https://www.google.com/s2/favicons?domain=" + currentEntry["url"], true);
			httpRequest.responseType = "blob";
			httpRequest.send();
		}, i++ * 1000);
	}
}

// Helper function to restore folder collapse state upon load
// Defaults to all folders closed except the favorites bar
// Also initializes the cache for any new or changed folders
// It grabs a new cache in case the favicon code changed it
function collapseFolders () {
	browser.storage.local.get("cache", function (result) {
		if (result && result.cache) {
			var cache = result.cache;
			var imgList = document.getElementsByClassName("folder");
			for (const img of imgList) {
				var id = img.id;
				if (img.parentNode.children.length == 1) {
					
					// The folder is empty, so just update the cache
					cache[id] = "empty";
				}
				else {
					if (id in cache) {
						if (cache[id] === "open") {
							if (theme == "dark") {
								img.children[0].src = browser.runtime.getURL("/images/folderOpen16_dark.png");
							}
							else {
								img.children[0].src = browser.runtime.getURL("/images/folderOpen16.png");
							}
						}
						else if (cache[id] === "closed") {
							img.parentNode.children[1].className = "invisible";
						}
						else if (cache[id] === "empty") {
							img.parentNode.children[1].className = "invisible";
							cache[id] = "closed";
						}
					}
					else {
						if (id == "1") {
							if (theme == "dark") {
								img.children[0].src = browser.runtime.getURL("/images/folderOpen16_dark.png");
							}
							else {
								img.children[0].src = browser.runtime.getURL("/images/folderOpen16.png");
							}
							cache[id] = "open";
						}
						else {
							img.parentNode.children[1].className = "invisible";
							cache[id] = "closed";
						}
					}
				}
			}
			
			// Save the cache in case we had to update it for uninitialized folders
			browser.storage.local.set({"cache": cache});
		}
		else {
			browser.storage.local.set({"cache": {}});
		}
	});
}

// Main function to populate the page when it opens
// First prevent middle-button scrolling and the default context menu
// (button === 4 in old IE, but we don't care about that)
// Also add an event listener for scrolls in order to save the scroll position
// (This can't be saved on popup close due to https://bugs.chromium.org/p/chromium/issues/detail?id=31262)
document.addEventListener("DOMContentLoaded", function (event) {
	document.body.onmousedown = function (e) {
		if (e) {
			if (e.which == 2 || e.button === 1 ) {
				return false;
			}
		}
	};
	document.addEventListener("contextmenu", function (e) {
		if (e) {
			e.preventDefault();
		}
	});
	var wrapperDiv = document.getElementById("wrapperDiv");
	wrapperDiv.addEventListener("scroll", function (e) {
		var scrollPosition = this.scrollTop;
		browser.storage.local.set({"scrollPosition": scrollPosition});
	});
	
	// If there are bookmarks available, put them in the DOM (root's id = 0)
	// Note that getTree()'s default returns an array with a single item (the root)
	// and Chrome's two children are the "Favorites Bar" and "Other Favorites" folders
	// Favorites Bar id = 1, Other Favorites id = 2
	// Also restore scroll position if it's been saved and set the theme properly
	browser.storage.local.get(null, function (result) {
		if (result && result.theme) {
			if (result.theme == "dark") {
				theme = "dark";
				document.getElementById("popup").className += "dark";
			}
		}
		browser.bookmarks.getTree(function (fullTree) {
			if (fullTree && fullTree[0].children && fullTree[0].children.length > 0) {
				var rootDiv = document.getElementById("rootDiv");
				var parentFolder = rootDiv;
				parseFolder(fullTree[0].children, parentFolder, 0);
				if (result && result.scrollPosition && result.scrollMemory) {
					if (result.scrollMemory == "true") {
						wrapperDiv.scrollTop = result.scrollPosition;
					}
				}
				
				// After favorites have been retrieved, populate favicons
				// Also restore the folder collapse states
				// The cache is just a dictionary with node id as the key
				// The value is either a base64 image for a favorite or a collapse state for a folder
				if (result && result.cache) {
					populateIcons(result.cache);
				}
				else {
					browser.storage.local.set({"cache": {}});
				}
				collapseFolders();
			}
		});
	});
});
