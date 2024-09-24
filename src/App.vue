<script>
import fetchAndParseSchedule from "./logic/scrapper.js";
import LoadingSpinner from "./components/LoadingSpinner.vue";

export default {
  name: 'MapBase',
  components: {LoadingSpinner},
  data() {
    return {
      days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
      hours: ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      courses: {
        Lundi: null,
        Mardi: null,
        Mercredi: null,
        Jeudi: null,
        Vendredi: null
      },
      inputValue: "",
      dateInput: "",
      coursesCount: 0,
      init: true,
      isMobile: false
    }
  },
  created() {
    this.fillInputs()
    this.CheckMobile()
  },
  mounted() {
  },
  methods: {
    fillInputs() {
      const urlParams = new URLSearchParams(window.location.search);
      const nameParam = urlParams.get('name');
      if (nameParam) {
        this.inputValue = nameParam;
      }
      const dateParam = urlParams.get('date');
      if (dateParam) {
        this.dateInput = dateParam;
      } else {
        this.dateInput = this.formatDate(new Date());
      }
    },
    CheckMobile() {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        this.isMobile = true;
      }
    },
    formatDate(date) {
      return date.toISOString().slice(0, 10);
    },
    changeDate(days) {
      const current = new Date(this.dateInput);
      current.setDate(current.getDate() + days); // Add/subtract days
      this.dateInput = this.formatDate(current); // Update the date input value
    },
    retrieveSchedule(name, date = null) {
      fetchAndParseSchedule(name, date)
          .then(schedule => {
            if (schedule == null) {
              console.log("Invalid input.")
              return;
            }
            this.coursesCount = 0
            schedule.forEach(entry => {
              this.courses[entry.day] = entry.courses;
              this.coursesCount += entry.courses.length;
            });
          })
          .catch(error => {
            console.error('Error:', error);
          });
    },
    calculateCourseHeight(course) {
      const startDate = this.convertHourToNumber(course.debut)
      const endDate = this.convertHourToNumber(course.fin)
      const durationInHours = endDate - startDate
      return durationInHours * 30;
    },
    convertHourToNumber(hourString) {
      const [hours, minutes] = hourString.split(':').map(Number);
      let hourNumber;
      if (hours === 24 && minutes === 0) {
        // Special case for "24:00", which should be converted to 24
        hourNumber = 24;
      } else {
        // Otherwise, calculate the hour number
        hourNumber = (hours % 24) + (minutes / 60);
      }

      return hourNumber;
    },
    convertHourToText(hourString) {
      const [hours, minutes] = hourString.split(':');
      return hours + 'h' + minutes
    },
    updateUrl() {
      const baseUrl = window.location.href.split('?')[0];
      const newUrl = baseUrl + '?name=' + encodeURIComponent(this.inputValue) + '&date=' + encodeURIComponent(this.dateInput);
      history.replaceState(null, '', newUrl);
    }
  },
  watch: {
    inputValue: function (newValue) {
      clearTimeout(this.nameTimeout);
      this.nameTimeout = setTimeout(() => {
        if (this.init === false) {
          this.retrieveSchedule(newValue, this.dateInput);
          this.updateUrl()
        } else {
          this.init = false
        }
      }, 1500);
    },
    dateInput: function (newValue) {
      this.retrieveSchedule(this.inputValue, newValue);
      this.updateUrl()
    }
  },
  beforeDestroy() {
    clearTimeout(this.nameTimeout);
  }
}


</script>

<template>
  <div id="app">
    <div class="timetable">
      <h1>L'edt de fouuuuuu</h1>
      <div class="header">
        <div class="time-column"></div>
        <div v-for="day in days" :key="day" class="day">{{ day }}</div>
      </div>
      <div ref="timetable" class="timetable-body">
        <div class="time-column">
          <div v-for="hour in hours" :key="hour" class="hour">{{ hour }}</div>
        </div>
        <div v-if="coursesCount > 0" v-for="day in days" :key="day" class="day-column">
          <template v-for="(course, index) in courses[day]" :key="course.matiere + index">
            <div v-if="index === 0"
                 class="course-empty"
                 :style="{ height: ((convertHourToNumber(course.debut) - 8) * 30) + 'px' }"></div>
            <div v-else-if="convertHourToNumber(course.debut) !== convertHourToNumber(courses[day][index-1].fin)"
                 class="course-empty"
                 :style="{ height: ((convertHourToNumber(course.debut) - convertHourToNumber(courses[day][index-1].fin)) * 30) + 'px' }"></div>
            <div class="course"
                 :style="{ height: (calculateCourseHeight(course)-10) + 'px', backgroundColor: course.color.color, color: course.color.textColor}">
              <span>{{ course.matiere.toLowerCase() }}</span>
              <span>Salle : {{ course.salle }}</span>
              <span v-if="!isMobile">Prof : {{ course.prof }}</span>
              <span>{{ convertHourToText(course.debut) }}-{{ convertHourToText(course.fin) }}</span>
            </div>
          </template>
        </div>
        <div class="empty-week" v-else-if="init === true">
          <LoadingSpinner/>
        </div>
        <div class="empty-week" v-else>
          Pas de cours cette semaine 🏖️
        </div>
      </div>
    </div>
    <div class="form">
      <p>Entrez votre prénom et nom (prenom.nom)</p>
      <input type="text" class="input" v-model="inputValue" placeholder='Entrez "prenom.nom"'>
      <div class="date-container">
        <button class="button" @click="changeDate(-7)">⬅️</button>
        <input type="date" class="input date-input" v-model="dateInput" placeholder='MM/DD/YYYY'>
        <button class="button" @click="changeDate(7)">➡️</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.header {
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
}

h1 {
  text-align: center;
}

span {
  font-size: 0.55rem;
  text-transform: capitalize;
  margin-bottom: 0.3rem;
}

.time-column {
  width: 80px;
  text-align: center;
}

.day {
  width: calc(100% / 5); /* Assuming 7 days in a week */
  text-align: center;
  margin-left: 1px;
}

.timetable-body {
  display: flex;
  width: 100%;
}

.hour {
  height: 30px; /* Adjust height as needed */
}

.day-column {
  width: calc(100% / 5);
  border-left: 1px solid #ccc;
}

.course {
  border-radius: 10px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.course-empty {
  border: none;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  gap: 10px;

  p {
    margin-bottom: 0.5rem;
  }
}

.input {
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
}

.button {
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
}

.date-container {
  display: flex;
  gap: 10px;
  min-width: 100px
}

.date-input {
  cursor: pointer;
}

.empty-week {
  width: 100%;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media screen and (min-width: 600px) {
  span {
    font-size: 0.85rem;
  }
}
</style>
