const { GoogleMap } = require('../index');
const { handleError } = require('./utils');

module.exports = {
  coordinates(req, res) {
    const { address } = req.query;

    return GoogleMap.fetchCoordinates(address)
      .then(location => res.json({ location }))
      .catch(err => handleError(res, err));
  },

  suggestions(req, res) {
    const { query } = req.query;

    return GoogleMap.fetchAutocompletePredictions(query)
      .then(suggestions => res.json({ suggestions }))
      .catch(err => handleError(res, err));
  },

  details(req, res) {
    const { placeId } = req.params;

    return GoogleMap.fetchPlaceDetails(placeId)
      .then(location => res.json({ location }))
      .catch(err => handleError(res, err));
  }
};
