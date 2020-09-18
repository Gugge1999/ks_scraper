// ideer:
// 1:08:06
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
const { setInterval } = require('timers');
require('dotenv').config();
var app = express();
var numberOfTimesReloded = 0;
var emailsSent = 0;

app.get('/scrape', function (req, res) {
  //url = 'https://klocksnack.se/forums/handla-s%C3%A4ljes-bytes.11/';
  url = 'https://klocksnack.se/search/13278215/?q=556&t=post&o=date&c[title_only]=1&c[node]=11+50';
  // url = 'https://klocksnack.se/search/13278222/?q=6139&t=post&o=date&c[title_only]=1&c[node]=11+50';

  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      var title, date;
      var watchArray = [];
      var dateArray = [];
      var dateAndTime = new Date().toLocaleString();
      var json = {
        title: watchArray,
        date: dateArray,
      };

      $('.titleText').filter(function () {
        var data = $(this);

        title = data
          .children()
          .children()
          .text()
          .replace(/[^a-zA-ZäöåÄÖÅ0-9 ]/g, ' ') // Removes all special characters
          .replace(/(?!\b\s+\b)\s+/g, ''); // Removes spaces

        watchArray.push(title);
      });
    } else {
      console.log(error);
    }

    $('.DateTime').filter(function () {
      var data = $(this);
      date = data.text();

      dateArray.push(date);
    });

    var watchAndDateArray = [watchArray[0].concat(', ' + dateArray[0])];

    var emailText = `${watchAndDateArray}. Skickat: ${dateAndTime}`;

    json.title = watchArray[0];
    json.date = dateArray[0];

    console.log(`json scraped data: ${JSON.stringify(json, null, 4)}`);
    var newJSONFormat = JSON.stringify(json, null, 4);
    fs.readFile('output.json', function (err, data) {
      console.log('data in output.json: ' + data);
      if (data != newJSONFormat) {
        /* let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });

        let mailoptions = {
          from: 'ksappscraper@gmail.com',
          to: 'davidgust99@gmail.com',
          subject: `New watch available ${dateAndTime}`,
          text: emailText,
        };

        transporter.sendMail(mailoptions, function (err, data) {
          if (error) {
            console.log('error occured', err);
          } else {
            emailsSent++;
            console.log('Email sents: ' + emailsSent);
          }
        }); */

        // Parameter 1:  output.json - this is what the created filename will be called
        // Parameter 2:  JSON.stringify(json, null, 4) - the data to write. stringify makes it more readable. 4 means it inserts 4 white spaces before the key value pair
        // Parameter 3:  callback function - a callback function to let us know the status of our function
        setTimeout(function () {
          fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
            console.log('File successfully written! - Check your project directory for the output.json file');
          });
        }, 5000);
      }
    });

    // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
    res.send('Check your console!');
  });
});

// Reload the site when the server starts
request('http://localhost:8081/scrape', (err, res, body) => {});

// Konvertera millisekunder till timmar, minuter och sekunder
function msToTime(reloadTime) {
  var seconds = Math.floor((reloadTime / 1000) % 60);
  var minutes = Math.floor((reloadTime / (1000 * 60)) % 60);
  var hours = Math.floor((reloadTime / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  return `${hours}:${minutes}:${seconds}`;
}

// Denna intervalltimer laddar om localhost:8081/scrape.
var reloadTime = 10000; // 3600000 ms = 1 timme. 1800000 ms = 30 min
setInterval(
  () =>
    request('http://localhost:8081/scrape', (err, res, body) => {
      if (err) {
        return console.log(err);
      } else {
        numberOfTimesReloded++;
        console.log(`Number of reloads: ${numberOfTimesReloded}. Site reloads every: ${msToTime(reloadTime)} (hh/mm/ss)`);
      }
    }),
  reloadTime
);

app.listen('8081');
console.log(`Server running on: http://localhost:8081/scrape`);
module.exports = app;
