import mongoose from 'mongoose';

const timelogSchema = new mongoose.Schema({
    taskid: { type: mongoose.Schema.Types.ObjectId, ref: 'Project.task', required: true },
    projectid: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    stage: {
        type: String,
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
}, { timestamps: true });

export default mongoose.model('Timelog', timelogSchema);


