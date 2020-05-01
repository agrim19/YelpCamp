var express=require("express"),
    app=express(),
    bodyParser = require("body-parser"),
    mongoose=require("mongoose");
    Campground=require("./models/campgrounds");
    seedDB=require("./seeds");
    Comment=require("./models/comment");
    passport=require("passport");
    LocalStrategy=require("passport-local");
    User=require("./models/user");
    methodOverride=require("method-override");
    flash=require("connect-flash");


//requiring routes
var campgroundRoutes=require("./routes/campgrounds");
    commentRoutes=require("./routes/comments");
    indexRoutes=require("./routes/index");

// seedDB();        //seed the database
mongoose.connect("mongodb://localhost:27017/yelp_camp_v12", {useNewUrlParser:true,useUnifiedTopology:true});
app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));           //tells express to serve from the public folder too
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());
mongoose.set('useFindAndModify',false);

//moment js config
app.locals.moment= require("moment");

//passport config
app.use(require("express-session")({
    secret:"HIhihihihihih YelpCamp",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currentUser=req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
}); 


//route setup
app.use("/",indexRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);

//=================================================================================
//ROUTES


//SERVER
app.listen(3000,function(){
    console.log("Yelp Camp serving on port 3000");
});