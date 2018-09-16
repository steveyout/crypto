const { validateForm } = require('../utils/validation');

const { sendEmail } = require('../utils/mail');

module.exports = {
  index: (req, res) => {
    res.render('backend/pages/mail')
  },
  save: (req, res) => {
    validateForm.validateMail({
      fields: {
        subject: {val: req.body.subject, message: 'Enter message subject.'},
        message: {val: req.body.message, message: 'Enter message.'},
        recipient: {val: req.body.recipient, message: 'recipients mail is required.'}
      }
    }, (err) => {
      if (err) return res.status(422).json({success: false, response: err});

      let sendMail = async () => {
        try {
          await sendEmail(req.body.recipient,
            req.body.subject.trim(),
            'adminMail',
            {message: req.body.message});

          console.log('MAIL GREETING')
        }catch (e) {
          console.log('Mail Error', e)
        }
      };

      sendMail()

      res.status(200).json({
        success: true,
        response: 'Mail sent!'
      })
    })
  }
};
