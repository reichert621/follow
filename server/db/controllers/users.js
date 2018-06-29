const { User } = require('../index');
const { handleError } = require('./utils');

module.exports = {
  isAuthenticated(req, res) {
    const isLoggedIn = Boolean(req.user && req.user.id);

    return res.json({
      isAuthenticated: isLoggedIn,
      currentUser: req.user
    });
  },

  getCurrentUser(req, res) {
    const { id: userId } = req.user;

    return User.findById(userId)
      .then(user => res.json({ currentUser: user }))
      .catch(err => handleError(res, err));
  },

  fetch(req, res) {
    return User.fetch()
      .then(users => res.json({ users }))
      .catch(err => handleError(res, err));
  },

  login(req, res) {
    return User.authenticate(req.body)
      .then(user => res.json({ user }))
      .catch(err => handleError(res, err));
  },

  signup(req, res) {
    return User.register(req.body)
      .then(user => res.json({ user }))
      .catch(err => handleError(res, err));
  },

  findByUsername(req, res) {
    const { username } = req.params;

    return User.findByUsername(username)
      .then(user => res.json({ user }))
      .catch(err => handleError(res, err));
  },

  fetchMyFriends(req, res) {
    const { id: userId } = req.user;

    return User.fetchFriendsWithLocations(userId)
      .then(friends => res.json({ friends }))
      .catch(err => handleError(res, err));
  },

  fetchAllUsers(req, res) {
    const { params, user } = req;
    const { id: userId } = user;
    const { filter = {} } = params;

    return User.fetchAllUsers(userId, filter)
      .then(users => res.json({ users }))
      .catch(err => handleError(res, err));
  },

  fetchUserProfile(req, res) {
    const { user, params } = req;
    const { id: userId } = user;
    const { username } = params;

    return User.fetchUserProfile(userId, username)
      .then(result => res.json(result))
      .catch(err => handleError(res, err));
  },

  follow(req, res) {
    const { user, params } = req;
    const { id: userId } = user;
    const { username } = params;

    return User.follow(userId, username)
      .then(result => res.json({ success: !!result }))
      .catch(err => handleError(res, err));
  },

  unfollow(req, res) {
    const { user, params } = req;
    const { id: userId } = user;
    const { username } = params;

    return User.unfollow(userId, username)
      .then(result => res.json({ success: !!result }))
      .catch(err => handleError(res, err));
  }
};
