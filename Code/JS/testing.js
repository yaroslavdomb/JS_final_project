import { Task } from "./Task.js";
import { formatTime, LOCAL_EN } from "./helper.js";
import { POPULATE_LOCAL_STORAGE, POPULATE_MAIN_TABLE, LOCALSTORAGE_KEY, LOG_ON } from "./config.js";

export class Testing {
    /**
     * @type {number}
     */
    #mainTableTaskCount;
    /**
     * @type {number}
     */
    #mainTableHistoryTasksCount;
    /**
     * @type {number}
     */
    #localStorageTasksCount;
    /**
     * @type {number}
     */
    #localStorageHistoryTasksCount;
    /**
     * @type {string}
     */
    #startDate;
    /**
     * @type {string}
     */
    #endDate;
    /**
     * @type {number}
     */
    #diff;
    #startTs;
    #endTs;

    /**
     * @param {number} mainTableTaskCount
     * @param {number} mainTableHistoryTasksCount
     * @param {number} localStorageTasksCount
     * @param {number} localStorageHistoryTasksCount
     * @param {string} startDate
     * @param {string} endDate
     */
    constructor(
        mainTableTaskCount = 0,
        mainTableHistoryTasksCount = 0,
        localStorageTasksCount = 0,
        localStorageHistoryTasksCount = 0,
        startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        startTs,
        endTs,
        diff
    ) {
        this.#mainTableTaskCount =
            mainTableTaskCount != null && typeof mainTableTaskCount === "number" && mainTableTaskCount >= 0
                ? mainTableTaskCount
                : 0;
        this.#mainTableHistoryTasksCount =
            mainTableHistoryTasksCount != null &&
            typeof mainTableHistoryTasksCount === "number" &&
            mainTableHistoryTasksCount >= 0
                ? mainTableHistoryTasksCount
                : 0;
        this.#localStorageTasksCount =
            localStorageTasksCount != null && typeof localStorageTasksCount === "number" && localStorageTasksCount >= 0
                ? localStorageTasksCount
                : 0;
        this.#localStorageHistoryTasksCount =
            localStorageHistoryTasksCount != null &&
            typeof localStorageHistoryTasksCount === "number" &&
            localStorageHistoryTasksCount >= 0
                ? localStorageHistoryTasksCount
                : 0;
        this.#startDate =
            startDate != null && typeof startDate === "string" && Date.parse(startDate)
                ? startDate
                : new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
        this.#endDate =
            endDate != null && typeof endDate === "string" && Date.parse(endDate)
                ? endDate
                : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
        this.#endTs = new Date(this.#endDate).getTime();
        this.#startTs = new Date(this.#startDate).getTime();
        this.#diff = this.#endTs - this.#startTs;
    }

    get mainTableTaskCount() {
        return this.#mainTableTaskCount;
    }

    get mainTableHistoryTasksCount() {
        return this.#mainTableHistoryTasksCount;
    }

    get localStorageTasksCount() {
        return this.#localStorageTasksCount;
    }

    get localStorageHistoryTasksCount() {
        return this.#localStorageHistoryTasksCount;
    }

    get startDate() {
        return this.#startDate;
    }

    get endDate() {
        return this.#endDate;
    }
    get endTs() {
        return this.#endTs;
    }
    get startTs() {
        return this.#startTs;
    }
    get diff() {
        return this.#diff;
    }

    set mainTableTaskCount(count) {
        if (typeof count === "number" && count >= 0) {
            this.#mainTableTaskCount = count;
        } else {
            if (LOG_ON) console.error("Invalid value for mainTableTaskCount");
        }
    }

    set mainTableHistoryTasksCount(count) {
        if (typeof count === "number" && count >= 0) {
            this.#mainTableHistoryTasksCount = count;
        } else {
            if (LOG_ON) console.error("Invalid value for mainTableHistoryTasksCount");
        }
    }

    set localStorageTasksCount(count) {
        if (typeof count === "number" && count >= 0) {
            this.#localStorageTasksCount = count;
        } else {
            if (LOG_ON) console.error("Invalid value for localStorageTasksCount");
        }
    }

    set localStorageHistoryTasksCount(count) {
        if (typeof count === "number" && count >= 0) {
            this.#localStorageHistoryTasksCount = count;
        } else {
            if (LOG_ON) console.error("Invalid value for localStorageHistoryTasksCount");
        }
    }

    set startDate(date) {
        if (typeof date === "string" && Date.parse(date)) {
            this.#startDate = date;
            this.#startTs = new Date(this.#startDate).getTime();
        } else {
            if (LOG_ON) console.error("Invalid value for startDate");
        }
    }

    set endDate(date) {
        if (typeof date === "string" && Date.parse(date)) {
            this.#endDate = date;
            this.#endTs = new Date(this.#endDate).getTime();
        } else {
            if (LOG_ON) console.error("Invalid value for endDate");
        }
    }

    set diff(_) {
        this.#diff = this.#endTs - this.#startTs;
    }

    populateWithTestData(taskManager) {
        this.populateMainTable(taskManager);
        this.populateLocalStorage();
    }

    populateMainTable(taskManager) {
        if (POPULATE_MAIN_TABLE) {
            const currTasks = this.createTestTasksArr(this.mainTableTaskCount, null);
            if (currTasks) {
                this.populateTasksHistory(currTasks, this.mainTableHistoryTasksCount);
                taskManager.hydrateAndAppendTasks(currTasks);
            }
        }
    }

    populateLocalStorage() {
        if (POPULATE_LOCAL_STORAGE) {
            const currTasks = this.createTestTasksArr(this.localStorageTasksCount, "localStor");
            if (currTasks) {
                this.populateTasksHistory(currTasks, this.localStorageHistoryTasksCount);
                localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(currTasks));
            }
        }
    }

    populateTasksHistory(tasksArr, limit) {
        tasksArr.forEach((currTask) => {
            currTask.changes = this.createTestTasksArr(limit, currTask.details);
        });
    }

    createTestTasksArr(taskLimit, keepTaskDetails) {
        const testTaskArr = [];
        for (let i = 0; i < taskLimit; i++) {
            const newTestTask = new Task();
            newTestTask.select = Math.floor(Math.random() * 10) >= 5;
            newTestTask.id = i + 1;
            newTestTask.isDone = Math.floor(Math.random() * 10) >= 5;
            newTestTask.group = "test group" + Math.floor(Math.random() * 10);
            newTestTask.priority = Math.floor(Math.random() * 11);
            newTestTask.details = keepTaskDetails === null ? "task details for " + i : keepTaskDetails + "__0" + i;
            newTestTask.deadline = this.randomDate();
            newTestTask.createdAt = this.randomDate();
            newTestTask.updatedAt = this.randomDate();
            newTestTask.isOnScreen = true;

            testTaskArr.push(newTestTask);
        }

        return testTaskArr;
    }

    randomDate() {
        const preformated = new Date(Math.floor(Math.random() * (this.diff + 1) + this.startTs));
        return formatTime(preformated, LOCAL_EN);
    }
}
