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

//부탁할개리스트
router.get('/pleaselist', function (req, res, next) {
    var sess = req.session;

    var sql = "SELECT * FROM pleasedog"

    conn.query(sql, function (err, row) {        
        res.render('./pleaselist/pleaselist', { list : row, users : sess,title: '도그프렌드' });
    })
});

//부탁할게리스트에서 부탁할게 상세로
router.post('/pleasedetail/:pleasedog_num', function (req, res, next) {
    var params = req.params;
    
    var numsql = "SELECT * FROM pleasedog WHERE pleasedog_num = ?";

    conn.query(numsql, [params.pleasedog_num], function (err, row) {
        res.redirect('/please/pleasedetail' + params.pleasedog_num);
    })
});

//부탁할개 상세
router.get('/pleasedetail/:pleasedog_num', function (req, res, next) {
    var sess = req.session;
    var params = req.params;
    
    var pleasesql = "SELECT * FROM userspleasedog,pleasedog,users WHERE userspleasedog.pleasedog_num = pleasedog.pleasedog_num AND users.users_id = userspleasedog.users_id AND pleasedog.pleasedog_num = ?"
    var petsql = "SELECT * FROM pet WHERE users_id = ? AND pet_num = ?"

    conn.query(pleasesql,[params.pleasedog_num], function(err, row) {
        conn.query(petsql,[row[0].users_id, row[0].pet_num], function (err, row1) {
            console.log("pet",row1);
                     
            res.render('./pleasedetail/pleasedetail', {users:sess, please : row, pet : row1 , title: '도그프렌드' });
        })
    })

});

//부탁할개추가
router.get('/pleaseadd', function (req, res, next) {
    var sess = req.session;

    var usersql = "SELECT * FROM users WHERE users_id = ?"
    var petsql = "SELECT * FROM pet WHERE users_id = ?"

    conn.query(usersql, [sess.userID], function (err, row) {
        conn.query(petsql, [sess.userID], function (err, row2) {
            res.render('./pleaseadd/pleaseadd', { users: sess, userr: row, pet: row2, title: '도그프렌드' });
        })
    })
});


//부탁할개추가 등록
var lat=0,lng=0;
router.post('/pleaseadd', function (req, res, next) {
    var sess = req.session;
    var body = req.body;

    if (body.upload == null) {
        lat = req.query.lat;
        lng = req.query.lng;
        
    }
    else {
        if(lat == 0){
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
            res.write("<script> alert('지도에 핀을 찍어주세요.'); history.back(); </script>");
        } else{
            var pleasesql = "INSERT INTO pleasedog(start_time, end_time, pleasedog_etc, latitude, longitude, title, pet_num) VALUES (?,?,?,?,?,?,?)"
            var AIsql = "select LAST_INSERT_ID() as pleasedog_num";
            var userplesql = "INSERT INTO userspleasedog(users_id, pleasedog_num) VALUES (?,?)"

            if(body.petnameselect == null){
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
                res.write("<script> alert('개를 선택하세요.'); history.back(); </script>");
            } else{
                conn.query(pleasesql, [body.startDate, body.endDate, body.etc, lat, lng, body.content, body.petnameselect], function (err, row2) {
                    conn.query(AIsql, function (err, row3) {
                        conn.query(userplesql, [sess.userID, row3[0].pleasedog_num], function (err, row4) {
                            res.redirect('/please/pleasedetail/' + row3[0].pleasedog_num);
                        });
                    });
                });
            }
        }
    }
});


// 수정 페이지 등록
router.post('/pleaseupdate/:pleasedog_num', function (req, res, next) {
    var body = req.body;
    console.log('들어왔냐 ');
    console.log(body);
    

    if (body.upload == null) {
        lat = req.query.lat;
        lng = req.query.lng;
    }
    else {
        var garasql = "SELECT * FROM pleasedog WHERE pleasedog_num = ?"
        var pleasesql = "UPDATE pleasedog SET start_time = ?, end_time = ?, pleasedog_etc = ?, latitude = ?, longitude = ?, title = ?, pet_num = ? WHERE pleasedog_num = ?"

        if(lat == 0 || lng == 0){
            conn.query(garasql,[req.params.pleasedog_num], function (err, row) {
                conn.query(pleasesql, [body.startDate, body.endDate, body.etc, row[0].latitude, row[0].longitude, body.content, body.petnameselect, req.params.pleasedog_num], function (err, row2) {
                    res.redirect('/please/pleasedetail/' + req.params.pleasedog_num);
                });
            })
        }else{
            conn.query(pleasesql, [body.startDate, body.endDate, body.etc, lat, lng, body.content, body.petnameselect, req.params.pleasedog_num], function (err, row2) {
                if(err){ console.log(err);} else{
                    res.redirect('/please/pleasedetail/' + req.params.pleasedog_num);
                }
            });
        }
    }
});

//부탁할개수정
router.get('/pleaseupdate/:pleasedog_num', function (req, res, next) {
    var sess = req.session;
    var params = req.params;

    var pleasesql = "SELECT * FROM userspleasedog,pleasedog,users WHERE userspleasedog.pleasedog_num = pleasedog.pleasedog_num AND users.users_id = userspleasedog.users_id AND pleasedog.pleasedog_num = ?"
    var petsql = "SELECT * FROM pet WHERE users_id = ?"

    conn.query(pleasesql,[params.pleasedog_num],function(err, row) {
        conn.query(petsql,[sess.userID], function (err, row1) {
            res.render('./pleaseupdate/pleaseupdate', { users: sess, writer: row, pet:row1 ,title: '도그프렌드' });
        })
    })
});

router.get('/pleaserequest/:pleasedog_num', function (req, res, next) {
    var sess = req.session;

    var insertsql = "INSERT INTO pleasedogrequest(users_id, pleasedog_num) VALUES (?,?)"

    conn.query(insertsql, [sess.userID, req.params.pleasedog_num], function (err, row) {
        res.send('<script> alert("신청이 완료 되었습니다."); location.href="/please/pleaselist" </script>');
    })
})

router.get('/pleaseaccept/:pleasedog_num', function (req, res, next) {
    var sess = req.session;

    var accsql = "SELECT * FROM pleasedogrequest,users WHERE pleasedogrequest.users_id = users.users_id AND pleasedog_num = ?"

    conn.query(accsql, [req.params.pleasedog_num], function (err, row) {
        res.render('./pleaseaccept/pleaseaccept', { acc:row, users:sess, title: '도그프렌드' });
    })
});

router.get('/please_Y/', function (req, res, next) {
    var sess = req.session;
    var dogquery = req.query.pleasedog_num;

    var updatesql = "UPDATE pleasedogrequest SET state = ? WHERE users_id = ? AND pleasedog_num = ?"
    var Nupdatesql = "UPDATE pleasedogrequest SET state= ? WHERE pleasedog_num = ? AND state = ?"
  
    conn.query(updatesql, ['y', req.query.users_id, req.query.pleasedog_num], function(err, row) {
        conn.query(Nupdatesql, ['n', req.query.pleasedog_num, 'wait'], function(err, row2){
            res.send(`<script>location.href="/please/pleaseaccept/" + ${dogquery}; </script>`);
        })
    })
})
  
router.get('/please_N/', function (req, res, next) {
    var sess = req.session;
    var dogquery = req.query.pleasedog_num;

    var updatesql = "UPDATE pleasedogrequest SET state = ? WHERE users_id = ? AND pleasedog_num = ?"
  
    conn.query(updatesql, ['n', req.query.users_id, req.query.pleasedog_num], function(err, row) {
        res.send(`<script>location.href="/please/pleaseaccept/" + ${dogquery}; </script>`);
    })
})

module.exports = router;