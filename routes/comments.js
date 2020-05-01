var express=require("express");
    router=express.Router({mergeParams:true});
    Campground=require("../models/campgrounds")
    Comment=require("../models/comment");
    middleware=require("../middleware");       //automatically requires "index" named file

//comments new
router.get("/new",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err)
            console.log(err);
        else
        {
            res.render("comment/new",{campground:campground});
        }
    })
})
//comments create
router.post("/",middleware.isLoggedIn,function(req,res){
    //look up campground using id
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds")
        }
        else
        {
            //create new comment
            Comment.create(req.body.comment,function(err,comment){
                if(err)
                    console.log(err);
                else{
                    //add username and id to comment
                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                    comment.author.isAdmin=req.user.isAdmin;
                    //save comment
                    comment.save();
                    //connect comment to campground
                    campground.comments.push(comment);
                    campground.save();
                    //redirect to show page
                    req.flash("success","Successfully created comment");
                    res.redirect("/campgrounds/"+campground._id);
                }
            })
        }
    })
});
//comment edit route
router.get("/:comment_id/edit",middleware.checkCommentOwnership,async (req,res)=>{
    try{
        let comment= await Comment.findById(req.params.comment_id);
        res.render("comment/edit",{campground_id:req.params.id,comment:comment});
    }
    catch{
        res.redirect("back");
    }
})
//update route
router.put("/:comment_id",middleware.checkCommentOwnership,(req,res)=>{
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,async (err,updatedComment)=>{
        if(err){
            res.redirect("back");
        }
        res.redirect("/campgrounds/"+req.params.id);
    })
});
//delete route
router.delete("/:comment_id",middleware.checkCommentOwnership,(req,res)=>{
    Comment.findByIdAndRemove(req.params.comment_id, (err)=>{
        if(err){
            req.flash("success","Comment deleted");
            res.redirect("back");
        }
        res.redirect("/campgrounds/"+req.params.id);
    })
})

module.exports=router;
