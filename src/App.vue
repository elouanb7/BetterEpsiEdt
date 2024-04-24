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
      }
    }
  },
  async mounted() {
    const nameSurname = 'elouan.bessettes';
    fetchAndParseSchedule(nameSurname)
        .then(schedule => {
          schedule.forEach(entry => {
            this.courses[entry.day] = entry.courses;
          });
        })
        .catch(error => {
          console.error('Error:', error);
        });
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
          <div v-for="course in courses[day]" :key="course.matiere" class="course">
            <span>{{ course.matiere }}</span>
            <span>{{ course.salle }}</span>
            <span>{{ course.prof }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timetable {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
}

.time-column {
  width: 100px; /* Adjust width as needed */
}

.day {
  width: calc(100% / 7); /* Assuming 7 days in a week */
  text-align: center;
}

.timetable-body {
  display: flex;
}

.hour {
  height: 60px; /* Adjust height as needed */
}

.day-column {
  flex: 1;
  border-left: 1px solid #ccc;
}

.course {
  border: 1px solid #000;
  padding: 5px;
  margin-bottom: 5px;
}
</style>
