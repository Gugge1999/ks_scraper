'use strict';
require('dotenv').config();
let express = require('express');
let app = express();
let fs = require('fs');
let request = require('request');
let cheerio = require('cheerio');
let nodemailer = require('nodemailer');
const { setInterval } = require('timers');

let numberOfTimesReloded = 1;
let json = {
  watchName: '',
  date: '',
};

function getTime() {
  return new Date().toLocaleString();
}

app.get('/scrape', function (req, res) {
  const url = 'https://klocksnack.se/search/46733/?q=sinn&t=post&c[child_nodes]=1&c[nodes][0]=11&c[title_only]=1&o=date&g=1';
  //const url = 'https://klocksnack.se/search/2731/?q=556&t=post&c[child_nodes]=1&c[nodes][0]=11&c[title_only]=1&o=date';
  //const url = 'https://klocksnack.se/search/23458/?q=6139&t=post&c[child_nodes]=1&c[nodes][0]=11&c[title_only]=1&o=date&g=1';

  request(url, function (error, response, html) {
    if (!error) {
      let $ = cheerio.load(html);

      // Toggle terminal: Ctrl + ö
      // Skapa två endpoints istället för två filer...
      var watchName = $('.contentRow-title')
        .children()
        .first()
        .text()
        .replace(/Tillbakadragen|Avslutad|Säljes|Bytes|\//gi, '') // Remove sale status of the watch
        .trim();
      json.watchName = watchName;

      var date = $('.u-dt').attr('data-date-string');
      json.date = date;
    } else {
      console.log(error);
    }

    let emailText = `${json.watchName}. Upplagd: ${json.date}. Detta mail mail skickades: ${getTime()}`;

    let formatedJSON = JSON.stringify(json, null, 4);

    fs.readFile('output1.json', function (err, storedData) {
      if (err) throw err;
      console.log(`json scraped data: ${formatedJSON}`);
      console.log(`data in output1.json: ${storedData}`);
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

        transporter.sendMail(mailoptions, function (err) {
          if (error) {
            console.log('Error occured', err);
          } else {
            console.log('Email sent: ' + getTime());
            //console.log('\u001B[34mEmail sent.'); Text med blå färg.

            // Logs information related to the watch to a textfile
            fs.appendFile('email_logs.txt', `Email sent: ${getTime()}\nWatch name: ${watchName}\nDate: ${date}\n\n`, function (err) {
              if (err) {
                console.log(err);
              }
              console.log('Wrote successfully to email_logs.txt');
            });

            // Parameter 1: output1.json - this is what the created filename will be called
            // Parameter 2: JSON.stringify(json, null, 4) - the data to write. stringify makes it more readable. 4 means it inserts 4 white spaces before the key.
            // Parameter 3: callback function - a callback function to let us know the status of our function
            fs.writeFile('output1.json', JSON.stringify(json, null, 4), function (err) {
              if (err) {
                throw err;
              }
              console.log('File successfully written! - Check your project directory for the output1.json file');
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
const reloadTime = 1800000; // 3600000 ms = 1 hour. 1800000 ms = 30 min. 600000 = 10min.

// Scrapes the site when the server starts by requesting the endpoint
request('http://localhost:8080/scrape', (err) => {
  if (err) {
    throw err;
  } else {
    console.log(
      `Number of reloads: ${numberOfTimesReloded}. Site reloads every: ${msToTime(reloadTime)} (hh/mm/ss)\nTime of reload: ${getTime()}\n\n`
    );
  }
});

setInterval(
  () =>
    request('http://localhost:8080/scrape', (err) => {
      if (err) {
        return console.log(err);
      } else {
        numberOfTimesReloded++;
        console.log(
          `Number of reloads: ${numberOfTimesReloded}. Site reloads every: ${msToTime(
            reloadTime
          )} (hh/mm/ss)\nTime of reload: ${getTime()}\n\n`
        );
      }
    }),
  reloadTime
);

app.listen('8080');
console.log(`Server running on: http://localhost:8080/scrape`);
module.exports = app;
