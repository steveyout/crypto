class FormValidation {
  emailValidation(email){
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email));
  }
  //login fields validation
  validateLogin(valObj, callback){
    let errors = {};
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.email.val || fields.email.val.trim() === ''){
      hasErrors = true;
      errors.email = fields.email.message
    }

    if(!fields.password.val || fields.password.val.trim() === ''){
      hasErrors = true;
      errors.password = fields.password.message
    }

    if(fields.email.val && fields.email.val.trim() !== ''){
      if(!this.emailValidation(fields.email.val.trim())){
        hasErrors = true;
        errors.email = 'Please enter a valid email address.'
      }
    }

    callback(hasErrors && errors)
  }

  validateSignup(valObj, callback){
    let errors = {};
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.email.val || fields.email.val.trim() === ''){
      hasErrors = true;
      errors.email = fields.email.message
    }

    if(!fields.password.val || fields.password.val.trim() === ''){
      hasErrors = true;
      errors.password = fields.password.message
    }

    if(fields.email.val && fields.email.val.trim() !== ''){
      if(!this.emailValidation(fields.email.val.trim())){
        hasErrors = true;
        errors.email = 'Please enter a valid email address.'
      }
    }

    if(!fields.name.val || fields.name.val.trim() === ''){
      hasErrors = true;
      errors.name = fields.name.message
    }

    if(!fields.phone.val || fields.phone.val.trim() === ''){
      hasErrors = true;
      errors.phone = fields.phone.message
    }

    if(!fields.country.val || fields.country.val.trim() === ''){
      hasErrors = true;
      errors.country = fields.country.message
    }

    if(!fields.bitcoinAddress.val || fields.bitcoinAddress.val.trim() === ''){
      hasErrors = true;
      errors.bitcoinAddress = fields.bitcoinAddress.message
    }

    callback(hasErrors && errors)
  }

  validateLostPassword(valObj, callback){
    let errors = {};
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.email.val || fields.email.val.trim() === ''){
      hasErrors = true;
      errors.email = fields.email.message
    }

    if(fields.email.val && fields.email.val.trim() !== ''){
      if(!this.emailValidation(fields.email.val.trim())){
        hasErrors = true;
        errors.email = 'Please enter a valid email address.'
      }
    }

    callback(hasErrors && errors)
  }

  validateResetPassword(valObj, callback){
    let errors = {};
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.password.val || fields.password.val.trim() === ''){
      errors.email = fields.password.message
      hasErrors = true;
    }

    if ((!fields.confirmPassword.val || fields.confirmPassword.val.trim() === '') || fields.password.val !== fields.confirmPassword.val) {
      errors.password = 'Password and retyped password don\'t match';
      errors.password = 'Password and retyped password don\'t match';
      hasErrors = true;
    }

    callback(hasErrors && errors)
  }

  validateSetting(valObj, callback){
    let errors = {}
    let hasErrors = false

    let fields = valObj.fields

    if(!fields.siteName.val || fields.siteName.val.trim() === ''){
      errors.siteName = fields.siteName.message
      hasErrors = true;
    }

    if(!fields.siteOwner.val || fields.siteOwner.val.trim() === ''){
      errors.siteOwner = fields.siteOwner.message
      hasErrors = true;
    }

    if(!fields.siteDescription.val || fields.siteDescription.val.trim() === ''){
      errors.siteDescription = fields.siteDescription.message
      hasErrors = true;
    }

    if(!fields.siteMail.val || fields.siteMail.val.trim() === ''){
      errors.siteMail = fields.siteMail.message
      hasErrors = true;
    }

    if(!fields.facebookUri.val || fields.facebookUri.val.trim() === ''){
      errors.facebookUri = fields.facebookUri.message
      hasErrors = true;
    }

    if(!fields.twitterUri.val || fields.twitterUri.val.trim() === ''){
      errors.twitterUri = fields.twitterUri.message
      hasErrors = true;
    }

    if(!fields.googleUri.val || fields.googleUri.val.trim() === ''){
      errors.googleUri = fields.googleUri.message
      hasErrors = true;
    }

    callback(hasErrors && errors)
  }

  validateTestimony(valObj, callback){
    let errors = {};
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.message.val || fields.message.val.trim() === ''){
      errors.message = fields.message.message
      hasErrors = true;
    }

    callback(hasErrors && errors)
  }

  validateProfileDetails(valObj, callback){
    let errors = {}
    let hasErrors = false

    let fields = valObj.fields

    if(!fields.phone.val || fields.phone.val.trim() === ''){
      errors.phone = fields.phone.message
      hasErrors = true
    }

    if(!fields.bitcoinAddress.val || fields.bitcoinAddress.val.trim() === ''){
      errors.bitcoinAddress = fields.bitcoinAddress.message
      hasErrors = true
    }

    callback(hasErrors && errors)
  }

  validateProfilePassword(valObj, callback){
    let errrors = {}
    let hasErrors = false

    let fields = valObj.fields

    if(!fields.password.val || fields.password.val.trim() === ''){
      errors.password = fields.password.message
      hasErrors = true;
    }

    if ((!fields.confirmPassword.val || fields.confirmPassword.val.trim() === '') || fields.password.val !== fields.confirmPassword.val) {
      errors.password = 'Password and retyped password don\'t match';
      errors.password = 'Password and retyped password don\'t match';
      hasErrors = true;
    }

    callback(hasErrors && errors)
  }

  validateAdminUser(valObj, callback){
    let errors = {};
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.email.val || fields.email.val.trim() === ''){
      hasErrors = true;
      errors.email = fields.email.message
    }

    if(fields.email.val && fields.email.val.trim() !== ''){
      if(!this.emailValidation(fields.email.val.trim())){
        hasErrors = true;
        errors.email = 'Please enter a valid email address.'
      }
    }

    if(!fields.name.val || fields.name.val.trim() === ''){
      hasErrors = true;
      errors.name = fields.name.message
    }

    if(!fields.phone.val || fields.phone.val.trim() === ''){
      hasErrors = true;
      errors.phone = fields.phone.message
    }

    if(!fields.phone.val || fields.phone.val.trim() === ''){
      hasErrors = true;
      errors.phone = fields.phone.message
    }

    if(!fields.country.val || fields.country.val.trim() === ''){
      hasErrors = true;
      errors.country = fields.country.message
    }

    if(!fields.bitcoinAddress.val || fields.bitcoinAddress.val.trim() === ''){
      hasErrors = true;
      errors.bitcoinAddress = fields.bitcoinAddress.message
    }

    callback(hasErrors && errors)
  }

  validateTrading(valObj, callback){
    let errors = {}
    let hasErrors = false

    let fields = valObj.fields

    if(!fields.amount.val || fields.amount.val === ''){
      errors.amount = fields.amount.message;
      hasErrors = true;
    }

    callback(hasErrors && errors)
  }

  validateWithdrawal(valObj, callback){
    let errors = {}
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.amount.val || fields.amount.val === ''){
      errors.amount = fields.amount.message
      hasErrors = true;
    }

    // if(fields.amount.val && typeof(fields.amount.val) != 'number'){
    //   errors.amount = 'Please enter a correct bitcoin amount.'
    //   hasErrors = true;
    // }

    callback(hasErrors && errors)
  }

  validateNotification(valObj, callback){
    let errors = {}
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.subject.val || fields.subject.val === ''){
      errors.subject = fields.subject.message
      hasErrors = true;
    }

    if(!fields.message.val || fields.message.val === ''){
      errors.message = fields.message.message
      hasErrors = true;
    }

    callback(hasErrors && errors)
  }

  validateMail(valObj, callback){
    let errors = {}
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.subject.val || fields.subject.val === ''){
      errors.subject = fields.subject.message
      hasErrors = true;
    }

    if(!fields.message.val || fields.message.val === ''){
      errors.message = fields.message.message
      hasErrors = true;
    }

    if(!fields.recipient.val || fields.recipient.val === ''){
      errors.recipient = fields.recipient.message
      hasErrors = true;
    }

    if(fields.recipient.val && fields.recipient.val.trim() !== ''){
      if(!this.emailValidation(fields.recipient.val.trim())){
        hasErrors = true;
        errors.recipient = 'Please enter a valid recipient email address.'
      }
    }


    callback(hasErrors && errors)
  }

  validateSettingNew(valObj, callback){
    let errors = {};
    let hasErrors = false;

    let fields = valObj.fields;

    if(!fields.siteName.val || fields.siteName.val.trim() === ''){
      errors.siteName = fields.siteName.message;
      hasErrors = true;
    }

    if(!fields.siteOwner.val || fields.siteOwner.val.trim() === ''){
      errors.siteOwner = fields.siteOwner.message;
      hasErrors = true;
    }

    if(!fields.siteDescription.val || fields.siteDescription.val.trim() === ''){
      errors.siteDescription = fields.siteDescription.message;
      hasErrors = true;
    }

    if(!fields.siteMail.val || fields.siteMail.val.trim() === ''){
      errors.siteMail = fields.siteMail.message;
      hasErrors = true;
    }

    if(!fields.facebookUri.val || fields.facebookUri.val.trim() === ''){
      errors.facebookUri = fields.facebookUri.message;
      hasErrors = true;
    }

    if(!fields.twitterUri.val || fields.twitterUri.val.trim() === ''){
      errors.twitterUri = fields.twitterUri.message;
      hasErrors = true;
    }

    if(!fields.googleUri.val || fields.googleUri.val.trim() === ''){
      errors.googleUri = fields.googleUri.message;
      hasErrors = true;
    }

    if(!fields.email.val || fields.email.val.trim() === ''){
      hasErrors = true;
      errors.email = fields.email.message
    }

    if(!fields.password.val || fields.password.val.trim() === ''){
      hasErrors = true;
      errors.password = fields.password.message
    }

    if(fields.email.val && fields.email.val.trim() !== ''){
      if(!this.emailValidation(fields.email.val.trim())){
        hasErrors = true;
        errors.email = 'Please enter a valid email address.'
      }
    }

    if(!fields.name.val || fields.name.val.trim() === ''){
      hasErrors = true;
      errors.name = fields.name.message
    }

    if(!fields.phone.val || fields.phone.val.trim() === ''){
      hasErrors = true;
      errors.phone = fields.phone.message
    }



    callback(hasErrors && errors)
  }
}

module.exports = {
  validateForm: new FormValidation()
};
