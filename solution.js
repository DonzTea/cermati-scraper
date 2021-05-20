const fs = require('fs');

global.Promise = require('bluebird');
const superagent = require('superagent');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.cermati.com/artikel';

superagent
  .get(BASE_URL)
  .then(async (result) => {
    // main page
    const html = result.text;
    const $ = cheerio.load(html);

    const articles = await Promise.all(
      // iterating over articles on main page
      $('.article-list-item > a').map(async function () {
        const url = BASE_URL + $(this).attr('href').replace('/artikel', '');

        // scrape articles
        return superagent
          .get(url)
          .then(async (result) => {
            // single article page
            const html = result.text;
            const $ = cheerio.load(html);

            const title = $('.post-title').text().trim();
            const author = $('.author-name').text().trim();
            const postingDate = $('.post-date > span').text().trim();
            const relatedArticles = [];

            $('.panel-items-list')
              .first()
              .children('li')
              .each(function () {
                const wrapper = $(this).children('a');

                const relatedUrl =
                  BASE_URL + wrapper.attr('href').replace('/artikel', '');
                const relatedTitle = wrapper
                  .children('.item-title')
                  .text()
                  .trim();

                relatedArticles.push({
                  url: relatedUrl,
                  title: relatedTitle,
                });
              });

            return {
              url,
              title,
              author,
              postingDate,
              relatedArticles,
            };
          })
          .catch((error) => console.error(error));
      }),
    );

    // write result as json file
    fs.writeFile(
      './solution.json',
      JSON.stringify({ articles }, null, 2),
      function (err) {
        if (err) throw err;
        console.log(`${BASE_URL} scraped successfully!`);
      },
    );
  })
  .catch((error) => console.error(error));
