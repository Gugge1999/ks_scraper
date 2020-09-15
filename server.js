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
  url = 'https://klocksnack.se/forums/handla-s%C3%A4ljes-bytes.11/';
  /* url = 'https://klocksnack.se/search/13278215/?q=556&t=post&o=date&c[title_only]=1&c[node]=11+50';
  url = 'https://klocksnack.se/search/13278222/?q=6139&t=post&o=date&c[title_only]=1&c[node]=11+50'; */

  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      // ideer:
      // Readfile gör att mail inte skickas. Tas den bort fungerar mail funktionen men inte output.json
      // Ändra json till 0 om du vill se första elementer i en listan'
      // Ta bort read i readFile
      var title, date;
      var watchArray = [];
      var dateArray = [];
      var dateAndTime = new Date().toLocaleString();
      var json = {
        title: watchArray,
        date: dateArray,
      };

      // Kolla vid 49:00 https://www.youtube.com/watch?v=6R7u6EMWaa4
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

    var watchAndDateArray = [watchArray[3].concat(', ' + dateArray[3])];

    var emailText = `${watchAndDateArray}. Skickat: ${dateAndTime}`;

    json.title = watchArray[3];
    json.date = dateArray[3];

    // To write to the system we will use the built in 'fs' library.
    // In this example we will pass 3 parameters to the writeFile function
    // Parameter 1 :  output.json - this is what the created filename will be called
    // Parameter 2 :  JSON.stringify(json) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
    // Parameter 3 :  callback function - a callback function to let us know the status of our function

    console.log('json scraped data: ' + JSON.stringify(json, null, 4));
    var newJSONFormat = JSON.stringify(json, null, 4);
    fs.readFile('output.json', function read(err, data) {
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

// Denna intervalltimer laddar om localhost:8081. Näst sista parametern är antal millisekunder.
var reloadTime = 10000;
setInterval(
  () =>
    request('http://localhost:8081/scrape', (err, res, body) => {
      function msToTime(reloadTime) {
        var seconds = Math.floor((reloadTime / 1000) % 60),
          minutes = Math.floor((reloadTime / (1000 * 60)) % 60),
          hours = Math.floor((reloadTime / (1000 * 60 * 60)) % 24);

        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        return `${hours}:${minutes}:${seconds}`;
      }
      if (err) {
        return console.log(err);
      } else {
        numberOfTimesReloded++;
        console.log(`Number of reloads: ${numberOfTimesReloded}. Site reloads every: ${msToTime(reloadTime)} (hh/mm/ss)`);
      }
    }),
  reloadTime // 3600000 = 1 timme. 1800000 = 30 min
);

app.listen('8081');
console.log(`Server running on: http://localhost:8081/scrape`);
exports = module.exports = app;
