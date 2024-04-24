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
  },
  methods: {
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
    }
  },
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
            <span>{{ course.matiere }}</span>
            <span>{{ course.salle }}</span>
            <span>{{ course.prof }}</span>
          </div>
        </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.header {
  display: flex;
  width: 100%;
}

.time-column {
  width: 50px /* Adjust width as needed */
}

.day {
  width: calc(100% / 5 - 50px); /* Assuming 7 days in a week */
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
  width: calc(100% / 5 - 50px);
  border-left: 1px solid #ccc;
}

.course {
  border-radius: 10px;
}

.course-empty {
  border: none;
}
</style>
