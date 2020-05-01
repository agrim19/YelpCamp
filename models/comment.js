var mongoose=require("mongoose");
    User=require("./user");

var commentSchema=new mongoose.Schema({
    text:String,
    createdAt:{
        type:Date,
        default:Date.now
    },
    author:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String,
        isAdmin:{
            type:Boolean,
            default:false
        }
    }
});

var Comment=mongoose.model("Comment",commentSchema);

module.exports = Comment;