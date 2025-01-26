"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// let map, mapEvent;

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  // clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; //[lag, lng]
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {

    //prettier-ignore
    const months = [
      "January","February", "March", "April", "May", "June", "July", "August", "September","October","November", "December",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} On
     ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  // click() {
  //   this.clicks++
  // }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcSpace();
    this._setDescription();
  }

  calcSpace() {
    this.space = this.duration / this.distance;
    return this.space;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); //km/h
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycl1 = new Cycling([39, -12], 8.8, 74, 108);
// console.log(run1, cycl1)

/**************************/
//  APP ARTECHRURE
/**************************/
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this))
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get location");
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    // const {  longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling click on map
    this.#map.on("click", this._showForm.bind(this));
    return this;
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
      "";

      form.style.display = "none"
      form.classList.add("hidden");
      setTimeout(()=> form.style.display = "grid", 1000)

  }
  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _newWorkout(e) {
    //  console.log(this);
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;

      //Check if data is valid
      // if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence))
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Input value has to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout cycling, create cycling object (elevation gain can be negative)

    if (type === "cycling") {
      const elevation = +inputElevation.value;

      //Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Input value has to be positive numbers!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    //Render workout on on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout on list
    this._renderWorkout(workout);

    //hide form
    this._hideForm()
   
  }
  _renderWorkoutMarker(workout) {
    //render workout on map as marker
    console.log(this.#mapEvent);
    console.log(workout);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type  == "running" ? "🏃‍♂️" : "🚴"} ${workout.description}`)
      .openPopup();
  }
  _renderWorkout(workout) {
    // form.classList.add("hidden");

    let html = `
   <li class="workout workout--${workout.type}" data-id="${workout.id}">
           <h2 class="workout__title">${workout.description}</h2>
           <div class="workout__details">
             <span class="workout__icon">${
               workout.type == "running" ? "🏃‍♂️" : "🚴"
             }</span>
             <span class="workout__value">${workout.distance}</span>
             <span class="workout__unit">km</span>
           </div>
           <div class="workout__details">
             <span class="workout__icon">⏱</span>
             <span class="workout__value">${workout.duration}</span>
             <span class="workout__unit">min</span>
           </div>
        
   `;

    if (workout.type == "running")
      html += `  <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.space.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            
              </div>
               </li>
              `;

    if (workout.type == "cycling")
      html += `  <div class="workout__details">
               <span class="workout__icon">⚡️</span>
               <span class="workout__value">${workout.speed.toFixed(1)}</span>
               <span class="workout__unit">km/h</span>
             </div>
             <div class="workout__details">
               <span class="workout__icon">⛰</span>
               <span class="workout__value">${workout.elevationGain}</span>
               <span class="workout__unit">m</span>
             </div>
              </li>
             `;

    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup (e) {
    const workoutEl = e.target.closest(".workout");
    if(!workoutEl) return;
    
    const workout = this.#workouts.find(workout => workout.id  == workoutEl.dataset.id )
    console.log(workout.coords)

    this.#map.setView(workout.coords, this.#mapZoomLevel,{
      animate: true, 
      pan: {
        duration: 1
      }
    })


    //using public interface
    // workout.click()

  }
}

const app = new App();
