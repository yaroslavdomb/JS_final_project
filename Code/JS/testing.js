import { Task } from "./Task.js";
import { formatTime, LOCAL_EN } from "./helper.js";
import { POPULATE_LOCAL_STORAGE, POPULATE_MAIN_TABLE, LOCALSTORAGE_KEY } from "./config.js";

const testData = {
    currentTasksCount: 50,
    historyTasksCount: 12,
    localStorageTasksCount: 15
};

export function populateWithTestData(taskManager) {
    populateMainTable(taskManager);
    populateLocalStorage();
}

export function populateMainTable(taskManager) {
    if (POPULATE_MAIN_TABLE) {
        const currTasks = createTestTasksArr(testData.currentTasksCount, null);
        populateTasksHistory(currTasks);
        taskManager.hydrateAndAppendTasks(currTasks);
    }
}

export function populateLocalStorage() {
    if (POPULATE_LOCAL_STORAGE) {
        const currTasks = createTestTasksArr(testData.localStorageTasksCount, null);
        populateTasksHistory(currTasks);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(currTasks));
    }
}

function populateTasksHistory(tasksArr) {
    tasksArr.forEach((currTask) => {
        currTask.changes = createTestTasksArr(testData.historyTasksCount, currTask.details);
    });
}

function createTestTasksArr(taskLimit, keepTaskDetails) {
    const testTaskArr = [];
    for (let i = 0; i < taskLimit; i++) {
        const newTestTask = new Task();
        newTestTask.select = Math.floor(Math.random() * 10) >= 5;
        newTestTask.id = i + 1;
        newTestTask.isDone = Math.floor(Math.random() * 10) >= 5;
        newTestTask.group = "test group" + Math.floor(Math.random() * 10);
        newTestTask.priority = Math.floor(Math.random() * 10);
        newTestTask.details = keepTaskDetails ?? "task details for " + i;
        newTestTask.deadline = formatTime(null, LOCAL_EN);
        newTestTask.createdAt = formatTime(null, LOCAL_EN);
        newTestTask.updatedAt = formatTime(null, LOCAL_EN);
        testTaskArr.push(newTestTask);
    }

    return testTaskArr;
}
