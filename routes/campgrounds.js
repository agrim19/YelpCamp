var express=require("express");
    router=express.Router();
    Campground=require("../models/campgrounds")
    middleware=require("../middleware");       //automatically requires "index" named file
    multer=require("multer");
    storage= multer.diskStorage({
        filename: function(req,file,callback){
            callback(null,Date.now() + file.originalname);
        }
    });
    Comment=require("../models/comment");

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

//list grounds //INDEX ROUTE
router.get("/",function(req,res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name:regex},function(err,campgrounds){
            if(err){
                console.log(err);
            }
            else{
                if(campgrounds.length<1){
                    req.flash("error","No matches found");
                    return res.redirect('/campgrounds');
                }
                res.render("campgrounds/index",{campgrounds:campgrounds , page: 'campgrounds'});
            }
        });
    }
    else{
        Campground.find({},function(err,campgrounds){
            if(err){
                console.log(err);
            }
            else{
                res.render("campgrounds/index",{campgrounds:campgrounds , page: 'campgrounds'});
            }
        });
    }
});
//add ground    //NEW ROUTE
router.get("/new",middleware.isLoggedIn,function(req,res){
    res.render("campgrounds/new");
})
//SHOW - shows more info about 1 campground
router.get("/:id",function(req,res){
    //find campground clicked
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
        //show all info 
        if(!err)
        {
            res.render("campgrounds/show",{campground:foundCampground});
        }
        else    
            console.log(err);
    });
});
//edit campground route
router.get("/:id/edit",middleware.checkCampgroundOwnership,async (req,res)=>{
        try{
            let foundCampground= await Campground.findById(req.params.id);
                res.render("campgrounds/edit",{campground:foundCampground});
        }
        catch{
            res.redirect("back");
        }
    }
);
//update campground route
router.put("/:id",middleware.checkCampgroundOwnership,upload.single('image'),(req,res)=>{
    if(req.file){
        cloudinary.uploader.upload(req.file.path,(result)=>{
            req.body.campground.image= result.secure_url;
            req.body.campground.author={
                id:req.user._id,
                username:req.user.username
            }
            Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,campground){
                if(err){
                    req.flash("error",err.message);
                    return res.redirect("back");
                }
                req.flash("success","Edited campground successfully");
                res.redirect("/campgrounds/"+campground.id);
            })
        });   
    }
    else{
        Campground.findByIdAndUpdate(req.params.id,req.body.campground,(err,campgroundUpdated)=>{
            if(err){
                console.log(err);
                res.redirect("/redirect");
            }
            else{
                res.redirect("/campgrounds/"+req.params.id);
            }
        });
    }  
})
//post for adding ground    //CREATE ROUTE
router.post("/",middleware.isLoggedIn,upload.single('image'),function(req,res){
    //get data from form and add to array
    cloudinary.uploader.upload(req.file.path,(result)=>{
        req.body.campground.image= result.secure_url;
        req.body.campground.author={
            id:req.user._id,
            username:req.user.username
        }
        Campground.create(req.body.campground,function(err,campground){
            if(err){
                req.flash("error",err.message);
                return res.redirect("back");
            }
            // eval(require('locus'));
            res.redirect("/campgrounds/"+campground.id);
        })
    });     
});
//Destroy campground route
router.delete("/:id",middleware.checkCampgroundOwnership,(req,res)=>{
    Campground.findByIdAndRemove(req.params.id,(err,campgroundRemoved)=>
    {
        if(err)
            return res.redirect("/campgounds");
        Comment.deleteMany({_id: {$in: campgroundRemoved.comments}},(err)=>{
            if(!err){
                res.redirect("/campgrounds");

            }
        })
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports=router;