module.exports = {
  build: 'client/build', // hard-coded for now
  port: process.env.PORT || 8000,
  secret: process.env.SECRET || 'secret'
};
