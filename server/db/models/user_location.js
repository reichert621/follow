const { first } = require('lodash');
const knex = require('../knex');

const UserLocation = () => knex('user_locations');

const fetch = (where = {}) => {
  return UserLocation()
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
  return UserLocation()
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

const destroy = (id) => {
  return findById(id).delete();
};

module.exports = {
  fetch,
  findById,
  create,
  findOrCreate,
  update,
  destroy
};
