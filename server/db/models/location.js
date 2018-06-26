const { first } = require('lodash');
const knex = require('../knex');
const UserLocation = require('./user_location');

const Location = () => knex('locations');

const fetch = (where = {}) => {
  return Location()
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
  return Location()
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

const fetchByUserId = (userId, where = {}) => {
  return Location()
    .select('l.*', 'ul.date')
    .from('locations as l')
    .innerJoin('user_locations as ul', 'ul.locationId', 'l.id')
    .where({ ...where, 'ul.userId': userId })
    .orderBy('ul.date', 'asc');
};

const addUserLocation = async (userId, params) => {
  const {
    name,
    lat,
    latitude,
    lng,
    longitude,
    date
  } = params;

  if (!date) return Promise.reject(new Error('A date is required!'));

  const location = await findOrCreate({
    name,
    latitude: latitude || lat,
    longitude: longitude || lng
  });

  await UserLocation.findOrCreate({
    date,
    userId,
    locationId: location.id
  });

  return { ...location, date, userId };
};

module.exports = {
  fetch,
  findById,
  create,
  findOrCreate,
  update,
  destroy,
  fetchByUserId,
  addUserLocation
};
