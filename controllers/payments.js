const models = require('../db/models');

module.exports = (io) => {
  return {
    index: (req, res) => {
      return res.render('backend/pages/payment')
    },
    view: (req, res) => {
      let limit = 8;   // number of records per page
      let offset = 0;

      let sort = (req.query.sort)?req.query.sort:0;

      const Op = models.Sequelize.Op;

      models.Payments.findAndCountAll({
        include: [ {model: models.User }],
        where: {
          payed: false
        }
      })
        .then((data) => {
          let page = (req.query.page)?req.query.page:1;      // page number
          let pages = Math.ceil(data.count / limit);
          offset = limit * (page - 1);

          models.Payments.findAll({
            include: [ {model: models.User }],
            limit: limit,
            offset: offset,
            $sort: { id: 1 },
            where: {
              payed: false
            },
            order: [ ['createdAt', (sort == 0)?'DESC': 'ASC'] ]
          }).then(payments => {
            res.json({
              total: data.count, count: data.count, current: page, pages: pages, payments: payments
            })
          });
        });
    },
    paid: (req, res) => {
      models.Payments.findById(req.body.id).then(payment => {
        if(!payment) return res.status(422).json({success: false, response: 'Request not valid.'})

        if(payment.payed) return res.status(422).json({success: false, response: 'Payment already confirmed.'})

        models.Payments.update({payed: 1}, {where: {id: payment.id}}).then(paymentUpdated => {
          if(!paymentUpdated) return res.status(422).json({success: false, response: 'Request could not be completed.'});

          if(payment.transaction){
            models.Trade.update({
              totalEarnings: models.Sequelize.literal('totalEarnings + '+payment.amount)
            }, {where: {id: payment.transaction}}).then(transactionUpdated => {
              models.Wallet.update({
                balance: models.Sequelize.literal('balance + '+payment.amount)
              }).then(walletUpdated => {
                models.Trade.findById(payment.transaction).then(transaction => {
                  if(transaction.earning == transaction.totalEarnings){
                    models.Trade.update({
                      status: 2
                    }, {where: {id: payment.transaction}})
                  }
                })
              })
            })
          }

          return res.status(200).json({success: true, response: 'Payment confirmed!'})
        })
      })
    }
  }
};
