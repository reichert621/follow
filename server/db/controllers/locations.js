const { Location } = require('../index');
const { handleError } = require('./utils');

module.exports = {
  fetch(req, res) {
    return Location.fetch()
      .then(locations => res.json({ locations }))
      .catch(err => handleError(res, err));
  },

  fetchMyLocations(req, res) {
    const { id: userId } = req.user;

    return Location.fetchByUserId(userId)
      .then(locations => res.json({ locations }))
      .catch(err => handleError(res, err));
  },

  createMyLocation(req, res) {
    const { user, body: params } = req;
    const { id: userId } = user;

    return Location.addUserLocation(userId, params)
      .then(location => res.json({ location }))
      .catch(err => handleError(res, err));
  }
};
