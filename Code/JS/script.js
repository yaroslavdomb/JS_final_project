// I wish I could say yes  = хотел бы я сказать что да
// Almost = ну почти
// Just a tiny bit more, and yes = еще совсем немножечко и да

const TEST_MODE_ON = true;

const test_data = {
    outer_data_size: 5,
    inner_data_size: 6
};

const MOB_SCREEN_SIZE = 340;
const TABLET_SCREEN_SIZE = 750;
const LARGE_SCREEN_SIZE = 1280;
const LOCAL_EN = "en-US";
const EMPTY_GROUP = "---";
const PRIORITY_LOWEST = 10;

let tableFieldsCount;

const responsiveDesign = {
    backgroundColor: "",
    myWidth: ""
};

const htmlRow = {
    rowEl: {},
    idEl: {},
    id: ""
};

const singleTask = {
    select: false,
    id: "",
    isDone: false,
    priority: "",
    group: "",
    details: "",
    deadline: "",
    createdAt: "",
    updatedAt: "",
    changes: [],
    actions: []
};

const tableColumnsConfig = [
    { name: "select", colHeader: "select", isVisible: true },
    { name: "id", colHeader: "ID", isVisible: (visabilityFlags) => !visabilityFlags.isHistoryTable },
    { name: "isDone", colHeader: "Done", isVisible: true },
    { name: "priority", colHeader: "Priority", isVisible: true },
    { name: "group", colHeader: "Group", isVisible: true },
    { name: "details", colHeader: "Task details", isVisible: true },
    { name: "deadline", colHeader: "Deadline", isVisible: true },
    { name: "createdAt", colHeader: "Created At", isVisible: (visabilityFlags) => visabilityFlags.isDescScreen },
    { name: "updatedAt", colHeader: "Updated At", isVisible: (visabilityFlags) => visabilityFlags.isDescScreen },
    { name: "changes", colHeader: "Changes", isVisible: false },
    { name: "actions", colHeader: "Actions", isVisible: (visabilityFlags) => !visabilityFlags.isHistoryTable }
];

const visabilityFlags = {
    isMobScreen: true,
    isTabScreen: false,
    isDescScreen: false,
    isHistoryTable: false
};

class TaskManager {
    #existedTasks = [];

    constructor(initialTasks = []) {
        this.#existedTasks = initialTasks.map((task) => structuredClone(task));
    }

    getMaxId() {
        return this.#existedTasks.length === 0 ? 0 : Math.max(...this.#existedTasks.map((task) => task.id));
    }

    isEmpty() {
        return this.#existedTasks.length === 0;
    }

    addTask(task) {
        const newTask = structuredClone(task);
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
        const oldTaskIndex = this.getIndexById(id);
        if (oldTaskIndex < 0) return;

        return this.#existedTasks.splice(oldTaskIndex, 1)[0];
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

    //dataSource is single element/array of Single tasks
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
        return structuredClone(this.#existedTasks);
    }

    clearAllTasks() {
        this.#existedTasks = [];
    }
}

const taskManager = new TaskManager();

const dom = {
    rows: document.querySelectorAll("tbody tr"),
    managingBlock: document.querySelectorAll("div.managing"),
    taskTable: document.getElementById("task-table"),
    groupsList: document.getElementById("groups"),
    headerWidth: document.getElementById("full-table-header-width"),
    hideOnNarrow: document.querySelectorAll(".hide-on-narrow-screen"),
    deactivated: document.querySelectorAll(".hide-if-no-tasks"),

    modal: {
        modalWindow: document.getElementById("modalOverlay"),
        historyModalWindow: document.getElementById("historyModalOverlay"),
        historyTable: document.getElementById("history-table"),
        submitBtn: document.getElementById("submitBtn"),
        isDone: document.getElementById("task-is-done"),
        group: document.getElementById("task-group"),
        priority: document.getElementById("task-priority"),
        details: document.getElementById("task-details"),
        deadline: document.getElementById("task-deadline"),
        legend: document.getElementById("modal-legend"),
        priorityOut: document.getElementById("priority-value")
    }
};

// Redirect clicks in table
function handleTableClick(e) {
    if (e.target.matches("button.editRow")) {
        handleEditTask(e);
    } else if (e.target.matches("button.removeRow")) {
        handleRemoveTask(e);
    } else if (e.target.matches("button.showRow")) {
        handleShowTaskHistory(e);
    }
}

function handleShowTaskHistory(event) {
    getHTMLEl(event);
    visabilityFlags.isHistoryTable = true;

    const oldTask = taskManager.getTaskById(htmlRow.id);
    updateDataOnScreen(oldTask.changes, dom.modal.historyTable);
    openHistoryModal();
}

// Click on edit button in the table row
function handleEditTask(event) {
    getHTMLEl(event);
    //TODO: updateTasksStatistics(htmlRow.id, "edit");
    updateTaskHistory();
    prepareModal(true);
    openModal();
}

function updateTaskHistory() {
    const currentTask = taskManager.getTaskById(htmlRow.id);
    const historyCopyOfTask = structuredClone(currentTask);
    historyCopyOfTask.deadline = formatTime(null, LOCAL_EN);
    currentTask.changes.push(historyCopyOfTask);
}

//Click in the modal window to save the data after adding or editing a task
function handleSaveTask(isEditMode) {
    if (isEditMode) {
        const oldTask = taskManager.getTaskById(htmlRow.id);
        extractIncomingData(false, oldTask);
        const taskChanged = isTaskChanged(oldTask);
        if (taskChanged) {
            oldTask.updatedAt = formatTime(null, LOCAL_EN);
            updateRowOnScreen(oldTask, dom.taskTable);
        } else {
            //remove last task image from its history
            oldTask.changes.pop();
        }
    } else {
        const newTask = structuredClone(singleTask);
        extractIncomingData(true, newTask);
        newTask.createdAt = formatTime(null, LOCAL_EN);
        taskManager.addTask(newTask);
        if (!taskManager.isEmpty()) {
            enableActivity();
        }
        addRowToScreen(newTask, dom.taskTable);
    }
}

function updateRowOnScreen(task, table) {
    const existingRow = table.querySelector(`tr[data-id="${task.id}"]`);
    const columnsToShow = getColumnsToShow();
    buildRowFromTask(task, columnsToShow, existingRow);
}

function isTaskChanged(currentTask) {
    const historyTaskCopy = currentTask.changes[currentTask.changes.length - 1];
    return (
        currentTask.isDone !== historyTaskCopy.isDone ||
        currentTask.priority !== historyTaskCopy.priority ||
        currentTask.group !== historyTaskCopy.group ||
        currentTask.details !== historyTaskCopy.details ||
        currentTask.deadline !== historyTaskCopy.deadline
    );
}

// Click on remove button in the table row
function handleRemoveTask(event) {
    getHTMLEl(event);
    //TODO: updateTasksStatistics(htmlRow.id, "remove");
    taskManager.removeTaskById(htmlRow.id);
    disableMassActivity();
    htmlRow.rowEl.parentNode.removeChild(htmlRow.rowEl);
}

function prepareModal(isEditMode) {
    if (isEditMode) {
        dom.modal.submitBtn.dataset.action = "edit";
        const oldTask = taskManager.getTaskById(htmlRow.id);
        updateDomWithExistedGroups();
        setModalFields(oldTask);
    } else {
        dom.modal.submitBtn.dataset.action = "add";
        setModalFields();
        updateDomWithExistedGroups();
    }
}

function setModalFields(oldTask = null) {
    if (oldTask !== null) {
        dom.modal.group.value = oldTask.group;
        dom.modal.details.value = oldTask.details;
        dom.modal.isDone.checked = oldTask.isDone;
        dom.modal.deadline.value = formatForInputDatetime(oldTask.deadline);
        dom.modal.priorityOut.textContent = oldTask.priority;
        dom.modal.priority.value = PRIORITY_LOWEST - oldTask.priority;
        dom.modal.legend.innerText = "Edit existing task";
        dom.modal.submitBtn.innerText = "Edit task";
    } else {
        dom.modal.group.value = "";
        dom.modal.details.value = "";
        dom.modal.isDone.checked = "";
        dom.modal.deadline.value = "";
        dom.modal.priorityOut.textContent = "5";
        dom.modal.priority.value = "5";
        dom.modal.legend.innerText = "Add new task";
        dom.modal.submitBtn.innerText = "Add task";
    }
}

function formatForInputDatetime(taskDate) {
    const d = new Date(taskDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

function getHTMLEl(event) {
    htmlRow.rowEl = event.target.closest("tr");
    htmlRow.id = htmlRow.rowEl.dataset.id;
}

function updateTasksStatistics(id, action) {
    //TODO
}

//Redirect clicks in managing section
function handleManagingClick(e) {
    if (e.target.matches(".add")) {
        prepareModal(false);
        openModal();
    } else if (e.target.matches(".remove")) {
        //removeTask(e);
    } else if (e.target.matches(".edit")) {
        //editTask(e);
    }
}

//Redirect clicks in modal window
function handleModalClick(e) {
    if (e.target.matches("#submitBtn")) {
        const form = e.target.closest("form");
        if (!form.checkValidity()) {
            return;
        }

        e.preventDefault();
        const action = e.target.dataset.action;
        const editModeFlag = action === "edit";
        handleSaveTask(editModeFlag);
        closeModal();
    } else if (e.target.matches("#closeBtn")) {
        closeModal();
    }
}

function detectScreenSize() {
    const width = window.innerWidth;
    if (width >= MOB_SCREEN_SIZE && width < TABLET_SCREEN_SIZE) {
        visabilityFlags.isMobScreen = true;
        visabilityFlags.isTabScreen = false;
        visabilityFlags.isDescScreen = false;
    } else if (width >= TABLET_SCREEN_SIZE && width < LARGE_SCREEN_SIZE) {
        visabilityFlags.isMobScreen = false;
        visabilityFlags.isTabScreen = true;
        visabilityFlags.isDescScreen = false;
    } else if (width >= LARGE_SCREEN_SIZE) {
        visabilityFlags.isMobScreen = false;
        visabilityFlags.isTabScreen = false;
        visabilityFlags.isDescScreen = true;
    }
}

/*
isNewElemExist: If there is no new element, 
the function is called due to screen resize, and 
all elements should be added to the table with new styles.

Otherwise, it adds just a single element, so no redesign is needed.
*/
function updateDataOnScreen(dataSource, tableForUpdate) {
    const columnsToShow = getColumnsToShow();

    //header

    const newTHeader = buildHeader(columnsToShow);
    const oldThead = tableForUpdate.querySelector("thead");
    if (oldThead) {
        oldThead.replaceWith(newTHeader);
    }

    //body
    const newTBody = buildBody(columnsToShow, dataSource);
    setBodyDesign(newTBody, true);
    const oldTbody = tableForUpdate.querySelector("tbody");
    if (oldTbody) {
        oldTbody.replaceWith(newTBody);
    }
}

function getColumnsToShow() {
    return tableColumnsConfig.filter((col) =>
        typeof col.isVisible === "function" ? col.isVisible(visabilityFlags) : col.isVisible
    );
}

function addRowToScreen(dataSource, tableForUpdate) {
    const columnsToShow = getColumnsToShow();
    const oldTbody = tableForUpdate.querySelector("tbody");
    const newTBody = buildBody(columnsToShow, [dataSource], oldTbody);
    setBodyDesign(newTBody, false);
    if (oldTbody) {
        oldTbody.replaceWith(newTBody);
    }
}

function buildHeader(columnsToShow) {
    const thead = document.createElement("thead");
    
    if (!visabilityFlags.isHistoryTable) {
        const headerRow_mainHeader = thead.insertRow();
        headerRow_mainHeader.setAttribute("class", "full-table-header");
        const th_main = document.createElement("th");
        th_main.setAttribute("colspan", `${columnsToShow.length}`);
        th_main.setAttribute("id", `full-table-header-width`);
        th_main.textContent = "Things to do";
        headerRow_mainHeader.appendChild(th_main);
    }
    
    const headerRow_headers = thead.insertRow();
    columnsToShow.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col.colHeader;
        headerRow_headers.appendChild(th);
    });

    return thead;
}

//If existingBody != null it means we are going to add a new row to existing table
function buildBody(columnsToShow, tasksSource, existingBody = null) {
    const tbody = existingBody ?? document.createElement("tbody");
    tasksSource.forEach((task) => {
        const row = buildRowFromTask(task, columnsToShow, null);
        tbody.appendChild(row);
    });
    return tbody;
}

function buildRowFromTask(task, columnsToShow, existingRow = null) {
    const row = existingRow ?? document.createElement("tr");
    row.innerHTML = "";
    row.dataset.id = task.id;

    columnsToShow.forEach((col) => {
        const cell = row.insertCell();
        if (col.name === "actions") {
            const editBtn = document.createElement("button");
            editBtn.className = "activity editRow";
            editBtn.textContent = "+";
            cell.appendChild(editBtn);

            const removeBtn = document.createElement("button");
            removeBtn.className = "activity removeRow";
            removeBtn.textContent = "-";
            cell.appendChild(removeBtn);

            const showBtn = document.createElement("button");
            showBtn.className = "activity showRow";
            showBtn.textContent = "...";
            cell.appendChild(showBtn);
        } else if (col.name === "isDone" || col.name === "select") {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = !!task[col.name];
            if (visabilityFlags.isHistoryTable) checkbox.disabled = true;
            cell.appendChild(checkbox);
        } else {
            cell.textContent = task[col.name];
        }
    });

    return row;
}

function setBodyDesign(element, isScreenChanged) {
    if (isScreenChanged) {
        detectScreenSize();
        if (visabilityFlags.isMobScreen) {
            responsiveDesign.backgroundColor = "yellow";
            responsiveDesign.myWidth = "100%";
        } else if (visabilityFlags.isTabScreen) {
            responsiveDesign.backgroundColor = "aqua";
            responsiveDesign.myWidth = "90%";
        } else if (visabilityFlags.isDescScreen) {
            responsiveDesign.backgroundColor = "lightblue";
            responsiveDesign.myWidth = "80%";
        }
    }

    element.setAttribute("style", `background-color:${responsiveDesign.backgroundColor}`);
    document.documentElement.style.setProperty("--my-width", responsiveDesign.myWidth);
}

function extractIncomingData(shouldCreateNewId, task) {
    if (shouldCreateNewId) {
        task.id = taskManager.getMaxId() + 1;
    }

    task.isDone = dom.modal.isDone.checked;
    task.group = dom.modal.group.value.trim() || EMPTY_GROUP;
    task.priority = PRIORITY_LOWEST - Number(dom.modal.priority.value.trim());
    task.details = dom.modal.details.value;
    task.deadline = formatTime(dom.modal.deadline.value, LOCAL_EN);
}

//If it's marked as newTask, the field "createdAt" will be updated; otherwise, "updatedAt" will be updated.
function formatTime(timeToConvert, local = LOCAL_EN) {
    const now = timeToConvert === null ? new Date() : new Date(timeToConvert);

    const dd = String(now.getDate()).padStart(2, "0");
    const mo = new Intl.DateTimeFormat(local, { month: "short" }).format(now);
    const yyyy = String(now.getFullYear());

    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
    const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");

    return `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
}

function closeHistoryModal() {
    visabilityFlags.isHistoryTable = false;
    dom.modal.historyModalWindow.classList.add("hidden");
}

function closeModal() {
    dom.modal.modalWindow.classList.add("hidden");
}

function openHistoryModal() {
    dom.modal.historyModalWindow.classList.remove("hidden");
}

function openModal() {
    dom.modal.modalWindow.classList.remove("hidden");
}

function updateDomWithExistedGroups() {
    const existingGroups = taskManager.getExistingGroups();
    let htmlStr = "";

    existingGroups.forEach((group) => {
        htmlStr += `<option value="${group}"></option>`;
    });

    dom.groupsList.innerHTML = htmlStr;
}

function updatePriorityValue(priorityIn, priorityOut) {
    priorityOut.textContent = PRIORITY_LOWEST - priorityIn.value;
}

function disableMassActivity() {
    if (taskManager.isEmpty()) {
        dom.deactivated.forEach((el) => {
            el.setAttribute("disabled", "");
        });
    }
}

function enableActivity() {
    dom.deactivated.forEach((el) => {
        el.removeAttribute("disabled");
    });
}

function calculateColumnCount() {
    tableFieldsCount = Object.keys(singleTask).length;
}

function handleHistoryModalClick(e) {
    if (e.target.matches("#historySubmitBtn") || e.target.matches("#historyCloseBtn")) {
        e.preventDefault();
        closeHistoryModal();
    }
}

window.addEventListener("resize", () => updateDataOnScreen(taskManager.getAllTasks(), dom.taskTable));

//Update selected priority value in the middle window
document.addEventListener("DOMContentLoaded", () => {
    if (TEST_MODE_ON) {
        populateWithTestData();
    }

    const priorityInput = document.getElementById("task-priority");
    const priorityOutput = document.getElementById("priority-value");
    priorityInput.addEventListener("input", () => updatePriorityValue(priorityInput, priorityOutput));
    disableMassActivity();
    detectScreenSize();
    updateDataOnScreen(taskManager.getAllTasks(), dom.taskTable);
    closeModal();
    closeHistoryModal();
});

//Add click listeners
dom.taskTable.addEventListener("click", handleTableClick);
dom.managingBlock.forEach((block) => {
    block.addEventListener("click", handleManagingClick);
});
dom.modal.modalWindow.addEventListener("click", handleModalClick);
dom.modal.historyModalWindow.addEventListener("click", handleHistoryModalClick);

//************************************************************************
//TEST SECTION
function populateWithTestData() {
    createTestTasks(test_data.outer_data_size, null).forEach((t) => taskManager.addTask(t));
    for (let i = 0; i < test_data.outer_data_size; i++) {
        const details = taskManager.getTaskById(i + 1).details;
        taskManager.updateTaskHistoryById(i + 1, createTestTasks(test_data.inner_data_size, details));
    }
}

function createTestTasks(taskLimit, keepTaskDetails) {
    const testTaskArr = [];
    for (let i = 0; i < taskLimit; i++) {
        const newTestTask = structuredClone(singleTask);
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
//************************************************************************

// function searchDone() {
//     const doneTasks = Array.from(domSelection.rows).filter((currentRow) => isRowDone(currentRow));
//     doneTasks.forEach((currenTask) => updateDesignForDone(currenTask));
// }

// function updateDesignForDone(currenTask) {
//     const thirdTh = currentTask.querySelector("th")[2];
//     thirdTh.style.textDecoration = "line-through";
//     thirdTh.style.textAlign = "center";
// }

// function isRowDone(currentRow) {
//     const done = currentRow.querySelector("th > input");
//     return done?.checked ?? false;
// }

// function setRowDone(currentRow) {
//     const done = currentRow.querySelector("th > input");
//     done.checked = true;
//     done.setAttribute("checked", "checked");
//     done.classList.add("checked");
// }
