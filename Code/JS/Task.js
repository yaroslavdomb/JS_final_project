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
     * @type {string}
     */
    #createdAt;
    /**
     * @type {string}
     */
    #updatedAt;
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
        "createdAt",
        "updatedAt",
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
        createdAt = "",
        updatedAt = "",
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
        this.#createdAt = createdAt;
        this.#updatedAt = updatedAt;
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
    }

    get createdAt() {
        return this.#createdAt;
    }
    set createdAt(value) {
        this.#createdAt = value;
    }

    get updatedAt() {
        return this.#updatedAt;
    }
    set updatedAt(value) {
        this.#updatedAt = value;
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

    clone() {
        return new Task(
            this.select,
            this.id,
            this.isDone,
            this.priority,
            this.group,
            this.details,
            this.deadline,
            this.createdAt,
            this.updatedAt,
            this.changes ? this.changes.map((change) => change.clone()) : [],
            this.actions ? [...this.actions] : []
        );
    }
}
