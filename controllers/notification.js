const { Notification } = require('../db/models'),
  { User } = require('../db/models'),
  {validateForm} = require('../utils/validation');

module.exports = (io) => {
  return {
    index: (req, res) => {
      let limit = 9;   // number of records per page
      let offset = 0;

      Notification.findAndCountAll({where: {recipient: res.locals.userDetails.id}})
        .then((data) => {
          let page = (req.query.page)?req.query.page:1;      // page number
          let pages = Math.ceil(data.count / limit);
          offset = limit * (page - 1);

          Notification.findAll({
            where: {recipient: res.locals.userDetails.id},
            limit: limit,
            offset: offset,
            $sort: { id: 1 },
            order: [ ['createdAt', 'DESC'] ]
          }).then(notification => {
            res.render('backend/pages/notifications', {notifications: notification, 'count': data.count, current: page, 'pages': pages})

          });
        })
    },
    show: (req, res) => {
      Notification.findOne({where: {recipient: req.session.user, id: req.params.id}}).then(notification => {
        if(!notification) return res.send(404)

        if(!notification.isRead){
          Notification.update({
            isRead: 1
          }, {where: {
              id: req.params.id
            }})
        }

        res.render('backend/pages/notification', {notification: notification})
      })
    },
    listShow: (req, res) => {
      Notification.findAll({where: {recipient: req.session.user, isRead: 0}, order: [ ['createdAt', 'DESC'] ] }).then(data => {
        res.json({count: data.length, notifications: data})
      })
    },
    save: (req, res) => {
      validateForm.validateNotification({
        fields: {
          subject: {val: req.body.subject, message: 'Please enter message title.'},
          message: {val: req.body.message, message: 'Please enter message.'}
        }
      }, (err) => {
        if (err) return res.status(422).json({success: false, response: err});
        
        User.findById(req.body.recipient).then(user => {
          if(!user) return res.status(422).json({sucess: false, response: 'Request not valid.'})

          let msg = req.body.message.trim();
          let briefMsg = msg.substr(0, 45);

          briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

          Notification.create({
            recipient: user.id,
            title: req.body.subject.trim(),
            message: msg,
            briefMessage: briefMsg
          }).then(notification => {
            io.sockets.emit('newNotification.' + notification.recipient, {
              briefMessage: briefMsg,
              id: notification.id,
              createdAt: notification.createdAt,
              title: notification.title
            })
          })

          res.status(200).json({success: true, response: 'Message sent!'})
        })
      });
    }
  }
};
