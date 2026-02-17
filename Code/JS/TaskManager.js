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

    /*
    Detect name of sorting field and it's type.
    This will allow to hold sorting code without duplication.
    -- NOT related to sort efficiency algorithm!
    
    For faster sortign by dates columns will be used 
    columns with XXXTS = means XXX TimeStamp.
    This will allow to use number processing instead of new Date(date)  
    */
    detectSortFunction(sortBy) {
        const sortingConfig = {
            select: { field: "select", type: "boolean" },
            number: { field: "id", type: "number" },
            done: { field: "isDone", type: "boolean" },
            group: { field: "group", type: "string" },
            priority: { field: "priority", type: "number" },
            details: { field: "details", type: "string" },
            deadline: { field: "deadlineTs", type: "date" },
            created: { field: "createdAtTs", type: "date" },
            updated: { field: "updatedAtTs", type: "date" }
        };

        return sortingConfig[sortBy];
    }

    sortBy(isASC, sortParam) {
        const sortOrder = isASC ? 1 : -1;
        const sortField = sortParam.field;
        const type = sortParam.type;
        this.#existedTasks.sort((t1, t2) => {
            switch (type) {
                case "number":
                case "boolean":
                case "date":
                    return (t1[sortField] - t2[sortField]) * sortOrder;
                case "string":
                    return t1[sortField].localeCompare(t2[sortField]) * sortOrder;
                default:
                    return 0;
            }
        });
    }
}
