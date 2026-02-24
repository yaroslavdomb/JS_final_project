import { Task } from "./Task.js";
import { formatTime, LOCAL_EN } from "./helper.js";
import { POPULATE_LOCAL_STORAGE, POPULATE_MAIN_TABLE, LOCALSTORAGE_KEY } from "./config.js";

const testData = {
    currentTasksCount: 50,
    historyTasksCount: 12,
    localStorageTasksCount: 15,
    from: new Date("2023-01-01"),
    till: new Date("2027-01-01")
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
        const currTasks = createTestTasksArr(testData.localStorageTasksCount, "localStor");
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
        newTestTask.priority = Math.floor(Math.random() * 11);
        newTestTask.details = keepTaskDetails === null ? "task details for " + i : keepTaskDetails + "__0" + i;
        newTestTask.deadline = randomDate();
        newTestTask.createdAt = randomDate();
        newTestTask.updatedAt = randomDate();
        testTaskArr.push(newTestTask);
    }

    return testTaskArr;
}

function randomDate () {
    const preformated = new Date(
        Math.floor(Math.random() * (testData.till.getTime() - testData.from.getTime() + 1) + testData.from.getTime())
    );

    return formatTime(preformated, LOCAL_EN); 
}