const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Estado del jugador
const player = {
    position: new THREE.Vector3(0, 1.7, 0),
    speed: 0.15,
    score: 0,
    ppe: { helmet: false, goggles: false, gloves: false, boots: false, vest: false },
    trainings: { helmet: false, goggles: false, gloves: false, boots: false, vest: false },
    ppeQuality: { helmet: 0, goggles: 0, gloves: 0, boots: 0, vest: 0 },
    equipmentTime: { helmet: 0, goggles: 0, gloves: 0, boots: 0, vest: 0 },
    penalties: 0,
    currentScenario: null
};

let mouseX = 0, mouseY = 0, isPointerLocked = false;
let keys = {}, avatar = null, avatarParts = {};
let cameraMode = 'third-person', cameraDistance = 5, cameraHeight = 3;

// Guías de capacitación con instrucciones mejoradas y más detalladas
const trainingGuides = {
    helmet: {
        name: 'Casco de Seguridad',
        icon: '⛑️',
        scenario: 'Zona de almacenamiento vertical con riesgo de caída de objetos desde altura',
        steps: [
            {
                title: 'Inspección Visual Preliminar',
                content: `Antes de colocarte el casco, es fundamental realizar una inspección visual completa para garantizar que esté en condiciones óptimas de uso.`,
                detailedInstructions: [
                    'Sostén el casco con ambas manos a la altura de tus ojos',
                    'Revisa la superficie externa buscando grietas, abolladuras o deformaciones',
                    'Verifica que el arnés interior esté completo y en buen estado',
                    'Comprueba que la banda de sudor esté limpia y no presente rasgaduras',
                    'Asegúrate de que las ranuras de ventilación no estén obstruidas',
                    'Revisa la fecha de fabricación en la etiqueta interior (no más de 5 años)',
                    'Confirma que la suspensión interna no tenga fisuras o desgaste excesivo',
                    'Verifica que tenga la certificación vigente (ANSI Z89.1 o equivalente)'
                ],
                safetyTip: 'Un casco dañado puede comprometer seriamente tu seguridad. Si encuentras algún defecto, NO lo uses y repórtalo inmediatamente.',
                warning: 'Nunca uses un casco que haya sufrido un impacto previo, aunque no presente daños visibles. El material interno puede estar comprometido.',
                interactionType: 'inspect',
                icon: '🔍'
            },
            {
                title: 'Limpieza del Casco',
                content: `Un casco limpio no solo es más higiénico, sino que también permite una mejor inspección y mayor comodidad durante el uso prolongado.`,
                detailedInstructions: [
                    'Limpia el exterior con un paño húmedo y jabón neutro',
                    'Limpia la banda de sudor con una toallita desinfectante',
                    'Revisa que no queden residuos de suciedad en las ranuras',
                    'Seca completamente todas las superficies antes de usar',
                    'No uses solventes químicos que puedan dañar el material',
                    'Verifica que el interior esté seco y sin mal olor'
                ],
                safetyTip: 'La acumulación de suciedad puede ocultar grietas o daños en el casco. Una limpieza regular es parte del mantenimiento preventivo.',
                interactionType: 'clean',
                icon: '🧼'
            },
            {
                title: 'Ajuste de la Suspensión Interior',
                content: `El sistema de suspensión es crucial para la absorción de impactos. Debe estar correctamente ajustado a tu talla antes de colocar el casco.`,
                detailedInstructions: [
                    'Localiza la perilla o mecanismo de ajuste en la parte posterior',
                    'Afloja completamente el sistema de suspensión',
                    'Coloca el casco temporalmente sobre tu cabeza para medir',
                    'Gira la perilla de ajuste gradualmente en sentido horario',
                    'Ajusta hasta que la banda rodee cómodamente tu cabeza',
                    'Debe quedar firme pero no apretado (espacio de dos dedos)',
                    'Verifica que la corona del arnés esté centrada',
                    'Asegúrate de que haya al menos 2.5 cm entre tu cabeza y el cascarón',
                    'La banda debe quedar horizontal, no inclinada'
                ],
                safetyTip: 'Un ajuste correcto distribuye el impacto uniformemente y previene que el casco se mueva o se caiga durante el trabajo.',
                warning: 'Si el casco está demasiado suelto, puede salirse al agacharte. Muy apretado causará dolor de cabeza y distracción.',
                interactionType: 'adjust',
                icon: '⚙️'
            },
            {
                title: 'Posicionamiento Correcto en la Cabeza',
                content: `La técnica correcta de colocación asegura que el casco cumpla su función protectora de manera óptima.`,
                detailedInstructions: [
                    'Retira gorras, vinchas o cualquier accesorio de la cabeza',
                    'Si tienes cabello largo, recógelo completamente',
                    'Toma el casco por los lados con ambas manos',
                    'Inclina ligeramente la cabeza hacia adelante',
                    'Coloca el casco desde el frente, deslizándolo hacia atrás',
                    'El borde frontal debe quedar 2-3 cm sobre las cejas',
                    'Centra el casco para que cubra toda la coronilla uniformemente',
                    'Verifica que no obstruya tu visión periférica',
                    'Asegúrate de que las orejas queden libres para poder escuchar'
                ],
                safetyTip: 'El casco debe sentirse cómodo y seguro. Si se mueve o presiona demasiado, reajústalo antes de continuar.',
                warning: 'Un casco mal colocado (muy atrás o muy adelante) no protege adecuadamente. El área frontal es crítica.',
                interactionType: 'place',
                icon: '🎯'
            },
            {
                title: 'Ajuste y Cierre de la Barboquejo',
                content: `La barboquejo es esencial para mantener el casco en su lugar, especialmente durante movimientos bruscos o impactos.`,
                detailedInstructions: [
                    'Toma ambas correas laterales de la barboquejo',
                    'Pasa las correas bajo tu barbilla sin torcerlas',
                    'Ajusta las correas laterales para que formen una "V" bajo tus orejas',
                    'La barboquejo debe quedar centrada bajo tu mentón',
                    'Ajusta hasta que puedas pasar dos dedos entre la correa y tu barbilla',
                    'Cierra el broche asegurándote de escuchar el "clic"',
                    'Verifica que las correas no rocen ni presionen tus orejas',
                    'Comprueba que el broche esté completamente enganchado'
                ],
                safetyTip: 'Una barboquejo correctamente ajustada evita que el casco se desprenda en caso de caída o impacto. Es tu seguro de vida.',
                warning: 'NUNCA dejes la barboquejo sin ajustar. Un casco sin barboquejo puede salir volando al primer movimiento brusco.',
                interactionType: 'secure',
                icon: '🔒'
            },
            {
                title: 'Pruebas de Ajuste y Seguridad',
                content: `Las pruebas finales aseguran que todos los ajustes sean correctos y que el casco esté listo para protegerte durante toda la jornada.`,
                detailedInstructions: [
                    'Mueve tu cabeza vigorosamente de lado a lado - el casco debe moverse contigo',
                    'Inclina la cabeza hacia adelante y hacia atrás completamente',
                    'Intenta empujar el casco desde el frente - no debe desplazarse más de 2 cm',
                    'Empuja desde la parte trasera - debe resistir el movimiento',
                    'Empuja lateralmente desde ambos lados',
                    'Salta en el lugar varias veces - el casco debe permanecer estable',
                    'Agáchate completamente como si levantaras algo del piso',
                    'Mira hacia arriba como si observaras algo en altura',
                    'Verifica que tu visión no esté obstruida en ningún ángulo',
                    'Comprueba que puedas escuchar claramente',
                    'Asegúrate de sentirte cómodo para trabajar todo el turno'
                ],
                safetyTip: 'Un casco bien ajustado se siente como una extensión de tu cabeza. Si algo no se siente bien, reajusta antes de comenzar a trabajar.',
                warning: 'Si experimentas dolor, presión excesiva o mareos, el ajuste es incorrecto. Reajusta inmediatamente.',
                interactionType: 'verify',
                icon: '✅'
            },
            {
                title: 'Verificación Final de Barboquejo',
                content: `Una última verificación de la barboquejo garantiza que todo el sistema de retención esté funcionando correctamente.`,
                detailedInstructions: [
                    'Con el casco puesto, toma el borde frontal con una mano',
                    'Intenta empujar el casco hacia atrás con firmeza',
                    'La barboquejo debe impedir que el casco se mueva significativamente',
                    'Suelta y verifica que el casco vuelva a su posición',
                    'Repite tirando desde la parte trasera hacia adelante',
                    'Confirma que la barboquejo esté cómoda durante estos movimientos',
                    'Verifica una última vez que no haya puntos de presión'
                ],
                safetyTip: 'Esta verificación final puede salvar tu vida. Tómate estos 30 segundos antes de comenzar cualquier trabajo.',
                interactionType: 'verify',
                icon: '✅'
            }
        ]
    },
    goggles: {
        name: 'Gafas de Protección',
        icon: '🥽',
        scenario: 'Zona de corte y soldadura con proyección de partículas y chispas',
        steps: [
            {
                title: 'Identificación del Tipo de Gafa Requerida',
                content: `Existen diferentes tipos de gafas según el riesgo. Elegir el tipo correcto es el primer paso crucial para tu protección.`,
                detailedInstructions: [
                    'Identifica el tipo de riesgo: impacto, químico, radiación UV, o soldadura',
                    'Verifica la tabla de riesgos de tu área de trabajo',
                    'Para impactos: gafas con lentes de policarbonato certificadas',
                    'Para químicos: gafas herméticas con sello completo',
                    'Para soldadura: gafas con filtro de sombra apropiado (sombra 3-14)',
                    'Confirma la certificación ANSI Z87.1 o EN 166 en la montura',
                    'Verifica que el código de marcado coincida con tu tarea'
                ],
                safetyTip: 'Usar el tipo incorrecto de gafas puede ser tan peligroso como no usarlas. Las gafas comunes NO son EPP.',
                warning: 'Las gafas de impacto NO protegen contra químicos. Las gafas de químicos NO protegen contra soldadura.',
                interactionType: 'select',
                icon: '🎯'
            },
            {
                title: 'Inspección Detallada Pre-Uso',
                content: `Una inspección exhaustiva previene exposiciones peligrosas por gafas defectuosas.`,
                detailedInstructions: [
                    'Sostén las gafas contra la luz para ver imperfecciones',
                    'Inspecciona los lentes buscando rayones profundos o grietas',
                    'Verifica que no haya decoloraciones o manchas permanentes',
                    'Revisa que el sello de espuma esté completo, suave y adherido',
                    'Comprueba que las bandas elásticas tengan elasticidad adecuada',
                    'Verifica que las válvulas de ventilación estén libres de obstrucciones',
                    'Asegúrate de que los ajustes laterales funcionen correctamente',
                    'Confirma que el puente nasal sea ajustable y esté intacto'
                ],
                safetyTip: 'Lentes rayados pueden distorsionar tu visión y causar accidentes. Reemplázalos inmediatamente si están dañados.',
                warning: 'Un sello de espuma deteriorado permite entrada de partículas y químicos. No lo uses si está roto.',
                interactionType: 'inspect',
                icon: '🔍'
            },
            {
                title: 'Limpieza Apropiada de Lentes',
                content: `Los lentes limpios son esenciales para mantener una visibilidad clara y segura durante el trabajo.`,
                detailedInstructions: [
                    'Enjuaga las gafas con agua tibia para eliminar partículas',
                    'Aplica una gota de limpiador específico para lentes en cada lado',
                    'Usa un paño de microfibra limpio (NUNCA tu camisa o papel)',
                    'Limpia con movimientos circulares suaves desde el centro',
                    'No presiones demasiado para evitar rayar el revestimiento anti-empañante',
                    'Enjuaga nuevamente con agua limpia si usaste jabón',
                    'Seca con aire o con el paño de microfibra sin frotar',
                    'Verifica que no queden manchas, huellas o residuos'
                ],
                safetyTip: 'Una limpieza regular previene el empañamiento y mantiene tu visión clara en todo momento.',
                warning: 'NUNCA uses solventes, acetona o limpiadores abrasivos. Dañan el revestimiento protector.',
                interactionType: 'clean',
                icon: '🧼'
            },
            {
                title: 'Aplicación de Anti-Empañante (si aplica)',
                content: `El empañamiento es uno de los problemas más comunes. Prevenirlo es clave para trabajar seguro.`,
                detailedInstructions: [
                    'Verifica si tus gafas tienen revestimiento anti-empañante integrado',
                    'Si no lo tienen, aplica spray o toallitas anti-empañante',
                    'Aplica el producto en ambos lados de los lentes',
                    'Distribuye uniformemente con movimientos circulares',
                    'Deja secar según las instrucciones del producto (usualmente 30 segundos)',
                    'No toques los lentes con los dedos después de aplicar',
                    'Repite la aplicación cada 4-6 horas según sea necesario'
                ],
                safetyTip: 'Las gafas empañadas te obligan a quitártelas, dejándote desprotegido. La prevención es fundamental.',
                interactionType: 'prepare',
                icon: '💨'
            },
            {
                title: 'Ajuste de Bandas y Tensión',
                content: `Un ajuste correcto garantiza que las gafas permanezcan en su lugar sin causar molestias durante períodos prolongados.`,
                detailedInstructions: [
                    'Afloja completamente las bandas elásticas antes de colocar',
                    'Separa las bandas usando los ajustes laterales',
                    'Verifica que las bandas no estén torcidas',
                    'Ajusta la longitud de manera que queden simétricas',
                    'La banda posterior debe estar preparada para la parte baja del cráneo',
                    'Las bandas laterales deben tener la misma tensión en ambos lados',
                    'Deja un poco de holgura para el ajuste final después de colocarlas'
                ],
                safetyTip: 'Ajustes desiguales causan presión en un lado y gaps en el otro. Ambos son peligrosos.',
                interactionType: 'adjust',
                icon: '⚙️'
            },
            {
                title: 'Colocación Correcta de las Gafas',
                content: `La técnica de colocación adecuada asegura el sellado correcto y la máxima protección desde el inicio.`,
                detailedInstructions: [
                    'Si usas anteojos recetados, colócalos primero (o usa gafas sobrepuestas)',
                    'Sostén las gafas por la montura lateral, no por los lentes',
                    'Inclina ligeramente tu cabeza hacia adelante',
                    'Coloca las gafas desde el frente sobre tu nariz',
                    'Ajusta el puente nasal para que quede cómodo y centrado',
                    'Pasa la banda elástica sobre tu cabeza hasta la parte posterior baja',
                    'Asegúrate de que el sello de espuma contacte completamente con tu piel',
                    'Verifica que no haya cabello atrapado en el sello',
                    'Confirma que no haya espacios entre las gafas y tu rostro'
                ],
                safetyTip: 'Un sellado completo es crucial para protegerte de salpicaduras químicas y partículas volantes.',
                warning: 'Si usas barba, esta puede interferir con el sellado. Considera usar una máscara facial completa o recortar la barba.',
                interactionType: 'place',
                icon: '🎯'
            },
            {
                title: 'Ajuste Final y Sellado',
                content: `El ajuste fino asegura comodidad y protección durante toda la jornada laboral.`,
                detailedInstructions: [
                    'Con las gafas puestas, ajusta gradualmente las bandas laterales',
                    'Aprieta en incrementos pequeños alternando entre ambos lados',
                    'Las gafas deben quedar firmes pero no causar presión excesiva',
                    'Presiona suavemente alrededor del sello para verificar contacto completo',
                    'Ajusta el puente nasal para eliminar cualquier espacio',
                    'Verifica que las gafas no presionen dolorosamente ningún punto',
                    'La banda posterior debe quedar horizontal, no inclinada',
                    'Asegúrate de poder parpadear cómodamente sin tocar los lentes'
                ],
                safetyTip: 'Las gafas deben sellar completamente alrededor de tus ojos sin crear puntos de presión incómodos.',
                interactionType: 'adjust',
                icon: '⚙️'
            },
            {
                title: 'Pruebas de Movilidad y Visión',
                content: `La verificación final asegura que las gafas proporcionen protección y visibilidad sin restricciones.`,
                detailedInstructions: [
                    'Mueve tu cabeza vigorosamente de lado a lado - las gafas deben moverse contigo',
                    'Inclina la cabeza hacia adelante y hacia atrás completamente',
                    'Intenta mirar en todas direcciones sin que las gafas se desplacen',
                    'Verifica tu campo de visión periférica (debe ser al menos 180°)',
                    'Comprueba que no haya empañamiento inmediato',
                    'Realiza movimientos bruscos simulando tu trabajo',
                    'Agáchate y levántate varias veces',
                    'Salta en el lugar - las gafas deben permanecer estables',
                    'Verifica que puedas ver claramente sin distorsiones',
                    'Asegúrate de poder respirar cómodamente sin que se empañen',
                    'Confirma que no haya puntos de presión después de 2 minutos'
                ],
                safetyTip: 'Si las gafas se empañan constantemente, esto puede ser peligroso. Usa tratamiento anti-empañante o considera gafas con mejor ventilación.',
                warning: 'Quitarse las gafas "solo un momento" para limpiar el empañamiento es cuando ocurren la mayoría de accidentes.',
                interactionType: 'verify',
                icon: '✅'
            },
            {
                title: 'Verificación de Compatibilidad con Otros EPP',
                content: `Las gafas deben funcionar correctamente junto con tu casco y otros equipos de protección.`,
                detailedInstructions: [
                    'Si usas casco, colócalo después de las gafas',
                    'Verifica que el casco no presione las gafas contra tu rostro',
                    'Asegúrate de que las bandas de las gafas no interfieran con el casco',
                    'Si usas respirador, colócalo y verifica que no rompa el sello de las gafas',
                    'Comprueba que puedas usar todos los EPP simultáneamente sin molestia',
                    'Realiza movimientos normales de trabajo con todo el EPP puesto',
                    'Confirma que ningún equipo comprometa la efectividad de otro'
                ],
                safetyTip: 'El EPP debe funcionar como un sistema integrado. Cada pieza debe complementar las otras, no interferir.',
                interactionType: 'verify',
                icon: '✅'
            }
        ]
    },
    gloves: {
        name: 'Guantes Industriales',
        icon: '🧤',
        scenario: 'Zona de manipulación de materiales abrasivos y químicos',
        steps: [
            {
                title: 'Identificación de Riesgos y Selección',
                content: `Elegir el guante correcto según la tarea es fundamental. No todos los guantes protegen contra todos los riesgos.`,
                detailedInstructions: [
                    'Identifica todos los riesgos: cortes, químicos, calor, frío, electricidad, abrasión',
                    'Consulta la matriz de selección de guantes de tu empresa',
                    'Para químicos: verifica la tabla de resistencia química del guante',
                    'Confirma la certificación apropiada (EN 374 química, EN 388 mecánica, etc.)',
                    'Verifica el nivel de protección requerido (1-5 para cortes, A-F para química)',
                    'Asegúrate de elegir la talla correcta (ni grandes ni pequeños)',
                    'Verifica el nivel de destreza requerido (1-5, donde 5 es más destreza)',
                    'Confirma que el material sea compatible con las sustancias que manejarás'
                ],
                safetyTip: 'Usar el guante incorrecto puede ser tan peligroso como no usar guantes. Un guante de látex NO protege contra ácidos fuertes.',
                warning: 'Los guantes de látex NO protegen contra productos químicos fuertes. Usa nitrilo, neopreno o PVC según la sustancia.',
                interactionType: 'select',
                icon: '🎯'
            },
            {
                title: 'Inspección Pre-Uso Exhaustiva',
                content: `Una inspección exhaustiva previene exposiciones peligrosas por guantes defectuosos.`,
                detailedInstructions: [
                    'Inspecciona visualmente toda la superficie buscando perforaciones o cortes',
                    'Realiza la prueba de inflado: sopla aire dentro y cierra la muñeca',
                    'Observa si mantiene el aire por 10 segundos (si se desinfla hay perforación)',
                    'Revisa las costuras y uniones - no deben estar despegadas',
                    'Verifica que no haya decoloración química o degradación del material',
                    'Comprueba que el interior esté limpio, seco y sin olor extraño',
                    'Asegúrate de que no haya rasgaduras en el puño',
                    'Verifica la fecha de caducidad si es un guante químico',
                    'Confirma que el grosor sea uniforme en toda la superficie'
                ],
                safetyTip: 'Un pequeño pinchazo en un guante químico puede exponer tu piel a sustancias peligrosas. Si hay duda, descarta el guante.',
                warning: 'Los guantes químicos tienen vida útil limitada. Después de la fecha de caducidad pierden sus propiedades protectoras.',
                interactionType: 'inspect',
                icon: '🔍'
            },
            {
                title: 'Preparación de Manos e Higiene',
                content: `Las manos limpias y secas son esenciales para un ajuste adecuado y para prevenir irritaciones o infecciones.`,
                detailedInstructions: [
                    'Lava tus manos con agua y jabón durante al menos 20 segundos',
                    'Presta atención a áreas entre dedos y bajo las uñas',
                    'Enjuaga completamente para eliminar residuos de jabón',
                    'Seca completamente tus manos (la humedad causa deslizamiento y hongos)',
                    'Revisa tus manos buscando heridas, cortes, dermatitis o irritaciones',
                    'Cubre cualquier herida con un vendaje impermeable',
                    'Quita anillos, relojes, pulseras y cualquier joya',
                    'Recorta uñas largas que puedan perforar el guante',
                    'Si usas guantes de algodón bajo los guantes de protección, colócalos primero',
                    'Aplica crema de manos si tienes piel muy seca (espera absorción completa)'
                ],
                safetyTip: 'Las joyas pueden quedar atrapadas en maquinaria y causar lesiones graves. Siempre quítalas antes de trabajar.',
                warning: 'Trabajar con heridas abiertas aumenta el riesgo de infección grave. Repórtalo al supervisor y cubre adecuadamente.',
                interactionType: 'prepare',
                icon: '🖐️'
            },
            {
                title: 'Técnica de Colocación del Primer Guante',
                content: `La forma correcta de ponerse los guantes previene contaminación y asegura protección completa desde el inicio.`,
                detailedInstructions: [
                    'Toma el primer guante por el puño con tu mano dominante',
                    'Mantén el guante alejado de superficies contaminadas',
                    'Inserta tu mano no dominante con los dedos juntos y extendidos',
                    'Empuja suavemente hasta que todos los dedos lleguen al fondo',
                    'Tira del puño hacia arriba usando solo la parte interna del puño',
                    'Evita tocar el exterior del guante con la mano desnuda',
                    'Ajusta cada dedo individualmente para eliminar arrugas',
                    'Asegúrate de que no haya bolsas de aire en los dedos',
                    'El guante debe cubrir completamente tu muñeca (mínimo 5 cm)'
                ],
                safetyTip: 'Tocar el exterior del guante con manos desnudas puede transferir contaminantes. Usa siempre la técnica correcta.',
                interactionType: 'place',
                icon: '👐'
            },
            {
                title: 'Colocación del Segundo Guante',
                content: `El segundo guante requiere técnica especial para evitar contaminar el primero ya puesto.`,
                detailedInstructions: [
                    'Con la mano enguantada, toma el segundo guante por DENTRO del puño',
                    'Inserta la mano desnuda sin tocar el exterior del guante',
                    'Una vez insertada, usa la mano enguantada para tirar del puño',
                    'Ajusta cada dedo del segundo guante eliminando arrugas',
                    'Verifica que ambos guantes cubran la misma altura en las muñecas',
                    'Si usas mangas largas, asegúrate de que el guante cubra el puño',
                    'Para mayor protección, mete el puño de la manga dentro del guante',
                    'Verifica que no queden gaps entre el guante y la manga'
                ],
                safetyTip: 'El overlap entre manga y guante previene que sustancias penetren por la muñeca durante el trabajo.',
                interactionType: 'place',
                icon: '👐'
            },
            {
                title: 'Ajuste y Verificación de Dedos',
                content: `Un ajuste adecuado en los dedos es crucial para mantener destreza y evitar fatiga durante el trabajo.`,
                detailedInstructions: [
                    'Flexiona todos tus dedos completamente varias veces',
                    'Haz un puño apretado y ábrelo - no debe haber restricción excesiva',
                    'Verifica que las yemas de tus dedos lleguen al final del guante',
                    'No debe haber más de 2-3mm de espacio en las puntas',
                    'Comprueba que no haya arrugas excesivas en las palmas',
                    'Las arrugas pueden crear puntos de presión y fatiga',
                    'Junta las palmas y verifica que el material no se arrugue dolorosamente',
                    'Separa todos los dedos - el material debe moverse fácilmente'
                ],
                safetyTip: 'Guantes demasiado grandes causan fatiga y pérdida de destreza. Demasiado pequeños pueden rasgarse o causar dolor.',
                interactionType: 'adjust',
                icon: '⚙️'
            },
            {
                title: 'Pruebas de Destreza y Agarre',
                content: `Verificar que puedas realizar tus tareas con seguridad y precisión es esencial antes de comenzar.`,
                detailedInstructions: [
                    'Intenta agarrar objetos pequeños (tornillos, herramientas)',
                    'Verifica que puedas sentir texturas a través del material',
                    'Prueba abrir y cerrar puertas o válvulas',
                    'Intenta escribir o manipular controles si es parte de tu trabajo',
                    'Verifica tu capacidad de agarre con objetos mojados o resbaladizos',
                    'Asegúrate de que los guantes no se deslicen o roten en tus manos',
                    'Prueba realizar movimientos precisos típicos de tu tarea',
                    'Confirma que puedas mantener el agarre durante al menos 30 segundos',
                    'Si pierdes sensibilidad táctil excesiva, considera guantes más delgados'
                ],
                safetyTip: 'La pérdida de destreza aumenta el riesgo de accidentes. Si no puedes realizar tu trabajo con seguridad, necesitas otros guantes.',
                warning: 'Nunca reutilices guantes de un solo uso. Los guantes reutilizables deben limpiarse e inspeccionarse entre usos.',
                interactionType: 'verify',
                icon: '✅'
            },
            {
                title: 'Verificación de Compatibilidad y Movilidad',
                content: `El paso final asegura que los guantes funcionen correctamente con tu trabajo y otros EPP.`,
                detailedInstructions: [
                    'Realiza todos los movimientos típicos de tu trabajo con los guantes puestos',
                    'Verifica que puedas alcanzar todos los controles necesarios',
                    'Si usas herramientas, pruébalas con los guantes antes de comenzar',
                    'Asegúrate de que los guantes no interfieran con otros EPP',
                    'Verifica que las mangas del chaleco o chaqueta no empujen los guantes',
                    'Confirma que puedas usar tu radio o teléfono si es necesario',
                    'Realiza movimientos repetitivos simulando tu tarea por 2 minutos',
                    'Verifica que no aparezcan puntos de fricción o dolor',
                    'Confirma que los guantes no te hagan más lento de forma peligrosa'
                ],
                safetyTip: 'Los guantes deben mejorar tu seguridad, no entorpecer tu trabajo. Si causan problemas significativos, consulta con tu supervisor.',
                interactionType: 'verify',
                icon: '✅'
            }
        ]
    },
    boots: {
        name: 'Botas de Seguridad',
        icon: '🥾',
        scenario: 'Zona de tránsito con riesgo de objetos pesados y superficies resbaladizas',
        steps: [
            {
                title: 'Selección e Inspección de Botas',
                content: `Las botas de seguridad adecuadas protegen contra múltiples riesgos. La inspección asegura que estén en condiciones óptimas.`,
                detailedInstructions: [
                    'Verifica que las botas tengan puntera de acero o composite (no aluminio para zonas con imanes)',
                    'Confirma que la suela sea antideslizante y resistente a aceites',
                    'Inspecciona el exterior buscando cortes, desgarros o desgaste excesivo',
                    'Revisa que la puntera no esté abollada o deformada',
                    'Comprueba que las suelas no estén desgastadas (al menos 3mm de profundidad)',
                    'Verifica que no haya penetraciones u objetos incrustados en la suela',
                    'Asegúrate de que las costuras estén intactas',
                    'Confirma que el forro interior no esté rasgado'
                ],
                safetyTip: 'Las botas dañadas pueden colapsar bajo impacto, exponiendo tus pies a lesiones graves. Reemplázalas inmediatamente si están comprometidas.',
                warning: 'Una puntera abollada ha absorbido impacto y ha perdido su capacidad protectora. No la uses.',
                interactionType: 'inspect',
                icon: '🔍'
            },
            {
                title: 'Preparación de Pies y Calcetines',
                content: `Los pies secos y calcetines apropiados previenen ampollas y mejoran la comodidad durante largas jornadas.`,
                detailedInstructions: [
                    'Asegúrate de que tus pies estén limpios y completamente secos',
                    'Usa calcetines de trabajo apropiados (lana o sintéticos absorbentes)',
                    'Los calcetines deben ser sin costuras o con costuras planas',
                    'Evita calcetines de algodón que retienen humedad',
                    'Los calcetines deben cubrir al menos hasta el tobillo',
                    'Si tienes problemas en los pies, usa plantillas ortopédicas aprobadas',
                    'Corta las uñas de los pies para evitar presión contra la puntera'
                ],
                safetyTip: 'Los calcetines adecuados reducen la fricción y absorben humedad, previniendo ampollas y problemas de piel.',
                interactionType: 'prepare',
                icon: '🧦'
            },
            {
                title: 'Colocación y Ajuste de la Bota',
                content: `La técnica correcta de colocación asegura soporte óptimo y previene lesiones en tobillos.`,
                detailedInstructions: [
                    'Siéntate en una superficie estable para ponerte las botas',
                    'Afloja completamente los cordones antes de insertar el pie',
                    'Inserta tu pie firmemente, asegurando que el talón esté completamente asentado',
                    'Golpea suavemente el talón contra el piso para asentar el pie',
                    'Tus dedos deben tener espacio para moverse (aproximadamente 1 cm de la puntera)',
                    'Asegúrate de que la lengüeta esté centrada y sin arrugas',
                    'Verifica que no haya puntos de presión incómodos',
                    'Repite con el otro pie'
                ],
                safetyTip: 'Un calce adecuado previene fatiga, ampollas y problemas de postura. Las botas deben sentirse cómodas desde el primer uso.',
                warning: 'Botas demasiado grandes causan tropiezos; demasiado pequeñas causan dolor y daño circulatorio.',
                interactionType: 'place',
                icon: '🎯'
            },
            {
                title: 'Amarre de Cordones',
                content: `Un amarre correcto proporciona soporte de tobillo y previene que las botas se salgan durante el trabajo.`,
                detailedInstructions: [
                    'Comienza el amarre desde los ojales inferiores',
                    'Tira de los cordones uniformemente en cada nivel',
                    'Aprieta gradualmente desde el empeine hacia el tobillo',
                    'La zona del empeine debe quedar firme pero no apretada',
                    'La zona del tobillo debe proporcionar soporte sin restringir movimiento',
                    'Haz un nudo doble seguro al final',
                    'Mete los extremos sobrantes dentro de la bota (nunca dejes cordones sueltos)',
                    'Verifica que los cordones no toquen el piso'
                ],
                safetyTip: 'Cordones correctamente atados previenen torceduras de tobillo y aseguran que la bota actúe como una unidad con tu pie.',
                warning: 'Cordones sueltos son un peligro de tropiezo grave y pueden quedar atrapados en maquinaria.',
                interactionType: 'secure',
                icon: '🔗'
            },
            {
                title: 'Prueba de Movilidad',
                content: `La verificación final asegura que puedas moverte y trabajar de manera segura y cómoda.`,
                detailedInstructions: [
                    'Párate y camina alrededor del área durante al menos 2 minutos',
                    'Realiza movimientos de flexión de rodillas (sentadillas)',
                    'Prueba caminar en superficies inclinadas si están disponibles',
                    'Intenta ponerte en puntillas y sobre los talones',
                    'Verifica que no haya puntos de presión o fricción',
                    'Asegúrate de que las botas no te hagan tropezar',
                    'Comprueba que puedas moverte libremente sin restricciones',
                    'Verifica la estabilidad de tu paso'
                ],
                safetyTip: 'Las botas de seguridad deben sentirse como una extensión natural de tus pies. Si algo se siente mal, reajusta antes de comenzar el trabajo.',
                interactionType: 'verify',
                icon: '✅'
            }
        ]
    },
    vest: {
        name: 'Chaleco Reflectante',
        icon: '🦺',
        scenario: 'Zona de tráfico de montacargas y vehículos pesados',
        steps: [
            {
                title: 'Inspección del Chaleco',
                content: `Un chaleco en buenas condiciones es esencial para tu visibilidad. La inspección asegura que cumpla su función.`,
                detailedInstructions: [
                    'Verifica que el chaleco tenga las cintas reflectantes completas y sin daños',
                    'Inspecciona el material fluorescente buscando decoloración o manchas',
                    'Comprueba que las costuras estén intactas',
                    'Asegúrate de que las cintas reflectantes estén firmemente adheridas',
                    'Verifica que los cierres (velcro o cremalleras) funcionen correctamente',
                    'Confirma que el chaleco esté limpio (la suciedad reduce visibilidad)',
                    'Revisa que tenga la certificación ANSI/ISEA 107 visible',
                    'Asegúrate de que sea de Clase 2 o 3 según tu área de trabajo'
                ],
                safetyTip: 'Un chaleco sucio o dañado puede reducir tu visibilidad hasta en un 70%. Lávalo regularmente y reemplázalo cuando sea necesario.',
                warning: 'Las cintas reflectantes pierden efectividad con el tiempo. Si están opacas o despegadas, reemplaza el chaleco.',
                interactionType: 'inspect',
                icon: '🔍'
            },
            {
                title: 'Orientación Correcta del Chaleco',
                content: `Colocar el chaleco en la orientación correcta asegura que las bandas reflectantes estén donde deben estar.`,
                detailedInstructions: [
                    'Identifica la parte frontal (generalmente tiene un bolsillo o etiqueta)',
                    'Verifica que las bandas reflectantes horizontales estén completas',
                    'La banda horizontal debe rodear completamente tu torso',
                    'Las bandas verticales deben ir desde los hombros hasta la cintura',
                    'Asegúrate de que el logo o identificación estén al frente',
                    'Confirma que el cuello del chaleco esté diseñado para ajustarse a tu cuello'
                ],
                safetyTip: 'Un chaleco al revés compromete seriamente tu visibilidad desde ciertos ángulos.',
                interactionType: 'orient',
                icon: '🎯'
            },
            {
                title: 'Colocación del Chaleco',
                content: `La técnica correcta de colocación asegura que el chaleco se ajuste apropiadamente y no interfiera con tu trabajo.`,
                detailedInstructions: [
                    'Sostén el chaleco por los hombros con ambas manos',
                    'Pasa tus brazos por las aberturas como una chaqueta',
                    'Ajusta el chaleco sobre tus hombros',
                    'Asegúrate de que el cuello esté cómodo y no muy apretado',
                    'Verifica que las bandas de los hombros estén centradas',
                    'El chaleco debe quedar sobre tu ropa de trabajo, no debajo',
                    'Asegúrate de que no tape tu identificación personal',
                    'Verifica que el chaleco cubra la mayor parte de tu torso'
                ],
                safetyTip: 'El chaleco debe ir sobre TODA tu ropa de trabajo para máxima visibilidad. Nunca lo uses debajo de otra prenda.',
                warning: 'Si el chaleco es muy grande y cuelga demasiado, puede quedar atrapado en maquinaria. Usa la talla correcta.',
                interactionType: 'place',
                icon: '👕'
            },
            {
                title: 'Ajuste y Cierre',
                content: `Un chaleco correctamente ajustado permanece en su lugar y no interfiere con tus movimientos o equipos.`,
                detailedInstructions: [
                    'Cierra el velcro o cremallera frontal del chaleco',
                    'Ajusta las cintas laterales si el chaleco las tiene',
                    'El chaleco debe quedar ajustado pero no apretado',
                    'Debes poder moverte libremente con los brazos',
                    'Asegúrate de que no interfiera con tu cinturón de herramientas',
                    'Verifica que no cubra controles o equipos de emergencia',
                    'El chaleco no debe colgar ni tener partes sueltas',
                    'Confirma que puedas alcanzar tu radio o teléfono fácilmente'
                ],
                safetyTip: 'Un chaleco muy suelto puede engancharse en objetos. Muy apretado puede restringir tu respiración o movimiento.',
                interactionType: 'adjust',
                icon: '⚙️'
            },
            {
                title: 'Verificación de Visibilidad',
                content: `La verificación final asegura que seas visible desde todos los ángulos en tu área de trabajo.`,
                detailedInstructions: [
                    'Párate frente a un espejo o pide a un compañero que te revise',
                    'Verifica que las bandas reflectantes sean visibles desde el frente',
                    'Voltéate y confirma visibilidad desde atrás',
                    'Levanta los brazos - las bandas laterales deben ser visibles',
                    'Inclínate en diferentes direcciones - el chaleco debe moverse contigo',
                    'Simula tus movimientos de trabajo comunes',
                    'Asegúrate de que el chaleco no se suba o se mueva excesivamente',
                    'Verifica que bajo diferentes ángulos de luz seas visible'
                ],
                safetyTip: 'Tu visibilidad puede salvar tu vida. Si trabajas cerca de vehículos en movimiento, es tu responsabilidad asegurarte de que te vean.',
                warning: 'En condiciones de poca luz o niebla, tu chaleco es tu única protección contra colisiones. Asegúrate de que esté limpio y funcional.',
                interactionType: 'verify',
                icon: '✅'
            }
        ]
    }
};

// Crear escenario 3D
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Crear líneas divisorias
for (let i = -50; i <= 50; i += 10) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, 0.01, -50),
        new THREE.Vector3(i, 0.01, 50)
    ]);
    const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xffff00 }));
    scene.add(line);
}

// Crear edificios y estructuras
function createBuilding(x, z, width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    return building;
}

createBuilding(-20, -20, 8, 12, 8, 0x8b4513);
createBuilding(20, -20, 8, 15, 8, 0x696969);
createBuilding(-20, 20, 8, 10, 8, 0x4682b4);
createBuilding(20, 20, 8, 14, 8, 0x8b0000);

// Zona de almacenamiento (helmet)
const helmetZone = createBuilding(-30, 0, 12, 18, 12, 0xff6347);
// Zona de soldadura (goggles)
const gogglesZone = createBuilding(30, 0, 10, 8, 10, 0x4169e1);
// Zona de manipulación (gloves)
const glovesZone = createBuilding(0, -30, 10, 6, 10, 0x32cd32);
// Zona de tránsito (boots)
const bootsZone = createBuilding(0, 30, 10, 5, 10, 0xffd700);
// Zona de montacargas (vest)
const vestZone = createBuilding(-15, -15, 15, 4, 15, 0xff8c00);

// Crear montacargas
function createForklift(x, z) {
    const forkLiftGroup = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 4),
        new THREE.MeshStandardMaterial({ color: 0xffcc00 })
    );
    body.position.y = 1;
    forkLiftGroup.add(body);
    const mast = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 6, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    mast.position.set(0, 3, 1.5);
    forkLiftGroup.add(mast);
    forkLiftGroup.position.set(x, 0, z);
    scene.add(forkLiftGroup);
}

createForklift(10, 10);
createForklift(-10, -10);

// Zonas de trabajo clasificadas con requisitos específicos
const workZones = [
    {
        name: 'Almacén de Altura',
        position: new THREE.Vector3(-30, 0, 0),
        radius: 12,
        color: 0xff6347,
        description: 'Zona de almacenamiento vertical con riesgo de caída de objetos pesados desde estanterías de más de 3 metros',
        requiredPPE: ['helmet', 'boots', 'gloves'],
        recommendedPPE: ['goggles', 'vest'],
        riskLevel: 'ALTO'
    },
    {
        name: 'Taller de Soldadura',
        position: new THREE.Vector3(30, 0, 0),
        radius: 10,
        color: 0x4169e1,
        description: 'Área de corte y soldadura con proyección de chispas, radiación UV y objetos calientes',
        requiredPPE: ['helmet', 'goggles', 'gloves'],
        recommendedPPE: ['boots'],
        riskLevel: 'EXTREMO'
    },
    {
        name: 'Zona de Químicos',
        position: new THREE.Vector3(0, 0, -30),
        radius: 10,
        color: 0x32cd32,
        description: 'Manipulación de sustancias corrosivas, ácidos y solventes industriales',
        requiredPPE: ['goggles', 'gloves', 'boots'],
        recommendedPPE: ['helmet'],
        riskLevel: 'EXTREMO'
    },
    {
        name: 'Patio de Maniobras',
        position: new THREE.Vector3(0, 0, 30),
        radius: 12,
        color: 0xffd700,
        description: 'Tránsito constante de montacargas y vehículos pesados con poca visibilidad',
        requiredPPE: ['vest', 'helmet', 'boots'],
        recommendedPPE: ['goggles'],
        riskLevel: 'ALTO'
    },
    {
        name: 'Zona de Carga',
        position: new THREE.Vector3(-15, 0, -15),
        radius: 10,
        color: 0xff8c00,
        description: 'Descarga de materiales con movimiento de cargas suspendidas y tráfico vehicular',
        requiredPPE: ['helmet', 'vest', 'boots'],
        recommendedPPE: ['gloves'],
        riskLevel: 'ALTO'
    },
    {
        name: 'Sala de Máquinas',
        position: new THREE.Vector3(15, 0, 15),
        radius: 8,
        color: 0x8b4513,
        description: 'Operación de maquinaria pesada con partes móviles y niveles altos de ruido',
        requiredPPE: ['helmet', 'goggles', 'gloves', 'boots'],
        recommendedPPE: ['vest'],
        riskLevel: 'EXTREMO'
    },
    {
        name: 'Zona Segura / Oficinas',
        position: new THREE.Vector3(0, 0, 0),
        radius: 8,
        color: 0x87ceeb,
        description: 'Área administrativa y de descanso. EPP opcional pero puede usarse',
        requiredPPE: [],
        recommendedPPE: [],
        riskLevel: 'BAJO'
    }
];

// Crear avatar
function createAvatar() {
    avatar = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0066cc });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), bodyMat);
    body.position.y = 0.6;
    avatar.add(body);
    avatarParts.body = body;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.5;
    avatar.add(head);
    avatarParts.head = head;
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), bodyMat);
    leftArm.position.set(-0.5, 0.6, 0);
    avatar.add(leftArm);
    avatarParts.leftArm = leftArm;
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), bodyMat);
    rightArm.position.set(0.5, 0.6, 0);
    avatar.add(rightArm);
    avatarParts.rightArm = rightArm;
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    leftLeg.position.set(-0.2, -0.45, 0);
    avatar.add(leftLeg);
    avatarParts.leftLeg = leftLeg;
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    rightLeg.position.set(0.2, -0.45, 0);
    avatar.add(rightLeg);
    avatarParts.rightLeg = rightLeg;
    avatar.position.copy(player.position);
    scene.add(avatar);
}

function initThreeJS() {
    createAvatar();
}

// Variables para el sistema de capacitación mejorado
let currentTraining = null;
let currentStep = 0;
let stepStartTime = 0;
let interactionAttempts = 0;

// Funciones de actualización de puntaje mejoradas
function updateScore() {
    const equipped = Object.values(player.ppe).filter(v => v).length;
    const trainings = Object.values(player.trainings).filter(v => v).length;
    const qualities = Object.values(player.ppeQuality);
    const avgQuality = qualities.reduce((a, b) => a + b, 0) / Math.max(qualities.length, 1);
    const totalTime = Object.values(player.equipmentTime).reduce((a, b) => a + b, 0);
    
    // Calcular puntuación base
    let baseScore = equipped * 100;
    
    // Bonus por calidad
    const qualityBonus = Math.floor(avgQuality * equipped * 10);
    
    // Bonus por capacitaciones
    const trainingBonus = trainings * 50;
    
    // Penalización por tiempo excesivo (más de 2 minutos por ítem)
    const timePenalty = Math.max(0, Math.floor((totalTime - 120) / 10));
    
    player.score = baseScore + qualityBonus + trainingBonus - player.penalties - timePenalty;
    
    // Actualizar UI
    document.getElementById('score-value').textContent = player.score;
    document.getElementById('ppe-score').textContent = equipped * 100;
    document.getElementById('quality-score').textContent = Math.round(avgQuality) + '%';
    document.getElementById('trainings-completed').textContent = trainings + '/5';
    document.getElementById('time-score').textContent = totalTime + 's';
    document.getElementById('penalties-score').textContent = '-' + player.penalties;
    
    // Actualizar badge de calidad general
    const badge = document.getElementById('overall-badge');
    if (equipped === 0) {
        badge.className = 'quality-badge quality-poor';
        badge.textContent = 'SIN EQUIPAR';
    } else if (avgQuality >= 90) {
        badge.className = 'quality-badge quality-excellent';
        badge.textContent = 'EXCELENTE';
    } else if (avgQuality >= 75) {
        badge.className = 'quality-badge quality-good';
        badge.textContent = 'BUENO';
    } else if (avgQuality >= 50) {
        badge.className = 'quality-badge quality-fair';
        badge.textContent = 'ACEPTABLE';
    } else {
        badge.className = 'quality-badge quality-poor';
        badge.textContent = 'DEFICIENTE';
    }
    
    updateProgressDisplay();
}

function updateProgressDisplay() {
    const equipped = Object.values(player.ppe).filter(v => v).length;
    document.getElementById('progress-text').textContent = equipped + '/5';
    document.getElementById('progress-fill').style.width = (equipped / 5 * 100) + '%';
}

// Función mejorada para mostrar capacitación
function showTraining(ppeType) {
    // Permitir iniciar cualquier capacitación en cualquier momento
    currentTraining = ppeType;
    currentStep = 0;
    interactionAttempts = 0;
    stepStartTime = Date.now();
    
    const guide = trainingGuides[ppeType];
    const titleElement = document.getElementById('training-title') || document.getElementById('training-title-main');
    if (titleElement) {
        titleElement.textContent = `${guide.icon} Capacitación: ${guide.name}`;
    }
    
    document.getElementById('training-modal').style.display = 'block';
    
    const nextBtn = document.getElementById('next-step-btn') || document.getElementById('next-step-btn-main');
    if (nextBtn) nextBtn.style.display = 'none';
    
    // Asignar event listeners del modal
    const cancelBtn = document.getElementById('cancel-training-btn') || document.getElementById('cancel-training-btn-main');
    if (cancelBtn) cancelBtn.onclick = closeTraining;
    
    const nextButton = document.getElementById('next-step-btn') || document.getElementById('next-step-btn-main');
    if (nextButton) nextButton.onclick = nextStep;
    
    showStep(0);
}

// Función para mostrar cada paso con instrucciones detalladas
function showStep(stepIndex) {
    const guide = trainingGuides[currentTraining];
    const step = guide.steps[stepIndex];
    
    // Actualizar barra de progreso
    const progressPercent = ((stepIndex + 1) / guide.steps.length) * 100;
    const progressFill = document.getElementById('training-progress-fill') || document.getElementById('training-progress-fill-main');
    const progressText = document.getElementById('training-progress-text') || document.getElementById('training-progress-text-main');
    
    if (progressFill) progressFill.style.width = progressPercent + '%';
    if (progressText) progressText.textContent = `Paso ${stepIndex + 1} de ${guide.steps.length}`;
    
    // Panel de instrucciones
    const instructionPanel = document.getElementById('instruction-panel') || document.getElementById('instruction-panel-main');
    if (!instructionPanel) return;
    
    let instructionsHTML = `
        <div class="step-title">
            <span class="step-number">${stepIndex + 1}</span>
            ${step.icon} ${step.title}
        </div>
        <div class="step-content">${step.content}</div>
    `;
    
    if (step.detailedInstructions && step.detailedInstructions.length > 0) {
        instructionsHTML += `
            <div class="step-action">
                <strong>📝 Instrucciones Detalladas:</strong>
                <ul class="step-list">
                    ${step.detailedInstructions.map(inst => `<li>${inst}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (step.safetyTip) {
        instructionsHTML += `
            <div class="safety-tip">
                <strong>💡 Consejo de Seguridad:</strong>
                ${step.safetyTip}
            </div>
        `;
    }
    
    if (step.warning) {
        instructionsHTML += `
            <div class="warning-box">
                <strong>⚠️ ADVERTENCIA:</strong>
                ${step.warning}
            </div>
        `;
    }
    
    instructionPanel.innerHTML = instructionsHTML;
    
    // Panel de interacción
    setupInteraction(step);
    
    // Reiniciar contador de intentos
    interactionAttempts = 0;
    stepStartTime = Date.now();
}

// Función para configurar la interacción según el tipo
function setupInteraction(step) {
    const interactionPanel = document.getElementById('interaction-panel') || document.getElementById('interaction-panel-main');
    if (!interactionPanel) return;
    
    switch(step.interactionType) {
        case 'inspect':
            interactionPanel.innerHTML = `
                <div class="interactive-object" id="inspect-object" style="font-size: 120px; cursor: pointer;">
                    ${trainingGuides[currentTraining].icon}
                </div>
                <div class="interaction-hint">🔍 Haz clic y arrastra para inspeccionar desde todos los ángulos</div>
                <div class="quality-indicator">
                    <div class="quality-dot good"></div>
                    <span>Buscando defectos... (${interactionAttempts}/5 áreas revisadas)</span>
                </div>
            `;
            setupInspectInteraction();
            break;
            
        case 'adjust':
        case 'secure':
            interactionPanel.innerHTML = `
                <div class="gesture-area" id="adjust-area">
                    <div class="interactive-object" id="adjust-object" style="font-size: 100px;">
                        ${trainingGuides[currentTraining].icon}
                    </div>
                </div>
                <div class="interaction-hint">⚙️ Haz clic repetidamente para ajustar (${interactionAttempts}/8 ajustes)</div>
                <div class="progress-bar" style="width: 300px;">
                    <div class="progress-fill" id="adjust-progress" style="width: 0%;"></div>
                </div>
            `;
            setupAdjustInteraction();
            break;
            
        case 'place':
            interactionPanel.innerHTML = `
                <div class="gesture-area" id="drop-zone">
                    <span style="font-size: 80px; opacity: 0.3;">🎯</span>
                </div>
                <div class="interactive-object" id="drag-object" style="font-size: 100px; margin-top: 20px;">
                    ${trainingGuides[currentTraining].icon}
                </div>
                <div class="interaction-hint">👆 Arrastra el equipo hacia la zona objetivo</div>
            `;
            setupPlaceInteraction();
            break;
            
        case 'verify':
            interactionPanel.innerHTML = `
                <div class="interactive-object" id="verify-object" style="font-size: 120px;">
                    ${trainingGuides[currentTraining].icon}
                </div>
                <div class="interaction-hint">✅ Realiza verificaciones (${interactionAttempts}/6 pruebas)</div>
                <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 300px;">
                    <button class="btn" onclick="verifyTest('movement')">Probar Movimiento</button>
                    <button class="btn" onclick="verifyTest('fit')">Verificar Ajuste</button>
                    <button class="btn" onclick="verifyTest('comfort')">Revisar Comodidad</button>
                    <button class="btn" onclick="verifyTest('security')">Chequear Seguridad</button>
                    <button class="btn" onclick="verifyTest('vision')">Probar Visión</button>
                    <button class="btn" onclick="verifyTest('mobility')">Verificar Movilidad</button>
                </div>
            `;
            break;
            
        case 'select':
        case 'prepare':
        case 'clean':
        case 'orient':
            interactionPanel.innerHTML = `
                <div class="interactive-object" id="simple-object" style="font-size: 120px; cursor: pointer;">
                    ${trainingGuides[currentTraining].icon}
                </div>
                <div class="interaction-hint">👆 Haz clic cuando hayas revisado las instrucciones</div>
                <button class="btn" style="margin-top: 30px;" onclick="completeSimpleStep()">✓ He Completado Este Paso</button>
            `;
            break;
    }
}

// Interacción de inspección
function setupInspectInteraction() {
    const obj = document.getElementById('inspect-object');
    let isDragging = false;
    let startX, startY, currentRotation = 0;
    
    obj.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            currentRotation += deltaX * 0.5;
            obj.style.transform = `rotate(${currentRotation}deg) scale(${1 + Math.abs(deltaY) * 0.001})`;
            
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                interactionAttempts++;
                updateInspectionProgress();
                startX = e.clientX;
                startY = e.clientY;
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function updateInspectionProgress() {
    const hint = document.querySelector('.quality-indicator span');
    if (hint) {
        hint.textContent = `Buscando defectos... (${Math.min(interactionAttempts, 5)}/5 áreas revisadas)`;
    }
    
    if (interactionAttempts >= 5) {
        setTimeout(() => {
            completeStep();
        }, 500);
    }
}

// Interacción de ajuste
function setupAdjustInteraction() {
    const obj = document.getElementById('adjust-object');
    let clicks = 0;
    
    obj.addEventListener('click', () => {
        clicks++;
        interactionAttempts = clicks;
        
        const progress = (clicks / 8) * 100;
        document.getElementById('adjust-progress').style.width = progress + '%';
        
        // Animación de ajuste
        obj.style.transform = `scale(${1 + (clicks % 2) * 0.1}) rotate(${clicks * 5}deg)`;
        setTimeout(() => {
            obj.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
        
        const hint = document.querySelector('.interaction-hint');
        hint.textContent = `⚙️ Haz clic repetidamente para ajustar (${clicks}/8 ajustes)`;
        
        if (clicks >= 8) {
            setTimeout(() => {
                completeStep();
            }, 500);
        }
    });
}

// Interacción de colocación
function setupPlaceInteraction() {
    const dragObj = document.getElementById('drag-object');
    const dropZone = document.getElementById('drop-zone');
    let isDragging = false;
    let startX, startY;
    
    dragObj.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragObj.style.cursor = 'grabbing';
        startX = e.clientX - dragObj.offsetLeft;
        startY = e.clientY - dragObj.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            dragObj.style.position = 'absolute';
            dragObj.style.left = (e.clientX - startX) + 'px';
            dragObj.style.top = (e.clientY - startY) + 'px';
            
            const dropRect = dropZone.getBoundingClientRect();
            const dragRect = dragObj.getBoundingClientRect();
            
            if (
                dragRect.left > dropRect.left &&
                dragRect.right < dropRect.right &&
                dragRect.top > dropRect.top &&
                dragRect.bottom < dropRect.bottom
            ) {
                dropZone.style.background = 'rgba(0,255,136,0.3)';
            } else {
                dropZone.style.background = 'rgba(255,215,0,0.05)';
            }
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            dragObj.style.cursor = 'grab';
            
            const dropRect = dropZone.getBoundingClientRect();
            const dragRect = dragObj.getBoundingClientRect();
            
            if (
                dragRect.left > dropRect.left &&
                dragRect.right < dropRect.right &&
                dragRect.top > dropRect.top &&
                dragRect.bottom < dropRect.bottom
            ) {
                dropZone.classList.add('active');
                dragObj.style.display = 'none';
                setTimeout(() => {
                    completeStep();
                }, 800);
            } else {
                dragObj.style.position = 'relative';
                dragObj.style.left = '0';
                dragObj.style.top = '0';
            }
        }
    });
}

// Función para verificación
window.verifyTest = function(testType) {
    interactionAttempts++;
    
    const buttons = document.querySelectorAll('#interaction-panel .btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(testType.substring(0, 4))) {
            btn.disabled = true;
            btn.style.background = '#00ff88';
            btn.textContent = '✓ ' + btn.textContent;
        }
    });
    
    const hint = document.querySelector('.interaction-hint');
    hint.textContent = `✅ Realiza verificaciones (${interactionAttempts}/6 pruebas completadas)`;
    
    if (interactionAttempts >= 6) {
        setTimeout(() => {
            completeStep();
        }, 500);
    }
}

// Función para pasos simples
window.completeSimpleStep = function() {
    completeStep();
}

// Función para completar un paso
function completeStep() {
    const guide = trainingGuides[currentTraining];
    const stepTime = Math.floor((Date.now() - stepStartTime) / 1000);
    
    // Calcular calidad basada en tiempo y número de intentos
    let quality = 100;
    if (stepTime > 45) quality -= 10; // Penalización por tiempo excesivo
    if (stepTime > 60) quality -= 10;
    if (interactionAttempts > 10) quality -= 5; // Demasiados intentos
    
    player.ppeQuality[currentTraining] = Math.max(player.ppeQuality[currentTraining], quality);
    player.equipmentTime[currentTraining] += stepTime;
    
    // Mostrar retroalimentación
    const interactionPanel = document.getElementById('interaction-panel') || document.getElementById('interaction-panel-main');
    if (interactionPanel) {
        interactionPanel.innerHTML = `
            <div class="task-complete">
                ✓ ¡Paso Completado!
                <div style="font-size: 16px; margin-top: 10px;">
                    Tiempo: ${stepTime}s | Calidad: ${quality}%
                </div>
            </div>
        `;
        // Confetti effect
        createConfetti(interactionPanel);
    }
    
    // Mostrar botón para continuar
    const nextBtn = document.getElementById('next-step-btn') || document.getElementById('next-step-btn-main');
    if (nextBtn) nextBtn.style.display = 'inline-block';
}

// Función para avanzar al siguiente paso
function nextStep() {
    const guide = trainingGuides[currentTraining];
    
    if (currentStep < guide.steps.length - 1) {
        currentStep++;
        const nextBtn = document.getElementById('next-step-btn') || document.getElementById('next-step-btn-main');
        if (nextBtn) nextBtn.style.display = 'none';
        showStep(currentStep);
    } else {
        completeTraining();
    }
}

// Función para crear efecto confetti
function createConfetti(container) {
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = ['#ffd700', '#00ff88', '#ff6600', '#4169e1'][Math.floor(Math.random() * 4)];
        confetti.style.animationDelay = Math.random() * 0.3 + 's';
        container.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 2000);
    }
}

// Función para completar la capacitación
function completeTraining() {
    player.trainings[currentTraining] = true;
    player.ppe[currentTraining] = true;
    
    const guide = trainingGuides[currentTraining];
    const totalTime = player.equipmentTime[currentTraining];
    const quality = player.ppeQuality[currentTraining];
    
    // Mostrar pantalla de completado
    document.getElementById('training-modal').innerHTML = `
        <h2>🎉 ¡Capacitación Completada!</h2>
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 150px; margin: 20px 0;">${guide.icon}</div>
            <h3 style="color: #00ff88; margin: 20px 0;">${guide.name}</h3>
            
            <div class="score-breakdown" style="max-width: 500px; margin: 30px auto;">
                <div class="score-item">
                    <span class="score-label">Tiempo Total:</span>
                    <span class="score-value">${totalTime}s</span>
                </div>
                <div class="score-item">
                    <span class="score-label">Calidad de Equipamiento:</span>
                    <span class="score-value">${quality}%</span>
                </div>
                <div class="score-item">
                    <span class="score-label">Puntos Obtenidos:</span>
                    <span class="score-value">+150</span>
                </div>
            </div>
            
            <div style="margin: 30px 0;">
                <div class="quality-badge ${quality >= 90 ? 'quality-excellent' : quality >= 75 ? 'quality-good' : 'quality-fair'}">
                    ${quality >= 90 ? '⭐ EXCELENTE' : quality >= 75 ? '✓ BUENO' : '~ ACEPTABLE'}
                </div>
            </div>
            
            <p style="color: #ccc; margin: 20px 0; line-height: 1.6;">
                Has completado exitosamente la capacitación de ${guide.name}. 
                Ahora estás equipado y capacitado para trabajar de manera segura en zonas que requieran este EPP.
            </p>
            
            <button class="btn" id="continue-training-btn" style="font-size: 18px; padding: 15px 40px; margin-top: 20px;">
                Continuar
            </button>
        </div>
    `;
    
    // Event listener para el botón continuar
    document.getElementById('continue-training-btn').onclick = () => {
        // Restaurar el contenido original del modal desde el HTML base
        restoreModalContent();
        // Cerrar el modal
        closeTraining();
    };
    
    updatePPEStatus();
    updateScore();
}

// Función para restaurar el contenido del modal
function restoreModalContent() {
    document.getElementById('training-modal').innerHTML = `
        <h2 id="training-title-main">Capacitación de EPP</h2>
        
        <div class="training-progress-bar">
            <div class="training-progress-fill" id="training-progress-fill-main"></div>
            <div class="training-progress-text" id="training-progress-text-main">Paso 0 de 0</div>
        </div>
        
        <div class="training-layout">
            <div class="instruction-panel" id="instruction-panel-main"></div>
            <div class="interaction-panel" id="interaction-panel-main"></div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-secondary" id="cancel-training-btn-main">Cancelar</button>
            <button class="btn" id="next-step-btn-main" style="display:none;">Siguiente Paso →</button>
        </div>
    `;
    
    // Restaurar event listeners
    document.getElementById('cancel-training-btn-main').onclick = closeTraining;
    document.getElementById('next-step-btn-main').onclick = nextStep;
}

function updatePPEStatus() {
    Object.keys(player.ppe).forEach(ppeType => {
        const status = document.getElementById(`${ppeType}-status`);
        const miniProgress = document.getElementById(`${ppeType}-mini-progress`);
        const qualityDisplay = status.querySelector('.ppe-quality');
        
        if (player.ppe[ppeType]) {
            status.classList.remove('missing', 'in-progress');
            status.classList.add('equipped');
            miniProgress.style.width = '100%';
            
            const quality = player.ppeQuality[ppeType];
            qualityDisplay.style.display = 'block';
            qualityDisplay.textContent = `Calidad: ${quality}%`;
            
            if (quality >= 90) qualityDisplay.style.color = '#00ff88';
            else if (quality >= 75) qualityDisplay.style.color = '#ffd700';
            else qualityDisplay.style.color = '#ffaa00';
            
            // Agregar EPP visible al avatar
            addPPEToAvatar(ppeType);
        }
    });
}

// Función para agregar EPP visible al avatar
function addPPEToAvatar(ppeType) {
    if (!avatar || !avatarParts.head) return;
    
    // Remover EPP existente si ya existe
    if (avatarParts[ppeType]) {
        avatar.remove(avatarParts[ppeType]);
    }
    
    let ppeMesh;
    
    switch(ppeType) {
        case 'helmet':
            // Casco - esfera amarilla sobre la cabeza
            ppeMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xffcc00 })
            );
            ppeMesh.position.copy(avatarParts.head.position);
            ppeMesh.position.y += 0.1;
            ppeMesh.scale.y = 0.9;
            break;
            
        case 'goggles':
            // Gafas - cilindro horizontal azul
            ppeMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16),
                new THREE.MeshStandardMaterial({ color: 0x4169e1, transparent: true, opacity: 0.7 })
            );
            ppeMesh.rotation.z = Math.PI / 2;
            ppeMesh.position.copy(avatarParts.head.position);
            ppeMesh.position.z += 0.25;
            ppeMesh.position.y -= 0.05;
            break;
            
        case 'gloves':
            // Guantes - cubos en las manos
            const gloveGeom = new THREE.BoxGeometry(0.15, 0.15, 0.25);
            const gloveMat = new THREE.MeshStandardMaterial({ color: 0x32cd32 });
            
            // Guante izquierdo
            if (avatarParts.leftArm) {
                const leftGlove = new THREE.Mesh(gloveGeom, gloveMat);
                leftGlove.position.set(avatarParts.leftArm.position.x, avatarParts.leftArm.position.y - 0.5, avatarParts.leftArm.position.z);
                avatar.add(leftGlove);
            }
            
            // Guante derecho
            ppeMesh = new THREE.Mesh(gloveGeom, gloveMat);
            if (avatarParts.rightArm) {
                ppeMesh.position.set(avatarParts.rightArm.position.x, avatarParts.rightArm.position.y - 0.5, avatarParts.rightArm.position.z);
            }
            break;
            
        case 'boots':
            // Botas - cubos en los pies
            const bootGeom = new THREE.BoxGeometry(0.25, 0.2, 0.35);
            const bootMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
            
            // Bota izquierda
            if (avatarParts.leftLeg) {
                const leftBoot = new THREE.Mesh(bootGeom, bootMat);
                leftBoot.position.set(avatarParts.leftLeg.position.x, -0.9, avatarParts.leftLeg.position.z);
                avatar.add(leftBoot);
            }
            
            // Bota derecha
            ppeMesh = new THREE.Mesh(bootGeom, bootMat);
            if (avatarParts.rightLeg) {
                ppeMesh.position.set(avatarParts.rightLeg.position.x, -0.9, avatarParts.rightLeg.position.z);
            }
            break;
            
        case 'vest':
            // Chaleco - caja naranja sobre el torso
            ppeMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.85, 1.0, 0.45),
                new THREE.MeshStandardMaterial({ color: 0xff8c00, transparent: true, opacity: 0.8 })
            );
            if (avatarParts.body) {
                ppeMesh.position.copy(avatarParts.body.position);
                ppeMesh.position.z += 0.05;
            }
            break;
    }
    
    if (ppeMesh) {
        avatar.add(ppeMesh);
        avatarParts[ppeType] = ppeMesh;
    }
}

function closeTraining() {
    document.getElementById('training-modal').style.display = 'none';
    currentTraining = null;
    currentStep = 0;
}

function startTraining() {
    console.log("startTraining() llamado");
    try {
        document.getElementById('menu-screen').style.display = 'none';
        if (canvas && canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
        console.log("Capacitación iniciada");
    } catch(e) {
        console.error("Error en startTraining:", e);
    }
}

function startFreeMode() {
    console.log("startFreeMode() llamado");
    try {
        Object.keys(player.trainings).forEach(key => { player.trainings[key] = true; });
        document.getElementById('menu-screen').style.display = 'none';
        if (canvas && canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
        console.log("Modo libre iniciado");
    } catch(e) {
        console.error("Error en startFreeMode:", e);
    }
}

function checkScenarios() {
    const warning = document.getElementById('danger-warning');
    const dangerText = document.getElementById('danger-text');
    const zoneInfo = document.getElementById('zone-info');
    
    // Verificar que los elementos existen
    if (!warning || !dangerText || !zoneInfo) {
        console.error("Elementos de zona no encontrados");
        return;
    }
    
    let currentZone = null;
    
    // Encontrar la zona actual
    for (const zone of workZones) {
        const distance = player.position.distanceTo(zone.position);
        if (distance < zone.radius) {
            currentZone = zone;
            break;
        }
    }
    
    if (currentZone) {
        // Mostrar información de la zona
        const zoneName = document.getElementById('zone-name');
        const zoneDesc = document.getElementById('zone-description');
        const zoneReqs = document.getElementById('zone-requirements');
        
        if (zoneName) zoneName.textContent = `📍 ${currentZone.name}`;
        if (zoneDesc) zoneDesc.textContent = currentZone.description;
        
        // Mostrar requisitos de EPP
        const ppeNames = {
            helmet: 'Casco de Seguridad',
            goggles: 'Gafas de Protección',
            gloves: 'Guantes Industriales',
            boots: 'Botas de Seguridad',
            vest: 'Chaleco Reflectante'
        };
        
        let reqHTML = '';
        currentZone.requiredPPE.forEach(ppe => {
            const hasPPE = player.ppe[ppe];
            const icon = hasPPE ? '✓' : '✗';
            const className = hasPPE ? 'met' : 'missing';
            reqHTML += `<div class="zone-req-item ${className}">${icon} ${ppeNames[ppe]} (Obligatorio)</div>`;
        });
        
        currentZone.recommendedPPE.forEach(ppe => {
            const hasPPE = player.ppe[ppe];
            const icon = hasPPE ? '✓' : '○';
            const className = hasPPE ? 'met' : '';
            reqHTML += `<div class="zone-req-item ${className}">${icon} ${ppeNames[ppe]} (Recomendado)</div>`;
        });
        
        if (currentZone.requiredPPE.length === 0 && currentZone.recommendedPPE.length === 0) {
            reqHTML = '<div class="zone-req-item met">✓ No se requiere EPP específico</div>';
        }
        
        if (zoneReqs) zoneReqs.innerHTML = reqHTML;
        zoneInfo.style.display = 'block';
        
        // Verificar si falta EPP obligatorio
        const missingRequired = currentZone.requiredPPE.filter(ppe => !player.ppe[ppe]);
        
        if (missingRequired.length > 0) {
            warning.style.display = 'block';
            const shortNames = {
                helmet: 'Casco',
                goggles: 'Gafas',
                gloves: 'Guantes',
                boots: 'Botas',
                vest: 'Chaleco'
            };
            if (dangerText) dangerText.textContent = `⚠️ FALTAN: ${missingRequired.map(ppe => shortNames[ppe]).join(', ')}`;
            player.penalties += 1;
            updateScore();
        } else {
            warning.style.display = 'none';
            // Bonus por cumplir requisitos
            if (currentZone.requiredPPE.length > 0) {
                player.score += 0.1;
                updateScore();
            }
        }
    } else {
        // Fuera de todas las zonas
        warning.style.display = 'none';
        zoneInfo.style.display = 'none';
    }
}

function updatePlayerMovement() {
    const moveSpeed = player.speed;
    if (keys['w']) {
        player.position.x -= Math.sin(mouseX) * moveSpeed;
        player.position.z -= Math.cos(mouseX) * moveSpeed;
    }
    if (keys['s']) {
        player.position.x += Math.sin(mouseX) * moveSpeed;
        player.position.z += Math.cos(mouseX) * moveSpeed;
    }
    if (keys['a']) {
        player.position.x -= Math.cos(mouseX) * moveSpeed;
        player.position.z += Math.sin(mouseX) * moveSpeed;
    }
    if (keys['d']) {
        player.position.x += Math.cos(mouseX) * moveSpeed;
        player.position.z -= Math.sin(mouseX) * moveSpeed;
    }
    
    player.position.x = Math.max(-48, Math.min(48, player.position.x));
    player.position.z = Math.max(-48, Math.min(48, player.position.z));
    
    if (avatar) {
        avatar.position.copy(player.position);
        avatar.rotation.y = mouseX;
        
        if (keys['w'] || keys['s'] || keys['a'] || keys['d']) {
            const walkCycle = Date.now() * 0.005;
            if (avatarParts.leftLeg) avatarParts.leftLeg.rotation.x = Math.sin(walkCycle) * 0.5;
            if (avatarParts.rightLeg) avatarParts.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
            if (avatarParts.leftArm) avatarParts.leftArm.rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
            if (avatarParts.rightArm) avatarParts.rightArm.rotation.x = Math.sin(walkCycle) * 0.3;
        } else {
            if (avatarParts.leftLeg) avatarParts.leftLeg.rotation.x = 0;
            if (avatarParts.rightLeg) avatarParts.rightLeg.rotation.x = 0;
            if (avatarParts.leftArm) avatarParts.leftArm.rotation.x = 0;
            if (avatarParts.rightArm) avatarParts.rightArm.rotation.x = 0;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    updatePlayerMovement();
    checkScenarios();
    
    if (cameraMode === 'third-person' && avatar) {
        const cameraX = player.position.x + Math.sin(mouseX) * cameraDistance;
        const cameraZ = player.position.z + Math.cos(mouseX) * cameraDistance;
        const cameraY = player.position.y + cameraHeight;
        camera.position.set(cameraX, cameraY, cameraZ);
        camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
    } else {
        camera.position.copy(player.position);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = mouseX;
        camera.rotation.x = mouseY;
    }
    
    renderer.render(scene, camera);
}

function toggleCamera() {
    if (cameraMode === 'third-person') {
        cameraMode = 'first-person';
        document.getElementById('camera-toggle-btn').innerHTML = '📷 Vista: 1ra Persona';
        if (avatar) avatar.visible = false;
    } else {
        cameraMode = 'third-person';
        document.getElementById('camera-toggle-btn').innerHTML = '📷 Vista: 3ra Persona';
        if (avatar) avatar.visible = true;
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'v') toggleCamera();
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', () => {
    if (document.getElementById('menu-screen').style.display !== 'none') return;
    canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener('mousemove', (e) => {
    if (isPointerLocked) {
        mouseX += e.movementX * 0.002;
        mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY - e.movementY * 0.002));
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Inicializar
initThreeJS();
animate();

console.log("Asignando event listeners...");

// Event listeners - Solo para elementos que siempre están en el DOM
try {
    const startTrainingBtn = document.getElementById('start-training-btn');
    const startFreeBtn = document.getElementById('start-free-btn');
    const cameraBtn = document.getElementById('camera-toggle-btn');
    
    console.log("Botones encontrados:", {
        startTraining: !!startTrainingBtn,
        startFree: !!startFreeBtn,
        camera: !!cameraBtn
    });
    
    if (startTrainingBtn) {
        startTrainingBtn.onclick = startTraining;
        console.log("✓ Event listener asignado a start-training-btn");
    } else {
        console.error("✗ start-training-btn NO encontrado");
    }
    
    if (startFreeBtn) {
        startFreeBtn.onclick = startFreeMode;
        console.log("✓ Event listener asignado a start-free-btn");
    } else {
        console.error("✗ start-free-btn NO encontrado");
    }
    
    if (cameraBtn) {
        cameraBtn.onclick = toggleCamera;
        console.log("✓ Event listener asignado a camera-toggle-btn");
    } else {
        console.error("✗ camera-toggle-btn NO encontrado");
    }
    
    // Event listeners para el panel de EPP
    const ppeItems = ['helmet', 'goggles', 'gloves', 'boots', 'vest'];
    ppeItems.forEach(ppe => {
        const element = document.getElementById(`${ppe}-status`);
        if (element) {
            element.onclick = () => showTraining(ppe);
            console.log(`✓ Event listener asignado a ${ppe}-status`);
        } else {
            console.error(`✗ ${ppe}-status NO encontrado`);
        }
    });
    
    console.log("✓ Todos los event listeners asignados correctamente");
} catch(e) {
    console.error("ERROR asignando event listeners:", e);
}

// Los event listeners del modal se asignan dinámicamente cuando se abre
