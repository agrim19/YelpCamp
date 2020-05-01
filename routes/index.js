    var express=require("express");
    router=express.Router();
    Campground=require("../models/campgrounds")
    Comment=require("../models/comment");
    passport=require("passport")
    User=require("../models/user");
    async=require("async");
    nodemailer=require("nodemailer");
    crypto=require("crypto");
    multer=require("multer");
    storage= multer.diskStorage({
        filename: function(req,file,callback){
            callback(null,Date.now() + file.originalname);
        }
    });

var imageFilter = function(req,file,cb){
    //accept image files only
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error('Only image files are allowed!'),false);
    }
    cb(null,true);
};
var upload=multer({storage:storage, fileFilter:imageFilter});

var cloudinary=require("cloudinary");
cloudinary.config({
    cloud_name: 'dpmswyqtm',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/",function(req,res){
    res.render("landing");
});
//AUTH ROUTES   
//show register form
router.get("/register",function(req,res){
    res.render("register",{page:'register'});
});
//handle register logic
router.post("/register",upload.single('avatar'),(req,res)=>{

    cloudinary.uploader.upload(req.file.path,(result)=>{
        req.body.user.avatar= result.secure_url;
        req.body.user.username=req.body.username;
        if(req.body.adminCode==='secretcode123'){
            req.body.user.isAdmin=true;
        };
        User.register(req.body.user,req.body.password,(err,user)=>{
            if(err)
            {
                req.flash("error",err.message);
                return res.redirect("/register"); 
            }
            passport.authenticate("local")(req,res,()=>{
                req.flash("success","Welcome to YelpCamp "+user.username);
                res.redirect("/campgrounds");
            });
        });
    }); 

    // var newUser=new User(req.body.user);
    // User.register(newUser,req.body.password,(err,user)=>{
    //     if(err)
    //     {
    //         req.flash("error",err.message);
    //         return res.redirect("/register"); 
    //     }
    //     passport.authenticate("local")(req,res,()=>{
    //         req.flash("success","Welcome to YelpCamp "+user.username);
    //         res.redirect("/campgrounds");
    //     });
    // });
});
//show login form
router.get("/login",(req,res)=>{
    res.render("login",{page:"login"});
});
//handle login logic
router.post("/login",passport.authenticate("local",{
    successRedirect:"/campgrounds",
    failureRedirect:"/login",
    failureFlash: 'Invalid username or password. Try again!',
    successFlash: 'Welcome back!'
}),(req,res)=>{
});
//logout route
router.get("/logout",(req,res)=>{
    req.logout();
    req.flash("success","Logged Out successfully!");
    res.redirect("/campgrounds");
}); 


//FORGOT PASSWORD STUFF
//show form
router.get("/forgot",(req,res)=>{
    res.render("forgot");
});
router.post("/forgot",(req,res,next)=>{
    async.waterfall([
        (done)=>{
            crypto.randomBytes(20,function(err,buf){
                var token=buf.toString("hex");
                done(err,token);
            });
        },
        (token,done)=>{
            User.findOne({email:req.body.email},(err,user)=>{
                if(!user){
                    req.flash('error','No account with that email exists.');
                    return res.redirect("/forgot");
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now()+36000000;
                user.save((err)=>{
                    done(err,token,user);
                });
            });
        },
        (token,user,done)=>{
            var smtpTransport = nodemailer.createTransport({
                service:"Gmail",
                auth:{
                    user:'agrimchopra90@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions={
                to:user.email,
                from:'agrimchopra90@gmail.com',
                subject:"Password Reset Link",
                text:'You are recieving this mail. Nice. Click on this link to reset: http://'+req.headers.host+'/reset/'+token+'\n\n'
            };
            smtpTransport.sendMail(mailOptions,function(err){
                console.log('mail sent');
                req.flash('success','Email has been sent with further instructions');
                done(err,'done');
            });
        }
    ],function(err){
        if(err) return next(err);
        res.redirect('/forgot')
    });
});
//change form render
router.get('/reset/:token',(req,res)=>{
    User.findOne({
        resetPasswordToken:req.params.token,
        resetPasswordExpires: { $gt:Date.now()}
    },(err,user)=>{
        if(!user){
            req.flash("error",'Your link is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset',{token:req.params.token});
    });
});
//change password
router.post('/reset/:token',(req,res)=>{
    User.findOne({resetPasswordToken:req.params.token, resetPasswordExpires:{$gt: Date.now()}},(err,user)=>{
        if(!user){
            req.flash("error","Invalid or expired token.");
            return res.redirect("/forgot");
        }
        if(err){
            req.flash("error",err.message);
            return res.redirect("/forgot");
        }
        if(req.body.password!=req.body.confirm){
            req.flash("error",'The 2 passwords must match');
            return res.redirect("back");
        }
        user.setPassword(req.body.password,(err)=>{
            user.resetPasswordToken=undefined;
            user.resetPasswordExpires=undefined;
            user.save((err)=>{
                if(err)
                {
                    req.flash("error",err.message);
                    return res.redirect("/forgot");
                }
                req.logIn(user,(err)=>{
                    if(err){
                        req.flash("error",err.message);
                        return res.redirect("/campgrounds");
                    }
                });
                var smtpTransport=nodemailer.createTransport({
                    service:"Gmail",
                    auth:{
                        user:'agrimchopra90@gmail.com',
                        pass: process.env.GMAILPW
                    }
                });
                var mailOptions={
                    to: user.email,
                    from:"agrimchopra90@gmail.com",
                    subject:'Your password was changed',
                    text:"Hello\n\nYour password for your YelpCamp account has been successfully updated."
                };
                smtpTransport.sendMail(mailOptions,function(err){
                    if(err){
                        console.log(err);
                        req.flash("error","Something went wrong.");
                        return res.redirect("/forgot");
                    }
                    req.flash("success","Your password was changed successfully!");
                    res.redirect("/campgrounds");
                })
            });
        });
    });
});


//USER PROFILES
//show profile
router.get("/users/:id",async (req,res)=>{
    let user=await User.findById(req.params.id);
    Campground.find().where('author.id').equals(user._id).exec((err,campgrounds)=>{
        if(err){
            req.flash("error",'Something went wrong');
            return res.redirect("/campgrounds");
        }
        res.render("users/show",{user:user, campgrounds:campgrounds});
    });
});
//edit profile
router.get("/users/:id/edit",async (req,res)=>{
    User.findById(req.params.id,(err,user)=>{
        if(err){
            req.flash("error", 'Something went wrong');
            return res.redirect('back');
        }
        res.render('users/edit',{user:user});
    });
});
//update profile
router.put('/users/:id',upload.single('avatar'),(req,res)=>{
    if(req.file){
        cloudinary.uploader.upload(req.file.path,(result)=>{
            req.body.user.avatar= result.secure_url;
            User.findByIdAndUpdate(req.params.id,req.body.user,function(err,user){
                if(err){
                    req.flash("error",err.message);
                    return res.redirect("back");
                }
                req.flash("success","Edited details successfully");
                return res.redirect("/users/"+user.id);
            });
        });   
    }
    else{
        User.findByIdAndUpdate(req.params.id,req.body.user,function(err,user){
            if(err){
                req.flash('error','Something went wrong');
                return res.redirect('back');
            }
            Campground.find().where('author.id').equals(user._id).exec((err,campgrounds)=>{
                if(err){
                    req.flash("error",'Something went wrong');
                    return res.redirect("/campgrounds");
                }
                campgrounds.forEach(element => {
                    element.author.username=req.body.user.username;
                    element.save();
                });
            });
            Comment.find().where('author.id').equals(user._id).exec((err,campgrounds)=>{
                if(err){
                    req.flash("error",'Something went wrong');
                    return res.redirect("/campgrounds");
                }
                campgrounds.forEach(element => {
                    element.author.username=req.body.user.username;
                    element.save();
                });
                req.flash('success','Edited details successfully');
                return res.redirect('/users/'+user.id);
            });
        })
    }
})


 module.exports=router;