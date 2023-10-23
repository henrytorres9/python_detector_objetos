const fileInput = document.getElementById("file-input");
const selectedImage = document.getElementById("selected-image");
const loaderContainer = document.getElementById("loader-container");
const detectionImage = document.getElementById("detection-image");

// Función para mostrar el preloader
function showLoader() {
  loaderContainer.style.display = "flex";
}

// Función para ocultar el preloader
function hideLoader() {
  loaderContainer.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  // Limpiar la previsualización de la imagen al seleccionar una nueva
  fileInput.addEventListener("change", function () {
    selectedImage.src = "";
    detectionImage.src = "";
    const file = fileInput.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      selectedImage.src = imageURL;
      detectionImage.src = "/static/img-detect.png";
    } else {
      selectedImage.src = "/static/default.jpg";
    }

    // Validar que el archivo seleccionado sea una imagen
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (file && allowedTypes.indexOf(file.type) === -1) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, seleccione un archivo de imagen válido (JPEG, JPG, PNG o GIF).",
      });
      selectedImage.src = "/static/default.jpg";
      detectionImage.src = "/static/img-detect.png";
      fileInput.value = "";
      return;
    }
  });

  const form = document.getElementById("detection-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!fileInput.files.length) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, seleccione una imagen antes de detectar objetos.",
      });
      return;
    }

    showLoader();

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetch("/detect", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const personCount = document.getElementById("personCount");
        const catCount = document.getElementById("catCount");
        const plantCount = document.getElementById("plantCount");

        let personCounter = 0;
        let catCounter = 0;
        let plantCounter = 0;
        console.log(data);
        console.log(data.results);
        data.results.forEach((result) => {
          if (result.label === "person") {
            personCounter++;
          } else if (result.label === "cat") {
            catCounter++;
          } else if (result.label === "pottedplant") {
            plantCounter++;
          }
        });

        personCount.textContent = personCounter;
        catCount.textContent = catCounter;
        plantCount.textContent = plantCounter;

        const imageURL = URL.createObjectURL(fileInput.files[0]);
        selectedImage.src = imageURL;

        // Mostrar la imagen detectada
        const detectionImage = document.getElementById("detection-image");
        detectionImage.src = "data:image/jpeg;base64," + data.image_data;

        hideLoader();
      })
      .catch((error) => {
        console.error(error);
        hideLoader();
      });
  });

  document
    .getElementById("clear-button")
    .addEventListener("click", function () {
      selectedImage.src = "/static/default.jpg";
      detectionImage.src = "/static/img-detect.png";
      fileInput.value = "";
      document.getElementById("personCount").textContent = "0";
      document.getElementById("catCount").textContent = "0";
      document.getElementById("plantCount").textContent = "0";
    });
});
