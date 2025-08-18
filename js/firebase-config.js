// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCQ6u_awADjZ0rOSyGsYuS4P7l5CMSQ2BE",
  authDomain: "conjuntos-247.firebaseapp.com",
  projectId: "conjuntos-247",
  storageBucket: "conjuntos-247.firebasestorage.app",
  messagingSenderId: "610068407540",
  appId: "1:610068407540:web:3ddb136813d11c83856aa1",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Configuración de Firestore
db.settings({ timestampsInSnapshots: true });
