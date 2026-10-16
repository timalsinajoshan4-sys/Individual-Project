const clock = document.getElementById("clock");
const todayDate = document.getElementById("today-date");
const monthYear = document.getElementById("month-year");
const calendarDays = document.getElementById("calendar-days");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const eventsHeading = document.getElementById("events-heading");
const eventsList = document.getElementById("events-list");
const eventDialog = document.getElementById("event-dialog");
const eventForm = document.getElementById("event-form");
const eventTitle = document.getElementById("event-title");
const eventTime = document.getElementById("event-time");
const eventDescription = document.getElementById("event-description");
const cancelEventBtn = document.getElementById("cancel-event");

const now = new Date();
let currentMonth = now.getMonth();
let currentYear = now.getFullYear();

let selectedDate = formatDate(now);

let eventDate = selectedDate;

let events = {};

try {
    const savedEvents = localStorage.getItem("calendarEvents");
    events = savedEvents ? JSON.parse(savedEvents) : {};

    if (
        !events ||
        typeof events !== "object" ||
        Array.isArray(events)
    ) {
        events = {};
    }
} catch (error) {
    events = {};
    console.error("Could not load saved events:", error);
}

function updateClock() {
    const now = new Date();

    clock.textContent = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    todayDate.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

updateClock();
setInterval(updateClock, 1000);

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    // Use local date values to avoid timezone shifts
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function renderCalendar() {
    calendarDays.replaceChildren();

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(
        currentYear,
        currentMonth + 1,
        0
    ).getDate();

    const daysInPreviousMonth = new Date(
        currentYear,
        currentMonth,
        0
    ).getDate();

    monthYear.textContent = new Date(
        currentYear,
        currentMonth,
        1
    ).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    const today = formatDate(new Date());

    for (let i = 0; i < 42; i++) {
        let dayNumber;
        let date;
        let isOtherMonth = false;

        if (i < firstDay) {
            dayNumber = daysInPreviousMonth - firstDay + i + 1;
            date = new Date(currentYear, currentMonth - 1, dayNumber);
            isOtherMonth = true;
        } else if (i >= firstDay + daysInMonth) {
            dayNumber = i - firstDay - daysInMonth + 1;
            date = new Date(currentYear, currentMonth + 1, dayNumber);
            isOtherMonth = true;
        } else {
            dayNumber = i - firstDay + 1;
            date = new Date(currentYear, currentMonth, dayNumber);
        }

        const dateString = formatDate(date);
        const dayButton = document.createElement("button");

        dayButton.type = "button";
        dayButton.classList.add("calendar-day");
        dayButton.textContent = dayNumber;
        dayButton.dataset.date = dateString;

        dayButton.setAttribute(
            "aria-label",
            formatDisplayDate(dateString)
        );

        if (isOtherMonth) {
            dayButton.classList.add("other-month");
        }

        if (dateString === today) {
            dayButton.classList.add("today");
        }

        if (dateString === selectedDate) {
            dayButton.classList.add("selected");
            dayButton.setAttribute("aria-pressed", "true");
        } else {
            dayButton.setAttribute("aria-pressed", "false");
        }

        if (events[dateString]?.length > 0) {
            dayButton.classList.add("has-event");
            dayButton.title = `${events[dateString].length} event(s)`;
        }

        // Single-click: select date and display its events
        dayButton.addEventListener("click", function () {
            selectedDate = dateString;
            renderCalendar();
            renderEvents();
        });

        // Double-click: open the form to add an event
        dayButton.addEventListener("dblclick", function () {
            selectedDate = dateString;
            eventDate = dateString;

            renderCalendar();
            renderEvents();
            openEventForm();
        });

        calendarDays.appendChild(dayButton);
    }
}

prevMonthBtn.addEventListener("click", function () {
    currentMonth--;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    renderCalendar();
});

nextMonthBtn.addEventListener("click", function () {
    currentMonth++;

    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    renderCalendar();
});

function renderEvents() {
    eventsHeading.textContent =
        `Events for ${formatDisplayDate(selectedDate)}`;

    eventsList.replaceChildren();

    const dateEvents = events[selectedDate] || [];

    if (dateEvents.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No events or reminders for this date.";
        eventsList.appendChild(message);
        return;
    }

    dateEvents.forEach(function (event, index) {
        const eventCard = document.createElement("article");
        eventCard.classList.add("event-item");

        const title = document.createElement("h3");
        title.textContent = event.title;

        eventCard.appendChild(title);

        if (event.time) {
            const time = document.createElement("p");
            time.classList.add("event-time");
            time.textContent = `Time: ${event.time}`;
            eventCard.appendChild(time);
        }

        if (event.description) {
            const description = document.createElement("p");
            description.textContent = event.description;
            eventCard.appendChild(description);
        }

        // Delete event button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete event";
        deleteButton.style.marginTop = "10px";
        deleteButton.style.padding = "7px 10px";
        deleteButton.style.border = "none";
        deleteButton.style.borderRadius = "6px";
        deleteButton.style.cursor = "pointer";

        deleteButton.addEventListener("click", function () {
            const confirmed = confirm(
                `Delete "${event.title}"?`
            );

            if (!confirmed) {
                return;
            }

            events[selectedDate].splice(index, 1);

            if (events[selectedDate].length === 0) {
                delete events[selectedDate];
            }

            saveEvents();
            renderCalendar();
            renderEvents();
        });

        eventCard.appendChild(deleteButton);
        eventsList.appendChild(eventCard);
    });
}

function openEventForm() {
    eventForm.reset();

    if (typeof eventDialog.showModal === "function") {
        eventDialog.showModal();
        eventTitle.focus();
    } else {
        alert("Your browser does not support the event dialog.");
    }
}

// Save a new event when the form is submitted
eventForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = eventTitle.value.trim();
    const time = eventTime.value;
    const description = eventDescription.value.trim();

    if (!title) {
        alert("Please enter an event title.");
        eventTitle.focus();
        return;
    }

    if (!events[eventDate]) {
        events[eventDate] = [];
    }

    events[eventDate].push({
        id: Date.now().toString(),
        title: title,
        time: time,
        description: description
    });

    saveEvents();

    selectedDate = eventDate;

    const [year, month] = eventDate.split("-").map(Number);
    currentYear = year;
    currentMonth = month - 1;

    eventDialog.close();

    renderCalendar();
    renderEvents();
});

cancelEventBtn.addEventListener("click", function () {
    eventDialog.close();
});

function saveEvents() {
    try {
        localStorage.setItem(
            "calendarEvents",
            JSON.stringify(events)
        );
    } catch (error) {
        console.error("Could not save events:", error);
        alert(
            "Your event could not be saved. Check your browser storage."
        );
    }
}

renderCalendar();
renderEvents();