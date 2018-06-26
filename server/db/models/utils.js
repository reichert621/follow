const fetch = require('node-fetch');

const { GOOGLE_API_KEY } = process.env;
const GOOGLE_MAPS_API = 'https://maps.googleapis.com/maps/api';
const GEOCODE_API = `${GOOGLE_MAPS_API}/geocode/json`;
const PLACE_AUTOCOMPLETE_API = `${GOOGLE_MAPS_API}/place/autocomplete/json`;
const PLACE_DETAILS_API = `${GOOGLE_MAPS_API}/place/details/json`;

// TODO: find a better library?
const request = (endpoint, config) => {
  return fetch(endpoint, config)
    .then(res => res.json());
};

module.exports = {
  GOOGLE_API_KEY,
  GEOCODE_API,
  PLACE_AUTOCOMPLETE_API,
  PLACE_DETAILS_API,
  request
};
