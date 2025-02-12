# MovieStars

MovieStars is a Chrome extension that lets you effortlessly explore reviews from both users and critics. It aggregates essential details from leading entertainment websites. Whether you're deciding what to watch next or just curious about a show's information , MovieStars simplifies your search and enhances your viewing experience.

Details currently extracted:

- Show's Title
- Posters
- Rating
- Reference Links

## Examples
![11/02/2025](/assets/docs/example2.png)

![11/02/2025](/assets/docs/example3.png)

## Websites

### Currently Supported Show Title Extraction

- Currently:
    - Crunchyroll
- Roadmap:
    - Netflix
    - Max (HBO Max)
    - Disney Plus

### Currently Supported Review Score Sources

- Currently:
    - IMDB
    - MyAnimeList (MAL)
- Roadmap:
    - Letterbox

## Project Structure

- **manifest.json**: Contains metadata about the extension, permissions, and specifies scripts (content script, background service worker, popup, etc).
- **popup.html**: Defines the HTML structure of the popup window.
- **popup.js**: Handles the popup window and sites contents.
- **background.js**: Background service worker that extracts the current page Show title.
- **README.md**: Project documentation.

## Installation

1. Clone or download the repository containing the extension files.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the directory containing the extension files.

## Usage

1. Click on the extension icon in the Chrome toolbar to open the popup.
2. Type in a valid Dontpad path.
3. Highlight any text on the current webpage.
4. Click the "Add Highlighted Text" button in the popup.
5. The highlighted text will stored in the Dontpad path as a "ABNT" style reference

## License

This project is licensed under the MIT License.