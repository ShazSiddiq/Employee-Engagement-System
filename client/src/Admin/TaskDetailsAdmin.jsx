import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';

const WORKING_HOURS = [
  { day: 'Monday', startHour: 10, endHour: 18 },
  { day: 'Tuesday', startHour: 10, endHour: 18 },
  { day: 'Wednesday', startHour: 10, endHour: 18 },
  { day: 'Thursday', startHour: 10, endHour: 18 },
  { day: 'Friday', startHour: 10, endHour: 18 },
  { day: 'Saturday', startHour: 10, endHour: 18 },
  { day: 'Sunday', startHour: 18, endHour: 23 },
];

const getWorkingHoursForDay = (date) => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  return WORKING_HOURS.find(day => day.day === dayName);
};

const calculateWorkingHoursBetween = (start, end) => {
  let totalWorkingHours = 0;
  let current = new Date(start);

  while (current < end) {
    const workingHours = getWorkingHoursForDay(current);
    if (workingHours && workingHours.startHour < workingHours.endHour) {
      const dayStart = new Date(current);
      dayStart.setHours(workingHours.startHour, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(workingHours.endHour, 0, 0, 0);
      const workStart = current > dayStart ? current : dayStart;
      const workEnd = end < dayEnd ? end : dayEnd;

      if (workStart < workEnd) {
        totalWorkingHours += (workEnd - workStart);
      }
    }
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return totalWorkingHours;
};

const formatTimeSpent = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days} day ${hours}h ${minutes}m ${seconds}s`;
};

const calculateTimeSpent = (timelogs, taskStage, taskDoneTime) => {
  if (taskStage === 'Done') {
    return `${formatTimeSpent(calculateTimeUntilDone(timelogs, taskDoneTime))}`;
  }
  if (taskStage === 'Archive') {
    return `${formatTimeSpent(calculateTimeUntilDone(timelogs, taskDoneTime))}`;
  }

  if (!timelogs || timelogs.length === 0) {
    return 'N/A';
  }

  const totalTime = timelogs.reduce((total, log) => {
    const startTime = new Date(log.startTime);
    let endTime;

    if (log.endTime) {
      endTime = new Date(log.endTime);
    } else {
      endTime = new Date(); // Ongoing task, use current time
    }

    if (endTime < startTime) {
      return total;
    }

    return total + calculateWorkingHoursBetween(startTime, endTime);
  }, 0);

  return formatTimeSpent(totalTime);
};

const calculateTimeUntilDone = (timelogs, taskDoneTime) => {
  const doneTime = new Date(taskDoneTime);
  return timelogs.reduce((total, log) => {
    const startTime = new Date(log.startTime);
    let endTime = log.endTime ? new Date(log.endTime) : doneTime;

    if (endTime > doneTime) {
      endTime = doneTime;
    }

    if (endTime < startTime) {
      return total;
    }

    return total + calculateWorkingHoursBetween(startTime, endTime);
  }, 0);
};


export default function AdminTaskDetails() {
  const [tasks, setTasks] = useState([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [searchText, setSearchText] = useState('');
  const [timelogs, setTimelogs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const { projectId, userId } = location.state || {};

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTaskHistory(currentPage, rowsPerPage, searchText);
  }, [currentPage, rowsPerPage, searchText]);

  const fetchUserTaskHistory = async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    setError(null);

    try {
      // const userId = localStorage.getItem('userid');
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/project-history/${projectId}/${userId}?page=${page}&limit=${limit}&search=${search}`);
      const data = await response.json();

      const sortedTaskData = data.map(item => {
        item.tasks = item.tasks.filter(task => !task.deleteStatus || task.deleteStatus !== 1);
        return item;
      });

      if (Array.isArray(sortedTaskData) && sortedTaskData.length > 0) {
        const projectData = data[0];
        if (projectData && projectData.tasks && Array.isArray(projectData.tasks)) {
          setTasks(projectData.tasks);
          setProjectTitle(projectData.title);
          setTotalTasks(projectData.totalTasks);

          const timelogResponses = await Promise.all(projectData.tasks.map(task =>
            fetch(`${process.env.REACT_APP_BASE_URL}/timelogs/${task._id}`).then(res => res.json())
          ));

          const timelogMap = {};
          timelogResponses.forEach((timelogArray) => {
            if (Array.isArray(timelogArray)) {
              timelogArray.forEach(log => {
                if (log.taskid) {
                  if (!timelogMap[log.taskid]) {
                    timelogMap[log.taskid] = [];
                  }
                  timelogMap[log.taskid].push(log);
                }
              });
            }
          });
          setTimelogs(timelogMap);
        }
      } else {
        setTasks([]);
      }
    } catch (error) {
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
    setCurrentPage(1); // Reset to the first page on search
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
  };

  const columns = [
    {
      name: 'Task Name',
      selector: row => row.title,
      sortable: true,
    },
    {
      name: 'Stage',
      selector: row => row.stage,
      sortable: true,
    },
    {
      name: 'Created At',
      selector: row => new Date(row.created_at).toLocaleDateString(),
      sortable: true,
    },
    {
      name: 'Completion Date',
      selector: row => new Date(row.dateTime).toLocaleDateString(),
      sortable: true,
    },
    {
      name: 'Time Spent',
      selector: row => calculateTimeSpent(timelogs[row._id] || [], row.stage),
      sortable: true,
    },
  ];

  const paginationComponentOptions = {
    selectAllRowsItem: true,
    selectAllRowsItemText: '100',
  };

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#343a40',
        color: 'white',
        fontWeight: 'bold',
      },
    },
  };

  const isHomePage = location.pathname === '/dashboard';

  return (
    <div className="container mx-auto" style={{ padding: '75px' }}>
      <div className='flex items-center mt-3'>

        {!isHomePage && (
          <button
            onClick={() => navigate(-1)}
            className='bg-indigo-200 rounded-full p-[3px] mr-2 focus:outline-none focus:ring focus:ring-indigo-200 focus:ring-offset-1'
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-600">
              <path fillRule="evenodd" d="M15.293 6.293a1 1 0 010 1.414L10.414 12l4.879 4.879a1 1 0 01-1.414 1.414l-6.293-6.293a1 1 0 010-1.414l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <p className="text-lg" ><b>Task History <span>({tasks.length})</span></b></p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={tasks}
            pagination
            paginationServer
            paginationTotalRows={totalTasks}
            onChangeRowsPerPage={handleRowsPerPageChange}
            onChangePage={handlePageChange}
            paginationComponentOptions={paginationComponentOptions}
            striped
            highlightOnHover
            responsive
            subHeader
            customStyles={customStyles}
            subHeaderComponent={
              <input
                type="text"
                placeholder="Search..."
                className="p-1 border"
                value={searchText}
                onChange={handleSearch}
                autoFocus
              />
            }
            noDataComponent="No tasks found"
          />
        </>
      )}

      {error && <div>{error}</div>}
    </div>
  );
}
