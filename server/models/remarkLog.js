import mongoose from "mongoose";

const remarkLogSchema = new mongoose.Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    taskid: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    projectid: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    remark: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const RemarkLog = mongoose.model('RemarkLog', remarkLogSchema);

export default RemarkLog;
