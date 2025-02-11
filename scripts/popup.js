function levenshteinDistance(a, b) {
    const matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Compute the distance
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,  // Deletion
                    matrix[i][j - 1] + 1,  // Insertion
                    matrix[i - 1][j - 1] + 1 // Substitution
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

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
                const doc = new DOMParser().parseFromString(html, "text/html");
                // Select all divs with class "list di-t w100"
                const animeListDivs = doc.querySelectorAll("div.list.di-t.w100");

                // Create a query result object
                const queryResult = {
                    animes: []
                }

                // Loop through the first 10 anime entry
                const counter = 0;
                for (let i = 0; i < 10; i++) {

                    const title = animeListDivs[i].querySelector(".title a")?.textContent.trim();
                    const image = animeListDivs[i].querySelector(".picSurround a img")?.getAttribute("data-src");
                    const score = animeListDivs[i].querySelector(".pt8")?.innerHTML.match(/Scored (\d+\.\d+)/)?.[1];

                    queryResult.animes.push({
                        title,
                        image,
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

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('myAnimeList').addEventListener('click', function () {
        queryMyAnimeList("Dr Stone").then((data) => {
            console.log(data);
        }).catch((error) => {
            console.error(error);
        });
    });
});