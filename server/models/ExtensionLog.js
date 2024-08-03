import mongoose from "mongoose";

const ExtensionLogSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // userid: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    previousDateTime: { type: Date, required: true },
    newDateTime: { type: Date, required: true },
    grantedAt: { type: Date, default: Date.now },
});

const ExtensionLog = mongoose.model('ExtensionLog', ExtensionLogSchema);

export default ExtensionLog;
