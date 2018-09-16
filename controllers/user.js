const models = require('../db/models');
const {validateForm} = require('../utils/validation'),
  bcrypt = require('bcrypt'),
  verificationToken = require('../utils/verificationToken'),
  refferalLink = require('../utils/referralToken');

const { sendEmail } = require('../utils/mail');
const crypto = require('crypto');

module.exports = {
  index: (req, res) => {
    res.render('backend/admin/users')
  },
  list: (req, res) => {
    let q = (req.query.q)?req.query.q: '';
    let sort = req.query.sort;

    let limit = 8;   // number of records per page
    let offset = 0;

    const Op = models.Sequelize.Op;

    models.User.findAndCountAll({where: { name: { [Op.like]: '%'+q+'%'}, id: {
          [Op.not]: res.locals.adminId
        }, isDeleted: false}})
      .then((data) => {
        let page = (req.query.page)?req.query.page:1;      // page number
        let pages = Math.ceil(data.count / limit);
        offset = limit * (page - 1);

        models.User.findAll({
          where: { name: { [Op.like]: '%'+q+'%'}, id: {
              [Op.not]: res.locals.adminId
            }, isDeleted: false
          },
          limit: limit,
          offset: offset,
          $sort: { id: 1 },
          order: [ ['createdAt', 'DESC'] ],
          include: [{model: models.Wallet, as: 'wallet'}]
        }).then(users => {
          res.json({
            total: data.count, count: data.count, current: page, pages: pages, users: users
          })
        });
      });
  },
  show: (req, res) => {
    models.User.findById(req.params.id).then(user => {
      if(!user) return res.status(422).json({success: false, response: 'User not found!'})

      res.status(200).json({success: true, payload: user})
    })
  },
  ban: (req, res) => {
    models.User.findById(req.body.id).then(user => {
      if(!user) return res.status(422).json({success: false, response: 'Request could not be completed.'})

      if(user.isBanned) return res.status(422).json({success: false, response: 'User account already locked.'})

      models.User.update({isBanned: 1}, {where: {id: user.id}}).then(user => {
        if(!user) return res.status(422).json({success: false, response: 'Request could not be completed.'})

        let userBanMail = async () => {
          try {
            await sendEmail(user.email,
              'Account Issue',
              'accountBan',
              {userName: user.name});

            console.log('MAIL GREETING')
          }catch (e) {
            console.log('Mail Error', e)
          }
        };

        userBanMail()

        return res.status(200).json({success: true, response: 'User account locked!'})
      })
    })
  },
  unban: (req, res) => {
    models.User.findById(req.body.id).then(user => {
      if(!user) return res.status(422).json({success: false, response: 'Request not validated.'})

      if(!user.isBanned) return res.status(422).json({success: false, response: 'User account was never locked.'})

      models.User.update({isBanned: 0}, {where: {id: user.id}}).then(user => {
        if(!user) return res.status(422).json({success: false, response: 'Request could not be completed.'})

        let userUnBanMail = async () => {
          try {
            await sendEmail(user.email,
              'Account Issue',
              'accountUnBan',
              {userName: user.name});

            console.log('MAIL GREETING')
          }catch (e) {
            console.log('Mail Error', e)
          }
        };

        userUnBanMail()

        return res.status(200).json({success: true, response: 'User account opened!'})
      })
    })
  },
  destroy: (req, res) => {
    models.User.findById(req.body.id).then(user => {
      if(!user) return res.status(422).json({success: false, response: 'Request not valid.'})

      if(user.isDeleted) return res.status(422).json({success: false, response: 'User has been deleted.'})

      models.User.update({isDeleted: 1}, {where: {id: user.id}}).then(user => {
        if(!user) return res.status(422).json({success: false, response: 'Request could not be completed.'})

        let userDeleteMail = async () => {
          try {
            await sendEmail(user.email,
              'Account Issue',
              'accountDeleted',
              {userName: user.name});

            console.log('MAIL GREETING')
          }catch (e) {
            console.log('Mail Error', e)
          }
        };

        userDeleteMail()

        return res.status(200).json({success: true, response: 'User deleted!'})
      })
    })
  },
  createUser: (req, res) => {
    validateForm.validateAdminUser({
      fields: {
        email: {val: req.body.email, message: 'E-mail address is required.'},
        name: {val: req.body.name, message: 'Please enter your name.'},
        phone: {val: req.body.phone, message: 'Mobile number is required.'},
        country: {val: req.body.country, message: 'Please enter country.'},
        bitcoinAddress: {val: req.body.bitcoinAddress, message: 'Bitcoin address is required.'}
      }
    }, (err) => {
      if (err) return res.status(422).json({success: false, response: err})

      models.User.findOne({where: {email: req.body.email}}).then(user => {
        if(user) return res.status(409).json({success: false, response: 'Email address already taken.'});

        models.User.findOne({where: {name: req.body.name}}).then(user => {
          if(user) return res.status(409).json({success: false, response: 'Name already in use.'});

          crypto.randomBytes(9, function(err, buf) {
            let password = buf.toString('hex');

            let hashedPassword = bcrypt.hashSync(password, 10); // generate hashed password

            verificationToken(req.body.email)
              .then(token => {

                //send mails
                let encodedMail = new Buffer(req.body.email).toString('base64');
                let verificationLink = 'http://'+req.get('host')+'/verify?m='+encodedMail+'&id='+token;
                console.log(verificationLink);
                let verifyMail = async () => {
                  try {
                    await sendEmail(req.body.email,
                      'Agent Account Setup',
                      'userAccountVerification',
                      {verificationLink: verificationLink, password: password});

                    console.log('MAIL GREETING')
                  }catch (e) {
                    console.log('Mail Error', e)
                  }
                };

                verifyMail()
              })
              .catch(err => console.log("COULD NOT SEND MAIL."));

            refferalLink(req.body.email).then(link => {
              models.User.create({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                bitcoinAddress: req.body.bitcoinAddress,
                phone: req.body.phone,
                country: req.body.country
              }).then(user => {
                models.Wallet.create({
                  user: user.id
                }).then(wallet => {
                  models.User.findOne({
                    where: {id: user.id},
                    include: [{model: models.Wallet, as: 'wallet'}]
                  }).then(userD => {
                    return res.status(200).json({success: true, response: 'Account created successfully. User will be notified to further complete.', payload: userD})
                  })
                });
              })
            });
          });

        })
      })
    })
  }
};

