const express=require("express"),app=express(),session=require("express-session"),conf=require("./config/setting.json");app.use(session({secret:"myorb[y9bl6-4kr",resave:!1,saveUninitialized:!0}));const config={https_extension:!1,host:"localhost",port:"8099"},oxd=require("oxd-node")(config);app.get("/authen",(req,res)=>{oxd.get_authorization_url({oxd_id:conf.oxd_id,scope:["openid","profile"]},(err,response)=>{if(err){console.log(new Date,"Error : ",err);return}res.redirect(response.data.authorization_url)})});app.get("/uprofile",(req,res)=>{let sess=req.session;if(sess.acc_token&&sess.rtk){if(req.query.rtk==sess.rtk){getUserInfo(sess.acc_token).then(profile=>{if(profile.data.claims.inum){res.send(profile)}else{let newToken=getTokenByRTK(sess.rtk).then(newToken=>{sess.acc_token=newToken.access_token;sess.rtk=newToken.refresh_token;res.cookie("tpbhealth",newToken.refresh_token,{maxAge:216e5,secure:!0})}).catch(err=>{console.log("GETRTK ERR:",err);return})}}).catch(err=>{console.log("GETPROFILE ERR:",err);return})}else res.send({error:"Invalid rtk!"})}else res.send({error:"Token not found."})});app.get("/logout",function(req,res){if(req.session.acc_token&&req.session.rtk){oxd.get_logout_uri({oxd_id:conf.oxd_id},(err,response)=>{if(err){console.log(new Date,"Error : ",err);return}req.session.destroy(err=>{if(err)console.log(err);else{res.clearCookie("tpbhealth");res.redirect(response.data.uri)}})})}else res.redirect(conf.redirect_uri)});app.get("/",(req,res)=>{let sess=req.session;console.log("SESSION:",sess);if(sess.acc_token){console.log(`${new Date}:: Hello, ${sess.uname}`);app.use(express.static("."));res.sendFile("index.html",{root:"."})}else{if(req.query.code){let code=req.query.code,state=req.query.state;getToken(code,state).then(token=>{if(token){sess.acc_token=token.access_token;sess.rtk=token.refresh_token;res.cookie("tpbhealth",token.refresh_token,{maxAge:216e5,secure:!0});getUserInfo(token.access_token).then(profile=>{if(profile){console.log(`${new Date}:: sign in, ${profile.data.claims.name[0]}, ORG: ${profile.data.claims.orgName[0]}`);sess.uname=profile.data.claims.name[0];app.use(express.static("./"));res.redirect("/")}}).catch(err=>{console.log(new Date,"get userinfo error: ",err);return})}}).catch(err=>{console.log(new Date,"Error: ",err);return})}else{oxd.get_authorization_url({oxd_id:conf.oxd_id,scope:["openid","profile"]},(err,response)=>{if(err){console.log(new Date,"Error : ",err);return}res.redirect(response.data.authorization_url)})}}});function getToken(code,state){return new Promise((resolve,reject)=>{if(conf.oxd_id){oxd.get_tokens_by_code({oxd_id:conf.oxd_id,code:code,state:state},(err,response)=>{if(err){console.log(new Date,"Error : ",err);reject(err)}else{resolve(response.data)}})}else{reject(new Error("Not found \"conf.oxd_id\""))}})}function getTokenByRTK(rtk){return new Promise((resolve,reject)=>{if(conf.oxd_id){oxd.get_access_token_by_refresh_token({oxd_id:conf.oxd_id,refresh_token:rtk,scope:["openid","profile"]},(err,response)=>{if(err){console.log("Error : ",err);reject(err)}else{resolve(response.data)}})}else{reject(new Error("Not found \"conf.oxd_id\""))}})}function getUserInfo(accessToken){return new Promise((resolve,reject)=>{if(conf.oxd_id){oxd.get_user_info({oxd_id:conf.oxd_id,access_token:accessToken},(err,response)=>{if(err){console.log("Error : ",err);reject(err)}resolve(response)})}else{reject(new Error("Not found \"conf.oxd_id\""))}})}app.listen(3033,function(){console.log("TanRabad Watch listening with port 3033!")});