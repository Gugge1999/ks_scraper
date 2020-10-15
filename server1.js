'use strict';
let express = require('express');
let fs = require('fs');
let request = require('request');
let cheerio = require('cheerio');
let nodemailer = require('nodemailer');
const { setInterval } = require('timers');
require('dotenv').config();
let app = express();

let numberOfTimesReloded = 0;
let json = {
  watchName: '',
  date: '',
};

app.get('/scrape', function (req, res) {
  const url = 'https://klocksnack.se/search/2731/?q=556&t=post&c[child_nodes]=1&c[nodes][0]=11&c[title_only]=1&o=date';
  //const url = 'https://klocksnack.se/search/2670/?q=sinn&t=post&c[child_nodes]=1&c[nodes][0]=11&c[title_only]=1&o=date';

  let dateAndTime = new Date().toLocaleString();

  request(url, function (error, response, html) {
    if (!error) {
      let $ = cheerio.load(html);

      // Toggle terminal: Ctrl + ö
      let watchName = $('.contentRow-title')
        .children()
        .first()
        .text()
        .replace(/Tillbakadragen|Avslutad|Säljes|Bytes|\//gi, '') // Remove sale status of the watch
        .trim();
      json.watchName = watchName;

      let date = $('.u-dt').attr('data-date-string');
      json.date = date;
    } else {
      console.log(error);
    }
    let emailText = `${json.watchName}. Upplagd: ${json.date}. Detta mail mail skickades: ${dateAndTime}`;

    let formatedJSON = JSON.stringify(json, null, 4);

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
          subject: `Ny klocka tillgänglig`,
          text: emailText,
        };
        transporter.sendMail(mailoptions, function (err, data) {
          if (error) {
            console.log('Error occured', err);
          } else {
            console.log('Email sent: ' + dateAndTime);
            //console.log('\u001B[34mEmail sent.'); Text med blå färg.

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

// Convert ms to hours, mintues and seconds
function msToTime(reloadTime) {
  let seconds = Math.floor((reloadTime / 1000) % 60);
  let minutes = Math.floor((reloadTime / (1000 * 60)) % 60);
  let hours = Math.floor((reloadTime / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;

  return `${hours}:${minutes}:${seconds}`;
}

// This interval timer reloads localhost:8081/scrape
const reloadTime = 600000; // 3600000 ms = 1 hour. 1800000 ms = 30 min 600000 = 10min

// Scrapes the site when the server starts by requesting it
request('http://localhost:8080/scrape', (err, res, body) => {
  let time = new Date().toLocaleTimeString();
  console.log(`Site reloads every: ${msToTime(reloadTime)} (hh/mm/ss)\nTime of reload: ${time}\n`);
});

setInterval(
  () =>
    request('http://localhost:8080/scrape', (err, res, body) => {
      if (err) {
        return console.log(err);
      } else {
        let time = new Date().toLocaleTimeString();
        numberOfTimesReloded++;
        console.log(
          `Number of reloads: ${numberOfTimesReloded + 1}. Site reloads every: ${msToTime(
            reloadTime
          )} (hh/mm/ss)\nTime of reload: ${time}\n`
        );
      }
    }),
  reloadTime
);

app.listen('8080');
console.log(`Server running on: http://localhost:8080/scrape`);
module.exports = app;
