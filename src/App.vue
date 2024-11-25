<script>
import fetchAndParseSchedule from "./logic/scrapper.js";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import InfoIcon from "./assets/icons/info.svg"
import CloseIcon from "./assets/icons/close.svg"

export default {
  name: 'MapBase',
  components: {LoadingSpinner, InfoIcon, CloseIcon},
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
      isMobile: false,
      tooltips: [],
      columnWidth: 0,
    }
  },
  created() {
    this.fillInputs()
    this.checkMobile()
    window.addEventListener('resize', this.handleResize);
  },
  mounted() {
    // Ensure that the initial column width is set after rendering
    this.updateColumnWidth();
  },
  computed: {},
  methods: {
    handleResize() {
      this.checkMobile();
      this.updateColumnWidth(); // Recalculate column width on resize
      this.updateTooltipsPositions()
    },
    isHigherEnough(height) {
      return height > 45
    },
    toggleTooltip(key) {
      console.log(key)
      const index = this.tooltips.findIndex((tooltip) => tooltip.key === key);
      if (index !== -1) {
        this.tooltips.splice(index, 1);
      } else {
        this.tooltips.push({key, value: true});
      }
    },
    isTooltipVisible(key) {
      return this.tooltips.some((tooltip) => tooltip.key === key && tooltip.value);
    },
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
    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
    },
    updateColumnWidth() {
      // Ensure we have access to the column div and that it has been rendered
      this.$nextTick(() => {
        const divs = this.$refs.columnDiv;
        if (divs) {
          this.columnWidth = divs[0].offsetWidth;
        }
      });
    },
    updateTooltipsPositions() {
      this.$nextTick(() => {
        this.tooltips.forEach(tooltip => {
          const course = this.$refs[tooltip.key];
          /*if (divs.length > 1) {
            this.columnWidth = divs[0].offsetWidth;
            console.log("Tooltips width updated:", this.columnWidth);
          }*/
        })
      });
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
          .then((schedule) => {
            if (!schedule) return console.log("Invalid input.");

            this.coursesCount = 0;
            schedule.forEach((entry) => {
              this.courses[entry.day] = entry.courses;
              this.courses[entry.day].date = entry.date;
              this.coursesCount += entry.courses.length;
            });

            // Ensure layout has updated before calculating column width
            this.$nextTick(() => {
              this.updateColumnWidth();
            });
          })
          .catch((error) => {
            console.error("Error:", error);
          });
    },
    calculateCourseHeight(course) {
      const startDate = this.convertHourToNumber(course.debut)
      const endDate = this.convertHourToNumber(course.fin)
      const durationInHours = endDate - startDate
      return durationInHours * 45;
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
    inputValue(newValue) {
      clearTimeout(this.nameTimeout);
      this.nameTimeout = setTimeout(() => {
        if (!this.init) {
          this.retrieveSchedule(newValue, this.dateInput);
          this.updateUrl()
        } else {
          this.init = false;
        }
      }, 1500);
    },
    dateInput(newValue) {
      this.retrieveSchedule(this.inputValue, newValue);
      this.updateUrl()
    }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    clearTimeout(this.nameTimeout);
  },
}


</script>

<template>
  <div id="app">
    <div class="timetable">
      <div class="header">
        <div class="time-column"></div>
        <div v-for="day in days" :key="day" class="day">{{
            day
          }}<br>{{
            courses[day] && courses[day].date ? new Date(courses[day].date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long'
            }) : null
          }}
        </div>
      </div>
      <div ref="timetable" class="timetable-body">
        <div class="time-column">
          <div v-for="hour in hours" :key="hour" class="hour">{{ hour }}</div>
        </div>
        <div v-if="coursesCount > 0" v-for="day in days" :key="day" class="day-column" ref="columnDiv">
          <template v-for="(course, index) in courses[day]" :key="course.matiere + index">
            <div v-if="index === 0"
                 class="course-empty"
                 :style="{ height: ((convertHourToNumber(course.debut) - 8) * 45) + 'px' }"></div>
            <div v-else-if="convertHourToNumber(course.debut) !== convertHourToNumber(courses[day][index-1].fin)"
                 class="course-empty"
                 :style="{ height: ((convertHourToNumber(course.debut) - convertHourToNumber(courses[day][index-1].fin)) * 45) + 'px' }"></div>
            <div class="course"
                 :ref="`${course.matiere + index}`"
                 :style="{ height: (calculateCourseHeight(course)-10) + 'px', backgroundColor: course.color.color, color: course.color.textColor}">
              <span class="class">{{ course.matiere }}</span>
              <span class="room">Salle : {{ (course.salle.startsWith("SALLE") ? "DISTANCIEL" : course.salle) }}</span>
              <span class="teacher"
                    v-if="!isMobile && isHigherEnough(calculateCourseHeight(course)-10)">Prof : {{ course.prof }}</span>
              <span class="hours" v-if="isHigherEnough(calculateCourseHeight(course)-10)">{{
                  convertHourToText(course.debut)
                }}-{{ convertHourToText(course.fin) }}</span>
              <div class="info-button-container" @click="toggleTooltip(course.matiere + index)">
                <button class="info-button" v-if="!isHigherEnough(calculateCourseHeight(course)-10)">
                  <InfoIcon/>
                </button>
                <div v-if="isTooltipVisible(course.matiere + index)" style=""
                     @click.stop="toggleTooltip(course.matiere + index)"
                     :style="[{width:columnWidth-17 + 'px', 'margin-left': -(columnWidth-51) + 'px', 'margin-top': 25 + 'px'}]"
                     class="tooltip">
                  <div
                      class="triangle"
                      :style="[{left:columnWidth-53 + 'px'}]"
                  ></div>
                  <div class="tooltip-message">
                    <div>
                      <span class="teacher">Prof : {{ course.prof }}</span><br>
                      <span class="hours">{{ convertHourToText(course.debut) }}-{{
                          convertHourToText(course.fin)
                        }}</span>
                    </div>
                    <button class="close-button">
                      <CloseIcon/>
                    </button>
                  </div>
                  <!--                  {'margin-left': (-columnWidth + 29.5) + 'px'}, {'margin-top': 10 + 'px'}-->
                </div>
              </div>
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
  height: 45px; /* Adjust height as needed */
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
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;

  .class, .room {
    font-size: 0.65rem;
  }

  .teacher {
    font-size: 0.65rem;
  }

  .hours {
    font-size: 0.55rem;
  }
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
  margin-left: 38px;
}

.info-button, .close-button {
  background: none;
  border: none;
  padding: 0;
  width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-button {
  filter: brightness(0) invert(1);
  margin: 3px;
}

.info-button-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  height: 40px;
  background-color: #333;
  color: #fff;
  padding: 8px;
  border-radius: 10px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.tooltip-message {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
}

.triangle {
  position: absolute;
  top: -20px; /* Triangle above the bubble */
  border-width: 10px;
  border-style: solid;
  border-color: transparent transparent #333 transparent;
  width: 0;
  height: 0;
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

@media screen and (min-width: 768px) {
  .course {
    .class, .teacher, .room {
      font-size: small;
    }

    .hours {
      font-size: x-small;
    }
  }
}
</style>
