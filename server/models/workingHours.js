import mongoose from 'mongoose';

const workingHoursSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  startHour: { type: Number, required: true },
  endHour: { type: Number, required: true }
});

const WorkingHours = mongoose.model('WorkingHours', workingHoursSchema);

export default WorkingHours;
