'use strict';
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
const { setInterval } = require('timers');
require('dotenv').config();
var app = express();

var numberOfTimesReloded = 0;
var dateAndTime = new Date().toLocaleString();
var json = {
  watchName: '',
  date: '',
};

app.get('/scrape', function (req, res) {
  //const url = 'https://klocksnack.se/search/13278215/?q=556&t=post&o=date&c[title_only]=1&c[node]=11+50';
  const url = 'https://klocksnack.se/search/13278222/?q=6139&t=post&o=date&c[title_only]=1&c[node]=11+50';

  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      // ideer:
      // Testing2 branch change asdf
<<<<<<< HEAD
=======
      // Feature 1 test
>>>>>>> Feature1
      var watchName = $('.title')
        .children()
        .first()
        .text()
        .replace(/Tillbakadragen|Avslutad|Säljes|Bytes|\//gi, '') // Remove sale status of the watch
        .trim();
      json.watchName = watchName;

      var date = $('.DateTime').first().text();
      json.date = date;
    } else {
      console.log(error);
    }
    var emailText = `${json.watchName}. Upplagd: ${json.date}. Skickat: ${dateAndTime}`;

    var formatedJSON = JSON.stringify(json, null, 4);

    fs.readFile('output.json', function (err, storedData) {
      console.log(`json scraped data: ${formatedJSON}`);
      console.log(`data in output.json: ${storedData}`);
      if (storedData != formatedJSON) {
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });

        let mailoptions = {
          from: process.env.EMAIL,
          to: process.env.EMAILTO,
          subject: `New watch available ${dateAndTime}`,
          text: emailText,
        };

        transporter.sendMail(mailoptions, function (err, data) {
          if (error) {
            console.log('error occured', err);
          } else {
            console.log('\u001B[34mEmail sent.');

            // Parameter 1: output.json - this is what the created filename will be called
            // Parameter 2: JSON.stringify(json, null, 4) - the data to write. stringify makes it more readable. 4 means it inserts 4 white spaces before the key.
            // Parameter 3: callback function - a callback function to let us know the status of our function
            fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
              console.log('File successfully written! - Check your project directory for the output.json file');
            });
          }
        });
      }
    });

    // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
    res.send('Check your console');
  });
});

// Scrapes the site when the server starts by requesting it
request('http://localhost:8081/scrape', (err, res, body) => {});

// Convert ms to hours, mintues and seconds
function msToTime(reloadTime) {
  var seconds = Math.floor((reloadTime / 1000) % 60);
  var minutes = Math.floor((reloadTime / (1000 * 60)) % 60);
  var hours = Math.floor((reloadTime / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  return `${hours}:${minutes}:${seconds}`;
}

// This interval timer reloads localhost:8081/scrape
var reloadTime = 5000; // 3600000 ms = 1 hour. 1800000 ms = 30 min
setInterval(
  () =>
    request('http://localhost:8081/scrape', (err, res, body) => {
      if (err) {
        return console.log(err);
      } else {
        numberOfTimesReloded++;
        console.log(`Number of reloads: ${numberOfTimesReloded + 1}. Site reloads every: ${msToTime(reloadTime)} (hh/mm/ss)`);
      }
    }),
  reloadTime
);

app.listen('8081');
console.log(`Server running on: http://localhost:8081/scrape`);
module.exports = app;
