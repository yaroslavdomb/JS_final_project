import { Task } from "./Task.js";
import { formatTime, LOCAL_EN } from "./helper.js";

const testData = {
    currentTasksCount: 50,
    historyTasksCount: 16
};

export function populateWithTestData(taskManager) {
    createTestTasks(testData.currentTasksCount, null).forEach((t) => taskManager.addTask(t));
    for (let i = 0; i < testData.currentTasksCount; i++) {
        const details = taskManager.getTaskById(i + 1).details;
        taskManager.updateTaskHistoryById(i + 1, createTestTasks(testData.historyTasksCount, details));
    }
}

function createTestTasks(taskLimit, keepTaskDetails) {
    const testTaskArr = [];
    for (let i = 0; i < taskLimit; i++) {
        const newTestTask = new Task();
        newTestTask.select = Math.floor(Math.random() * 10) >= 5;
        newTestTask.id = i + 1;
        newTestTask.isDone = Math.floor(Math.random() * 10) >= 5;
        newTestTask.group = "test group" + Math.floor(Math.random() * 10);
        newTestTask.priority = Math.floor(Math.random() * 10);
        if (keepTaskDetails !== null) {
            newTestTask.details = keepTaskDetails;
        } else {
            newTestTask.details = "task details for " + i;
        }

        newTestTask.deadline = formatTime(null, LOCAL_EN);
        newTestTask.createdAt = formatTime(null, LOCAL_EN);
        newTestTask.updatedAt = formatTime(null, LOCAL_EN);
        testTaskArr.push(newTestTask);
    }

    return testTaskArr;
    //const tt = prepare(testTaskArr);
    //return tt;
}

function prepare(testTaskArr) {
    // const t = new Task(
    //     true,
    //     "3",
    //     false,
    //     8,
    //     "groupC",
    //     "Third task details",
    //     "2026-02-26T22:02:00Z",
    //     0,
    //     "2026-02-25T19:59:00Z",
    //     0,
    //     "2026-02-26T19:59:00Z",
    //     0,
    //     [],
    //     []
    // );
    // testTaskArr.length = 0;
    // testTaskArr.push(t);

    const filterExpression = `task-group = "test group8"`;
    // `time-deadline = new Date('2026-02-25T21:55') AND time-created = new Date('2026-02-20T21:56') OR select = true`;
        //"select = true AND time-deadline = '2026-02-26T22:02' OR time-created = '2026-02-27T22:02' OR isDone = true";
        // "time-deadline = new Date('2026-02-20T22:37').getTime()";
        // "task-is-selected = true AND isDone = false";
    const afterFormat = filterExpression
        .replace(/AND/g, "&&")
        .replace(/OR/g, "||")
        .replace(/=/g, "===")
        .replace(/select/g, "task.select")
        .replace(/isDone/g, "task.isDone")
        .replace(/task-group/g, "task.group")
        .replace(/task-priority/g, "task.priority")
        .replace(/task-details/g, "task.details")
        .replace(/time-deadline/g, "new Date(task.deadline).getTime()")
        .replace(/time-created/g, "new Date(task.createdAt).getTime()")
        .replace(/time-updated/g, "new Date(task.updatedAt).getTime()")
        .replace(/'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})'/g, (match) => {
            const dateStr = match.slice(1, -1); 
            const date = new Date(dateStr + ":00Z");
            return `new Date('${date.toISOString()}').getTime()`;
        });

    const filterFunction = new Function(
        "task",
        `
        return ${afterFormat};
    `
    );

    const result = testTaskArr.filter((task) => filterFunction(task));
    return result;
}

//const filterFunction = new Function("task", `return ${afterFormat};`);
// const result = tasks.filter((task) => filterFunction(task));
// console.log(result);

// const filterExpression =
//     "select = true AND time-deadline = '2026-02-26T22:02' OR time-created = '2026-02-27T22:02' OR isDone = true";

// const afterFormat = filterExpression
//     .replace(/AND/g, "&&")
//     .replace(/OR/g, "||")
//     .replace(/=/g, "===")
//     .replace(/select/g, "task.select")
//     .replace(/isDone/g, "task.isDone")
//     .replace(/task-group/g, "task.group")
//     .replace(/task-priority/g, "task.priority")
//     .replace(/task-details/g, "task.details")
//     .replace(/time-deadline/g, "new Date(task.deadline).getTime()")
//     .replace(/time-created/g, "new Date(task.createdAt).getTime()")
//     .replace(/time-updated/g, "new Date(task.updatedAt).getTime()");
