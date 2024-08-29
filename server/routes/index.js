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


const api = express.Router()

api.get("/workingHour",async(req,res)=>{
    try {
        const workingHours = await WorkingHours.find();
        res.send(workingHours)
    } catch (error) {
        console.log(error);
        
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

api.post("/search", async (req, res) => {
    try {
        let searchQuery = req.body.search;

        // Ensure searchQuery is a string
        if (typeof searchQuery !== 'string') {
            searchQuery = String(searchQuery);
        }

        // Perform the search query using Project model
        const data = await Project.find({
            $or: [
                { title: { $regex: searchQuery, $options: "i" } },
                { description: { $regex: searchQuery, $options: "i" } },
                { 'tasks.title': { $regex: searchQuery, $options: "i" } }, // Search in nested tasks array
                { 'tasks.description': { $regex: searchQuery, $options: "i" } } // Search in nested tasks array
            ]
        });

        res.send({ result: "Done", data: data });
    } catch (error) {
        res.status(500).send({ result: "Fail", message: "Internal server Error" });
    }
});



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
                            projectId:"$_id",
                            projectDescription: "$description",
                            taskTitle: "$task.title",
                            taskDescription: "$task.description",
                            taskStage: "$task.stage",
                            taskId: "$task._id",
                            taskCompletionDate:"$task.dateTime",
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
                    userProfile:"$user.profileImage",
                    // projects: "$user.projects", // Adjust based on your User schema
                    tasks: {
                        $map: {
                            input: "$tasks",
                            as: "task",
                            in: {
                                projectTitle: "$$task.projectTitle",
                                projectId:"$$task.projectId",
                                projectDescription: "$$task.projectDescription",
                                taskId: "$$task._id",
                                taskTitle: "$$task.taskTitle",
                                taskDescription: "$$task.taskDescription",
                                taskStage: "$$task.taskStage",
                                taskCompletionDate:"$$task.taskCompletionDate",
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




api.get('/projects', async (req, res) => {
    try {
        const data = await Project.find({}, { task: 0, __v: 0, updatedAt: 0 })
        return res.send(data)
        
    } catch (error) {
        return res.send(error)
    }
})

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

        res.send(result);
    } catch (error) {
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
    const { error, value } = project.validate({ title: req.body.title, description: req.body.description,dateTime: req.body.dateTime });
    if (error) return res.status(422).send(error)


    // insert data 
    try {
        const data = await new Project(value).save()
        res.send({ data: { title: data.title, description: data.description,dateTime: req.body.dateTime, updatedAt: data.updatedAt, _id: data._id } })

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
        if (!project) return res.status(404).send({ error: true, message: 'Project not found' });

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
    })

    // // validation
    const { error, value } = project.validate({ title: req.body.title, description: req.body.description });
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
            return res.status(404).send({ message: 'Project not found' });
        }

        res.send({ message: 'Project successfully marked as deleted' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//  task api   
// Define Joi validation schema
const taskSchema = Joi.object({
    title: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Title cannot be empty',
        'string.min': 'Title must be at least 2 characters long',
        'string.max': 'Title cannot be longer than 100 characters',
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
        if (!project) return res.status(404).send('Project not found');

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

        // Update remark and set task stage to "Pause"
        const result = await Project.updateOne(
            {
                _id: mongoose.Types.ObjectId(req.params.id),
                "task._id": mongoose.Types.ObjectId(req.params.taskId)
            },
            {
                $set: { 
                    "task.$.remark": value.remark,
                    "task.$.stage": "Pause"  // Add this line to update the stage
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).send('Task not found or remark not updated');
        }

        // Retrieve the updated task
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
        const remarkLog = new RemarkLog({
            userid: updatedTask.userid,
            taskid: req.params.taskId,
            projectid: req.params.id,
            remark: value.remark
        });

        await remarkLog.save();

        return res.send(updatedTask);
    } catch (error) {
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
        title: Joi.string().min(3).max(30).required(),
        description: Joi.string().trim().min(3).max(500).required(),
        dateTime:Joi.string().optional(),
    })

    const { error, value } = task.validate({ title: req.body.title, description: req.body.description });
    
    if (error) return res.status(422).send(error)

    try {
        const data = await Project.updateOne({
            _id: mongoose.Types.ObjectId(req.params.id),
            task: { $elemMatch: { _id: mongoose.Types.ObjectId(req.params.taskId) } }
        }, { $set: { "task.$.title": value.title, "task.$.description": value.description } })

        const project = await Project.findById({_id: mongoose.Types.ObjectId(req.params.id)});
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
async function handleTimelogUpdate(task, projectId, previousStage) {
    // Update the end time of the previous stage in Timelog
    const updatedRes = await Timelog.findOneAndUpdate(
        { taskid: task._id },
        { endTime: Date.now() }
    );
    
        // Determine start time for the new Timelog entry
        let startTime = Date.now();
        if (previousStage === undefined || previousStage === null) {
            startTime = task.created_at;
        }

        // Create a new Timelog entry for the new stage
        const newTimelog = new Timelog({
            taskid: task._id,
            projectid: mongoose.Types.ObjectId(projectId),
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
            return res.status(404).send('Project not found');
        }

        const bulkOps = [];
        const timelogOps = [];

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
                    await handleTimelogUpdate(task, req.params.id, previousStage);
                }
            }
        }

        if (bulkOps.length > 0) {
            await Project.bulkWrite(bulkOps);
        }

        if (timelogOps.length > 0) {
            await Timelog.bulkWrite(timelogOps);
        }

        res.send('Tasks updated successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
});


export default api