const { getForecast, getPlaceList } = require('./index');

const filename = "IDN11060.xml";
const placeName = "The Entrance";

getForecast(filename, placeName, true).then(data => {
    console.log(data);
});