import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCVO-TUuzvlMqj8SVV_urMYZMrzdatBSl8",
  authDomain: "portfolio-b43de.firebaseapp.com",
  databaseURL: "https://portfolio-b43de-default-rtdb.firebaseio.com",
  projectId: "portfolio-b43de",
  storageBucket: "portfolio-b43de.firebasestorage.app",
  messagingSenderId: "982981082359",
  appId: "1:982981082359:web:4afe4f8405a08dbadb27f2"
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
