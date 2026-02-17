import { Task } from "./Task.js";
import { formatTime, LOCAL_EN} from "./helper.js";

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
}
