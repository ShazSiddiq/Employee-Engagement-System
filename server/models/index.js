import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true // must be unique
    },
    description: String,
    dateTime: {
        type: Date,
        required: true
    },
    deleteStatus: {
        type: Number,
        default: 0, // 0 for not deleted, 1 for deleted, 2 for archived
        enum: [0, 1, 2] // Validates that the value is one of the allowed options
    },
    deletedAt: {
        type: Date,
        default: null // Set to null if not deleted
    },
    task: [
        {
            id: Number,
            title: String,
            description: String,
            userid: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
            order: Number,
            stage: {
                type: String,
            },
            index: Number,
            dateTime: {
                type: Date,
                required: true
            },
            attachment: [
                {
                    type: String,
                    url: String
                }
            ],
            remark: {
                type: String,
                default: ""
            },
            extensionRequest: { type: String, default: "" }, 
            created_at: { type: Date, default: Date.now },
            updated_at: { type: Date, default: Date.now },
            deleteStatus: {
                type: Number,
                default: 0, // 0 for not deleted, 1 for deleted, 2 for archived
                enum: [0, 1, 2] // Validates that the value is one of the allowed options
            },
            deletedAt: {
                type: Date,
                default: null // Set to null if not deleted
            }
        }
    ]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
