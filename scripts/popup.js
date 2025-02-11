/**
 * Calculates the Levenshtein distance between two strings.
 * The Levenshtein distance is a measure of the difference between two sequences.
 * It is the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one string into the other.
 * Lower is better.
 *
 * @param {string} stringA - The first string.
 * @param {string} stringB - The second string.
 * @returns {number} The Levenshtein distance between the two strings.
 */
function levenshteinDistance(stringA, stringB) {
    const matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= stringB.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= stringA.length; j++) {
        matrix[0][j] = j;
    }

    // Compute the distance
    for (let i = 1; i <= stringB.length; i++) {
        for (let j = 1; j <= stringA.length; j++) {
            if (stringB[i - 1] === stringA[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + 1,
                );
            }
        }
    }

    return matrix[stringB.length][stringA.length];
}

/**
 * Queries MyAnimeList for a given search term and returns the best matching anime.
 *
 * @param {string} query - The search term to query MyAnimeList.
 * @returns {Promise<Object>} A promise that resolves to an object containing the best matching anime's title, image, score, and levenshtein score.
 * @throws {Error} If there is an HTTP error or any other issue during the fetch operation.
 */
function queryMyAnimeList(query) {
    return new Promise((resolve, reject) => {
        const finalUrl = `https://myanimelist.net/search/all?q=${query}&cat=all`;
        const fetchOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        };

        fetch(finalUrl, fetchOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error while fetching content of ${finalUrl} ` + response.status);
                }
                return response.text();
            })
            .then(html => {
                // Create a query result object
                const queryResult = {
                    animes: []
                }

                // Parse the HTML content of the search results page using DOMParser
                const doc = new DOMParser().parseFromString(html, "text/html");

                // Select all divs with class "list di-t w100", which contain the anime entries
                const animeListDivs = doc.querySelectorAll("div.list.di-t.w100");

                // Loop through the first 10 anime entry (that is the default page size) and extract the title, image, and score
                const counter = 0;
                for (let i = 0; i < 10; i++) {

                    const title = animeListDivs[i].querySelector(".title a")?.textContent.trim();
                    const imageUrl = animeListDivs[i].querySelector(".picSurround a img")?.getAttribute("data-src");
                    const score = animeListDivs[i].querySelector(".pt8")?.innerHTML.match(/Scored (\d+\.\d+)/)?.[1];

                    queryResult.animes.push({
                        title,
                        image: imageUrl,
                        score,
                        levenshteinScore: levenshteinDistance(query, title),
                    });
                }

                // Find the best match based on the lowest levenshtein score
                const bestMatch = queryResult.animes.filter(anime => anime.levenshteinScore === Math.min(...queryResult.animes.map(anime => anime.levenshteinScore)))[0];

                resolve(bestMatch);
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Fetches the IMDb rating data for a given movie or TV show ID.
 *
 * @param {string} id - The IMDb ID of the movie or TV show.
 * @returns {Promise<Object>} A promise that resolves to an object containing the rating data:
 * - `ratingCount` {number}: The number of ratings.
 * - `bestRating` {number}: The highest possible rating.
 * - `worstRating` {number}: The lowest possible rating.
 * - `ratingValue` {number}: The average rating value.
 *
 * @throws {Error} If there is an HTTP error or if the rating data is not found.
 */
function getImdbRating(id) {
    return new Promise((resolve, reject) => {
        const finalUrl = `https://www.imdb.com/title/${id}/`;
        const fetchOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "cookie": "lc-main=en_US",
            }
        };

        fetch(finalUrl, fetchOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error while fetching content of ${finalUrl} ` + response.status);
                }
                return response.text();
            })
            .then(html => {
                // Extract the rating data from the html content using regex
                const regex = /"aggregateRating"\s*:\s*\{\s*"@type"\s*:\s*"AggregateRating"\s*,\s*"ratingCount"\s*:\s*(\d+)\s*,\s*"bestRating"\s*:\s*(\d+)\s*,\s*"worstRating"\s*:\s*(\d+)\s*,\s*"ratingValue"\s*:\s*([\d.]+)\s*\}/;
                const match = html.match(regex);

                if (match) {
                    const ratingData = {
                        ratingCount: parseInt(match[1], 10),
                        bestRating: parseInt(match[2], 10),
                        worstRating: parseInt(match[3], 10),
                        ratingValue: parseFloat(match[4]),
                    };
                    resolve(ratingData);
                } else {
                    const ratingData = {
                        ratingCount: null,
                        bestRating: null,
                        worstRating: null,
                        ratingValue: null,
                    };
                    resolve(ratingData);
                    console.log("Rating data not found for IMDb ID:", id);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Queries IMDb for a given search term and returns the best match with its IMDb rating.
 *
 * @param {string} query - The search term to query IMDb.
 * @returns {Promise<Object>} A promise that resolves to an object containing the best match with its IMDb rating.
 * @property {string} title - The title of the best match.
 * @property {string} image - The URL of the image of the best match.
 * @property {string} score - The IMDb rating of the best match.
 * @property {number} levenshteinScore - The Levenshtein distance score between the query and the title.
 *
 * @throws {Error} If there is an HTTP error while fetching content from IMDb or if there is an error parsing the response.
 */
function queryImdb(query) {
    return new Promise((resolve, reject) => {
        const finalUrl = `https://www.imdb.com/find/?q=${query}&ref_=nv_sr_sm`;
        const fetchOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        };

        fetch(finalUrl, fetchOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error while fetching content of ${finalUrl} ` + response.status);
                }
                return response.text();
            })
            .then(html => {
                // Create a query result object
                const queryResult = {
                    animes: []
                }

                // Parse the HTML content of the search results page using DOMParser
                const doc = new DOMParser().parseFromString(html, "text/html");

                // Select the script with id "__NEXT_DATA__" as a JSON object
                const imdbScriptNextData = doc.getElementById("__NEXT_DATA__").textContent;
                const imdbQueryData = JSON.parse(imdbScriptNextData);

                // Extract the title results from the JSON object
                const idbmQueryResults = imdbQueryData.props.pageProps.titleResults.results;

                // Loop through the shows entries and extract: id, title, image (if available), and set empty score
                for (const result of idbmQueryResults) {
                    const id = result.id;
                    const title = result.titleNameText;
                    const image = result.titlePosterImageModel?.url;
                    const score = ""

                    queryResult.animes.push({
                        id,
                        title,
                        image,
                        score,
                        levenshteinScore: levenshteinDistance(query, title),
                    });
                }

                // Find the best match based on the lowest levenshtein score
                const bestMatch = queryResult.animes.filter(anime => anime.levenshteinScore === Math.min(...queryResult.animes.map(anime => anime.levenshteinScore)))[0];

                // Get the IMDB rating of the best match
                getImdbRating(bestMatch.id).then((rating) => {
                    bestMatch.score = rating.ratingValue ? rating.ratingValue : "N/A";
                    delete bestMatch.id; // Remove the IMDB id from the final result

                    resolve(bestMatch);  // Return the best match with IMDB rating updated
                }).catch((error) => {
                    console.error(error);
                    reject(error);
                });

            })
            .catch(error => {
                reject(error);
            });
    })
};

document.addEventListener('DOMContentLoaded', function () {
    const imdbInfo = document.getElementById('imdb');
    const malInfo = document.getElementById('myAnimeList');

    // Load seriesTitle from local storage and then perform queries directly
    chrome.storage.local.get("seriesTitle", (result) => {
        const seriesTitle = result.seriesTitle;
        console.log("Updated seriesTitle:", seriesTitle);

        queryImdb(seriesTitle).then((data) => {
            console.log(data);
            imdbInfo.textContent = JSON.stringify(data, null, 2);
        }).catch((error) => {
            console.error(error);
        });

        queryMyAnimeList(seriesTitle).then((data) => {
            console.log(data);
            malInfo.textContent = JSON.stringify(data, null, 2);
        }).catch((error) => {
            console.error(error);
        });
    });
});