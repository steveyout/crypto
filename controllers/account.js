const {validateForm} = require('../utils/validation'),
  {User} = require('../db/models'),
  {Wallet, Trade} = require('../db/models'),
  bcrypt = require('bcrypt');

module.exports = {
  index: (req, res) => {
    if(res.locals.isAdmin){
      let siteStat = [];

      User.count().then(user => {
        siteStat.userCount = user;

        Trade.findAndCountAll({}).then(totalTransactions => {
          siteStat.totalTransactions = totalTransactions.count;

          Trade.findAndCountAll({where: {status: 2}}).then(completedTransactions => {
            siteStat.completedTransactions = completedTransactions.count;

            Trade.findAndCountAll({where: {status: 1}}).then(ongoingTransactions => {
              siteStat.ongoingTransactions = ongoingTransactions.count

              return res.render('backend/profile', {stat: siteStat})
            })
          })
        })
      })
    }else{
      User.findById(req.session.user).then(user => {
        Wallet.findOne({where: {user: user.id}}).then(wallet => {
          return res.render('backend/profile', {user: user, wallet: wallet})
        })

      })
    }
  },
  profile: (req, res) => {
    return res.render('backend/pages/profile')
  },
  show: (req,res) => {
    User.findById(req.session.user).then(user => {
      res.json(user)
    })
  },
  updateDetails: (req, res) => {

    validateForm.validateProfileDetails({
      fields: {
        phone: {val: req.body.phone, message: 'Mobile number is required.'},
        bitcoinAddress: {val: req.body.bitcoinAddress, message: 'Bitcoin address is required.'}
      }
    }, (err) => {
      if (err) return res.status(422).json({success: false, response: err});

      if(req.body.password && req.body.password.trim() !== ''){
        if ((!req.body.confirmPassword || req.body.confirmPassword.trim() === '')
          || req.body.password !== req.body.confirmPassword) {
          return res.status(422).json({success: false, response: {password: "Password and retyped don't match."}})
        }


        let hashPassword = bcrypt.hashSync(req.body.password.trim(), 10);

        return User.update({
          phone: req.body.phone,
          bitcoinAddress: req.body.bitcoinAddress,
          password: hashPassword
        }, {where: {
            id: req.session.user
          }}).then(user => {
          if(!user) return res.status(422).json({success: false, response: 'Could not completed request.'})

          res.status(200).json({success: true, response: 'Profile updated!', payload: user})
        })
      }

      User.update({
        phone: req.body.phone,
        bitcoinAddress: req.body.bitcoinAddress
      }, {where: {
          id: req.session.user
        }}).then(user => {
        if(!user) return res.status(422).json({success: false, response: 'Could not completed request.'})

        res.status(200).json({success: true, response: 'Profile updated!', payload: user})
      })
    });
  },
  updateProfileImage: (req, res) => {
    if(!req.files.profileImage) return res.status(422).json({success: false, response: 'No image selected.'})

    let profileImage = req.files.profileImage;

    const ext = profileImage.mimetype.split('/')[1];
    const newImageName = 'Profile' + '-' + Date.now() + '.'+ext;

    profileImage.mv('public/src/uploads/images/profile/'+newImageName, function(err) {
      if (err)
        return res.status(422).json({success: false, response: err.Error})

      User.update({
        profilePhoto: '/uploads/images/profile/'+newImageName
      }, {where: {
          id: req.session.user
        }}).then(user => {
        res.status(200).json({success: true, response: 'Profile image uploaded.'});
      })

    });
  }
};
