//here is where you'll set up your server as shown in lecture code.
const express = require('express');
const app = express();
const helpers = require('./helpers');
const configRoutes = require('./routes');
const session = require('express-session');
const redis = require('redis');
const client = redis.createClient();
client.connect().then(() => {});

const objc={};

app.use(express.json());

app.use(session({
  name: 'AuthCookie',
  secret: "some secret string!",
  saveUninitialized: true,
  resave: false,
}));

app.use((req, res, next) => {
  console.log('URL:- ',req.url);
  console.log('HTTP verb:- ',req.method);
  const body=JSON.parse(JSON.stringify(req.body)); 
  if(body.password){
    delete body.password;
  }
  console.log('Request Body:- ',body)
  next();
});

app.use((req, res, next) => {
  if(req.originalUrl in objc){
    objc[req.originalUrl]=objc[req.originalUrl]+1
  }else{
    objc[req.originalUrl]=1
  }
  console.log(objc)
  next();
});

app.use('/login',async(req, res, next) => {
  let exist=await client.exists('credentials');
  if(exist){
    return res.status(401).json({error:'you are already logged-in'});
  }
  next();
});

app.use('/recipes/:id',async (req, res,next) => {
  if(req.method=="GET"){
    //console.log('in recipes/:id middleware')
    let exist=await client.exists('/recipes/'+req.params.id);
    if(exist){
      let checkInMostAccessed=await client.zRank('mostAccessed','/recipes/'+req.params.id);
      //console.log("**********",checkInMostAccessed);
      if(checkInMostAccessed!==null){
        //console.log('found in mostaccessed');
        await client.zIncrBy('mostAccessed',1,'/recipes/'+req.params.id);
      }else{
        //console.log('not found in mostaccessed');
        await client.zAdd('mostAccessed',{ score:1, value:'/recipes/'+req.params.id });
      }
      let result=await client.get('/recipes/'+req.params.id);
      //console.log('sending from catch...');
      return res.status(200).json(JSON.parse(result));
    }
    else{
      next();
    }
  }else{
    next()
  }
  
});

app.use('/recipes', async (req, res, next) => {
  //getting the original url without the query parameter
  const originalUrl = req.originalUrl;
  const urlObject = new URL('http://localhost:3000'+originalUrl);
  const urlWithoutQuery = urlObject.pathname;
    let exist=await client.exists('credentials');
    if (!exist){
      if(req.method==="POST" || req.method==="PUT" || req.method==="PATCH"){
        //checking for the authentication of the user for post, put and patch methods
        return res.status(401).json({error:"you have to login toaccess this page"})
      }
    }
    if(urlWithoutQuery!=='/recipes'){
      //checking for the other routes rather than /recipe routes and skip if it is 
      //console.log('skipping /recipes route');
      next();
    }else{
      //it will enter this route if and only if the route is /recipe
      if(req.method==="POST"){  
        //console.log('in /recipes post middleware');
        next();
      }else{
        //console.log('in /recipes get middleware');
        const page_no= req.query.page || 1;
        try{
          if(isNaN(page_no)){
              throw 'page number should be valid number';
          }
          if(page_no<1){
              throw 'page number should be greater than 1';
          }
          let exist=await client.exists('/recipes_page_'+page_no);
          if(exist){
            let result=await client.get('/recipes_page_'+page_no);
            //console.log('sending from catch...');
            return res.status(200).json(JSON.parse(result));
          }else{
            next();
          }        
        }catch(e){
            return res.status(400).json({error: e});
        }
      }
    }

});

app.use('/recipes/:id/comments', async(req, res, next) => {
  let exist=await client.exists('credentials');
  if (!exist) {
      return res.status(401).json({error:"you have to login to access this page"})
  }
  next();
});

app.use('/recipes/:id/:commentid', async(req, res, next) => {
  let exist=await client.exists('credentials');
  if (!exist) {
      return res.status(401).json({error:"you have to login to access this page"})
  }
  next();
});

app.use('/recipes/:id/likes', async(req, res, next) => {
  let exist=await client.exists('credentials');
  if (!exist) {
      return res.status(401).json({error:"you have to login to access this page!!"})
  }
  next();
});

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});