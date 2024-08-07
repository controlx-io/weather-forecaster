# Weather Forecast Library

A Node.js library to download and process weather forecast data from an FTP server.

## Installation

```bash
npm install weather-forecaster
```

## Usage

```javascript
const { getForecast, getPlaceList } = require('weather-forecast-lib');

const filename = "IDN11060.xml";
const placeName = "The Entrance";

getForecast(filename, placeName, true).then(data => {
    console.log(data);
});

getPlaceList(filename, true).then(data => {
    console.log(data);
});

```