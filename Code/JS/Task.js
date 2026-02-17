import { formatTime, LOCAL_EN } from "./helper";
import { PRIORITY_DEFAULT, EMPTY_GROUP } from "./config";

export class Task {
    /**
     * @type {boolean}
     */
    #select;
    /**
     * @type {string}
     */
    #id;
    /**
     * @type {boolean}
     */
    #isDone;
    /**
     * @type {number}
     */
    #priority;
    /**
     * @type {string}
     */
    #group;
    /**
     * @type {string}
     */
    #details;
    /**
     * @type {string}
     */
    #deadline;
    /**
     * @type {number}
     */
    #deadlineTs;
    /**
     * @type {string}
     */
    #createdAt;
    /**
     * @type {number}
     */
    #createdAtTs;
    /**
     * @type {string}
     */
    #updatedAt;
    /**
     * @type {number}
     */
    #updatedAtTs;
    /**
     * @type {Task[]}
     */
    #changes;
    /**
     * @type {Array<string>}
     */
    #actions;

    static fields = [
        "select",
        "id",
        "isDone",
        "priority",
        "group",
        "details",
        "deadline",
        "deadlineTs",
        "createdAt",
        "createdAtTs",
        "updatedAt",
        "updatedAtTs",
        "changes",
        "actions"
    ];

    constructor(
        select = false,
        id = "",
        isDone = false,
        priority = 0,
        group = "",
        details = "",
        deadline = "",
        deadlineTs = 0,
        createdAt = "",
        createdAtTs = 0,
        updatedAt = "",
        updatedAtTs = 0,
        changes = [],
        actions = []
    ) {
        this.#select = select;
        this.#id = id;
        this.#isDone = isDone;
        this.#priority = priority;
        this.#group = group;
        this.#details = details;
        this.#deadline = deadline;
        this.#deadlineTs = deadlineTs;
        this.#createdAt = createdAt;
        this.#createdAtTs = createdAtTs;
        this.#updatedAt = updatedAt;
        this.#updatedAtTs = updatedAtTs;
        this.#changes = changes;
        this.#actions = actions;
    }

    get select() {
        return this.#select;
    }
    set select(value) {
        this.#select = value;
    }

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get isDone() {
        return this.#isDone;
    }
    set isDone(value) {
        this.#isDone = value;
    }

    get priority() {
        return this.#priority;
    }
    set priority(value) {
        this.#priority = value;
    }

    get group() {
        return this.#group;
    }
    set group(value) {
        this.#group = value;
    }

    get details() {
        return this.#details;
    }
    set details(value) {
        this.#details = value;
    }

    get deadline() {
        return this.#deadline;
    }
    set deadline(value) {
        this.#deadline = value;
        this.#deadlineTs = Date.parse(value);
    }

    get deadlineTs() {
        return this.#deadlineTs;
    }
    set deadlineTs(value) {
        this.#deadlineTs = value;
    }

    get createdAt() {
        return this.#createdAt;
    }
    set createdAt(value) {
        this.#createdAt = value;
        this.#createdAtTs = Date.parse(value);
    }

    get createdAtTs() {
        return this.#createdAtTs;
    }
    set createdAtTs(value) {
        this.#createdAtTs = value;
    }

    get updatedAt() {
        return this.#updatedAt;
    }
    set updatedAt(value) {
        this.#updatedAt = value;
        this.#updatedAtTs = Date.parse(value);
    }

    get updatedAtTs() {
        return this.#updatedAtTs;
    }
    set updatedAtTs(value) {
        this.#updatedAtTs = value;
    }

    get changes() {
        return this.#changes;
    }
    set changes(value) {
        this.#changes = value;
    }

    get actions() {
        return this.#actions;
    }
    set actions(value) {
        this.#actions = value;
    }

    getColumnCount() {
        return this.fields.length;
    }

    deepClone() {
        return new Task(
            this.select,
            this.id,
            this.isDone,
            this.priority,
            this.group,
            this.details,
            this.deadline,
            this.deadlineTs,
            this.createdAt,
            this.createdAtTs,
            this.updatedAt,
            this.updatedAtTs,
            this.changes ? this.changes.map((change) => change.deepClone()) : [],
            this.actions ? [...this.actions] : []
        );
    }

    shallowClone() {
        return new Task(
            this.select,
            this.id,
            this.isDone,
            this.priority,
            this.group,
            this.details,
            this.deadline,
            this.deadlineTs,
            this.createdAt,
            this.createdAtTs,
            this.updatedAt,
            this.updatedAtTs,
            [],
            []
        );
    }

    getDisplayedFields() {
        return {
            select: this.select,
            id: this.id,
            isDone: this.isDone,
            priority: this.priority,
            group: this.group,
            details: this.details,
            deadline: this.deadline,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    isDataChanged(changeableFieldsObj) {
        Object.keys(changeableFieldsObj).forEach((field) => {
            if (changeableFieldsObj[field] !== this[field]) {
                return true;
            }
        });
        return false;
    }

    static createTask(dataSource) {
        const newTask = new Task();

        newTask.isDone = dataSource.isDone ?? false;
        newTask.group = dataSource.group ?? EMPTY_GROUP;
        newTask.priority = dataSource.priority ?? PRIORITY_DEFAULT;
        newTask.details = dataSource.details ?? "";
        newTask.deadline = dataSource.deadline ?? "";
        newTask.createdAt = formatTime(null, LOCAL_EN);

        return newTask;
    }
}
