import { Task } from "./Task.js";
import { formatTime, LOCAL_EN } from "./helper.js";

export class TaskManager {
    /**
     * @type {Array<Task>}
     */
    #existedTasks = [];

    constructor(originalTasks = []) {
        this.#existedTasks = originalTasks.map((task) => task.clone());
    }

    getMaxId() {
        return this.#existedTasks.length === 0 ? 0 : Math.max(...this.#existedTasks.map((task) => task.id));
    }

    isEmpty() {
        return this.#existedTasks.length === 0;
    }

    addTask(task) {
        const newTask = task.clone();
        newTask.id = this.getMaxId() + 1;
        newTask.createdAt = formatTime(null, LOCAL_EN);
        this.#existedTasks.push(newTask);

        return newTask;
    }

    getTaskById(id) {
        return this.#existedTasks.find((task) => Number(id) === Number(task.id));
    }

    getIndexById(id) {
        return this.#existedTasks.findIndex((task) => Number(task.id) === Number(id));
    }

    updateTask(id, newTask) {
        const oldTaskIndex = this.getIndexById(id);
        if (oldTaskIndex < 0) return;

        //No need to save full chain of history inside each of the objects
        const copyForHistory = { ...this.#existedTasks[oldTaskIndex] };
        copyForHistory.changes = [];
        copyForHistory.actions = [];

        this.#existedTasks[oldTaskIndex].changes.push(copyForHistory);
        Object.keys(newTask).forEach((key) => {
            this.#existedTasks[oldTaskIndex][key] = newTask[key];
        });
        this.#existedTasks[oldTaskIndex].updatedAt = formatTime(null, LOCAL_EN);

        return this.#existedTasks[oldTaskIndex];
    }

    removeTaskById(id) {
        const indexOfRemovedTask = this.getIndexById(id);
        if (indexOfRemovedTask < 0) return;

        return this.#existedTasks.splice(indexOfRemovedTask, 1)[0];
    }

    getExistingGroups() {
        return new Set(this.#existedTasks.map((task) => task.group));
    }

    //Create and return map of type {group_name : num_of_tasks_in_the_group}
    getExistingGroupsAndCount() {
        const groupAndCount = {};
        this.#existedTasks.forEach((task) => {
            groupAndCount[task.group] = (groupAndCount[task.group] || 0) + 1;
        });
        return groupAndCount;
    }

    getAllExceptOne(id) {
        return this.#existedTasks.filter((task) => Number(task.id) !== Number(id));
    }

    //dataSource is single element/array of Task
    updateTaskHistoryById(id, dataSource) {
        const task = this.getTaskById(id);
        if (!task) return;
        if (!Array.isArray(dataSource)) {
            task.changes.push(dataSource);
        } else {
            dataSource.forEach((t) => task.changes.push(t));
        }
    }

    getAllTasks() {
        return this.#existedTasks.map((task) => task.clone());
    }

    clearAllTasks() {
        this.#existedTasks = [];
    }

    detectSortFunction(sortBy) {
        switch (sortBy) {
            case "select":
                return this.sortBySelect;
            case "number":
                return this.sortById;
            case "done":
                return this.sortByTaskStatus;
            case "group":
                return this.sortByGroup;
            case "priority":
                return this.sortByPriority;
            case "details":
                return this.sortByDetails;
            case "deadline":
                return this.sortByDeadline;
            case "created":
                return this.sortByCreatedTime;
            case "updated":
                return this.sortByUpdatedTime;
            default:
                return null;
        }
    }

    sortBySelect(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => t1.select - t2.select);
        } else {
            this.#existedTasks.sort((t1, t2) => t2.select - t1.select);
        }
    }

    sortById(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => t1.id - t2.id);
        } else {
            this.#existedTasks.sort((t1, t2) => t2.id - t1.id);
        }
    }

    sortByTaskStatus(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => t1.isDone - t2.isDone);
        } else {
            this.#existedTasks.sort((t1, t2) => t2.isDone - t1.isDone);
        }
    }

    sortByGroup(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => t1.group.localeCompare(t2.group));
        } else {
            this.#existedTasks.sort((t1, t2) => t2.group.localeCompare(t1.group));
        }
    }

    sortByPriority(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => t1.priority - t2.priority);
        } else {
            this.#existedTasks.sort((t1, t2) => t2.priority - t1.priority);
        }
    }

    sortByDeadline(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => new Date(t1.deadline) - new Date(t2.deadline));
        } else {
            this.#existedTasks.sort((t1, t2) => new Date(t2.deadline) - new Date(t1.deadline));
        }
    }

    sortByCreatedTime(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => new Date(t1.createdAt) - new Date(t2.createdAt));
        } else {
            this.#existedTasks.sort((t1, t2) => new Date(t2.createdAt) - new Date(t1.createdAt));
        }
    }

    sortByUpdatedTime(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => new Date(t1.updatedAt) - new Date(t2.updatedAt));
        } else {
            this.#existedTasks.sort((t1, t2) => new Date(t2.updatedAt) - new Date(t1.updatedAt));
        }
    }

    sortByDetails(isASC) {
        if (isASC) {
            this.#existedTasks.sort((t1, t2) => t1.details.localeCompare(t2.details));
        } else {
            this.#existedTasks.sort((t1, t2) => t2.details.localeCompare(t1.details));
        }
    }
}
