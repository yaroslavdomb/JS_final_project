import { Task } from "./Task.js";
import { TaskManager } from "./TaskManager.js";
import * as helper from "./helper.js";
import { populateWithTestData } from "./testing.js";
import { TEST_MODE_ON, SCREEN_SIZES, EMPTY_GROUP, PRIORITY_LOWEST, visabilityFlags } from "./config.js";

const taskManager = new TaskManager();
let sortOrder = true;
let selectedAll = false;

const responsiveDesign = {
    backgroundColor: "",
    myWidth: ""
};

const htmlRow = {
    rowEl: {},
    idEl: {},
    id: ""
};

const tableColumnsConfig = [
    { name: "select", colHeader: "select", isVisible: true },
    { name: "id", colHeader: "ID", isVisible: (visabilityFlags) => !visabilityFlags.isHistoryTable },
    { name: "isDone", colHeader: "Done", isVisible: true },
    { name: "priority", colHeader: "Priority", isVisible: true },
    { name: "group", colHeader: "Group", isVisible: true },
    { name: "details", colHeader: "Task details", isVisible: true },
    { name: "deadline", colHeader: "Deadline", isVisible: true },
    { name: "deadlineTs", colHeader: "", isVisible: false },
    { name: "createdAt", colHeader: "Created At", isVisible: (visabilityFlags) => visabilityFlags.isDescScreen },
    { name: "createdAtTs", colHeader: "", isVisible: false },
    { name: "updatedAt", colHeader: "Updated At", isVisible: (visabilityFlags) => visabilityFlags.isDescScreen },
    { name: "updatedAtTs", colHeader: "", isVisible: false },
    { name: "changes", colHeader: "", isVisible: false },
    { name: "actions", colHeader: "Actions", isVisible: (visabilityFlags) => !visabilityFlags.isHistoryTable }
];

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
        filterModalWindow: document.getElementById("filterModalOverlay"),
        historyTable: document.getElementById("history-table"),
        submitBtn: document.getElementById("submitBtn"),
        isDone: document.getElementById("task-is-done"),
        group: document.getElementById("task-group"),
        priority: document.getElementById("task-priority"),
        details: document.getElementById("task-details"),
        deadline: document.getElementById("task-deadline"),
        legend: document.getElementById("modal-legend"),
        priorityOut: document.getElementById("priority-value"),
        finalFilterTextarea: document.getElementById("finalFilter")
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
    } else if (e.target.matches('input[type="checkbox"]')) {
        handleCheckbox(e);
    } else if (e.target.matches("th")) {
        const sortBy = e.target.dataset.colSorting;
        const sortParams = taskManager.detectSortFunction(sortBy);
        if (sortParams) {
            taskManager.sortBy(sortOrder, sortParams);
            sortOrder = !sortOrder;
            updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        }
    }
}

function handleCheckbox(e) {
    getHTMLEl(e);

    const checkboxType = e.target.dataset.taskChecked;
    if (checkboxType === "status") {
        const clickedTask = taskManager.getTaskById(htmlRow.id);
        updateTaskHistory();
        clickedTask.isDone = !clickedTask.isDone;
        clickedTask.updatedAt = helper.formatTime(null, helper.LOCAL_EN);
        clickedTask.changes[clickedTask.changes.length - 1].changes = [];
        updateRowOnScreen(clickedTask, dom.taskTable);
    } else {
        const clickedTask = taskManager.getTaskById(htmlRow.id);
        taskManager.toggleSelection(htmlRow.id);
        updateRowOnScreen(clickedTask, dom.taskTable);
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

// Click on remove button in the table row
function handleRemoveTask(event) {
    getHTMLEl(event);
    //TODO: updateTasksStatistics(htmlRow.id, "remove");
    taskManager.removeTaskById(htmlRow.id);
    disableMassActivity();
    htmlRow.rowEl.parentNode.removeChild(htmlRow.rowEl);
}

//Redirect clicks in managing section
//Upload click propcessed by handleFileUpload cause
// it's a different type of event - "change"? not an action
function handleManagingClick(e) {
    if (e.target.matches(".add")) {
        prepareModal(false);
        openModal();
    } else if (e.target.matches(".download")) {
        taskManager.saveInFile();
    } else if (e.target.matches(".select")) {
        taskManager.toggleAllSelected(selectedAll);
        selectedAll = !selectedAll;
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
    } else if (e.target.matches(".filter")) {
        openFilterModal();
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file || file.type !== "application/json") {
        console.error(`${file.name} is not a JSON file.`);
        alert("Please select JSON file.");
        return;
    } else if (file.size === 0) {
        console.error(`File ${file.name} is empty!`);
        alert(`File ${file.name} is empty!`);
        return;
    }

    try {
        const text = await file.text();
        const taskArr = JSON.parse(text);
        taskManager.uploadTasks(taskArr);
        updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
        enableMassActivity();
    } catch (error) {
        console.error(`Error while processing ${file.name}: ` + error);
    }
}

function handleSaveTask(isEditMode) {
    const incomingData = getChangeableFieldsFromModal();
    if (isEditMode) {
        const updatedTask = taskManager.updateTask(htmlRow.id, incomingData);
        if (updatedTask) {
            updateRowOnScreen(updatedTask, dom.taskTable);
        }
    } else {
        const newTask = Task.createTask(incomingData);
        taskManager.addTask(newTask);
        addRowToScreen(newTask, dom.taskTable);
        if (!taskManager.isEmpty()) {
            enableMassActivity();
        }
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

function handleHistoryModalClick(e) {
    if (e.target.matches("#historySubmitBtn") || e.target.matches("#historyCloseBtn")) {
        e.preventDefault();
        closeHistoryModal();
    }
}

function handleFilterModalClick (e){
    if (e.target.matches("#filterSubmitBtn")) {
        e.preventDefault();
        //TODO - get data from modal and do parsing
        closeFilterModal();
    } else if (e.target.matches("#filterCloseBtn")) {
        e.preventDefault();
        closeFilterModal();
    } else if (e.target.matches("#clearFilter")) {
        const finalFilterTextarea = document.getElementById("finalFilter");
        finalFilterTextarea.value = "";
    }
}

function updateTaskHistory() {
    const currentTask = taskManager.getTaskById(htmlRow.id);
    const historyCopyOfTask = currentTask.deepClone();
    currentTask.changes.push(historyCopyOfTask);
}

function updateRowOnScreen(task, table) {
    const existingRow = table.querySelector(`tr[data-id="${task.id}"]`);
    const columnsToShow = getColumnsToShow();
    buildRowFromTask(task, columnsToShow, existingRow);
}

//order of updateDomWithExistedGroups and setModalFields is important
// as otherwise existed groups will be loosed in modal window
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

//TODO
function updateTasksStatistics(id, action) {}

function detectScreenSize() {
    const width = window.innerWidth;
    if (width >= SCREEN_SIZES.MOBILE && width < SCREEN_SIZES.TABLET) {
        visabilityFlags.isMobScreen = true;
        visabilityFlags.isTabScreen = false;
        visabilityFlags.isDescScreen = false;
    } else if (width >= SCREEN_SIZES.TABLET && width < SCREEN_SIZES.DESKTOP) {
        visabilityFlags.isMobScreen = false;
        visabilityFlags.isTabScreen = true;
        visabilityFlags.isDescScreen = false;
    } else if (width >= SCREEN_SIZES.DESKTOP) {
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

    //Header of the table
    if (!visabilityFlags.isHistoryTable) {
        const headerRow_mainHeader = thead.insertRow();
        headerRow_mainHeader.setAttribute("class", "full-table-header");
        const th_main = document.createElement("th");
        th_main.setAttribute("colspan", `${columnsToShow.length}`);
        th_main.setAttribute("id", `full-table-header-width`);
        th_main.textContent = "Things to do";
        headerRow_mainHeader.appendChild(th_main);
    }

    //Columns headers
    const headerRow_headers = thead.insertRow();
    columnsToShow.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col.colHeader;
        const sorting = helper.mapColumnName2Dataset(col.colHeader);
        if (sorting) th.dataset.colSorting = sorting;
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
            const dataType = col.name === "isDone" ? "status" : "selection";
            checkbox.dataset.taskChecked = dataType;
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

function getChangeableFieldsFromModal() {
    return {
        isDone: dom.modal.isDone.checked,
        group: dom.modal.group.value.trim() || EMPTY_GROUP,
        priority: PRIORITY_LOWEST - Number(dom.modal.priority.value.trim()),
        details: dom.modal.details.value,
        deadline: helper.formatTime(dom.modal.deadline.value, helper.LOCAL_EN)
    };
}

function closeFilterModal() {
    dom.modal.filterModalWindow.classList.add("hidden");
}

function closeHistoryModal() {
    visabilityFlags.isHistoryTable = false;
    dom.modal.historyModalWindow.classList.add("hidden");
}

function closeModal() {
    dom.modal.modalWindow.classList.add("hidden");
}

function openFilterModal() {
    dom.modal.filterModalWindow.classList.remove("hidden");
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
            el.classList.remove("btn-is-active");
        });
    }
}

function enableMassActivity() {
    if (!taskManager.isEmpty()) {
        dom.deactivated.forEach((el) => {
            el.classList.add("btn-is-active");
        });
    }
}

window.addEventListener("resize", () => updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable));

//Update selected priority value in the middle window
document.addEventListener("DOMContentLoaded", () => {
    if (TEST_MODE_ON) {
        populateWithTestData(taskManager);
        enableMassActivity();
    }

    const priorityInput = document.getElementById("task-priority");
    const priorityOutput = document.getElementById("priority-value");
    priorityInput.addEventListener("input", () => updatePriorityValue(priorityInput, priorityOutput));
    disableMassActivity();
    detectScreenSize();
    updateDataOnScreen(taskManager.getAllTasksForDisplay(), dom.taskTable);
    closeModal();
    closeHistoryModal();
    closeFilterModal();

    //filter builder functionality
    const modal = document.getElementById("filterModalOverlay");
    //const openModalBtn = document.getElementById("openModalBtn");
    //const closeBtn = document.getElementById("closeBtn");
    const applyFilterBtn = document.getElementById("filterSubmitBtn");
    const clearFilterBtn = document.getElementById("clearFilter");
    const finalFilterTextarea = document.getElementById("finalFilter");
    const dragBtns = document.querySelectorAll(".drag-btn");
    const fieldSelect = document.querySelector(".field");
    const operationSelect = document.querySelector(".operation");
    const valueContainer = document.querySelector(".value-container");
    const filterRow = document.querySelector(".filter-row");

    const fieldOperations = {
        bool: ["="],
        number: [">", ">=", "=", "<", "<="],
        string: ["equalTo", "startFrom", "endWith", "includes"],
        "date-time": [">", ">=", "=", "<", "<="]
    };

    const fieldValues = {
        bool: () => {
            valueContainer.innerHTML = `<label><input type="radio" name="bool" value="true">true</label>
            <label><input type="radio" name="bool" value="false">false</label>`;
        },
        number: () => {
            valueContainer.innerHTML = `<input type="text" class="value-input" placeholder="012..." />`;
        },
        string: () => {
            valueContainer.innerHTML = `<input type="text" class="value-input" placeholder="ABC..." />`;
        },
        "date-time": () => {
            valueContainer.innerHTML = `<input type="datetime-local" class="value-input" />`;
        }
    };

    function getCurrentValue() {
        const checked = document.querySelector('input[name="bool"]:checked');
        if (checked) return checked.value;
        const input = document.querySelector(".value-input");
        return input ? input.value : "";
    }

    dragBtns.forEach((btn) => {
        btn.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text", e.target.innerText);
        });
    });

    filterRow.addEventListener("dragstart", (e) => {
        const field = fieldSelect.value;
        const operation = operationSelect.value;
        const value = getCurrentValue();
        const filterString = `${field} ${operation} ${value}`;
        e.dataTransfer.setData("text", filterString);
    });

    finalFilterTextarea.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    finalFilterTextarea.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedText = e.dataTransfer.getData("text");
        finalFilterTextarea.value += draggedText + " ";
    });

    // openModalBtn.addEventListener("click", () => {
    //     modal.style.display = "flex";
    // });

    // closeBtn.addEventListener("click", () => {
    //     modal.style.display = "none";
    // });

    applyFilterBtn.addEventListener("click", () => {
        //TODO: use finalFilterTextarea.value ;
    });

    clearFilterBtn.addEventListener("click", () => {
        finalFilterTextarea.value = "";
    });

    fieldSelect.addEventListener("change", (e) => {
        const fieldType = e.target.selectedOptions[0].getAttribute("data-type");
        updateOperations(fieldType);
        updateValues(fieldType);
    });

    function updateOperations(fieldType) {
        operationSelect.innerHTML = "";
        fieldOperations[fieldType].forEach((op) => {
            const option = document.createElement("option");
            option.value = op;
            option.textContent = op;
            operationSelect.appendChild(option);
        });
    }

    function updateValues(fieldType) {
        fieldValues[fieldType]();
    }

    const defaultFieldType = fieldSelect.selectedOptions[0].getAttribute("data-type");
    updateOperations(defaultFieldType);
    updateValues(defaultFieldType);
});

//Add click listeners
dom.taskTable.addEventListener("click", handleTableClick);
dom.managingBlock.forEach((block) => {
    block.addEventListener("click", handleManagingClick);
    const fileInputs = block.querySelectorAll('input[type="file"]');
    fileInputs.forEach((fileInput) => {
        fileInput.addEventListener("change", handleFileUpload);
        fileInput.removeEventListener("click", handleManagingClick);
    });
});
dom.modal.modalWindow.addEventListener("click", handleModalClick);
dom.modal.historyModalWindow.addEventListener("click", handleHistoryModalClick);
dom.modal.filterModalWindow.addEventListener("click", handleFilterModalClick);

//document.getElementById("saveDataBtn").addEventListener("click", () => );
