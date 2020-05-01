var mongoose=require("mongoose");
    passportLocalMongoose=require("passport-local-mongoose");
var UserSchema= new mongoose.Schema({
    username: String,
    password: String,
    isAdmin:{
        type:Boolean,
        default:false
    },
    avatar:String,
    resetPasswordToken:String,
    resetPasswordExpires:Date,
    email:{
        type:String,
        unique:true,
        required:true
    },
    firstName:String,
    lastName:String 
});
UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User",UserSchema);
module.exports=User;
