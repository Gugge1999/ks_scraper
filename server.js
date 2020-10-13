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
  //const url = 'https://klocksnack.se/search/13438427/?q=rolex&t=post&o=date&c[title_only]=1&c[node]=40+66+70+11+50+36+29+65';
  //const url = 'https://klocksnack.se/search/13278215/?q=556&t=post&o=date&c[title_only]=1&c[node]=11+50';
  // const url = 'https://klocksnack.se/search/13278222/?q=6139&t=post&o=date&c[title_only]=1&c[node]=11+50';
  const url = 'https://klocksnack.se/search/2693/?q=6139&t=post&c[child_nodes]=1&c[nodes][0]=11&c[title_only]=1&o=date';

  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      // ideé?
      // Läg till så att man ser vilken address som använd
      var watchName = $('.contentRow-title')
        .children()
        .first()
        .text()
        .replace(/Tillbakadragen|Avslutad|Säljes|Bytes|\//gi, '') // Remove sale status of the watch
        .trim();
      json.watchName = watchName;

      var date = $('.u-dt').attr('data-date-string');
      // This if satement removes the time from date if the watch post is newer than an hour.
      json.date = date;
    } else {
      console.log(error);
    }
    var emailText = `${json.watchName}. Upplagd: ${json.date}. Detta mail mail skickades: ${dateAndTime}`;

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
          subject: `Ny klocka tillgänglig ${dateAndTime}`,
          text: emailText,
        };
        transporter.sendMail(mailoptions, function (err, data) {
          if (error) {
            console.log('error occured', err);
          } else {
            console.log('Email sent: ' + dateAndTime);
            //console.log('\u001B[34mEmail sent.');

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
request('http://localhost:8080/scrape', (err, res, body) => {});

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
var reloadTime = 10000; // 3600000 ms = 1 hour. 1800000 ms = 30 min 600000 = 10min
setInterval(
  () =>
    request('http://localhost:8080/scrape', (err, res, body) => {
      if (err) {
        return console.log(err);
      } else {
        numberOfTimesReloded++;
        console.log(`Number of reloads: ${numberOfTimesReloded + 1}. Site reloads every: ${msToTime(reloadTime)} (hh/mm/ss)\n`);
      }
    }),
  reloadTime
);

app.listen('8080');
console.log(`Server running on: http://localhost:8080/scrape`);
module.exports = app;
