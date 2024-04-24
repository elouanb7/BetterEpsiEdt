import axios from 'axios';

function getWorkingDays() {
    const currentDate = new Date();
    const currentDayOfWeek = currentDate.getDay();
    const currentHour = currentDate.getHours();

    // Array to hold the working days
    let workingDays = [];

    // Function to add days to the current date
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // Calculate working days based on current day of the week
    switch (currentDayOfWeek) {
        case 0: // Sunday
            currentDate.setDate(currentDate.getDate() + 1); // Move to Monday
            for (let i = 0; i <= 4; i++) {
                workingDays.push(addDays(currentDate, i));
            }
        case 6: // Saturday
            currentDate.setDate(currentDate.getDate() + 2); // Move to Monday
            for (let i = 0; i <= 4; i++) {
                workingDays.push(addDays(currentDate, i));
            }
            break;
        case 1: // Monday
            for (let i = 0; i <= 4; i++) {
                workingDays.push(addDays(currentDate, i));
            }
            break;
        case 2: // Tuesday
            for (let i = -1; i <= 3; i++) {
                workingDays.push(addDays(currentDate, i));
            }
            break;
        case 3: // Wednesday
            for (let i = -2; i <= 2; i++) {
                workingDays.push(addDays(currentDate, i));
            }
            break;
        case 4: // Thursday
            for (let i = -3; i <= 1; i++) {
                workingDays.push(addDays(currentDate, i));
            }
            break;
        case 5: // Friday
            if (currentHour >= 20) {
                currentDate.setDate(currentDate.getDate() + 3); // Move to Monday of next week
                for (let i = 0; i <= 4; i++) {
                    workingDays.push(addDays(currentDate, i));
                }
            }
            for (let i = -4; i <= 0; i++) {
                workingDays.push(addDays(currentDate, i));
            }
            break;
    }

    // Format dates to MM/DD/YYYY
    workingDays = workingDays.map(date => date.toLocaleDateString('en-US'));
    return workingDays;
}

async function fetchAndParseOneWorkingDay(tel, date) {
    const url = `https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx?Action=posETUD&serverid=C&tel=${tel}&date=${date}%208:00`;
    try {
        axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
        const response = await axios.get(url);
        const html = await response.data
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const lignes = doc.querySelectorAll('.Ligne');
        const daySchedule = [];
        lignes.forEach(ligne => {
            // Extract data from each 'Ligne' element
            const debut = ligne.querySelector('.Debut').textContent.trim();
            const fin = ligne.querySelector('.Fin').textContent.trim();
            const matiere = ligne.querySelector('.Matiere').textContent.trim();
            const salle = ligne.querySelector('.Salle').textContent.trim();
            const prof = ligne.querySelector('.Prof').textContent.trim();

            // Push the extracted data into the 'schedule' array
            daySchedule.push({
                debut,
                fin,
                matiere,
                salle,
                prof
            });
        });
        return daySchedule;
    } catch (error) {
        console.error('Error fetching or parsing schedule for :', error);
        return null;
    }
}

function addDays(weekSchedule){
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const scheduleByDay = [];
    weekSchedule.forEach((day, index) => {
        const dayOfWeek = days[index];
        const dayObject = {
            day: dayOfWeek,
            courses: day
        };
        scheduleByDay.push(dayObject);
    });
    return scheduleByDay
}

function getColorByIndex(index) {
    const colors =[
        "#184082ff",
        "#ba6e33ff",
        "#ffbe0bff",
        "#fb5607ff",
        "#ff3636ff",
        "#ff006eff",
        "#8338ecff",
        "#3a86ffff",
        "#68ff6bff",
        "#c6fffaff"
    ];
    return colors[index % colors.length];
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to shuffle predefined colors
function shuffleColors() {
    const colors = [
        { color: "#184082ff", textColor: "white" },
        { color: "#ba6e33ff", textColor: "white" },
        { color: "#ffbe0bff", textColor: "black" },
        { color: "#fb5607ff", textColor: "white" },
        { color: "#ff3636ff", textColor: "white" },
        { color: "#ff006eff", textColor: "white" },
        { color: "#8338ecff", textColor: "white" },
        { color: "#3a86ffff", textColor: "black" },
        { color: "#68ff6bff", textColor: "black" },
        { color: "#c6fffaff", textColor: "black" }
    ];
    return shuffle([...colors]); // Shuffle a copy of the colors array
}

function addColorsToSchedule(weekSchedule) {
    const matiereColors = {}; // Object to store colors for each matiere
    const colors = shuffleColors(); // Shuffle predefined colors

    weekSchedule.forEach(day => {
        day.courses.forEach(course => {
            if (!matiereColors.hasOwnProperty(course.matiere)) {
                // Assign a new color if matiere is encountered for the first time
                matiereColors[course.matiere] = colors.pop(); // Pop a color from the shuffled list
            }
            course.color = matiereColors[course.matiere];
        });
    });

    return weekSchedule;
}

export default async function fetchAndParseSchedule(tel) {
    const workingDays = getWorkingDays();
    let weekSchedule = []
    for (let i = 0; i < workingDays.length; i++) {
        await fetchAndParseOneWorkingDay(tel, workingDays[i]).then(workingDay => {
            weekSchedule.push(workingDay);
        })
    }
    weekSchedule = addDays(weekSchedule);
    return addColorsToSchedule(weekSchedule);
}

