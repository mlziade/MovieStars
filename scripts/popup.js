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
 * Calculates the Jaro similarity between two strings.
 *
 * The function computes the Jaro distance for two input strings by identifying matching characters within
 * a certain window (based on the lengths of the strings) and counting the number of matching characters and
 * transpositions. The result is a score between 0.0 (no similarity) and 1.0 (exact match), where higher values indicate
 * greater similarity.
 *
 * @param {string} s1 - The first string to compare.
 * @param {string} s2 - The second string to compare.
 * @returns {number} A similarity score between 0.0 and 1.0.
 */
function jairoDistance(s1, s2) {
    // If the strings are equal
    if (s1 === s2) {
      return 1.0;
    }
  
    // Length of two strings
    const len1 = s1.length;
    const len2 = s2.length;
  
    // Maximum distance up to which matching is allowed
    const max_dist = Math.floor(Math.max(len1, len2) / 2) - 1;
  
    // Count of matches
    let match = 0;
  
    // Hash for matches
    const hash_s1 = Array(s1.length).fill(0);
    const hash_s2 = Array(s1.length).fill(0);
  
    // Traverse through the first string
    for (let i = 0; i < len1; i++) {
      // Check if there is any match
      for (
        let j = Math.max(0, i - max_dist);
        j < Math.min(len2, i + max_dist + 1);
        j++
      ) {
        // If there is a match
        if (s1[i] === s2[j] && hash_s2[j] === 0) {
          hash_s1[i] = 1;
          hash_s2[j] = 1;
          match++;
          break;
        }
      }
    }
  
    // If there is no match
    if (match === 0) return 0.0;
  
    // Number of transpositions
    let t = 0;
    let point = 0;
  
    // Count number of occurrences where two characters match but
    // there is a third matched character in between the indices
    for (let i = 0; i < len1; i++) {
      if (hash_s1[i]) {
        // Find the next matched character in second string
        while (hash_s2[point] === 0) point++;
  
        if (s1[i] !== s2[point]) t++;
        point++;
      }
    }
  
    t /= 2;
  
    // Return the Jaro Similarity
    return (match / len1 + match / len2 + (match - t) / match) / 3.0;
}

/**
 * Generates a map of n-grams and their frequencies from a given string.
 *
 * @param {string} str - The string from which to extract n-grams.
 * @param {number} n - The length of each n-gram.
 * @returns {Map<string, number>} A map where the keys are n-grams and the values are their frequency counts.
 */
function getNGrams(str, n = 3) {
    const ngrams = new Map();
    str = str.toLowerCase().replace(/\s+/g, ' '); // Normalize spaces

    for (let i = 0; i <= str.length - n; i++) {
        const gram = str.substring(i, i + n);
        ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
    }

    return ngrams;
}

/**
 * Calculates the cosine similarity between two strings based on the frequency of their n-grams.
 *
 * @param {string} str1 - The first string to compare.
 * @param {string} str2 - The second string to compare.
 * @param {number} [n=3] - The size of the n-grams to generate. Defaults to 3.
 * @returns {number} The cosine similarity score, a value from 0 to 1.
 */
function cosineSimilarity(str1, str2, n = 3) {
    const ngrams1 = getNGrams(str1, n);
    const ngrams2 = getNGrams(str2, n);

    const allKeys = new Set([...ngrams1.keys(), ...ngrams2.keys()]);

    let dotProduct = 0, norm1 = 0, norm2 = 0;

    for (let key of allKeys) {
        const freq1 = ngrams1.get(key) || 0;
        const freq2 = ngrams2.get(key) || 0;
        
        dotProduct += freq1 * freq2;
        norm1 += freq1 ** 2;
        norm2 += freq2 ** 2;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1); // Avoid division by zero
}

function finalSimilarity(str1, str2) {
    // Levenshtein distance score (normalized) 0 to 1
    const levenshteinScore = levenshteinDistance(str1, str2);
    const lev = 1 - (levenshteinScore / Math.max(str1.length, str2.length));

    const jairoScore = jairoDistance(str1, str2);
    const cosineScore = cosineSimilarity(str1, str2);

    const alpha = 0.4, beta = 0.3, gamma = 0.3; // Weights

    return {
        similarityScore: (alpha * lev) + (beta * jairoScore) + (gamma * cosineScore),
        levenshteinScore: lev,
        jairoScore,
        cosineScore,
    }
}

/**
 * Queries MyAnimeList for anime entries that match the provided query string.
 *
 * @param {string} query - The search query used to find matching anime titles.
 * @returns {Promise<Object>} A promise that resolves to an object representing the best matching anime, with the following properties:
 *   @property {string} title - The title of the anime.
 *   @property {string} image - The URL of the anime's image.
 *   @property {string} score - The anime's score formatted to two decimal places.
 *   @property {number} levenshteinScore - The computed Levenshtein distance between the query and the anime title.
 *   @property {string} referenceUrl - The URL to the anime's detail page on MyAnimeList.
 * 
 * @throws {Error} If the HTTP response is not successful or if there is an error during fetching/parsing.
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

                    const scoreFormatted = parseFloat(score).toFixed(2);

                    if (!title) {
                        continue;
                    }

                    const resultSimilarity = finalSimilarity(query, title);

                    queryResult.animes.push({
                        title,
                        image: imageUrl,
                        score: scoreFormatted,
                        levenshteinScore: resultSimilarity.levenshteinScore,
                        jairoScore: resultSimilarity.jairoScore,
                        cosineScore: resultSimilarity.cosineScore,
                        similarityScore: resultSimilarity.similarityScore,
                        referenceUrl: animeListDivs[i].querySelector(".title a")?.getAttribute("href"),
                    });
                }

                // Find the best match based on the highest similarity score
                const bestMatch = queryResult.animes.filter(anime => anime.similarityScore === Math.max(...queryResult.animes.map(anime => anime.similarityScore)))[0];

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
 *   @property {number} ratingCount - The number of ratings.
 *   @property {number} bestRating - The highest possible rating.
 *   @property {number} worstRating - The lowest possible rating.
 *   @property {number} ratingValue - The average rating value.
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
                    // console.log("Rating data not found for IMDb ID:", id);
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
 *  @property {string} title - The title of the best match.
 *  @property {string} image - The URL of the image of the best match.
 *  @property {string} score - The IMDb rating of the best match.
 *  @property {number} levenshteinScore - The Levenshtein distance score between the query and the title.
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

                    if (!title) {
                        continue;
                    }

                    const resultSimilarity = finalSimilarity(query, title);

                    queryResult.animes.push({
                        id,
                        title,
                        image,
                        score,
                        levenshteinScore: resultSimilarity.levenshteinScore,
                        jairoScore: resultSimilarity.jairoScore,
                        cosineScore: resultSimilarity.cosineScore,
                        similarityScore: resultSimilarity.similarityScore,
                        referenceUrl: `https://www.imdb.com/title/${id}/`,
                    });
                }

                // Find the best match based on the highest similarity score
                const bestMatch = queryResult.animes.filter(anime => anime.similarityScore === Math.max(...queryResult.animes.map(anime => anime.similarityScore)))[0];

                // Get the IMDB rating of the best match
                getImdbRating(bestMatch.id).then((rating) => {
                    const scoreFormatted = rating.ratingValue ? parseFloat(rating.ratingValue).toFixed(2) : "N/A";
                    bestMatch.score = scoreFormatted;
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


/**
 * Fetches HTML content from the given URL and extracts the letterboxd rating and image.
 *
 * This function performs an HTTP GET request to retrieve the HTML of the provided URL, then
 * uses regular expressions to extract the "ratingValue" and "image" URL from the response.
 *
 * @param {string} url - The URL to fetch the HTML content from.
 * @returns {Promise<{object}>} A promise that resolves with an object containing:
 *  @property {string} imageUrl - The URL of the image.
 *  @property {number} ratingValue - The rating value.
 *  @property {number} levenshteinScore - The computed Levenshtein distance between the query and the anime title.
 *  @property {string} referenceUrl - The URL to the anime's detail page on Letterboxd.
 * 
 * @throws {Error} If the HTTP response is not successful.
 */
function getLetterboxdRatingAndImage(url) {
    return new Promise((resolve, reject) => {
        const fetchOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        };

        fetch(url, fetchOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error while fetching content of ${url} ` + response.status);
                }
                return response.text();
            })
            .then(html => {
                // Extract the image URL
                const regexImage = /"image"\s*:\s*"([^"]+)"/;
                const urlImages = html.match(regexImage);

                // Extract the rating value
                const regexRating = /"ratingValue"\s*:\s*([\d.]+)/;
                const ratingValue = html.match(regexRating);

                if (ratingValue && urlImages) {
                    const resultData = {
                        imageUrl: urlImages[1],
                        ratingValue: parseFloat(ratingValue[1]),
                    };
                    resolve(resultData);
                } else {
                    const resultData = {
                        imageUrl: null,
                        ratingValue: null,
                    };
                    resolve(resultData);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Queries Letterboxd with the specified search query to find the best matching anime entry.
 *
 * The function constructs a search URL and sends a GET request to Letterboxd. It then parses the HTML
 * response to extract search results, computes the Levenshtein distance between the query and each title,
 * and selects the entry with the smallest distance as the best match. Once the best match is identified,
 * it fetches additional details, such as the rating and image, for that entry.
 *
 * @param {string} query - The search query string used to search for an anime on Letterboxd.
 * @returns {Promise<Object>} A promise that resolves to an object representing the best matching anime, with the following properties:
 *  @property {string} title - The title of the anime.
 *  @property {string} image - The URL of the anime's image.
 *  @property {string} score - The anime's score formatted to two decimal places.
 *  @property {number} levenshteinScore - The computed Levenshtein distance between the query and the anime title.
 *  @property {string} referenceUrl - The URL to the anime's detail page on Letterboxd.
 *
 * @throws {Error} Throws an error if there is a problem with fetching the content or retrieving the additional details.
 */
function queryLetterboxd(query) {
    return new Promise((resolve, reject) => {
        const finalUrl = `https://www.letterboxd.com/s/search/${query}/?__csrf=804700fc55592152ef82`;
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

                // Get the ul element with class "results"
                const resultsUl = doc.querySelector("ul.results");

                // Get all li elements within the ul
                const resultItems = resultsUl.querySelectorAll("li");

                // Loop through all list items using a for loop and extract the title, image, and score
                for (let i = 0; i < resultItems.length; i++) {
                    const item = resultItems[i];
                    const title = item.querySelector(".film-detail-content h2 a")?.textContent.trim();
                    const referenceUrl = item.querySelector(".film-detail-content h2 a")?.getAttribute("href");

                    if (!title) {
                        continue;
                    }

                    const resultSimilarity = finalSimilarity(query, title);

                    queryResult.animes.push({
                        title,
                        image: "",
                        score: "N/A",
                        levenshteinScore: resultSimilarity.levenshteinScore,
                        jairoScore: resultSimilarity.jairoScore,
                        cosineScore: resultSimilarity.cosineScore,
                        similarityScore: resultSimilarity.similarityScore,
                        referenceUrl: `https://www.letterboxd.com${referenceUrl}`,
                    });
                }

                // Find the best match based on the highest similarity score
                const bestMatch = queryResult.animes.filter(anime => anime.similarityScore === Math.max(...queryResult.animes.map(anime => anime.similarityScore)))[0];

                // Get the Letterboxd rating and image of the best match and update the best match object
                getLetterboxdRatingAndImage(bestMatch.referenceUrl).then((result) => {
                    const scoreFormatted = result.ratingValue ? parseFloat(result.ratingValue).toFixed(2) : "N/A";
                    bestMatch.score = scoreFormatted;
                    bestMatch.image = result.imageUrl;
                }).catch((error) => {
                    console.error(error);
                    reject(error);
                });

                resolve(bestMatch);
            }
            )
            .catch(error => {
                reject(error);
            });
    });
}

// Wait for the DOM of the popup to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Auxiliar function to update the popup with data
    function updatePopup(imdbData, malData, letterboxdData, seriesTitle) {
        // Update title
        document.getElementById('title').textContent = seriesTitle;

        // Update ratings values
        document.getElementById('imdb-rating-value').textContent = imdbData ? imdbData.score : 'N/A';
        document.getElementById('mal-rating-value').textContent = malData ? malData.score : 'N/A';
        document.getElementById('letterboxd-rating-value').textContent = letterboxdData ? letterboxdData.score : 'N/A';

        // Update ratings links
        document.getElementById('imdb-rating-value').href = imdbData ? imdbData.referenceUrl : '';
        document.getElementById('mal-rating-value').href = malData ? malData.referenceUrl : '';
        document.getElementById('letterboxd-rating-value').href = letterboxdData ? letterboxdData.referenceUrl : '';

        // Update IMDb and MAL SVGs href values
        document.getElementById('imdb-svg-ref').href = imdbData ? imdbData.referenceUrl : '';
        document.getElementById('mal-svg-ref').href = malData ? malData.referenceUrl : '';
        document.getElementById('letterboxd-svg-ref').href = letterboxdData ? letterboxdData.referenceUrl : '';

        // Update IMDb poster source
        const posterImdb = imdbData ? imdbData.image : null;
        if (posterImdb) {
            document.getElementById('poster-imdb').src = posterImdb;
        }

        // Update MAL poster source
        const posterMal = malData ? malData.image : null;
        if (posterMal) {
            document.getElementById('poster-mal').src = posterMal;
        }

        // Update Letterboxd poster source
        const posterLetterboxd = letterboxdData ? letterboxdData.image : null;
        if (posterLetterboxd) {
            document.getElementById('poster-letterboxd').src = posterLetterboxd;
        }

        // Update the posters and "carrousel" dots visibility based on the data availability
        if (posterImdb && posterMal && posterLetterboxd) {
            // All three posters available
            document.getElementById('poster-imdb').style.display = 'block';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Update the title provider
            document.getElementById('title-provider-imdb').textContent = imdbData.title;
            document.getElementById('title-provider-mal').textContent = malData.title;
            document.getElementById('title-provider-letterboxd').textContent = letterboxdData.title;
            document.getElementById('title-provider-imdb').style.display = 'block';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        } else if (posterImdb && posterMal && !posterLetterboxd) {
            // IMDb and MAL available
            document.getElementById('poster-imdb').style.display = 'block';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Update the title provider
            document.getElementById('title-provider-imdb').textContent = imdbData.title;
            document.getElementById('title-provider-mal').textContent = malData.title;
            document.getElementById('title-provider-imdb').style.display = 'block';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        } else if (posterImdb && !posterMal && posterLetterboxd) {
            // IMDb and Letterboxd available
            document.getElementById('poster-imdb').style.display = 'block';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Update the title provider
            document.getElementById('title-provider-imdb').textContent = imdbData.title;
            document.getElementById('title-provider-letterboxd').textContent = letterboxdData.title;
            document.getElementById('title-provider-imdb').style.display = 'block';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        } else if (!posterImdb && posterMal && posterLetterboxd) {
            // MAL and Letterboxd available
            document.getElementById('poster-imdb').style.display = 'none';
            document.getElementById('poster-mal').style.display = 'block';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Update the title provider
            document.getElementById('title-provider-mal').textContent = malData.title;
            document.getElementById('title-provider-letterboxd').textContent = letterboxdData.title;
            document.getElementById('title-provider-imdb').style.display = 'none';
            document.getElementById('title-provider-mal').style.display = 'block';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        } else if (posterImdb && !posterMal && !posterLetterboxd) {
            // Only IMDb available
            document.getElementById('poster-imdb').style.display = 'block';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Update the title provider
            document.getElementById('title-provider-imdb').textContent = imdbData.title;
            document.getElementById('title-provider-imdb').style.display = 'block';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        } else if (!posterImdb && posterMal && !posterLetterboxd) {
            // Only MAL available
            document.getElementById('poster-imdb').style.display = 'none';
            document.getElementById('poster-mal').style.display = 'block';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Update the title provider
            document.getElementById('title-provider-mal').textContent = malData.title;
            document.getElementById('title-provider-imdb').style.display = 'none';
            document.getElementById('title-provider-mal').style.display = 'block';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        } else if (!posterImdb && !posterMal && posterLetterboxd) {
            // Only Letterboxd available
            document.getElementById('poster-imdb').style.display = 'none';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'block';
            // Update the title provider
            document.getElementById('title-provider-letterboxd').textContent = letterboxdData.title;
            document.getElementById('title-provider-imdb').style.display = 'none';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'block';
        } else {
            // If no poster is available, show the default poster
            document.getElementById('poster-imdb').src = '../assets/default-poster.svg';
            document.getElementById('poster-imdb').style.display = 'block';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Hide Title provided by elements
            document.getElementById('title-provider-imdb').style.display = 'none';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        }
    }

    // Get the series title from the local storage
    chrome.storage.local.get('seriesTitle', function (data) {
        // If the seriesTitle is not set, take the user input
        if (data.seriesTitle == "") {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('no-title').style.display = 'block';

            // Add event listener to the search button
            const searchInput = document.getElementById('search-title');
            const searchButton = document.getElementById('search-button');
            searchButton.addEventListener('click', function () {
                document.getElementById('no-title').style.display = 'none';
                document.getElementById('loading').style.display = 'block';
                const searchValue = searchInput.value;
                chrome.storage.local.set({ seriesTitle: searchValue }, () => { });

                // Call the providers functions and update the popup
                Promise.all([queryImdb(searchValue), queryMyAnimeList(searchValue), queryLetterboxd(searchValue)])
                    .then(results => {
                        const [imdbData, malData, letterboxdData] = results;
                        updatePopup(imdbData, malData, letterboxdData, searchValue);
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('content').style.display = 'block';
                        document.getElementById('no-title').style.display = 'none';
                    })
                    .catch(error => {
                        console.error('Error fetching data:', error);
                    });
            });

        // If the seriesTitle is set, query the providers for the series
        } else if (data.seriesTitle) {
            const seriesTitle = data.seriesTitle;

            // Call the providers functions and update the popup
            Promise.all([queryImdb(seriesTitle), queryMyAnimeList(seriesTitle), queryLetterboxd(seriesTitle)])
                .then(results => {
                    const [imdbData, malData, letterboxdData] = results;
                    updatePopup(imdbData, malData, letterboxdData, seriesTitle);
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('content').style.display = 'block';
                    document.getElementById('no-title').style.display = 'none';
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        }

        // Add event listeners to the rating buttons
        const imdbButton = document.getElementById('imdb-rating');
        const malButton = document.getElementById('mal-rating');
        const letterboxdButton = document.getElementById('letterboxd-rating');
        imdbButton.addEventListener('click', function () {
            // Show the IMDb poster and hide the MAL and Letterboxd posters
            document.getElementById('poster-imdb').style.display = 'block';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Show the IMDb title provider and hide the MAL and Letterboxd title providers
            document.getElementById('title-provider-imdb').style.display = 'block';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        });
        malButton.addEventListener('click', function () {
            // Show the MAL poster and hide the IMDb and Letterboxd posters
            document.getElementById('poster-imdb').style.display = 'none';
            document.getElementById('poster-mal').style.display = 'block';
            document.getElementById('poster-letterboxd').style.display = 'none';
            // Show the MAL title provider and hide the IMDb and Letterboxd title providers
            document.getElementById('title-provider-imdb').style.display = 'none';
            document.getElementById('title-provider-mal').style.display = 'block';
            document.getElementById('title-provider-letterboxd').style.display = 'none';
        });
        letterboxdButton.addEventListener('click', function () {
            // Show the Letterboxd poster and hide the IMDb and MAL posters
            document.getElementById('poster-imdb').style.display = 'none';
            document.getElementById('poster-mal').style.display = 'none';
            document.getElementById('poster-letterboxd').style.display = 'block';
            // Show the Letterboxd title provider and hide the IMDb and MAL title providers
            document.getElementById('title-provider-imdb').style.display = 'none';
            document.getElementById('title-provider-mal').style.display = 'none';
            document.getElementById('title-provider-letterboxd').style.display = 'block';
        });
    });
});