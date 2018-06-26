const { first } = require('lodash');
const knex = require('../knex');

const UserFriend = () => knex('user_friends');

const fetch = (where = {}) => {
  return UserFriend()
    .select()
    .where(where);
};

const findOne = (where = {}) => {
  return fetch(where).first();
};

const findById = (id, where = {}) => {
  return findOne({ ...where, id });
};

const create = (params) => {
  return UserFriend()
    .returning('id')
    .insert(params)
    .then(first)
    .then(id => findById(id));
};

const findOrCreate = (params) => {
  return findOne(params)
    .then(found => {
      if (found) {
        return found;
      }

      return create(params);
    });
};

const update = (id, params) => {
  return findById(id)
    .update(params)
    .then(count => (count > 0))
    .then(success => findById(id));
};

const destroyById = (id) => {
  return findById(id).delete();
};

const destroy = (userId, friendId) => {
  if (!userId) return Promise.reject(new Error('A userId is required!'));
  if (!friendId) return Promise.reject(new Error('A friendId is required!'));

  return UserFriend()
    .where({ userId, friendId })
    .del();
};

const isFollowing = (userId, friendId) => {
  return findOne({ userId, friendId })
    .then(found => !!found);
};

module.exports = {
  fetch,
  findById,
  create,
  findOrCreate,
  update,
  destroyById,
  destroy,
  isFollowing
};
