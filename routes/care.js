var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dogfriendsdb'
});

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

//맡아줄개 등록 저장
var lat = 0, lng = 0;
router.post('/careadd', function (req, res, next) {
  var sess = req.session;
  var body = req.body

  if (body.upload == null) {
    lat = req.query.lat;
    lng = req.query.lng;
    console.log(lat,lng);
    
  }
  else {
    if(lat == 0){
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('지도에 핀을 찍어주세요.'); history.back(); </script>");
    } else if(body.week == null){
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('요일을 선택해 주세요.'); history.back(); </script>");
    } else {
      var caresql = "INSERT INTO caredog(users_id, title, caredog_etc, latitude, longitude, upprice, downprice) VALUES (?,?,?,?,?,?,?)"
      var sql = "SELECT LAST_INSERT_ID() as caredog_num"
      var weeksql = "SELECT possible_code FROM possibleday WHERE possible_day = ?"
      var daysql = "INSERT INTO possibledaydetail(caredog_num, possible_code) VALUES (?,?)"

      conn.query(caresql, [sess.userID, body.title, body.etc, lat, lng, body.upprice, body.downprice], function (err, row) {
        conn.query(sql, function (err, row1) {
          for (var i = 0; i < body.week.length; i++) {
            conn.query(weeksql, [body.week[i]], function (err, row2) {
              console.log(row2);
              
              conn.query(daysql, [row1[0].caredog_num, row2[0].possible_code])
            })
          }
          res.redirect('/care/caredetail/' + row1[0].caredog_num);
        })
      })
    }
  }
})

// 업데이트 완료 
router.post('/careupdate/:caredog_num', function (req, res, next) {
  var body = req.body;

  if (body.upload == null) {
    lat = req.query.lat;
    lng = req.query.lng;
  }else if(body.week == null){
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
    res.write("<script> alert('요일을 선택해 주세요.'); history.back(); </script>");
  } else {
    var garasql = "SELECT * FROM caredog WHERE caredog_num = ?"
    var caresql = "UPDATE caredog SET title = ?, caredog_etc= ?, latitude= ?, longitude = ?, upprice = ?, downprice = ? WHERE caredog_num = ?"
    var delsql = "DELETE FROM possibledaydetail WHERE caredog_num = ?"
    var weeksql = "SELECT possible_code FROM possibleday WHERE possible_day = ?"
    var daysql = "INSERT INTO possibledaydetail(caredog_num, possible_code) VALUES (?,?)"

    if (lat == 0 || lng == 0) {
      conn.query(garasql, [req.params.caredog_num], function (err, row) {
        conn.query(caresql, [body.title, body.etc, row[0].latitude, row[0].longitude, body.upprice, body.downprice, req.params.caredog_num], function (err, row2) {
          conn.query(delsql,[req.params.caredog_num], function(err, row3){
            for (var i = 0; i < body.week.length; i++) {
              conn.query(weeksql, [body.week[i]], function (err, row2) {
                conn.query(daysql, [req.params.caredog_num, row2[0].possible_code])
              })
            }
            res.redirect('/care/caredetail/' + req.params.caredog_num);
          })
        });
      })
    } else {
      conn.query(caresql, [body.title, body.etc, lat, lng, body.upprice, body.downprice, req.params.caredog_num], function (err, row) {
        conn.query(delsql,[req.params.caredog_num], function(err, row3){
          for (var i = 0; i < body.week.length; i++) {
            conn.query(weeksql, [body.week[i]], function (err, row2) {
              conn.query(daysql, [req.params.caredog_num, row2[0].possible_code])
            })
          }
          res.redirect('/care/caredetail/' + req.params.caredog_num);
        })
      });
    }
  }
})

// 신청하기
router.post('/carerequest/:caredog_num', function(req, res, next){
  var sess = req.session;
  var body = req.body;

  var requestsql = "INSERT INTO caredogrequest(users_id, caredog_num, request_day, start_time, end_time, pet_num) " + 
    " SELECT ? as users_id, ? as caredog_num, SYSDATE() as request_day, ? as start_time, ? as end_time, ? as pet_num"

  conn.query(requestsql, [sess.userID, req.params.caredog_num, body.startDate, body.endDate, body.petnameselect], function(err, row) {
    res.send('<script> alert("신청이 완료 되었습니다."); location.href="/" </script>');
  })

})

// ----------------------------get라우터
//맡아줄개 목록
router.get('/carelist', function (req, res, next) {
  var sess = req.session;

  var caresql = "SELECT * FROM caredog"
  var usersql = "SELECT * FROM users WHERE users_id = ?"
  var sql = "SELECT * FROM caredog where users_id = ?"

  conn.query(caresql, function (err, row) {
    conn.query(usersql,[sess.userID], function(err, row2) {
      conn.query(sql,[sess.userID], function (err, row3) {
        console.log(row3);
        res.render('./carelist/carelist', { users: sess, auth: row2, list: row, noo:row3 , title: '도그프렌드' });
      })
    })
  })
});

//맡아줄개 등록
router.get('/careadd', function (req, res, next) {
  var sess = req.session;

  var usersql = "SELECT * FROM users WHERE users_id = ?"

  conn.query(usersql, [sess.userID], function (err, row) {
    res.render('./careadd/careadd', { users:sess, userr: row, title: '도그프렌드' });
  })
});

//맡아줄개 상세
router.get('/caredetail/:caredog_num', function (req, res, next) {
  var sess = req.session;

  var caresql = "SELECT * FROM caredog,users WHERE caredog.users_id = users.users_id AND caredog_num = ?"
  var weeksql = "SELECT * FROM possibledaydetail,possibleday WHERE possibledaydetail.possible_code = possibleday.possible_code AND possibledaydetail.caredog_num = ?"

  conn.query(caresql, [req.params.caredog_num], function (err, row) {
    conn.query(weeksql, [req.params.caredog_num], function (err, row1) {
      res.render('./caredetail/caredetail', { care: row, week: row1, users: sess, title: '도그프렌드' });
    })
  })
});

//맡아줄개 수정
router.get('/careupdate/:caredog_num', function (req, res, next) {
  var updatesql = "SELECT * FROM caredog, possibledaydetail WHERE caredog.caredog_num = possibledaydetail.caredog_num AND caredog.caredog_num = ?"
  var usersql = "SELECT * FROM users WHERE users_id = ?"
  var sess = req.session;

  conn.query(updatesql, [req.params.caredog_num], function (err, row) {
    conn.query(usersql, [req.session.userID], function (err, row1) {
      res.render('./careupdate/careupdate', { users: sess, writer: row, userr: row1, title: '도그프렌드' });
    })
  })
});

//맡아줄개 신청
router.get('/carerequest/:caredog_num', function (req, res, next) {
  var sess = req.session;
  
  var usersql = "SELECT * FROM users,pet WHERE users.users_id = pet.users_id AND users.users_id = ?"
  var caresql = "SELECT * FROM caredog WHERE caredog_num = ?"

  conn.query(usersql, [sess.userID], function(err, row){
    conn.query(caresql, [req.params.caredog_num], function(err, row1){
      res.render('./carerequest/carerequest', { userr: row, request:row1 ,users: sess, title: '도그프렌드' });
    })
  })
});

//맡아줄개 승인
router.get('/careaccept/', function(req, res, next) {
  var sess = req.session;

  var accsql = "SELECT * FROM caredogrequest WHERE users_id =? AND caredog_num = ?"
  var usersql = "SELECT * FROM users,pet WHERE users.users_id = pet.users_id AND users.users_id = ? AND pet_num = ?"

  conn.query(accsql, [req.query.users_id, req.query.caredog_num], function (err, row) {
    conn.query(usersql, [req.query.users_id, row[0].pet_num], function (err, row2) {
      res.render('./careaccept/careaccept', {acc : row, userr:row2 , users: sess, title: '도그프렌드'})
    })
  })
})

router.get('/care_Y/', function (req, res, next) {
  var sess = req.session;
  
  var updatesql = "UPDATE caredogrequest SET state = ?, request_day = ? WHERE users_id = ? AND caredog_num = ?"

  conn.query(updatesql, ['y', today, req.query.users_id, req.query.caredog_num], function(err, row) {
    res.send('<script>location.href="/request/requestlist"; </script>');
  })
})

router.get('/care_N/', function (req, res, next) {
  var sess = req.session;
  
  var updatesql = "UPDATE caredogrequest SET state = ?, request_day = ? WHERE users_id = ? AND caredog_num = ?"

  conn.query(updatesql, ['n', today, req.query.users_id, req.query.caredog_num], function(err, row) {
    res.send('<script>location.href="/request/requestlist"; </script>');
  })
})

module.exports = router;