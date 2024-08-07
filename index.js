const ftp = require('basic-ftp');
const xml2js = require('xml2js');
const fs = require('fs').promises;

/**
 * Download xml file from ftp server
 * @param {string} xmlFileName 
 */
async function downloadFile(xmlFileName) {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.bom.gov.au",
            user: "anonymous",
            password: "guest",
            secure: false,
        });
        await client.downloadTo(xmlFileName, "/anon/gen/fwo/" + xmlFileName);
    } catch (err) {
        throw err;
    } finally {
        client.close();
    }
}

/**
 * Delete file
 * @param {string} xmlFileName 
 */
function deleteFile(xmlFileName) {
    fs.unlink(xmlFileName).catch(err => {
        console.error(err);
    });
}

/**
 * Convert xml to json and extract forecast data
 * @param {string} xmlFileName 
 * @returns JSON object
 */
async function convertXmlToJson(xmlFileName) {
    try {
        const xmlData = await fs.readFile(xmlFileName, "utf-8");
        const parser = new xml2js.Parser();
        return await parser.parseStringPromise(xmlData);
    } catch (err) {
        throw err;
    }
}

/**
 * Extract forecast data from json object with place name
 * @param {object} jsonData 
 * @param {string} placeName 
 * @returns Array of forecast data
 */
function extractForecastData(jsonData, placeName) {
    const forecastData = [];
    for (area of jsonData.product.forecast[0].area) {
        const { aac, description } = area.$
        if (description !== placeName) continue;

        const forecastPeriod = area['forecast-period'];
        if (forecastPeriod === undefined || !Array.isArray(forecastPeriod)) continue;

        for (period of forecastPeriod) {
            const forecast = {
                index: period.$.index,
                start_time_local: period.$['start-time-local'],
                end_time_local: period.$['end-time-local'],
            }
            if (period.text !== undefined) {
                for (text of period.text) {
                    forecast[text.$.type] = text._;
                }
            }
            if (period.element !== undefined) {
                for (element of period.element) {
                    forecast[element.$.type] = element._;
                }
            }
            forecastData.push(forecast);
        }
    }
    return forecastData;
}

/**
 * Extract place data from json object with place name
 * @param {object} jsonData
 * @returns Array of forecast data
 */
function extractPlaceData(jsonData) {
    const placeData = [];
    for (area of jsonData.product.forecast[0].area) {
        const { aac, description, type } = area.$
        const place = {
            aac,
            description,
            type,
        }
        const parent_aac = area.$['parent-aac'];
        if (parent_aac) place.parent_aac = parent_aac;
        placeData.push(place);
    }
    return placeData;
}

/**
 * Get forecast data
 * @param {string} xmlFileName 
 * @param {string} placeName 
 * @param {boolean} deleteFile delete file after processing
 * @returns JSON object
 */
async function getForecast(xmlFileName, placeName, deleteFileAfter = true) {
    const data = {
        xmlFileName,
        placeName,
        forecast: [],
    }

    try {
        await downloadFile(xmlFileName);
        const jsonData = await convertXmlToJson(xmlFileName);
        data.forecast = extractForecastData(jsonData, placeName);
    } catch (error) {
        console.error(error);
    } finally {
        if (deleteFileAfter) deleteFile(xmlFileName);
    }

    return data;
}

/**
 * Get list of places
 * @param {string} xmlFileName 
 * @returns JSON object
 */
async function getPlaceList(xmlFileName, deleteFileAfter = true) {
    const data = {
        xmlFileName,
        places: [],
    }

    try {
        await downloadFile(xmlFileName);
        const jsonData = await convertXmlToJson(xmlFileName);
        data.places = extractPlaceData(jsonData);
    } catch (error) {
        console.error(error);
    } finally {
        if (deleteFileAfter) deleteFile(xmlFileName);
    }

    return data;
}

module.exports = {
    getForecast,
    downloadFile,
    getPlaceList,
}