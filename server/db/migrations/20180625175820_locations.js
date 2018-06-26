exports.up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('locations', (table) => {
      table.increments('id');
      table.string('name').notNullable();
      table.float('latitude').notNullable();
      table.float('longitude').notNullable();
    }),
    knex.schema.createTable('user_locations', (table) => {
      table.increments('id');
      table.bigInteger('userId').notNullable();
      table.bigInteger('locationId').notNullable();
      table.date('date').notNullable();
    })
  ]);
};

exports.down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('locations'),
    knex.schema.dropTable('user_locations')
  ]);
};
