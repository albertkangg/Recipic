#!/usr/bin/nodejs

var express = require('express');
var https = require('https');
const { AuthorizationCode } = require('simple-oauth2');
var app = express();
var mysql = require('mysql');

var hbs = require('hbs');

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

app.set('trust proxy', 1);
app.set('view engine', 'hbs');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var cookieSession = require('cookie-session');
app.use(cookieSession({
    name: 'tempcookie',
    keys: ['temp']
}));


var path = require('path');
const { config } = require('process');
console.log(__dirname);
app.use(express.static(path.join(__dirname,'static')));

//mysql
var pool = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'accounts'
});
//functions

function checkAuthentication(req,res,next){
    if('authenticated' in req.session){
        next();
    }
    else{
        res.render('sign-in-slideshow');
    }
}
// pages
app.get('/',[checkAuthentication],function(req,res){
    res.render('file-drop-page');
});

app.get('/logout',function(req,res){
    delete req.session.authenticated;
    res.redirect('./');
})

app.get('/temp',function(req,res){
    res.render('sign-in-slideshow')
})

app.get('/signin',function(req,res){
    console.log(req.query);
    const {signin_username,signin_password,signup_username,signup_password} = req.query;
    // console.log(signup_username);
    // console.log(signup_password)
    if((signup_username !== null || signup_password !== null)&&(signup_username !== undefined || signup_password !== undefined)){
        // console.log("1")
        if(signup_username === "" || signup_password === "" || signup_username === undefined || signup_password === undefined){
            var params = {
                'message':'Please fill out both email and password.'
            }
            res.json(params);
        }
        else{
            var check = 'SELECT EXISTS(SELECT 1 FROM users WHERE USERNAME = "'+pool.escape(signup_username)+'") AS mycheck;'
            pool.query(check,function(error,results,fields){
                if (error) throw error;
                // console.log(results[0].mycheck)
                if(results[0].mycheck === 1){
                    var params = {
                        'message':'Account already exists.'
                    }
                    res.json(params);
                }
                else{
                    var create = 'INSERT INTO users(USERNAME,PASSWORD) values ("' + pool.escape(signup_username)+'", "' + pool.escape(signup_password) +'");';
                    pool.query(create,function(error,results,fields){
                        if (error) throw error;
                        var params = {
                            'message':'Succesfully registered.'
                        }
                        res.json(params);
                    })
                }
            })
        }
    }
    else if((signin_username !== null || signin_password !== null)&&(signin_username !== undefined || signin_password !== undefined)){
        if(signin_username === "" || signin_password === "" || signin_username === undefined || signin_password === undefined){
            var params = {
                'message':'Please fill out both email and password.'
            }
            res.json(params);
        }
        else{
            var check = 'SELECT EXISTS(SELECT 1 FROM users WHERE USERNAME = "'+pool.escape(signin_username)+'" AND PASSWORD = "' + pool.escape(signin_password)+ '") AS mycheck;'
            pool.query(check,function(error,results,fields){
                if (error) throw error;
                // console.log(results[0].mycheck)
                if(results[0].mycheck === 1){
                    var params = {
                        'message':'Logged in succesfully! Reload to access content.'
                    }
                    req.session.authenticated = true;
                    res.json(params);
                }
                else{
                    var params = {
                        'message':'Email and password combination does not exist.'
                    }
                    res.json(params);
                }
            });
        }
    }
});

app.get('/test',function(req,res){
    res.render('ai-test');
});

app.get('/sql-test',function(req,res){
    var test = 'INSERT INTO users(USERNAME,PASSWORD) values ("' + pool.escape('kevinchong@gmail.com')+'", "' + pool.escape('kevin') +'") ON DUPLICATE KEY update password = "' + pool.escape('kevin2') + '";'
    console.log(test);
    pool.query(test,function(error,results,fields){
        if (error) throw error;
        var test2 = 'SELECT * FROM users;'
        console.log(test2);
        pool.query(test2,function(error,results,fields){
            console.log(results);
        })
    })
    res.render('ai-test');
})

app.get('/recipes',[checkAuthentication],function(req,res){
    var data = null;

    const{food} = req.query;

    console.log(food);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            // console.log(this.responseText);
        }
    });

    xhr.open("GET", "https://edamam-recipe-search.p.rapidapi.com/search?q=" + food,false);
    xhr.setRequestHeader("x-rapidapi-host", "edamam-recipe-search.p.rapidapi.com");
    xhr.setRequestHeader("x-rapidapi-key", "c3bf74eafbmshb351a84518de8a8p1935dbjsn636a7225933e");

    xhr.send();
    data=xhr.responseText;
    var jsonResponse = JSON.parse(data);
    var params = {
        'recipes' : jsonResponse.hits
    };
    console.log(params.recipes[0].recipe.uri);
    res.render('recipe-page',params);
});


// -------------- listener -------------- //
// // The listener is what keeps node 'alive.' 

var listener = app.listen(5000, function() {
    console.log("Express server started");
});