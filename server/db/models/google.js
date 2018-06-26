const { first, get } = require('lodash');
const {
  GOOGLE_API_KEY,
  GEOCODE_API,
  PLACE_AUTOCOMPLETE_API,
  PLACE_DETAILS_API,
  request
} = require('./utils');

// TODO: Get data for all cities in the world + latitude/longitude,
// since that's all we care about for this project. Then we can get
// rid of the Google Maps API and not have to worry about billing.

const fetchCoordinates = (address) => {
  if (!address) {
    return Promise.reject(new Error('Address is required!'));
  }

  const params = [
    `key=${GOOGLE_API_KEY}`,
    `address=${address}`
  ].join('&');

  const endpoint = `${GEOCODE_API}?${params}`;

  return request(endpoint, {})
    .then(res => {
      const result = first(get(res, 'results'));
      const formattedAddress = get(result, 'formatted_address');
      const location = get(result, 'geometry.location', null);

      if (location && location.lat && location.lng) {
        return { ...location, name: formattedAddress };
      } else {
        throw new Error(`No valid location found for ${address}. (${location})`);
      }
    });
};

const fetchAutocompletePredictions = (query) => {
  if (!query) {
    return Promise.resolve(null);
  }

  const params = [
    'types=geocode',
    'language=en',
    `key=${GOOGLE_API_KEY}`,
    `input=${query}`
  ].join('&');

  const endpoint = `${PLACE_AUTOCOMPLETE_API}?${params}`;

  return request(endpoint, {})
    .then(res => {
      const predictions = get(res, 'predictions', []);

      return predictions.map(p => {
        return { description: p.description, placeId: p.place_id };
      });
    });
};

const fetchPlaceDetails = (placeId) => {
  if (!placeId) {
    return Promise.reject(new Error('Place ID is required!'));
  }

  const params = [
    'fields=name,geometry,formatted_address',
    `key=${GOOGLE_API_KEY}`,
    `placeid=${placeId}`
  ].join('&');

  const endpoint = `${PLACE_DETAILS_API}?${params}`;

  return request(endpoint, {})
    .then(res => {
      const result = get(res, 'result');
      const formattedAddress = get(result, 'formatted_address');
      const location = get(result, 'geometry.location', null);

      if (location && location.lat && location.lng) {
        return { ...location, name: formattedAddress };
      } else {
        throw new Error(`No location data found for ${placeId}. (${location})`);
      }
    });
};

module.exports = {
  fetchCoordinates,
  fetchAutocompletePredictions,
  fetchPlaceDetails
};
