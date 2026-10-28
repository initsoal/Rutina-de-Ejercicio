import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Dumbbell, Image as ImageIcon, LayoutDashboard, CheckCircle, Info, ChevronRight } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ingrid-pf-react-tracker';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app, auth, db;
if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

// --- Custom Exercise SVG Icons ---
const ExerciseIcon = ({ type }) => {
    const primary = "#6a1b9a"; // Machine / Clothes
    const secondary = "#d8b4fe"; // Skin / Woman
    const accent = "#ffeb3b"; // Weights / Details

    const renderIcon = () => {
        switch (type) {
            case 'caminadora':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 15 85 L 85 75" stroke={primary} strokeWidth="6" strokeLinecap="round" />
                        <path d="M 80 75 L 70 30 L 75 30" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="45" cy="25" r="8" fill={secondary} />
                        <path d="M 45 33 L 40 55 M 40 55 L 30 75 M 40 55 L 55 80 M 45 35 L 30 45 M 45 35 L 60 40" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                    </svg>
                );
            case 'prensa':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 20 80 L 80 80 L 70 20" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <path d="M 25 75 L 45 50" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="50" cy="40" r="8" fill={secondary} />
                        <path d="M 45 50 L 55 45 M 45 50 L 30 40 L 40 25" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <rect x="35" y="15" width="30" height="10" fill={accent} rx="2" transform="rotate(30 35 15)" />
                    </svg>
                );
            case 'peso_muerto':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <circle cx="35" cy="25" r="8" fill={secondary} />
                        <path d="M 35 33 L 55 45 M 55 45 L 50 80 M 55 45 L 60 80 M 35 33 L 45 60 L 55 60" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <line x1="50" y1="65" x2="65" y2="65" stroke={primary} strokeWidth="4" />
                        <circle cx="50" cy="65" r="5" fill={accent} />
                        <circle cx="65" cy="65" r="5" fill={accent} />
                    </svg>
                );
            case 'sentadilla':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <circle cx="50" cy="25" r="8" fill={secondary} />
                        <path d="M 50 33 L 50 55 M 50 55 L 35 70 L 40 85 M 50 55 L 65 70 L 60 85 M 50 35 L 40 45 L 50 45" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <rect x="45" y="40" width="10" height="14" fill={accent} rx="2" />
                    </svg>
                );
            case 'aductores':
            case 'abductores':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <rect x="35" y="50" width="30" height="40" fill={primary} rx="4" />
                        <circle cx="50" cy="20" r="8" fill={secondary} />
                        <path d="M 50 28 L 50 55 M 50 55 L 30 75 L 30 90 M 50 55 L 70 75 L 70 90 M 50 35 L 35 50 M 50 35 L 65 50" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <rect x="25" y="65" width="10" height="15" fill={accent} rx="3" />
                        <rect x="65" y="65" width="10" height="15" fill={accent} rx="3" />
                    </svg>
                );
            case 'eliptica':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 20 85 L 80 85 M 65 85 L 65 40 L 75 35" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <ellipse cx="50" cy="80" rx="20" ry="5" fill="none" stroke={primary} strokeWidth="4" />
                        <circle cx="45" cy="25" r="8" fill={secondary} />
                        <path d="M 45 33 L 40 60 M 40 60 L 35 80 M 40 60 L 65 80 M 45 35 L 65 45 M 45 35 L 50 50" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                    </svg>
                );
            case 'jalon':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 30 85 L 70 85 M 40 85 L 40 45 L 30 45 M 60 15 L 60 85 M 60 15 L 45 15 L 45 30" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="35" cy="30" r="8" fill={secondary} />
                        <path d="M 35 38 L 35 60 M 35 60 L 25 80 M 35 60 L 45 80 M 35 40 L 45 30 M 35 40 L 55 30" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <line x1="35" y1="30" x2="65" y2="30" stroke={accent} strokeWidth="4" />
                    </svg>
                );
            case 'empuje_pecho':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 25 85 L 75 85 M 35 85 L 35 25 M 35 50 L 50 50" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="40" cy="30" r="8" fill={secondary} />
                        <path d="M 40 38 L 40 65 M 40 65 L 50 85 M 40 65 L 30 85 M 40 45 L 65 45 M 40 45 L 60 55" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <rect x="62" y="40" width="6" height="20" fill={accent} rx="2" />
                    </svg>
                );
            case 'remo':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 15 80 L 85 80 M 35 80 L 35 55 M 70 80 L 70 45 L 60 45" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="40" cy="30" r="8" fill={secondary} />
                        <path d="M 40 38 L 40 60 M 40 60 L 60 65 M 40 60 L 25 75 M 40 45 L 55 45" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <line x1="55" y1="45" x2="70" y2="45" stroke={accent} strokeWidth="4" />
                    </svg>
                );
            case 'laterales':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <circle cx="50" cy="20" r="8" fill={secondary} />
                        <path d="M 50 28 L 50 60 M 50 60 L 40 85 M 50 60 L 60 85 M 50 35 L 25 45 M 50 35 L 75 45" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="25" cy="45" r="4" fill={accent} />
                        <circle cx="75" cy="45" r="4" fill={accent} />
                        <line x1="25" y1="41" x2="25" y2="49" stroke={primary} strokeWidth="2" />
                        <line x1="75" y1="41" x2="75" y2="49" stroke={primary} strokeWidth="2" />
                    </svg>
                );
            case 'bicicleta':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 25 80 L 75 80 M 35 80 L 45 55 L 65 80 M 45 55 L 60 50 M 60 50 L 70 40 L 75 45" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="35" cy="80" r="12" stroke={primary} strokeWidth="4" fill="none" />
                        <circle cx="65" cy="80" r="12" stroke={primary} strokeWidth="4" fill="none" />
                        <circle cx="45" cy="30" r="8" fill={secondary} />
                        <path d="M 45 38 L 45 60 M 45 60 L 50 80 M 45 60 L 35 70 M 45 42 L 65 45" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                    </svg>
                );
            case 'extensiones':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 20 85 L 80 85 M 40 85 L 40 45 L 65 45 M 65 45 L 65 70" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="35" cy="25" r="8" fill={secondary} />
                        <path d="M 35 33 L 35 60 M 35 60 L 60 60 L 80 60 M 35 40 L 45 55" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="75" cy="55" r="5" fill={accent} />
                    </svg>
                );
            case 'curl_pierna':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 20 85 L 80 85 M 40 85 L 40 45 L 65 45 M 65 45 L 65 70" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="35" cy="25" r="8" fill={secondary} />
                        <path d="M 35 33 L 35 60 M 35 60 L 60 60 L 60 80 M 35 40 L 45 55" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="55" cy="75" r="5" fill={accent} />
                    </svg>
                );
            case 'desplantes':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <circle cx="50" cy="20" r="8" fill={secondary} />
                        <path d="M 50 28 L 50 55 M 50 55 L 35 55 L 35 85 M 50 55 L 65 75 L 80 75 M 50 35 L 50 60 M 50 35 L 50 60" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <line x1="30" y1="85" x2="40" y2="85" stroke={primary} strokeWidth="4" />
                        <line x1="75" y1="75" x2="85" y2="75" stroke={primary} strokeWidth="4" />
                    </svg>
                );
            case 'aperturas':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 30 85 L 70 85 M 50 85 L 50 20 M 20 50 L 50 50 L 80 50 M 20 20 L 20 50 M 80 20 L 80 50" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="50" cy="30" r="8" fill={secondary} />
                        <path d="M 50 38 L 50 70 M 50 70 L 40 85 M 50 70 L 60 85 M 50 45 L 25 45 M 50 45 L 75 45" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <rect x="20" y="40" width="10" height="10" fill={accent} rx="2" />
                        <rect x="70" y="40" width="10" height="10" fill={accent} rx="2" />
                    </svg>
                );
            case 'triceps':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 70 10 L 70 85 M 55 10 L 85 10" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <line x1="70" y1="10" x2="60" y2="50" stroke={accent} strokeWidth="2" />
                        <circle cx="45" cy="25" r="8" fill={secondary} />
                        <path d="M 45 33 L 45 60 M 45 60 L 35 85 M 45 60 L 55 85 M 45 40 L 55 50 L 60 50" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="60" cy="50" r="3" fill={primary} />
                    </svg>
                );
            case 'biceps':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <circle cx="50" cy="20" r="8" fill={secondary} />
                        <path d="M 50 28 L 50 60 M 50 60 L 40 85 M 50 60 L 60 85 M 50 35 L 60 45 L 60 30 M 50 35 L 40 45 L 40 30" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="40" cy="30" r="4" fill={accent} />
                        <circle cx="60" cy="30" r="4" fill={accent} />
                        <line x1="35" y1="30" x2="45" y2="30" stroke={primary} strokeWidth="3" />
                        <line x1="55" y1="30" x2="65" y2="30" stroke={primary} strokeWidth="3" />
                    </svg>
                );
            case 'press_hombro':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        <path d="M 25 85 L 75 85 M 35 85 L 35 30 M 35 50 L 50 50" stroke={primary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="45" cy="30" r="8" fill={secondary} />
                        <path d="M 45 38 L 45 65 M 45 65 L 55 85 M 45 65 L 35 85 M 45 45 L 30 45 L 30 20 M 45 45 L 60 45 L 60 20" stroke={secondary} strokeWidth="6" strokeLinecap="round" fill="none" />
                        <circle cx="30" cy="20" r="4" fill={accent} />
                        <circle cx="60" cy="20" r="4" fill={accent} />
                        <line x1="25" y1="20" x2="35" y2="20" stroke={primary} strokeWidth="3" />
                        <line x1="55" y1="20" x2="65" y2="20" stroke={primary} strokeWidth="3" />
                    </svg>
                );
            default:
                return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill={primary} opacity="0.2"/></svg>;
        }
    };

    return renderIcon();
};

// --- Routine Data (with Custom SVGs) ---
const routineData = {
    lunes: {
        id: 'lunes', name: 'Lunes', type: 'TREN INFERIOR A', rest: false,
        exercises: [
            { id: 'l_cardio', title: 'Cardio: Caminadora', desc: '30-40 min. Vel 4.0, Inc 3-5.', sets: '-', reps: '-', recWeight: 'N/A', isCardio: true, icon: 'caminadora' },
            { id: 'l_prensa', title: 'Prensa de Piernas', desc: 'Enfoque en empuje controlado.', sets: '3', reps: '15', recWeight: '30-50 lbs', icon: 'prensa' },
            { id: 'l_rumano', title: 'Peso Muerto Rumano', desc: 'Estiramiento en isquiotibiales.', sets: '3', reps: '12', recWeight: '10-15 lbs c/u', icon: 'peso_muerto' },
            { id: 'l_goblet', title: 'Sentadilla Goblet', desc: 'Mancuerna al pecho, espalda recta.', sets: '3', reps: '12', recWeight: '10-15 lbs', icon: 'sentadilla' },
            { id: 'l_aductores', title: 'Aductores (Máquina)', desc: 'Cerrar piernas. Controla el regreso.', sets: '3', reps: '15', recWeight: '20-30 lbs', icon: 'aductores' }
        ]
    },
    martes: { id: 'martes', name: 'Martes', type: 'DESCANSO', rest: true, desc: 'Día pesado de escuela/home office. ¡Recupera energías!' },
    miercoles: {
        id: 'miercoles', name: 'Miércoles', type: 'TREN SUPERIOR A', rest: false,
        exercises: [
            { id: 'm_cardio', title: 'Cardio: Elíptica', desc: '30-45 min. Nivel 3-5.', sets: '-', reps: '-', recWeight: 'N/A', isCardio: true, icon: 'eliptica' },
            { id: 'm_jalon', title: 'Jalón al Pecho', desc: 'Saca el pecho al bajar la barra.', sets: '3', reps: '15', recWeight: '20-30 lbs', icon: 'jalon' },
            { id: 'm_empuje', title: 'Empuje de Pecho', desc: 'Movimiento controlado al extender.', sets: '3', reps: '12', recWeight: '15-25 lbs', icon: 'empuje_pecho' },
            { id: 'm_remo', title: 'Remo Sentado', desc: 'Junta las escápulas al jalar.', sets: '3', reps: '15', recWeight: '20-30 lbs', icon: 'remo' },
            { id: 'm_laterales', title: 'Elevaciones Laterales', desc: 'Brazos ligeramente flexionados.', sets: '3', reps: '12', recWeight: '5 lbs c/u', icon: 'laterales' }
        ]
    },
    jueves: { id: 'jueves', name: 'Jueves', type: 'DESCANSO', rest: true, desc: 'Día pesado de escuela/home office. Mantente hidratada.' },
    viernes: {
        id: 'viernes', name: 'Viernes', type: 'TREN INFERIOR B', rest: false,
        exercises: [
            { id: 'v_cardio', title: 'Bicicleta Estática', desc: '30 mins. Ritmo constante.', sets: '-', reps: '-', recWeight: 'N/A', isCardio: true, icon: 'bicicleta' },
            { id: 'v_ext', title: 'Extensiones de Pierna', desc: 'Aprieta arriba 1 segundo.', sets: '3', reps: '15', recWeight: '15-20 lbs', icon: 'extensiones' },
            { id: 'v_curl', title: 'Curl de Pierna Sentada', desc: 'Controla la fase excéntrica.', sets: '3', reps: '15', recWeight: '15-20 lbs', icon: 'curl_pierna' },
            { id: 'v_desplantes', title: 'Desplantes (Zancadas)', desc: 'Practica el equilibrio.', sets: '3', reps: '10/p', recWeight: 'Sin peso', icon: 'desplantes' },
            { id: 'v_abductores', title: 'Abductores (Máquina)', desc: 'Abrir piernas / glúteo lateral.', sets: '3', reps: '15', recWeight: '20-30 lbs', icon: 'abductores' }
        ]
    },
    sabado: {
        id: 'sabado', name: 'Sábado', type: 'TREN SUPERIOR B', rest: false,
        exercises: [
            { id: 's_cardio', title: 'Caminadora / Remo', desc: '30 mins. ¡Suda rico!', sets: '-', reps: '-', recWeight: 'N/A', isCardio: true, icon: 'remo' },
            { id: 's_aperturas', title: 'Aperturas de Pecho', desc: 'Siente el estiramiento del pecho.', sets: '3', reps: '15', recWeight: '10-15 lbs', icon: 'aperturas' },
            { id: 's_triceps', title: 'Tríceps en Polea', desc: 'Codos pegados al cuerpo.', sets: '3', reps: '15', recWeight: '10-20 lbs', icon: 'triceps' },
            { id: 's_biceps', title: 'Curl de Bíceps', desc: 'Movimiento limpio sin columpiar.', sets: '3', reps: '15', recWeight: '5-8 lbs', icon: 'biceps' },
            { id: 's_hombro', title: 'Press de Hombro', desc: 'Empuje vertical controlado.', sets: '3', reps: '12', recWeight: '10-15 lbs', icon: 'press_hombro' }
        ]
    },
    domingo: { id: 'domingo', name: 'Domingo', type: 'DESCANSO TOTAL', rest: true, desc: 'Caminata ligera en el parque. ¡Buen trabajo esta semana!' }
};

const daysOrder = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export default function App() {
    const [user, setUser] = useState(null);
    const [progress, setProgress] = useState({});
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'routine', 'reference'
    const [activeDay, setActiveDay] = useState(() => {
        const todayIdx = new Date().getDay();
        return todayIdx === 0 ? 'domingo' : daysOrder[todayIdx - 1];
    });
    const [loading, setLoading] = useState(true);

    // 1. Auth Init
    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const initAuth = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (err) {
                console.error("Auth error", err);
            }
        };
        initAuth();
        
        const unsubscribe = onAuthStateChanged(auth, (usr) => {
            setUser(usr);
            if (!usr) setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Data Fetching
    useEffect(() => {
        if (!user || !db) return;
        const progressRef = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', 'current_week');
        
        const unsubscribe = onSnapshot(progressRef, (docSnap) => {
            if (docSnap.exists()) {
                setProgress(docSnap.data());
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore error", err);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [user]);

    // Handlers for Routine
    const saveProgressToDb = (newProgress) => {
        setProgress(newProgress);
        if (user && db) {
            const progressRef = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', 'current_week');
            setDoc(progressRef, newProgress, { merge: true }).catch(console.error);
        }
    };

    const toggleExercise = (exId) => {
        const pData = progress[exId] || { done: false, weight: '', unit: 'lbs' };
        saveProgressToDb({ ...progress, [exId]: { ...pData, done: !pData.done } });
    };

    const updateWeight = (exId, weight) => {
        const pData = progress[exId] || { done: false, weight: '', unit: 'lbs' };
        saveProgressToDb({ ...progress, [exId]: { ...pData, weight } });
    };

    const updateUnit = (exId, unit) => {
        const pData = progress[exId] || { done: false, weight: '', unit: 'lbs' };
        saveProgressToDb({ ...progress, [exId]: { ...pData, unit } });
    };

    // Chart Data Preparation
    const chartData = useMemo(() => {
        const data = [];
        daysOrder.forEach(dayId => {
            const day = routineData[dayId];
            if (!day.rest && day.exercises) {
                day.exercises.forEach(ex => {
                    const pData = progress[ex.id];
                    if (!ex.isCardio && pData && pData.weight && Number(pData.weight) > 0) {
                        const val = Number(pData.weight);
                        // Normalize to lbs for chart visual consistency
                        const normalized = pData.unit === 'kg' ? val * 2.20462 : val;
                        data.push({
                            name: ex.title.replace(' (Máquina)', '').replace(' Sentado', ''),
                            weightLbs: Math.round(normalized),
                            display: `${val} ${pData.unit}`
                        });
                    }
                });
            }
        });
        return data;
    }, [progress]);

    const stats = useMemo(() => {
        let total = 0;
        let done = 0;
        daysOrder.forEach(dayId => {
            const day = routineData[dayId];
            if (!day.rest && day.exercises) {
                total += day.exercises.length;
                day.exercises.forEach(ex => {
                    if (progress[ex.id]?.done) done++;
                });
            }
        });
        return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
    }, [progress]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a0524] flex items-center justify-center text-[#ffeb3b]">
                <div className="text-xl font-bold animate-pulse flex items-center gap-2">
                    <Activity className="animate-spin" /> Cargando progreso de Ingrid...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a0524] text-white font-sans selection:bg-[#4a148c] selection:text-[#ffeb3b]">
            {/* Header */}
            <header className="bg-[#4a148c] shadow-lg sticky top-0 z-50 border-b border-[#6a1b9a]">
                <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#ffeb3b] rounded-full flex items-center justify-center text-[#4a148c]">
                            <Activity size={28} strokeWidth={3} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#ffeb3b] uppercase tracking-tight">Plan Ingrid Itzel</h1>
                            <p className="text-sm text-purple-200">Mes 1 • Enfoque Pérdida de Peso</p>
                        </div>
                    </div>
                    <nav className="flex bg-[#3b0959] p-1 rounded-xl shadow-inner gap-1 overflow-x-auto w-full md:w-auto">
                        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#ffeb3b] text-[#1a0524] shadow-md' : 'text-purple-300 hover:text-white'}`}>
                            <LayoutDashboard size={18} /> Dashboard
                        </button>
                        <button onClick={() => setActiveTab('routine')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'routine' ? 'bg-[#ffeb3b] text-[#1a0524] shadow-md' : 'text-purple-300 hover:text-white'}`}>
                            <Dumbbell size={18} /> Rutina
                        </button>
                        <button onClick={() => setActiveTab('reference')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'reference' ? 'bg-[#ffeb3b] text-[#1a0524] shadow-md' : 'text-purple-300 hover:text-white'}`}>
                            <ImageIcon size={18} /> Referencia General
                        </button>
                    </nav>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
                
                {/* --- DASHBOARD VIEW --- */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-[#4a148c] rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-[#6a1b9a]">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Activity size={120} className="text-[#ffeb3b]" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">¡Hola, Ingrid! 💪</h2>
                            <p className="text-purple-200 mb-8 max-w-lg">Sigue registrando tus pesos y completando tus ejercicios. El descanso y el cardio son tus mejores aliados este mes.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                {/* Progreso Circular */}
                                <div className="bg-[#2a0845] rounded-2xl p-6 flex flex-col items-center justify-center border border-[#4a148c]">
                                    <h3 className="text-[#ffeb3b] font-bold uppercase tracking-wide mb-4 text-sm">Compromiso Semanal</h3>
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-[#4a148c] stroke-current" strokeWidth="3" fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            <path className="text-[#ffeb3b] stroke-current transition-all duration-1000 ease-out" strokeWidth="3" fill="none" strokeDasharray={`${stats.percent}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        </svg>
                                        <div className="absolute text-2xl font-black text-white">{stats.percent}%</div>
                                    </div>
                                    <p className="text-sm text-purple-300 mt-4">{stats.done} de {stats.total} ejercicios listos</p>
                                </div>

                                {/* Reglas de Oro */}
                                <div className="bg-[#2a0845] rounded-2xl p-6 border border-[#4a148c]">
                                    <h3 className="text-[#ffeb3b] font-bold uppercase tracking-wide mb-4 text-sm flex items-center gap-2">
                                        <Info size={16} /> 3 Reglas de Oro
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-[#4a148c] text-[#ffeb3b] flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                            <div>
                                                <p className="font-bold text-sm text-white">Descanso</p>
                                                <p className="text-xs text-purple-300">45-60s entre series.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-[#4a148c] text-[#ffeb3b] flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                            <div>
                                                <p className="font-bold text-sm text-white">Prioridad Cardio</p>
                                                <p className="text-xs text-purple-300">No te lo saltes nunca.</p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-6 h-6 rounded-full bg-[#4a148c] text-[#ffeb3b] flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                            <div>
                                                <p className="font-bold text-sm text-white">Hidratación</p>
                                                <p className="text-xs text-purple-300">Agua metaboliza grasa.</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Gráfica de Pesos */}
                        <div className="bg-[#4a148c] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#6a1b9a]">
                            <h3 className="text-xl font-bold text-[#ffeb3b] mb-6 flex items-center gap-2">
                                <Activity size={20} /> Rendimiento de Pesos (Normalizado a lbs)
                            </h3>
                            {chartData.length > 0 ? (
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#6a1b9a" vertical={false} />
                                            <XAxis dataKey="name" stroke="#d8b4fe" fontSize={11} tickMargin={10} />
                                            <YAxis stroke="#d8b4fe" fontSize={11} />
                                            <Tooltip 
                                                cursor={{fill: '#3b0959'}}
                                                contentStyle={{ backgroundColor: '#2a0845', borderColor: '#6a1b9a', borderRadius: '12px' }}
                                                itemStyle={{ color: '#ffeb3b', fontWeight: 'bold' }}
                                                formatter={(value, name, props) => [props.payload.display, 'Peso Registrado']}
                                            />
                                            <Bar dataKey="weightLbs" radius={[6, 6, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill="#ffeb3b" />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-[#2a0845] rounded-xl border border-dashed border-[#6a1b9a]">
                                    <p className="text-purple-300">Aún no hay pesos registrados.</p>
                                    <p className="text-sm text-purple-400 mt-1">Ve a la pestaña Rutina y comienza a registrar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- ROUTINE VIEW --- */}
                {activeTab === 'routine' && (
                    <div className="animate-in fade-in duration-300">
                        {/* Day Selector */}
                        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 snap-x hide-scrollbar">
                            {daysOrder.map(dayId => {
                                const day = routineData[dayId];
                                const isActive = activeDay === dayId;
                                return (
                                    <button 
                                        key={dayId}
                                        onClick={() => setActiveDay(dayId)}
                                        className={`shrink-0 snap-start px-5 py-3 rounded-2xl font-bold transition-all border-2 text-left min-w-[140px] ${
                                            isActive ? 'bg-[#ffeb3b] text-[#1a0524] border-[#ffeb3b] scale-[1.02] shadow-lg' 
                                                     : 'bg-[#4a148c] text-purple-200 border-[#6a1b9a] hover:border-[#ffeb3b]/50'
                                        }`}
                                    >
                                        <div className={`text-xs uppercase opacity-80 ${isActive ? 'text-[#4a148c]' : 'text-purple-400'}`}>{day.name}</div>
                                        <div className="truncate text-sm mt-0.5">{day.rest ? 'Descanso' : day.type.split(' ')[1] || 'Entrenamiento'}</div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Exercises List */}
                        <div className="space-y-4">
                            {routineData[activeDay].rest ? (
                                <div className="bg-[#4a148c] rounded-3xl p-10 text-center border border-[#6a1b9a]">
                                    <h2 className="text-3xl font-black text-[#ffeb3b] uppercase mb-4">{routineData[activeDay].type}</h2>
                                    <p className="text-lg text-purple-200">{routineData[activeDay].desc}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6 px-4 py-2 border-l-4 border-[#ffeb3b]">
                                        <h2 className="text-2xl font-black text-white uppercase">{routineData[activeDay].name}: {routineData[activeDay].type}</h2>
                                    </div>
                                    
                                    {routineData[activeDay].exercises.map((ex, idx) => {
                                        const pData = progress[ex.id] || { done: false, weight: '', unit: 'lbs' };
                                        
                                        return (
                                            <div key={ex.id} className={`flex flex-col md:flex-row gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${pData.done ? 'bg-[#2a0845] border-[#ffeb3b] opacity-80' : 'bg-[#4a148c] border-[#6a1b9a]'}`}>
                                                
                                                {/* Thumbnail Image */}
                                                <div className="shrink-0 w-full md:w-32 h-32 rounded-xl overflow-hidden bg-[#f3e8ff] p-2 shadow-inner border border-purple-300 flex items-center justify-center">
                                                    <ExerciseIcon type={ex.icon} />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-grow flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-[#1a0524] text-[#ffeb3b] text-xs font-black px-2 py-0.5 rounded">#{idx + 1}</span>
                                                        <h3 className={`text-xl font-bold ${pData.done ? 'line-through text-purple-200' : 'text-white'}`}>{ex.title}</h3>
                                                    </div>
                                                    <p className="text-sm text-purple-200 mb-3">{ex.desc}</p>
                                                    
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="bg-[#3b0959] px-2 py-1 rounded text-purple-100">Series: <b>{ex.sets}</b></span>
                                                        <span className="bg-[#3b0959] px-2 py-1 rounded text-purple-100">Reps: <b>{ex.reps}</b></span>
                                                        <span className="bg-[#3b0959] px-2 py-1 rounded text-[#ffeb3b]">Sug: <b>{ex.recWeight}</b></span>
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="shrink-0 flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-[#6a1b9a] pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
                                                    {!ex.isCardio ? (
                                                        <div className="flex items-center gap-1 bg-[#2a0845] p-2 rounded-xl">
                                                            <input 
                                                                type="number"
                                                                value={pData.weight}
                                                                onChange={(e) => updateWeight(ex.id, e.target.value)}
                                                                disabled={pData.done}
                                                                placeholder="0"
                                                                className="w-16 bg-transparent text-white text-lg font-black text-center focus:outline-none placeholder-purple-700"
                                                            />
                                                            <select 
                                                                value={pData.unit}
                                                                onChange={(e) => updateUnit(ex.id, e.target.value)}
                                                                disabled={pData.done}
                                                                className="bg-transparent text-purple-300 text-xs font-bold focus:outline-none cursor-pointer"
                                                            >
                                                                <option value="lbs">lbs</option>
                                                                <option value="kg">kg</option>
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-grow flex items-center justify-center bg-[#2a0845] rounded-xl text-purple-400 p-2 text-xs font-bold text-center">
                                                            Cardio<br/>(Sin Peso)
                                                        </div>
                                                    )}

                                                    <button 
                                                        onClick={() => toggleExercise(ex.id)}
                                                        className={`flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${pData.done ? 'bg-[#ffeb3b] text-[#1a0524]' : 'bg-[#6a1b9a] text-white hover:bg-[#7b1fa2]'}`}
                                                    >
                                                        <CheckCircle size={20} className={pData.done ? "text-[#1a0524]" : "text-purple-300"} />
                                                        {pData.done ? 'Guardado' : 'Guardar'}
                                                    </button>
                                                </div>

                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* --- REFERENCE VIEW --- */}
                {activeTab === 'reference' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="bg-[#4a148c] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#6a1b9a]">
                            <h3 className="text-xl font-bold text-[#ffeb3b] mb-4 flex items-center gap-2">
                                <ImageIcon size={20} /> Infografía del Plan (Planet Fitness)
                            </h3>
                            <p className="text-purple-200 mb-6 text-sm">Aquí tienes el calendario y resumen general en caso de que necesites ver la imagen original.</p>
                            
                            <div className="rounded-2xl overflow-hidden border-4 border-[#2a0845] bg-[#1a0524] flex justify-center">
                                {/* Using the requested verbatim file name */}
                                <img src="image_0f8c01.jpg" alt="Plan de Entrenamiento Planet Fitness" className="w-full h-auto object-contain max-h-[80vh]" />
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}