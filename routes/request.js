var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dogfriendsdb'
});

//------------------------------------------------------------------------------------------------오늘 날짜

var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yyyy = today.getFullYear();

if (dd < 10) {
  dd = '0' + dd
}

if (mm < 10) {
  mm = '0' + mm
}

today = mm + '/' + dd + '/' + yyyy;

conn.connect();

//------------------------------------------------------------------------------------------------post 영역

//프렌즈 신청
router.post('/friendsadd', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "insert into authrequest (users_id,carecareer) values (?,?)"
  var sql1 = "select * from authrequest where users_id=? and (agree_yn= 'wait' or agree_yn= 'y')"


  conn.query(sql1, [sess.userID], function (err, row1) {
    if (row1.length == 0) {
      conn.query(sql, [sess.userID, body.carecareer], function (err, row) {
        if (err) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
          res.write("<script> alert('신청에 실패했습니다..'); history.back(); </script>");
        }
        else {
          res.redirect("/mypage");
        }
      });
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('이미 신청했습니다.'); history.back(); </script>");
    }
  })

});


//------------------------------------------------------------------------------------------------get 영역

//프렌즈신청
router.get('/friendsadd', function (req, res, next) {
  sess = req.session
  var sql = "select * from users where users_id = ? ";
  conn.query(sql, [sess.userID], function (err, row) {
    res.render('./friendsadd/friendsadd', { title: '도그프렌드', LID: req.session.userID, userr: row[0], users: req.session });
  });
});

//요청목록
router.get('/requestlist', function (req, res, next) {
  sess = req.session;

  var caresql = "SELECT * FROM caredog WHERE users_id = ?"
  var carereqsql = "SELECT * FROM caredogrequest WHERE caredog_num = ?"
  var pleasesql = "SELECT * FROM userspleasedog,pleasedog WHERE userspleasedog.pleasedog_num = pleasedog.pleasedog_num AND users_id = ?"

  conn.query(caresql, [sess.userID], function (err, row) {    
    if(row == ''){
      conn.query(pleasesql, [sess.userID], function (err, row2) {
        res.render('./requestlist/requestlist', { care:row, please: row2, title: '도그프렌드', users: req.session });
      })
    } else{
      conn.query(carereqsql, [row[0].caredog_num], function (err, row1) {
        conn.query(pleasesql, [sess.userID], function (err, row2) {
          res.render('./requestlist/requestlist', { care: row1, please: row2, title: '도그프렌드', users: req.session });
        })
      })
    }
  });
});

//프렌즈 신청 목록
router.get('/friendslist', function (req, res, next) {
  sess = req.session
  var sql = "select * from authrequest where agree_yn = 'wait'";
  conn.query(sql, function (err, row) {
    res.render('./friendslist/friendslist', { title: '도그프렌드', authreq: row, users: req.session });
  });
});

//프렌즈 상세
router.get('/friendsdetail/:authreq_num', function (req, res, next) {
  var params = req.params
  var sql1 = "select * from authrequest where authreq_num = ?";
  var sql2 = "select * from users where users_id = ?";

  conn.query(sql1, [params.authreq_num], function (err, row1) {
    conn.query(sql2, [row1[0].users_id], function (err, row2) {
      res.render('./friendsdetail/friendsdetail', { title: '도그프렌드', users: req.session, users: row2, carecareer: row1[0].carecareer, authreq_num: params.authreq_num });
    });
  });
});

//프렌즈 신청 수락
router.get('/:authreq_num/friend_y', function (req, res, next) {
  var sql = "update authrequest set agree_yn = ?, agree_date=? where authreq_num = ? "
  var selectsql = "SELECT users_id FROM authrequest WHERE authreq_num = ?"
  var updatesql = "UPDATE users SET auth = ? WHERE users_id = ? "
  conn.query(sql, ['y', today, req.params.authreq_num], function (err, row) {
    conn.query(selectsql, [req.params.authreq_num], function(err, row2){
      conn.query(updatesql, ['y',row2[0].users_id], function(err, row3){
        res.redirect("/");
      })
    })
  })
})

//프렌즈 신청 거절
router.get('/:authreq_num/friend_n', function (req, res, next) {
  var sql = "update authrequest set agree_yn = ?, agree_date=? where authreq_num = ? "
  var selectsql = "SELECT users_id FROM authrequest WHERE authreq_num = ?"
  var updatesql = "UPDATE users SET auth = ? WHERE users_id = ? "
  conn.query(sql, ['n', today, req.params.authreq_num], function (err, row) {
    conn.query(selectsql, [req.params.authreq_num], function(err, row2){
      conn.query(updatesql, ['n',row2[0].users_id], function(err, row3){
        res.redirect("/");
      })
    })
  })
})

module.exports = router;