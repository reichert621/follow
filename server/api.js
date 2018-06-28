const express = require('express');
const { auth, isAuthenticated } = require('./passport');

const { Router } = express;
const { users, maps, locations } = require('./db/controllers');

const api = Router();

const logout = (req, res) => {
  req.logout();

  return res
    .status(200)
    .send({ status: 200 });
};

// For testing
api.get('/ping', (req, res) => res.json({ message: 'pong' }));

api.post('/signup', users.signup);
api.post('/login', auth, users.login);
api.all('/logout', logout);
api.get('/me', isAuthenticated, users.getCurrentUser);
api.get('/friends', isAuthenticated, users.fetchMyFriends)
api.get('/users/:username', isAuthenticated, users.findByUsername);
api.get('/users/:username/status', isAuthenticated, users.fetchFollowStatus);
api.post('/users/:username/follow', isAuthenticated, users.follow);
api.post('/users/:username/unfollow', isAuthenticated, users.unfollow);

api.get('/locations/all', locations.fetch);
api.get('/locations/me', isAuthenticated, locations.fetchMyLocations);
api.post('/locations/me', isAuthenticated, locations.createMyLocation);
api.delete('/locations/:id', isAuthenticated, locations.remove);

api.get('/locations/coordinates', isAuthenticated, maps.coordinates);
api.get('/locations/suggestions', isAuthenticated, maps.suggestions);
api.get('/locations/:placeId', isAuthenticated, maps.details);

module.exports = api;
