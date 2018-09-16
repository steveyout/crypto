/**
* Index: will display the setting form and allow vue frontend to do the rest
* Save: will handle setting form submission via put*/
const bcrypt = require('bcrypt');

const validateForm = require('../utils/validation').validateForm;
const {SettingStore} = require('../utils/settingStore'),
  models = require('../db/models');


module.exports = (io) => {
  return {
    index: (req, res) => {
      if(res.locals.settings.siteName){
        return res.redirect('/')
      }
      return res.render('backend/admin/setting/index')
    },
    indexAdmin: (req, res) => {
      return res.render('backend/admin/setting/admin')
    },
    save: (req, res) => {
      //grab form data and run validation
      validateForm.validateSetting({
        fields: {
          siteName: {val: req.body.siteName, message: 'Please enter site name.'},
          siteOwner: {val: req.body.siteOwner, message: 'Please enter site owners name.'},
          siteDescription: {val: req.body.siteDescription, message: 'Please input description of site.'},
          siteMail: {val: req.body.siteMail, message: 'Enter e-mail address.'},
          facebookUri: {val: req.body.facebookUri, message: 'Please fill in this field.'},
          twitterUri: {val: req.body.twitterUri, message: 'Please fill in this field.'},
          googleUri: {val: req.body.googleUri, message: 'Please fill in this field.'}
        }
      }, err => {
        if(err) return res.status(422).json({success: false, response: err})

        const settings = {
          siteName: req.body.siteName.trim(),
          siteOwner: req.body.siteOwner.trim(),
          siteDescription: req.body.siteDescription.trim(),
          siteMail: req.body.siteMail.trim(),
          facebookUri: req.body.facebookUri.trim(),
          twitterUri: req.body.twitterUri.trim(),
          googleUri: req.body.googleUri.trim()
        };

        SettingStore.save(settings).then(result => {
          return res.status(200).json({success: true, response:'Setting Saved!', payload: result})
        }).catch(e => {
          console.log('ERROR:', e)
        })
      })
    },
    saveNew: (req, res) => {
      validateForm.validateSettingNew({
        fields: {
          siteName: {val: req.body.siteName, message: 'Please enter site name.'},
          siteOwner: {val: req.body.siteOwner, message: 'Please enter site owners name.'},
          siteDescription: {val: req.body.siteDescription, message: 'Please input description of site.'},
          siteMail: {val: req.body.siteMail, message: 'Enter e-mail address.'},
          facebookUri: {val: req.body.facebookUri, message: 'Please fill in this field.'},
          twitterUri: {val: req.body.twitterUri, message: 'Please fill in this field.'},
          googleUri: {val: req.body.googleUri, message: 'Please fill in this field.'},

          name: {val: req.body.name, message: 'Please enter name.'},
          email: {val: req.body.email, message: 'Please enter e-mail address.'},
          password: {val: req.body.password, message: 'Please enter password.'},
          phone: {val: req.body.phone, message: 'Please enter phone number.'},
        }
      }, err => {
        if(err) return res.status(422).json({success: false, response: err});

        models.User.findOne({where: {email: req.body.email}}).then(user => {
          if (user) return res.status(409).json({success: false, response: 'Email address already taken.'});

          models.User.findOne({where: {name: req.body.name}}).then(user => {
            if (user) return res.status(409).json({success: false, response: 'Username already in use.'});

            const settings = {
              siteName: req.body.siteName.trim(),
              siteOwner: req.body.siteOwner.trim(),
              siteDescription: req.body.siteDescription.trim(),
              siteMail: req.body.siteMail.trim(),
              facebookUri: req.body.facebookUri.trim(),
              twitterUri: req.body.twitterUri.trim(),
              googleUri: req.body.googleUri.trim()
            };

            let hashedPassword = bcrypt.hashSync(req.body.password, 10);

            models.User.create({
              name: req.body.name,
              email: req.body.email,
              password: hashedPassword,
              bitcoinAddress: 'N/A',
              phone: req.body.phone,
              country: 'Nigeria',
              isAdmin: true,
              adminType: 1,
              isActive: true
            }).then(user => {
              SettingStore.save(settings).then(result => {
                return res.status(200).json({success: true, response:'Setting Saved!', payload: result})
              }).catch(e => {
                console.log('ERROR:', e)
              })
            });
          })
        })
      })
    }
  }
};
