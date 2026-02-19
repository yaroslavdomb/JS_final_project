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

    addTask(newTask) {
        newTask.id = this.getMaxId() + 1;
        this.#existedTasks.push(newTask);

        return newTask;
    }

    getTaskById(id) {
        return this.#existedTasks.find((task) => Number(id) === Number(task.id));
    }

    getIndexById(id) {
        return this.#existedTasks.findIndex((task) => Number(task.id) === Number(id));
    }

    //Using shallow copy will allow to skip full history & actions data
    updateTask(id, changeableFieldsObj) {
        const taskToUpdate = this.getTaskById(id);
        if (!taskToUpdate) return;

        //validate data changed
        if (!taskToUpdate.isDataChanged(changeableFieldsObj)) return;

        //save history
        const copyForHistory = taskToUpdate.shallowClone();
        taskToUpdate.changes.push(copyForHistory);

        //copy updated fields into task, so actually it's updating
        Object.keys(changeableFieldsObj).forEach((key) => {
            taskToUpdate[key] = changeableFieldsObj[key];
        });
        taskToUpdate.updatedAt = formatTime(null, LOCAL_EN);

        return taskToUpdate;
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
        return this.#existedTasks.map((task) => task.deepClone());
    }

    getAllExceptOne(id) {
        return this.#existedTasks.filter((task) => Number(task.id) !== Number(id));
    }

    getAllTasksForDisplay() {
        return this.#existedTasks.map((task) => task.getDisplayedFields());
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

    saveInFile() {
        const content = JSON.stringify(
            this.#existedTasks.map((task) => task.toJSON()),
            null,
            2
        );
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tasks.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    uploadTasks(taskArr) {
        taskArr.forEach((taskData) => {
            const task = new Task(
                taskData.select,
                taskData.id,
                taskData.isDone,
                taskData.priority,
                taskData.group,
                taskData.details,
                taskData.deadline,
                taskData.deadlineTs,
                taskData.createdAt,
                taskData.createdAtTs,
                taskData.updatedAt,
                taskData.updatedAtTs,
                taskData.changes || [],
                taskData.actions || []
            );
            this.addTask(task);
        });
    }

    toggleAllSelected(isAllSelected) {
        this.#existedTasks.forEach((task) => (task.select = !isAllSelected));
    }
}
