var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dogfriendsdb'
});

conn.connect();



//------------------------------------------------------------------------------------------------post 영역

//로그인
router.post('/login', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "select * from users where users_ID = ? AND users_PW = ?";
  conn.query(sql, [body.id, body.pw], function (err, row) {

    if (err) {
      console.log(err);
    }
    else {
      if (row[0] == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('잘못입력했습니다.'); history.back(); </script>");
      }
      else {
        sess.userID = row[0].users_id        
        sess.userName = row[0].users_name
        res.redirect("/");
      }
    }
  });
});


//회원가입
router.post('/signup', function (req, res, next) {
  var body = req.body
  var sql = "insert into users (users_id,users_pw,users_name,phonenum,address,sex,age) values (?,?,?,?,?,?,?)"
  if ((body.ID == '') || (body.PW == '') || (body.name == '') || (body.phoneNum == '') || (body.address == '') || (body.email == '') || (body.sex == '') || body.age == '') {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
    res.write("<script> alert('모두 입력해주세요.'); history.back(); </script>");
  }
  else {
    conn.query(sql, [body.id, body.pw, body.name, body.phonenum, body.address, body.sex, body.age], function (err, row) {
      if (err) {
         console.log(err);
         
        console.log("회원가입에러",body.id, body.pw, body.name, body.phonenum, body.address, body.sex, body.age);
        
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('아이디가 중복되었습니다..'); history.back(); </script>");
      }
      else {
        res.redirect("/login");
      }
    });
  }
});

//개인정보수정
router.post('/myinfoupdate', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "update users set users_pw = ?, phonenum=?, address=? where users_id = ?"
  conn.query(sql, [body.pw, body.phonenum, body.address, sess.userID], function (err, row) {
    console.log(body.pw, body.phonenum, body.address, sess.userID);
    res.redirect("/mypage");
  });
});

//펫추가
router.post('/petadd', function (req, res, next) {
  var sess=req.session
  var body = req.body
  var sql = "insert into pet (users_id,pet_name,pet_kind,pet_age,pet_weight) values (?,?,?,?,?)"
  if ((body.petname == '') || (body.petkind == '') || (body.petage == '') || (body.petweight == '')){
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
    res.write("<script> alert('모두 입력해주세요.'); history.back(); </script>");
  }
  else {
    conn.query(sql, [sess.userID, body.petname, body.petkind, body.petage, body.petweight], function (err, row) {
      if (err) {
         console.log(err);
         
        console.log("펫 등록 에러",body.id, body.petname, body.petkind, body.petage, body.petweight);
        
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('펫 등록 실패'); history.back(); </script>");
      }
      else {
        res.redirect("/mypage");
      }
    });
  }
});

//펫정보수정
router.post('/petupdate/:pet_num', function (req, res, next) {
  console.log("asdasdasd");
  
  var sess = req.session
  var body = req.body
  var params=req.params
  var sql = "update pet set pet_name = ?, pet_kind=?, pet_age=?, pet_weight=? where pet_num = ?"
  conn.query(sql, [body.petname, body.petkind, body.petage, body.petweight,params.pet_num], function (err, row) {
    console.log("asdasd",body.petname, body.petkind, body.petage, body.petweight,params.pet_num);
    res.redirect("/petdetail/"+params.pet_num);
  });
});

//펫정보삭제
router.post('/petdetail/:pet_num', function (req, res, next) {
  console.log("asdasdasd");
  var params=req.params
  var sql = "delete from pet where pet_num = ?"
  conn.query(sql, [params.pet_num], function (err, row) {
    res.redirect("/mypage");
  });
});

//------------------------------------------------------------------------------------------------get 영역

//메인페이지
router.get('/', function(req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "select * from users where users_id = ? ";

  conn.query(sql, [sess.userID], function (err, row) {    
      res.render('./main/index', { title: '도그프렌드' , users : row[0], users:req.session});
  });
});

//로그인페이지
router.get('/login', function(req, res, next) {
  res.render('./login/login', { title: '도그프렌드', users:req.session });
});
//로그아웃
router.get("/logout", function (req, res, next) { //세션 탈출탈출
  req.session.destroy();
  res.clearCookie('userid');
  res.redirect("/")
});


//회원가입
router.get('/signup', function(req, res, next) {
  res.render('./signup/signup', { title: '도그프렌드', users:req.session });
});

//마이페이지
router.get('/mypage', function(req, res, next) {
  var sess = req.session
  var sql1 = "select * from pet where users_id = ? ";
  var sql2 = "select * from users where users_id = ? ";
  var sql3 = "SELECT * FROM `caredog` WHERE users_id = ?"
  var caresql = "SELECT * FROM caredogrequest WHERE caredog_num = ?"
  conn.query(sql1, [sess.userID], function (err, row1) {    
      conn.query(sql2, [sess.userID], function (err, row2) {          
        conn.query(sql3, [sess.userID],function(err, row3){ 
          conn.query(caresql, [row3[0].caredog_num], function (err, row4) {
            res.render('./mypage/mypage', { title: '도그프렌드', users:req.session, pet : row1, noo:row4,userr : row2[0]});
          })
        });
      });
  });
});

//개인정보 수정
router.get('/myinfoupdate', function(req, res, next) {
  var sess = req.session
  var sql = "select * from users where users_id = ? ";
  conn.query(sql, [sess.userID], function (err, row) {    
    res.render('./myinfoupdate/myinfoupdate', { title: '도그프렌드' , users:req.session, LID:req.session.userID, users : row[0]});
  });
});

//펫추가
router.get('/petadd', function(req, res, next) {
  res.render('./petadd/petadd', { title: '도그프렌드', users:req.session });
});
    
//펫정보
router.get('/petdetail/:pet_num', function(req, res, next) {
  var params=req.params
  var sql = "select * from pet where pet_num = ? ";
  conn.query(sql, [params.pet_num], function (err, row) {
    res.render('./petdetail/petdetail', { title: '도그프렌드' , users:req.session, pet:row[0]});
  });
});

//펫정보수정
router.get('/petupdate/:pet_num', function(req, res, next) {
  var sess = req.session
  var params=req.params
  var sql = "select * from pet where pet_num = ? ";
  conn.query(sql, [params.pet_num], function (err, row) {    
    console.log(row)
    res.render('./petupdate/petupdate', { title: '도그프렌드' , users:req.session, pet:row[0] });
  });
});

router.get('/finish/:caredog_num', function (req, res, next) {
  console.log("asdasdasd");
  var params=req.params
  var sql2 = `update caredogrequest set state = 'finish' where caredog_num = ?`
  conn.query(sql2, [params.caredog_num], function (err, row) {
    res.redirect("/mypage")
    });
});

module.exports = router;
