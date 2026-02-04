import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Pos = { x: number; y: number };

type EasterEgg = {
  at: number;            // número de intentos de NO para mostrar este easter egg
  title: string;
  body: string;
};

const EASTER_EGGS: EasterEgg[] = [
  {
    at: 2,
    title: "Deje de díficil cuche",
    body: "Al final siempre terminas diciendome que sí, y lo sabes amor 💚",
  },
  {
    at: 6,
    title: "Si sigue de orgullosa le van a quitar el higado como a su mami",
    body: `En unos años si sigue con esta mala toma de decisiones, va a decir como su mami, "YA VES COMO CAMBIAN LAS COSAS, EL AHORA MUERTO DE CÁNCER DE PULMÓN Y VOS SEGUÍS SIENDO UNA PENDEJA, QUE NO SÉ QUÉ"
    o bueno usted me cuenta que así le dice JAJA`,
  },
  {
    at: 15,
    title: "¿Qué preferís ser mi San Valentín o que el de la cooperativa te haga un examen de próstata?",
    body: "JAJAJAJA, si no aceptas vas a desnivelar el portón como Ana",
  },
  {
    at: 22,
    title: "Bueno cuche, según usted ¿Tiene otra opción que no sea decir que sí?",
    body: "Amorcito también le aviso que si dice que sí acepta ser mía, acepta que nació para hacer mi voluntad, lo que yo diga y quiera, por el resto de nuestra vida, ¿Queda claro?",
  },
];

export default function App() {
  const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/playlist/069JWC31GHAZpwKNGRPHe3?utm_source=generator";

  const lastMoveRef = useRef(0);
  const HOVER_COOLDOWN_MS = 1000;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const yesAudioRef = useRef<HTMLAudioElement | null>(null);
  const noBtnRef = useRef<HTMLButtonElement | null>(null);

  const [noCount, setNoCount] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [noPos, setNoPos] = useState<Pos>({ x: 0, y: 0 });
  const [egg, setEgg] = useState<EasterEgg | null>(null);
  const [yesHover, setYesHover] = useState(false);
  const [vignetteLocked, setVignetteLocked] = useState(false);

  const vignetteOn = yesHover || vignetteLocked;

  const padding = 6;
  const safeTop = 42;
  const MAX_SCALE = 8;

  // Corazones random (solo una vez)
  const hearts = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 14 + Math.random() * 26,
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 3,
      opacity: 0.25 + Math.random() * 0.35,
      isGreen: Math.random() < 0.24,
    }));
  }, []);

  // Coloca el botón NO al inicio en una posición linda
  useEffect(() => {
    setNoPos(randomNoPosition(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function getNoScale(count: number) {
    const desired = Math.min(1 + count * 0.28, MAX_SCALE);

    const container = containerRef.current;
    const btn = noBtnRef.current;
    if (!container || !btn) return desired;

    const rect = container.getBoundingClientRect();

    // tamaño REAL del botón sin transform
    const baseW = btn.offsetWidth || 170;
    const baseH = btn.offsetHeight || 68;

    // cuánto puede escalar para seguir cabiendo (nota safeTop para no invadir arriba)
    const maxScaleX = (rect.width - padding * 2) / baseW;
    const maxScaleY = (rect.height - safeTop - padding) / baseH;

    // mínimo 1 para evitar que “encojamos” por error en pantallas raras
    return Math.max(1, Math.min(desired, maxScaleX, maxScaleY));
  }  

  // function randomNoPosition(count: number): Pos {
  //   const el = containerRef.current;
  //   if (!el) return { x: 0, y: 0 };

  //   const rect = el.getBoundingClientRect();

  //   const padding = 6;
  //   // ++ no cae, -- si cae
  //   const safeTop = 42;

  //   // Aproximación del tamaño del botón (va creciendo con noCount)
  //   const scale = Math.min(1 + count * 0.28, 8);
  //   const btnW = 170 * scale;
  //   const btnH = 68 * scale;

  //   const minX = padding;
  //   const maxX = rect.width - btnW - padding;

  //   const minY = Math.max(padding, safeTop);
  //   const maxY = rect.height - btnH - padding;

  //   const x = maxX <= minX ? (rect.width - btnW) / 2 : minX + Math.random() * (maxX - minX);
  //   const y = maxY <= minY ? (rect.height - btnH) / 2 : minY + Math.random() * (maxY - minY);

  //   return { x,y };
  // }

  function randomNoPosition(count: number): Pos {
    const container = containerRef.current;
    const btn = noBtnRef.current;
    if (!container || !btn) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const scale = getNoScale(count);

    const baseW = btn.offsetWidth || 170;
    const baseH = btn.offsetHeight || 68;

    const halfExtraX = (baseW * (scale - 1)) / 2;
    const halfExtraY = (baseH * (scale - 1)) / 2;

    // ahora los límites se corren para que el borde real nunca se salga:
    const minX = padding + halfExtraX;
    const maxX = rect.width - padding - (baseW * scale - halfExtraX);

    const minY = Math.max(padding, safeTop) + halfExtraY;
    const maxY = rect.height - padding - (baseH * scale - halfExtraY);

    // Si no hay espacio, en vez de irnos a negativo, clamp al padding
    const x =
      maxX > minX ? minX + Math.random() * (maxX - minX) : minX;

    const y =
      maxY > minY ? minY + Math.random() * (maxY - minY) : minY;

    return { x, y };
  }

  // Reposicionar cuando cambia el conteo (ya con el label renderizado)
  useLayoutEffect(() => {
    if (accepted) return;
    setNoPos(randomNoPosition(noCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noCount, accepted]);

  function handleNoClick() {
    setNoCount((c) => {
      const next = c + 1;

      // moverlo y crecerlo
      setNoPos(randomNoPosition(next));

      // mostrar easter egg si toca
      const found = EASTER_EGGS.find((e) => e.at === next);
      if (found) setEgg(found);

      return next;
    });
  }

  function handleNoHover() {
    if (noCount < 0) return;

    const now = Date.now();
    if (now - lastMoveRef.current < HOVER_COOLDOWN_MS) return;

    lastMoveRef.current = now;
    setNoPos(randomNoPosition(noCount));
  }

  async function handleYesClick() {

      setYesHover(false);
      setVignetteLocked(true);

      try {
        const audio = yesAudioRef.current;
        if (audio) {
          audio.currentTime = 0;   // reinicia por si lo clickea más de una vez
          audio.volume = 1.0;      // ajusta volumen 0.0 a 1.0
          await audio.play();
        }
      } catch (e) {
        console.warn("No se pudo reproducir el audio:", e);
      }

      setAccepted(true);
  }

  const noScale = getNoScale(noCount);
  const noLabel =
    noCount < 2
      ? "No"
      : noCount < 6
      ? "Deje de socada"
      : noCount < 15
      ? "Amorcito sea sergia"
      : noCount < 22
      ? "¿Segura que eso quieres?"
      : "Ni modo le tocó aceptar";

  return (
    <div className="page">
      <div className="hearts" aria-hidden="true">
        {hearts.map((h) => (
          <span
            key={h.id}
            className={`heart ${h.isGreen ? "heart--green" : ""}`}
            style={{
              left: `${h.left}%`,
              width: `${h.size}px`,
              height: `${h.size}px`,
              animationDuration: `${h.duration}s`,
              animationDelay: `${h.delay}s`,
              opacity: h.opacity,
            }}
          />
        ))}
      </div>

      <div className="container" ref={containerRef}>
        <audio ref={yesAudioRef} src="/hooray-todd.mp3" preload="auto" />
        <div className="spotify">
          <div className="spotifyHint">🎧 Pushele play a nuestra soundtrack mi amor</div>
          <iframe
            title="Spotify playlist"
            src={SPOTIFY_EMBED_URL}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
        {!accepted ? (
          <>
            <h1 className="title">Cuche ¿Quieres ser mi San Valentín? 🥺💚🩷</h1>
            <p className="subtitle">
              Si le das que no sos gay, si le das que si te invito un orange chicken
            </p>

            <div className="buttons">
              <button 
                className="btn yes" onClick={handleYesClick}
                  onPointerEnter={() => setYesHover(true)}
                  onPointerLeave={() => setYesHover(false)}>
                Sí animal
              </button>
            </div>

            {/* WRAPPER: mueve posición */}
            <div
              className="noWrap"
              style={{
                transform: `translate3d(${noPos.x}px, ${noPos.y}px, 0)`,
              }}
            >
              {/* Botón NO troll */}
              <button
                ref={noBtnRef}
                className="btn no"
                onClick={handleNoClick}
                onMouseEnter={handleNoHover}
                style={{
                  transform: `scale(${noScale})`,
                }}
              >
              {noLabel}
              </button>
            </div>

            <div className="counter">
              Que tan gay es AMBO: <b>{noCount}</b>
            </div>
          </>
        ) : (
          <div className="accepted">
            <h1 className="title">HOORAY?</h1>
            <p className="subtitle">
              Me alegro mucho cuche, sabía que ibas a tomar la mejor decisión al final.
            </p>

            <div className="card">
              <p className="small">
                Amor, te amo mucho, sé que la distancia es difícil y se ve muy lejano el momento en el que podamos estar juntos, pero cada día me doy cuenta que sin importar
                la distancia tu te vas convirtiendo en algo indispensable de mi ser, algo que no quiero perder, alguien con quien quiero compartir mi vida y mis sueños. 
                Eres una persona genial como ya te he dicho mi amor, desde que has llegado no has echo más que motivarme a mejorar y espero pronto ser un hombre que esté a tu altura,
                me siento muy afortunado de que estés en mi vida, te elijo todos los días y espero que tu también me sigas eligiendo hasta que estemos juntos por fin.
              </p>
              <p className="small">
                ¡Feliz día de San Valentín cuche 💚💘!
              </p>
              <div className="imgYes">
                <img src="/DIJOSI.jpg" alt="pb-todd" />
              </div>
            </div>
          </div>
        )}

        {/* Modal de Easter Egg */}
        {egg && (
          <div className="modalBackdrop" onClick={() => setEgg(null)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2>{egg.title}</h2>
              <p>{egg.body}</p>
              <button className="btn ok" onClick={() => setEgg(null)}>
                No recuerdo haberte preguntado crack ;v
              </button>
            </div>
          </div>
        )}
      </div>

      <img
        className={`yesScreenSticker ${yesHover ? "isOn" : ""}`}
        src="/gumball-inlove.png"
        alt=""
        aria-hidden="true"
      />

      <div
        className={`screenVignette ${vignetteOn ? "isOn" : ""}`}
        aria-hidden="true"
      />
    </div>
  );
}
