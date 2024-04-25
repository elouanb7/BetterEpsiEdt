<script>
import fetchAndParseSchedule from "./logic/scrapper.js";

export default {
  name: 'MapBase',
  data() {
    return {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      courses: {
        Monday: null,
        Tuesday: null,
        Wednesday: null,
        Thursday: null,
        Friday: null
      },
      inputValue: ""
    }
  },
  created() {
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('name');
    if (nameParam) {
      this.inputValue = nameParam;
    }
  },
  async mounted() {
    if (this.inputValue != null || this.inputValue !== "") {
      this.retrieveSchedule(this.inputValue)
    }
  },
  methods: {
    retrieveSchedule(name){
      fetchAndParseSchedule(name)
          .then(schedule => {
            if(schedule == null){
              console.log("Invalid input.")
            }
            schedule.forEach(entry => {
              this.courses[entry.day] = entry.courses;
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
      const newUrl = baseUrl + '?name=' + encodeURIComponent(this.inputValue);
      history.replaceState(null, '', newUrl);
    }
  },
  watch: {
    inputValue: function(newValue) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.retrieveSchedule(newValue);
        this.updateUrl()
      }, 1500);
    }
  },
  beforeDestroy() {
    clearTimeout(this.timeout);
  }
}


</script>

<template>
  <div id="app">
    <div class="timetable">
      <div class="header">
        <div class="time-column"></div>
        <div v-for="day in days" :key="day" class="day">{{ day }}</div>
      </div>
      <div class="timetable-body">
        <div class="time-column">
          <div v-for="hour in hours" :key="hour" class="hour">{{ hour }}</div>
        </div>
        <div v-for="day in days" :key="day" class="day-column">
        <template v-for="(course, index) in courses[day]" :key="course.matiere + index">
          <div v-if="index === 0"
               class="course-empty"
               :style="{ height: ((convertHourToNumber(course.debut) - 8) * 30) + 'px' }"></div>
          <div v-else-if="convertHourToNumber(course.debut) !== convertHourToNumber(courses[day][index-1].fin)"
               class="course-empty"
               :style="{ height: ((convertHourToNumber(course.debut) - convertHourToNumber(courses[day][index-1].fin)) * 30) + 'px' }"></div>
          <div class="course"
               :style="{ height: calculateCourseHeight(course) + 'px', backgroundColor: course.color.color, color: course.color.textColor}">
            <span>{{ course.matiere }}</span><br>
            <span style="font-size: small">Salle : {{ course.salle }}</span><br>
            <span style="font-size: x-small">Prof : {{ course.prof }}</span><br>
            <span style="font-size: x-small">{{convertHourToText(course.debut)}}-{{convertHourToText(course.fin)}}</span>
          </div>
        </template>
        </div>
      </div>
    </div>
    <div class="form">
      <input type="text" class="name-input" v-model="inputValue" placeholder="Enter your input">
    </div>
  </div>
</template>

<style scoped>

.header {
  display: flex;
  width: 100%;
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
}

.course-empty {
  border: none;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

.name-input {
  width: 15%;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
}

@media screen {

}
</style>
