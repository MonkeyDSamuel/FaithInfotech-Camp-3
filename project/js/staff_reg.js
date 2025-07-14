document.addEventListener("DOMContentLoaded", () => {
  const dayBoxes = document.querySelectorAll(".day-box");
  dayBoxes.forEach(box => {
    box.addEventListener("click", () => {
      box.classList.toggle("selected");
    });
  });
});

function save(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender").value;
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const role = document.getElementById("roleSelect").value;
  const email = document.getElementById("email").value.trim();
  const specialization = document.getElementById("specialization").value.trim();
  const fee = parseFloat(document.getElementById("fee").value.trim());
  const timeSlot = document.getElementById("timeslot").value;

  const selectedDays = Array.from(document.querySelectorAll(".day-box.selected"))
                            .map(box => box.dataset.day);

  // ----------- Validation Starts -----------

  // Name validation: no special chars, no leading space, only letters and spaces allowed
  const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  if (!namePattern.test(name)) {
    alert("Invalid name. Only alphabets allowed. No special characters or leading spaces.");
    return;
  }

  // DOB validation: must be between 23 and 60 years old
  if (!dob) {
    alert("Date of Birth is required.");
    return;
  }
  const dobDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  const dayDiff = today.getDate() - dobDate.getDate();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  if (actualAge < 23 || actualAge > 60) {
    alert("Age must be between 23 and 60 years.");
    return;
  }

  // Phone validation: 10-digit starting with 7, 8 or 9
  const phonePattern = /^[789]\d{9}$/;
  if (!phonePattern.test(phone)) {
    alert("Invalid phone number. Must be 10 digits and start with 7, 8, or 9.");
    return;
  }

  // Address validation: no leading space, allowed letters, numbers, comma, dot, hyphen
  const addressPattern = /^[A-Za-z0-9][A-Za-z0-9\s,.-]*$/;
  if (!addressPattern.test(address)) {
    alert("Invalid address. No special characters except , . - and no leading spaces.");
    return;
  }

  // Fee validation: must be more than 100
  if (isNaN(fee) || fee <= 100) {
    alert("Consultation fee must be a number greater than ₹100.");
    return;
  }

  // ----------- Validation Ends -----------

  const staffData = {
    name,
    dob,
    gender,
    phone,
    address,
    role,
    email,
    specialization,
    consultationFee: fee,
    workingDays: selectedDays,
    timeSlot
  };

  let staffList = JSON.parse(localStorage.getItem("staffList")) || [];
  staffList.push(staffData);
  localStorage.setItem("staffList", JSON.stringify(staffList));

  window.location.href = "staff_login.html";
}