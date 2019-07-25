# Microsoft Edge Favorites Menu
A re-creation of Classic Edge's favorites menu as an extension for Chromium-based Edge.  This project is a work in progress and currently has full support for viewing and opening favorites.  

Hidden functionality that's worth knowing about:
* Holding ctrl and clicking on a favorite will open it in a new tab
* Middle clicking works the same as ctrl clicking
* On a folder, this opens every item in that folder in new tabs
* Holding shift and clicking on a favorite will open it in a new window
* There's an options page that will allow you to enable or disable scroll memory and dark theme
* Favicons are retrieved using Google's S2 web service and then cached for future use

Current deficiencies/future work:
* Adding a context menu for opening and editing items
* Folder management including sorting
* High contrast themes
* Cleaner icons and support for high DPI screens
* Keyboarding for focus and navigation so it's accessible to screen readers
* Remove the network call to grab favicons once a suitable extension API exists
* Support more than 10 levels of nested folders
* Add a warning when opening or editing lots of items at once
* Management features like deleting old or broken links
* Editing via drag and drop
* Multi-select
* Other lists (history, downloads, reading list)
