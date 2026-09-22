import mongoose from "mongoose";

const GithubStreakSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    }
}, {timestamps: true});

const GithubStreakModel = mongoose.models.GithubStreak || mongoose.model("GithubStreak", GithubStreakSchema);

export default GithubStreakModel;