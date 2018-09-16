const {User} = require('../db/models'),
  { validateForm } = require('../utils/validation'),
  randomPassword = require('../utils/randomPassword'),
  verificationToken = require('../utils/verificationToken'),
  bcrypt = require('bcrypt');

const crypto = require('crypto');

const { sendEmail } = require('../utils/mail');

module.exports = {
  save: (req, res) => {

  }
};
