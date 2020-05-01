// all the middleware goes here
var middlewareObj={};
    Campground=require("../models/campgrounds");
    Comment=require("../models/comment");

middlewareObj.isLoggedIn = function (req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else
    {
        req.flash("error","This action requires you to be logged in");
        res.redirect("/login");
    }
}

middlewareObj.checkCampgroundOwnership = async function (req,res,next){
    if(req.isAuthenticated()){
        try{
            let foundCampground= await Campground.findById(req.params.id);
            if(foundCampground.author.id.equals(req.user._id)||req.user.isAdmin)
                next();
            else
            {   
                req.flash("error","You are not allowed to do that");
                res.redirect("back");
            }
        }
        catch{
                req.flash("error","Campground not found");
                res.redirect("back");
            }
    }
    else{
        req.flash("error","This action requires login");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = async function (req,res,next){
    if(req.isAuthenticated()){
        try{
            let foundComment= await Comment.findById(req.params.comment_id);
            if(foundComment.author.id.equals(req.user._id)||req.user.isAdmin)
                next();
            else
            {   
                req.flash("error","You are not allowed to do that");
                res.redirect("back");
            }
        }
        catch{
                console.error(); 
        }
    }
    else{
        req.flash("error","This action requires login");
        res.redirect("back");
    }
}
module.exports = middlewareObj;