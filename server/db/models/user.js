const crypto = require('crypto');
const { first, omit } = require('lodash');
const knex = require('../knex.js');
const UserFriend = require('./user_friend');

const reject = (msg) => Promise.reject(new Error(msg));

const Users = () => knex('users');

const makeSalt = (num = 20) => {
  return crypto
    .randomBytes(num)
    .toString('hex');
};

const getHashed = (password, salt) => {
  return crypto
    .createHmac('sha512', salt)
    .update(password)
    .digest('hex');
};

const verifyPassword = (password, salt, hashed) => {
  return getHashed(password, salt) === hashed;
};

const isValidUser = (user, password) => {
  if (!user) throw new Error(`Invalid user ${user}!`);

  const { salt, password: hashed } = user;
  const isValid = verifyPassword(password, salt, hashed);

  return isValid;
};

const verifyUser = (user, password) => {
  if (isValidUser(user, password)) {
    return user;
  } else {
    throw new Error('Invalid password!');
  }
};

const formatted = (user) => omit(user, ['password', 'salt']);

const sanitized = (params) => {
  const { password } = params;
  const salt = makeSalt();

  return Object.assign({}, params, {
    salt,
    password: getHashed(password, salt)
  });
};

const fetch = (where = {}) => {
  return Users()
    .select()
    .where(where);
};

const findOne = (where) => {
  return fetch(where).first()
    .then(user => formatted(user));
};

const findById = (id) => {
  return findOne({ id });
};

const findByUsername = (username) => {
  return findOne({ username });
};

const findByEmail = (email) => {
  return findOne({ email });
};

const create = (params) => {
  return Users()
    .returning('id')
    .insert(sanitized(params))
    .then(first)
    .then(findById);
};

const register = (params) => {
  const { username, email, password } = params;

  if (!username) return reject('Username is required!');
  if (!email) return reject('Email is required!');
  if (!password) return reject('Password is required!');

  return Promise.all([
    findByUsername(username),
    findByEmail(email)
  ])
    .then(([existingUsername, existingEmail]) => {
      if (existingUsername) throw new Error('That username is taken!');
      if (existingEmail) throw new Error('That email address is taken!');

      return create(params);
    });
};

const authenticate = ({ username, password }) => {
  return findByUsername(username)
    .then(user => verifyUser(user, password));
};

const fetchFollowStatus = async (userId, username) => {
  const friend = await findByUsername(username);

  if (!friend || !friend.id) {
    throw new Error(`No user found with username ${username}!`);
  }

  const { id: friendId } = friend;
  const isFollowing = await UserFriend.isFollowing(userId, friendId);

  return { user: friend, isFollowing };
};

const follow = (userId, username) => {
  return findByUsername(username)
    .then(friend => {
      const friendId = friend && friend.id;

      if (!friendId) {
        throw new Error(`No user found with username ${username}!`);
      }

      return UserFriend.findOrCreate({ userId, friendId });
    });
};

const unfollow = (userId, username) => {
  return findByUsername(username)
    .then(friend => {
      const friendId = friend && friend.id;

      if (!friendId) {
        throw new Error(`No user found with username ${username}!`);
      }

      return UserFriend.destroy(userId, friendId);
    });
};

module.exports = {
  fetch,
  findOne,
  findById,
  findByUsername,
  findByEmail,
  create,
  register,
  authenticate,
  verifyUser,
  fetchFollowStatus,
  unfollow,
  follow
};
