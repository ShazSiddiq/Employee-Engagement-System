import express from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Project from '../models/index.js'
import Timelog from '../models/timelog.js';
import ExtensionLog from '../models/ExtensionLog.js';
const { ObjectId } = mongoose.Types;
import User from '../models/userModel.js';
import RemarkLog from '../models/remarkLog.js';
import WorkingHours from "../models/workingHours.js"
import nodemailer from "nodemailer";
import crypto from 'crypto';
import bcrypt from 'bcrypt';


const api = express.Router()

const from = 'shahbaz.as@innobles.com'//process.env.MAILSENDER;

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: from,
        pass: 'acia qtcs bcdr foro'
    }
});

// API for sending password reset link
api.post("/forgot-password", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });
        if (!user) {
            return res.status(404).send({ result: "Fail", message: "Invalid Email" });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

        await user.save();

        // Create reset URL
        // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        const resetUrl = `https://myte.innobles.com/reset-password/${resetToken}`;

        // Set up email options
        const mailOptions = {
            from: from,
            to: user.email,
            subject: "Password Reset: Team Myte",
            text: `You requested a password reset. Please click on the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nTeam: Myte\nDelhi`,
        };
        console.log(mailOptions);

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).send({ result: "Fail", message: "Failed to send email. Please try again later." });
            }
            res.send({ result: "Done", message: "Password reset link sent to your registered Email ID!" });
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({ result: "Fail", message: "Internal Server Error" });
    }
});

// API to handle the password reset
api.post("/reset-password/:token", async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send({ result: "Fail", message: "Token is invalid or has expired" });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);
        user.password = hash; // Assign the hashed password to the user object
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.send({ result: "Done", message: "Password reset successful" });

    } catch (error) {
        console.log(error);
        res.status(500).send({ result: "Fail", message: "Internal Server Error" });
    }
});

// API endpoint to get timelog by taskid
api.get('/timelogs/:taskid', async (req, res) => {
    const { taskid } = req.params;

    try {
        // Convert taskid to ObjectId
        const taskIdObjectId = mongoose.Types.ObjectId(taskid);

        const timelog = await Timelog.find({ taskid: taskIdObjectId });

        if (!timelog) {
            return res.status(404).json({ message: 'Timelog not found' });
        }

        res.json(timelog);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

api.get("/workingHour", async (req, res) => {
    try {
        const workingHours = await WorkingHours.find();
        res.send(workingHours)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
})

// Route to get working hours for a specific date
api.get('/api/working-hours-by-date', async (req, res) => {
    const dateString = req.query.date;

    // Validate date
    if (!dateString || isNaN(Date.parse(dateString))) {
        return res.status(400).json({ message: 'Invalid date format' });
    }

    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    try {
        // Fetch the document containing the working hours
        const workingHoursDoc = await WorkingHours.findOne();

        if (!workingHoursDoc || !workingHoursDoc.workingHoursData) {
            return res.status(404).json({ message: 'Working hours data not found' });
        }

        // Find the working hours for the specific day
        const workingHours = workingHoursDoc.workingHoursData.find(day => day.day === dayName);

        if (workingHours) {
            res.json(workingHours);
        } else {
            res.status(404).json({ message: `No working hours found for ${dayName}` });
        }
    } catch (error) {
        console.error('Error fetching working hours:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// fetch all user data
api.get("/userdata", async (req, res) => {
    try {
        Project.aggregate([
            {
                $match: {
                    deleteStatus: 0 // Only include projects that are not deleted
                }
            },
            { $unwind: "$task" },
            {
                $group: {
                    _id: "$task.userid",
                    tasks: {
                        $push: {
                            projectTitle: "$title",
                            projectId: "$_id",
                            projectDescription: "$description",
                            taskTitle: "$task.title",
                            taskDescription: "$task.description",
                            taskStage: "$task.stage",
                            taskId: "$task._id",
                            taskCompletionDate: "$task.dateTime",
                            extensionRequest: "$task.extensionRequest",
                            remark: "$task.remark",
                            deleteStatus: "$task.deleteStatus",
                            createdAt: "$task.created_at",
                            deletedAt: "$task.deletedAt"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users", // The name of the user collection
                    let: { userId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$userId"] }, { $eq: ["$isDeactivated", false] }] } } }
                    ],
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: false // Remove documents where the user is not found or deactivated
                }
            },
            {
                $lookup: {
                    from: "timelogs", // The name of the timelog collection
                    localField: "tasks.taskId",
                    foreignField: "taskid",
                    as: "timelogs"
                }
            },
            {
                $project: {
                    _id: 0,
                    userid: "$_id",
                    username: "$user.name", // Adjust based on your User schema
                    useremail: "$user.email",
                    userProfile: "$user.profileImage",
                    // projects: "$user.projects", // Adjust based on your User schema
                    tasks: {
                        $map: {
                            input: "$tasks",
                            as: "task",
                            in: {
                                projectTitle: "$$task.projectTitle",
                                projectId: "$$task.projectId",
                                projectDescription: "$$task.projectDescription",
                                taskId: "$$task._id",
                                taskTitle: "$$task.taskTitle",
                                taskDescription: "$$task.taskDescription",
                                taskStage: "$$task.taskStage",
                                taskCompletionDate: "$$task.taskCompletionDate",
                                extensionRequest: "$$task.extensionRequest",
                                remark: "$$task.remark",
                                deleteStatus: "$$task.deleteStatus",
                                createdAt: "$$task.createdAt",
                                deletedAt: "$$task.deletedAt",
                                timelogs: {
                                    $filter: {
                                        input: "$timelogs",
                                        as: "timelog",
                                        cond: { $eq: ["$$timelog.taskid", "$$task.taskId"] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ])
            .then(result => {
                res.send(result);
            })
            .catch(err => {
                res.status(500).send(err.message);
            });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


// fetch all project
api.get('/projects', async (req, res) => {
    try {
        const data = await Project.find({}, { task: 0, __v: 0, updatedAt: 0 })
        return res.send(data)

    } catch (error) {
        return res.send(error)
    }
})

// fetch task of project
api.get('/project/:projectId/:userid', async (req, res) => {
    const { userid, projectId } = req.params;

    // Validate projectId and userid
    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userid)) {
        return res.status(400).send({ error: true, message: 'Invalid projectId or userid' });
    }

    try {
        const result = await Project.aggregate([
            { $match: { _id: new ObjectId(projectId) } },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    tasks: {
                        $filter: {
                            input: "$task",
                            as: "task",
                            cond: { $eq: ["$$task.userid", new ObjectId(userid)] }
                        }
                    }
                }
            }
        ]);
console.log(result);

        res.send(result);
    } catch (error) {
        res.status(500).send({ error: true, message: 'An error occurred while fetching the project' });
    }
});

// fetch task of pegination and filtration of task of project
api.get('/project-history/:projectId/:userid', async (req, res) => {
    
    const { userid, projectId } = req.params;
    let { page = 1, limit = 10, search = '' } = req.query;

    // Convert page and limit to integers and fallback to default values if invalid
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page <= 0) page = 1;
    if (isNaN(limit) || limit <= 0) limit = 10;

    // Validate projectId and userid
    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userid)) {
        return res.status(400).send({ error: true, message: 'Invalid projectId or userid' });
    }

    try {
        const projectIdObject = new ObjectId(projectId);
        const userIdObject = new ObjectId(userid);

        const result = await Project.aggregate([
            { $match: { _id: projectIdObject } },
            { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },  // Handle empty task array
            {
                $match: {
                    ...(search && { "task.title": { $regex: search, $options: 'i' } }),  // Search tasks by title if provided
                    $or: [
                        { "task.userid": userIdObject },  // Match specific user's tasks
                        { "task": { $exists: false } }  // Handle case where there are no tasks
                    ]
                }
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    description: { $first: "$description" },
                    tasks: { $push: "$task" }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    tasks: { $filter: { input: "$tasks", as: "task", cond: { $ne: ["$$task", null] } } },  // Filter out null tasks
                    totalTasks: { $size: { $filter: { input: "$tasks", as: "task", cond: { $ne: ["$$task", null] } } } }  // Count non-null tasks
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    tasks: { $slice: ["$tasks", (page - 1) * limit, limit] },  // Paginate tasks
                    totalTasks: 1
                }
            }
        ]);

        // Check if the project was found
        if (result.length === 0) {
            return res.status(501).send({ error: true, message: 'Project not found' });
        }

        const project = result[0];

        // If tasks are not found or empty, set totalTasks to 0 and return an empty task array
        const response = {
            _id: project._id,
            title: project.title,
            description: project.description,
            tasks: project.tasks || [],  // Return empty array if no tasks
            totalTasks: project.tasks.length > 0 ? project.totalTasks : 0,  // Return task count or 0 if no tasks
            page,
            limit
        };

        // Send the project response
        res.send([response]);

    } catch (error) {
        console.error('Error fetching the project:', error);
        res.status(500).send({ error: true, message: 'An error occurred while fetching the project' });
    }
});

// post project
api.post('/project', async (req, res) => {
    // validate type 
    const project = Joi.object({
        title: Joi.string().trim().min(3).max(255).required().messages({
            'string.empty': 'Title cannot be empty',
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot be longer than 255 characters',
            'any.required': 'Title is required'
        }),
        description: Joi.string().trim().min(1).max(500).required().messages({
            'string.empty': 'Description cannot be empty',
            'string.min': 'Description must be at least 1 character long',
            'string.max': 'Description cannot be longer than 500 characters',
            'any.required': 'Description is required'
        }),
        dateTime: Joi.date().required().iso().messages({
            'date.base': 'Invalid date-time format',
            'date.format': 'Date-time must be in ISO 8601 format',
            'any.required': 'Date-time is required'
        })
    })

    // validation
    const { error, value } = project.validate({ title: req.body.title, description: req.body.description, dateTime: req.body.dateTime });
    if (error) return res.status(422).send(error)


    // insert data 
    try {
        const data = await new Project(value).save()
        res.send({ data: { title: data.title, description: data.description, dateTime: req.body.dateTime, updatedAt: data.updatedAt, _id: data._id } })

    } catch (e) {
        if (e.code === 11000) {
            return res.status(422).send({ data: { error: true, message: 'title must be unique' } })
        } else {
            return res.status(500).send({ data: { error: true, message: 'server error' } })
        }
    }


})


// Fetch project by ID
api.get('/project/:id', async (req, res) => {
    const projectIdSchema = Joi.string().hex().length(24).required().messages({
        'string.length': 'Invalid project ID',
        'string.hex': 'Invalid project ID',
    });

    const { error } = projectIdSchema.validate(req.params.id);
    if (error) return res.status(400).send({ error: true, message: error.details[0].message });

    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(501).send({ error: true, message: 'Project not found' });

        res.send({ data: project });
    } catch (e) {
        res.status(500).send({ error: true, message: 'Server error' });
    }
});

// assign project
api.post('/assign-projects/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { projectIds } = req.body;

        // Find the user by ID and update the projects array
        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { projects: { $each: projectIds } } }, // Use $addToSet to avoid duplicates
            { new: true } // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Projects assigned successfully', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch projects assigned to a user
api.get('/projects', async (req, res) => {
    try {
        const { userid } = req.query;
        const user = await User.findById(userid).populate('projects');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.projects);
    } catch (err) {

        res.status(500).json({ message: 'Server error' });
    }
});

// get project assign by admin
api.get('/projects/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user by userId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch projects that match the IDs in the user's `projects` array
        const projects = await Project.find({
            _id: { $in: user.projects }
        });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// project and task on bsis of userid
api.get('/projects-history/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Find the user by userId
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Fetch projects that match the IDs in the user's `projects` array and have deleteStatus = 0
      const projects = await Project.find({
        _id: { $in: user.projects },
        deleteStatus: 0 // Ensure we only fetch projects where deleteStatus is 0
      });
  
      // Convert userId to string for comparison if needed
      const userIdString = mongoose.Types.ObjectId(userId).toString();
  
      // Filter tasks within each project based on the userId and deleteStatus = 0
      const filteredProjects = projects.map(project => {
        return {
          ...project.toObject(), // Convert to plain JavaScript object
          task: project.task.filter(task => 
            task.userid.toString() === userIdString && task.deleteStatus === 0 // Ensure task has deleteStatus 0
          )
        };
      });
  
      // Ensure each project has a tasks array (even if empty)
      const projectsWithTasks = filteredProjects.map(project => ({
        ...project,
        task: project.task || [] // Default to empty array if task is undefined
      }));
  
      res.json(projectsWithTasks);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

// Get assigned projects for a specific user
api.get('/assigned-projects/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch user and populate assigned projects
        const user = await User.findById(userId).populate('projects'); // Assuming 'projects' is a reference in User schema

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the list of assigned projects
        res.json(user.projects);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


api.put('/project/:id', async (req, res) => {
    // validate type 
    const project = Joi.object({
        title: Joi.string().min(3).max(255).required(),
        description: Joi.string().required(),
        dateTime: Joi.date().required()
    })

    // // validation
    const { error, value } = project.validate({ title: req.body.title, description: req.body.description, dateTime: req.body.dateTime });
    if (error) return res.status(422).send(error)

    Project.updateOne({ _id: mongoose.Types.ObjectId(req.params.id) }, { ...value }, { upsert: true }, (error, data) => {
        if (error) {
            res.send(error)
        } else {
            res.send(data)
        }
    })


})

api.delete('/project/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find the project by ID and update its status and deletion date
        const result = await Project.updateOne(
            { _id: mongoose.Types.ObjectId(id) },
            {
                $set: {
                    deleteStatus: 1, // Set status to 1 for deleted
                    deletedAt: new Date() // Set the deletion date to now
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(501).send({ message: 'Project not found' });
        }

        res.send({ message: 'Project successfully marked as deleted' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//  task api   
// Define Joi validation schema
const taskSchema = Joi.object({
    title: Joi.string().trim().min(2).max(255).required().messages({
        'string.empty': 'Title cannot be empty',
        'string.min': 'Title must be at least 2 characters long',
        'string.max': 'Title cannot be longer than 250 characters',
        'any.required': 'Title is required'
    }),
    description: Joi.string().trim().min(2).max(500).required().messages({
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description must be at least 2 character long',
        'string.max': 'Description cannot be longer than 500 characters',
        'any.required': 'Description is required'
    }),
    userid: Joi.string().required(),
    dateTime: Joi.date().required().iso().messages({
        'date.base': 'Invalid date-time format',
        'date.format': 'Date-time must be in ISO 8601 format',
        'any.required': 'Date-time is required'
    })
});

// Route handler for adding a task
api.post('/project/:id/task', async (req, res) => {
    try {
        if (!req.params.id) return res.status(500).send('Server error');

        // Validate task input
        const { error, value } = taskSchema.validate({
            title: req.body.title,
            description: req.body.description,
            userid: req.body.userid,
            dateTime: req.body.dateTime
        });

        if (error) {
            // Extract detailed error messages
            const validationErrors = error.details.map(detail => detail.message);
            return res.status(422).json(validationErrors);
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(501).send('Project not found');

        const taskIndex = project.task.length > 0 ? Math.max(...project.task.map(o => o.index)) + 1 : 0;

        const newTask = {
            ...value,
            stage: 'In Progress',
            order: project.task.length,
            index: taskIndex,
            created_at: new Date(),
            updated_at: new Date()
        };

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            { $push: { task: newTask } },
            { new: true, useFindAndModify: false }
        );

        const newTaskId = updatedProject.task[updatedProject.task.length - 1]._id;

        const newTimelog = new Timelog({
            taskid: newTaskId,
            projectid: req.params.id,
            stage: newTask.stage, // Include stage in the timelog
            startTime: Date.now(),
        });

        await newTimelog.save();

        return res.send(updatedProject);
    } catch (error) {
        return res.status(500).send('Internal server error');
    }
});



api.get('/project/:id/task/:taskId', async (req, res) => {

    if (!req.params.id || !req.params.taskId) return res.status(500).send(`server error`);

    // res.send(req.params)
    try {

        let data = await Project.find(
            { _id: mongoose.Types.ObjectId(req.params.id) },
            {
                task: {
                    $filter: {
                        input: "$task",
                        as: "task",
                        cond: {
                            $in: [
                                "$$task._id",
                                [
                                    mongoose.Types.ObjectId(req.params.taskId)
                                ]
                            ]
                        }
                    }
                }
            })
        if (data[0].task.length < 1) return res.status(404).send({ error: true, message: 'record not found' })
        return res.send(data)
    } catch (error) {
        return res.status(5000).send(error)
    }


})

// update remark
api.put('/project/:id/remark/:taskId', async (req, res) => {
    if (!req.params.id || !req.params.taskId) {
        return res.status(400).send('Project ID and Task ID are required');
    }

    const taskSchema = Joi.object({
        remark: Joi.string().min(3).max(150).required()
    });

    const { error, value } = taskSchema.validate({ remark: req.body.remark });
    if (error) {
        return res.status(422).send(error.details[0].message);
    }

    try {
        // Step 1: Update remark and set task stage to "Pause"
        const result = await Project.updateOne(
            {
                _id: mongoose.Types.ObjectId(req.params.id),
                "task._id": mongoose.Types.ObjectId(req.params.taskId)
            },
            {
                $set: {
                    "task.$.remark": value.remark,
                    "task.$.stage": "Pause"
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).send('Task not found or remark not updated');
        }

        // Step 2: Retrieve the updated task
        const updatedProject = await Project.findOne(
            {
                _id: mongoose.Types.ObjectId(req.params.id),
                "task._id": mongoose.Types.ObjectId(req.params.taskId)
            },
            {
                "task.$": 1
            }
        );
        const updatedTask = updatedProject.task[0];

        // Step 3: Log the remark
        const remarkLog = new RemarkLog({
            userid: updatedTask.userid,
            taskid: req.params.taskId,
            projectid: req.params.id,
            remark: value.remark
        });

        await remarkLog.save();

        // Step 4: Update the last Timelog's endTime before creating a new one
        const lastTimelog = await Timelog.findOneAndUpdate(
            {
                taskid: req.params.taskId,
                projectid: req.params.id,
                endTime: { $exists: false }
            },
            { endTime: Date.now() }, // Set the end time to now
            { sort: { startTime: -1 }, new: true } // Get the latest and return the updated document
        );

        if (lastTimelog) {
            console.log('Updated last Timelog with endTime:', lastTimelog);
        } else {
            console.log('No previous Timelog found to update');
        }

        // Step 5: Create a new Timelog entry
        // const newTimelog = new Timelog({
        //     taskid: req.params.taskId,
        //     projectid: req.params.id,
        //     startTime: Date.now(),
        // });

        // await newTimelog.save();

        return res.send(updatedTask);
    } catch (error) {
        console.error('Error updating Timelog or task:', error);
        return res.status(500).send('Server error');
    }
});


// update time extension request 
api.put('/project/:id/extensionRequest/:taskId', async (req, res) => {

    if (!req.params.id || !req.params.taskId) return res.status(500).send(`server error`);
    const task = Joi.object({
        extensionRequest: Joi.string().min(3).max(300).required()
    })

    const { error, value } = task.validate({ extensionRequest: req.body.extensionRequest });
    if (error) return res.status(422).send(error)

    try {

        const data = await Project.updateOne({
            _id: mongoose.Types.ObjectId(req.params.id),
            task: { $elemMatch: { _id: mongoose.Types.ObjectId(req.params.taskId) } }
        }, { $set: { "task.$.extensionRequest": value.extensionRequest } })
        return res.send(data)
    } catch (error) {
        return res.send(error)
    }

})

// Grant extension

api.put('/project/grantExtension/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { newDateTime } = req.body;

    if (!taskId) {
        return res.status(500).send('Server error: Missing taskId');
    }

    const schema = Joi.object({
        newDateTime: Joi.date().required().messages({
            'date.base': 'Invalid date-time format'
        })
    });

    const { error } = schema.validate({ newDateTime });
    if (error) {
        return res.status(422).send(error.details[0].message);
    }

    try {
        const project = await Project.findOne({
            'task._id': mongoose.Types.ObjectId(taskId)
        });
        if (!project) {
            return res.status(404).send('Task not found');
        }

        const task = project.task.id(taskId);
        const previousDateTime = task.dateTime;


        const result = await Project.updateOne(
            { 'task._id': mongoose.Types.ObjectId(taskId) },
            {
                $set: {
                    'task.$.dateTime': new Date(newDateTime),
                    'task.$.extensionRequest': ''
                }
            }
        );

        const updatedProject = await Project.findOne({
            'task._id': mongoose.Types.ObjectId(taskId)
        });

        if (result.modifiedCount === 0) {
            return res.status(404).send('Task not found');
        }

        // Log the time extension
        const extensionLog = new ExtensionLog({
            taskId,
            previousDateTime,
            newDateTime: new Date(newDateTime),
        });
        await extensionLog.save();

        return res.send({ message: 'Time extension granted successfully' });
    } catch (error) {
        return res.status(500).send('Internal server error');
    }
});

// Deny time extension request
api.put('/project/denyExtension/:taskId', async (req, res) => {
    const { taskId } = req.params;

    if (!taskId) {
        return res.status(500).send('Server error: Missing taskId');
    }

    try {
        const project = await Project.findOne({
            'task._id': mongoose.Types.ObjectId(taskId)
        });
        if (!project) {
            return res.status(404).send('Task not found');
        }

        const result = await Project.updateOne(
            { 'task._id': mongoose.Types.ObjectId(taskId) },
            {
                $set: {
                    'task.$.extensionRequest': ''
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).send('Task not found');
        }

        return res.send({ message: 'Time extension denied successfully' });
    } catch (error) {
        return res.status(500).send('Internal server error');
    }
});

// update task
api.put('/project/:id/task/:taskId', async (req, res) => {

    if (!req.params.id || !req.params.taskId) return res.status(500).send(`server error`);

    const task = Joi.object({
        title: Joi.string().min(3).max(255).required(),
        description: Joi.string().trim().min(3).max(500).required(),
        dateTime: Joi.string().optional(),
    })

    const { error, value } = task.validate({ title: req.body.title, description: req.body.description });

    if (error) return res.status(422).send(error)

    try {
        const data = await Project.updateOne({
            _id: mongoose.Types.ObjectId(req.params.id),
            task: { $elemMatch: { _id: mongoose.Types.ObjectId(req.params.taskId) } }
        }, { $set: { "task.$.title": value.title, "task.$.description": value.description } })

        const project = await Project.findById({ _id: mongoose.Types.ObjectId(req.params.id) });
        return res.send(project)
    } catch (error) {
        return res.send(error)
    }

})

//Delete task 

api.delete('/project/:id/task/:taskId', async (req, res) => {
    if (!req.params.id || !req.params.taskId) return res.status(500).send('server error');

    try {
        const project = await Project.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(req.params.id), "task._id": mongoose.Types.ObjectId(req.params.taskId) },
            { $set: { "task.$.deleteStatus": 1, "task.$.deletedAt": new Date() } },
            { new: true }
        );

        if (!project) {
            return res.status(404).send('Task not found');
        }

        return res.send(project);
    } catch (error) {
        return res.status(500).send(error);
    }
});


// Function to handle Timelog updates
async function handleTimelogUpdate(task, projectId, previousStage, newStage) {   
    // Determine start time for the new Timelog entry
    let startTime = Date.now();
    if (previousStage === undefined || previousStage === null) {
        startTime = task.created_at;
    }
// console.log("newStage>>>>>>",newStage);
if(newStage=="Done"){
    const lastTimelog = await Timelog.findOneAndUpdate(
        {
            taskid: task._id,
            projectid: mongoose.Types.ObjectId(projectId),
            endTime: { $exists: false }
        },
        { endTime: Date.now() }, // Set the end time to now
        { sort: { startTime: -1 }, new: true } // Get the latest and return the updated document
    );
}
    // Create a new Timelog entry for the new stage
    const newTimelog = new Timelog({
        taskid: task._id,
        projectid: mongoose.Types.ObjectId(projectId),
        stage: newStage,  // Include the new stage in the Timelog entry
        startTime: startTime,
    });
    await newTimelog.save();
}



// API endpoint to update project todo list
api.put('/project/:id/todo', async (req, res) => {
    try {
        const projectId = mongoose.Types.ObjectId(req.params.id);
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(501).send('Project not found');
        }

        const bulkOps = [];

        for (const key in req.body) {
            for (const index in req.body[key].items) {
                const item = req.body[key].items[index];
                const newStage = req.body[key].name;

                const task = project.task.id(item._id);
                if (!task) {
                    throw new Error(`Task with id ${item._id} not found`);
                }

                const previousStage = task.stage;
                task.order = index;
                task.stage = newStage;
                task.updated_at = Date.now();

                bulkOps.push({
                    updateOne: {
                        filter: { _id: projectId, 'task._id': mongoose.Types.ObjectId(item._id) },
                        update: {
                            $set: {
                                'task.$.order': index,
                                'task.$.stage': newStage,
                                'task.$.updated_at': Date.now()
                            }
                        }
                    }
                });

                if (previousStage !== newStage) {
                    await handleTimelogUpdate(task, req.params.id, previousStage, newStage);
                }
            }
        }

        if (bulkOps.length > 0) {
            await Project.bulkWrite(bulkOps);
        }

        res.send('Tasks updated successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
});





export default api