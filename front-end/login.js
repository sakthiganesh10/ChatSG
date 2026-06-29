import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOZltwwXv9yJCcrqIZvoorcQvqrFvQDdk",
  authDomain: "chatsg-fbd04.firebaseapp.com",
  projectId: "chatsg-fbd04",
  storageBucket: "chatsg-fbd04.firebasestorage.app",
  messagingSenderId: "520062433609",
  appId: "1:520062433609:web:274ba3c91a176e742e4298",
  measurementId: "G-4YJ1Z923WM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const container = document.getElementById("container");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

const googleLogin = document.getElementById("googleLogin");
const googleSignup = document.getElementById("googleSignup");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userData = {
      name: user.displayName,
      email: user.email,
      photo: user.photoURL
    };

    localStorage.setItem("chatSGUser", JSON.stringify(userData));

    window.location.href = "ai.html";
  } catch (error) {
    console.log(error);
    alert("Google login failed daa");
  }
}

googleLogin.addEventListener("click", loginWithGoogle);
googleSignup.addEventListener("click", loginWithGoogle);



