/* ==========================================================================
   MAIN.JS · Un jardín entre recuerdos · Alma
   Entrada, álbum, video, música y cofre.
   Depende de scenes.js (window.GardenScenes y el evento `scenechange`),
   pero si no estuviera disponible, nada se rompe.
   ========================================================================== */
(function () {
  'use strict';

  /* ==========================================================================
     CONTENIDO EDITABLE · Fotografías del álbum
     Cambia aquí las descripciones (caption) y el texto alternativo (alt).
     Coloca las imágenes en assets/images/1.jpeg … 13.jpeg
     Si una foto no tiene caption, no se muestra ninguna descripción.
     ========================================================================== */
  const PHOTOS = [
    { src: 'assets/images/1.jpeg',  caption: 'Un instante que vale la pena guardar', alt: 'Primera fotografía del álbum' },
    { src: 'assets/images/2.jpeg',  caption: 'Donde todo se sintió ligero',          alt: 'Segunda fotografía del álbum' },
    { src: 'assets/images/3.jpeg',  caption: 'Dos prietos en aprietos',              alt: 'Tercera fotografía del álbum' },
    { src: 'assets/images/4.jpeg',  caption: 'Una sonrisa que se quedó',             alt: 'Cuarta fotografía del álbum' },
    { src: 'assets/images/5.jpeg',  caption: 'Un buen día',                          alt: 'Quinta fotografía del álbum' },
    { src: 'assets/images/6.jpeg',  caption: 'Una bonita cumpleañera',               alt: 'Sexta fotografía del álbum' },
    { src: 'assets/images/7.jpeg',  caption: 'Re loquita',                           alt: 'Séptima fotografía del álbum' },
    { src: 'assets/images/8.jpeg',  caption: 'Foto en grupo',                        alt: 'Octava fotografía del álbum' },
    { src: 'assets/images/9.jpeg',  caption: 'mewuing',                              alt: 'Novena fotografía del álbum' },
    { src: 'assets/images/10.jpeg',                                                  alt: 'Décima fotografía del álbum' },
    { src: 'assets/images/11.jpeg', caption: 'Mewuing x2',                           alt: 'Undécima fotografía del álbum' },
    { src: 'assets/images/12.jpeg',                                                  alt: 'Duodécima fotografía del álbum' },
    { src: 'assets/images/13.jpeg', caption: '🐜',                                  alt: 'Decimotercera fotografía del álbum' }
  ];

  /* ==========================================================================
     Ajustes
     ========================================================================== */
  const PAGE_TURN_SWAP_MS = 360;     // momento de la vuelta de página en que se cambia la foto (0.8 s en total)
   const CHEST_OPEN_DELAY_MS = 2800;  // la apertura cinematográfica dura ~3 s antes de mostrar la sorpresa
  const MODAL_RESET_MS = 800;        // tras cerrar el modal, la tarjeta vuelve a su cara frontal
  const MUSIC_NOTICE_MS = 2800;      // cuánto dura el aviso "Sin audio"
  const CLOSE_MODAL_ON_BACKDROP = true; // clic en el fondo oscuro cierra la ventana (solo si el clic empieza y termina ahí)

  /* ==========================================================================
     Utilidades
     ========================================================================== */
  const $ = (id) => document.getElementById(id);
  const pad2 = (n) => String(n).padStart(2, '0');
  const scenesApi = () => window.GardenScenes || null;

  const prefersReducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function isInteractiveTarget(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
           tag === 'VIDEO' || tag === 'AUDIO' || el.isContentEditable;
  }

  const entryIsVisible = () => { const el = $('entry'); return !!el && !el.hidden; };
  const modalIsOpen = () => { const el = $('surpriseModal'); return !!el && el.classList.contains('active'); };

  // Número de escena (data-scene) a la que pertenece un elemento
  function sceneIndexOf(el) {
    const scene = el && el.closest ? el.closest('.scene') : null;
    return scene ? Number(scene.dataset.scene) : -1;
  }

  /* ==========================================================================
     ENTRADA
     Ocultar con el atributo `hidden`: el CSS hace el fundido y libera #experience.
     Recibe el control de la música: el clic en "Entrar al jardín" es la
     interacción que permite iniciarla.
     ========================================================================== */
  function initEntry(music) {
    const entry = $('entry');
    const enterBtn = $('enterBtn');
    if (!entry || !enterBtn) return;

    enterBtn.addEventListener('click', () => {
      if (entry.hidden) return;
      entry.hidden = true;
      music.start(); // la música empieza con este clic

      // El foco pasa al botón de la primera escena (la entrada ya no es operable)
      const firstAction = document.querySelector('.scene.active .next-btn');
      if (firstAction) firstAction.focus({ preventScroll: true });
    });
  }

  /* ==========================================================================
     MÚSICA
     Empieza al pulsar "Entrar al jardín" (start) y también se puede activar o
     pausar con #musicBtn. El <audio> ya tiene `loop` en el HTML, así que se
     repite hasta el final. Devuelve un pequeño control para que la entrada
     la inicie y el video pueda pausarla y reanudarla sin duplicar lógica.
     ========================================================================== */
  function initMusic() {
    const noop = { start() {}, pauseForVideo() {}, resumeAfterVideo() {} };
    const btn = $('musicBtn');
    const audio = $('backgroundMusic');
    if (!btn || !audio) return noop;

    const label = btn.querySelector('span');
    const idleText = label ? label.textContent : '';

    const LABEL_OFF = 'Activar música';
    const LABEL_ON = 'Pausar música';
    const LABEL_ERROR = 'Música no disponible';

    let noticeActive = false;
    let noticeTimer = null;
    let resumeAfterVideo = false;

    // Estado visual: clase .active (la usa el CSS) + aria-label
    function setUi(playing) {
      btn.classList.toggle('active', playing);
      if (!noticeActive) btn.setAttribute('aria-label', playing ? LABEL_ON : LABEL_OFF);
    }

    // Aviso temporal cuando el audio no puede reproducirse
    function showUnavailable() {
      noticeActive = true;
      btn.setAttribute('aria-label', LABEL_ERROR);
      if (label) label.textContent = 'Sin audio';
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => {
        noticeActive = false;
        if (label) label.textContent = idleText;
        setUi(!audio.paused);
      }, MUSIC_NOTICE_MS);
    }

    async function toggle() {
      resumeAfterVideo = false; // el usuario decide: se cancela cualquier reanudación automática

      if (!audio.paused) {
        audio.pause();
        return;
      }

      try {
        await audio.play();
      } catch (err) {
        // AbortError: el usuario pausó mientras cargaba; no es un fallo
        if (err && err.name === 'AbortError') return;
        audio.pause();
        setUi(false);
        showUnavailable();
      }
    }

    btn.addEventListener('click', toggle);

    // El botón siempre refleja el estado real del audio
    // (también si se pausa desde los controles del sistema)
    audio.addEventListener('play', () => setUi(true));
    audio.addEventListener('pause', () => setUi(false));

    // Si el archivo no existe, el error se dispara en <source>
    audio.querySelectorAll('source').forEach((source) => {
      source.addEventListener('error', () => {
        audio.pause();
        setUi(false);
        showUnavailable();
      });
    });

    setUi(false);

    return {
      // Arranca la música (se llama al pulsar "Entrar al jardín")
      async start() {
        if (!audio.paused) return;
        try {
          await audio.play();
        } catch (err) {
          if (err && err.name === 'AbortError') return;
          setUi(false);
          showUnavailable();
        }
      },

      // Si suena música, se silencia mientras corre el video
      pauseForVideo() {
        if (!audio.paused) {
          resumeAfterVideo = true;
          audio.pause();
        }
      },

      // Al terminar o pausar el video, vuelve solo si la había pausado el video
      resumeAfterVideo() {
        if (!resumeAfterVideo) return;
        resumeAfterVideo = false;
        audio.play().catch(() => { /* sin ruido en consola */ });
      }
    };
  }

  /* ==========================================================================
     ÁLBUM
     ========================================================================== */
  function initAlbum() {
    const img = $('albumImage');
    const placeholder = $('photoPlaceholder');
    const caption = $('photoCaption');
    const mark = $('pageMark');
    const page = document.querySelector('#album .album-page');
    const prevBtn = document.querySelector('#album .prev-photo');
    const nextBtn = document.querySelector('#album .next-photo');
    if (!img || !placeholder || !caption || !mark || !prevBtn || !nextBtn) return;

    const total = PHOTOS.length;
    let current = 0;
    let loadToken = 0;   // descarta cargas obsoletas si se navega rápido
    let swapTimer = null;

    // Contenido de la foto actual
    function render() {
      const photo = PHOTOS[current];
      caption.textContent = photo.caption || '';
      mark.textContent = `${pad2(current + 1)} / ${pad2(total)}`;
      img.alt = photo.alt || photo.caption || '';

      // Se limpia la foto anterior para no mostrarla con la descripción nueva
      img.removeAttribute('src');
      placeholder.hidden = true;

      const token = ++loadToken;
      const probe = new Image();

      probe.onload = () => {
        if (token !== loadToken) return;
        img.src = photo.src;         // el CSS oculta el marcador al haber src
        placeholder.hidden = true;
      };
      probe.onerror = () => {
        if (token !== loadToken) return;
        img.removeAttribute('src');  // el CSS oculta la imagen rota
        placeholder.hidden = false;  // se muestra "Tu fotografía aquí"
      };
      probe.src = photo.src;
    }

    // Por si la imagen ya asignada fallara al pintarse
    img.addEventListener('error', () => {
      if (!img.getAttribute('src')) return;
      img.removeAttribute('src');
      placeholder.hidden = false;
    });

    // Cambia de foto (con vuelta de página si es posible)
    function show(index, animate) {
      current = (index + total) % total; // circular
      clearTimeout(swapTimer);

      if (animate && page && !prefersReducedMotion()) {
        page.classList.remove('turning');
        void page.offsetWidth;           // reinicia la animación
        page.classList.add('turning');
        swapTimer = setTimeout(render, PAGE_TURN_SWAP_MS);
      } else {
        render();
      }
    }

    if (page) {
      page.addEventListener('animationend', (e) => {
        if (e.target === page && e.animationName === 'page-turn') {
          page.classList.remove('turning');
        }
      });
    }

    nextBtn.addEventListener('click', () => show(current + 1, true));
    prevBtn.addEventListener('click', () => show(current - 1, true));

    // ← → cambian de foto mientras el álbum está visible.
    // Va en fase de captura y usa preventDefault(): así scenes.js
    // (que respeta defaultPrevented) no cambia de escena a la vez.
    const albumScene = $('album') ? $('album').closest('.scene') : null;
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (!albumScene || !albumScene.classList.contains('active')) return;
      if (entryIsVisible() || modalIsOpen() || isInteractiveTarget(e.target)) return;

      e.preventDefault();
      if (e.repeat) return;
      show(current + (e.key === 'ArrowRight' ? 1 : -1), true);
    }, true);

    show(0, false);
  }

  /* ==========================================================================
     VIDEO
     Nunca se reproduce solo. El marcador se oculta cuando el video está listo.
     ========================================================================== */
  function initVideo(music) {
    const video = $('memoryVideo');
    const placeholder = $('videoPlaceholder');
    if (!video || !placeholder) return;

    video.autoplay = false;
    video.removeAttribute('autoplay');

    let sourceFailed = false;

    function evaluate() {
      const supported = typeof video.canPlayType === 'function' && video.canPlayType('video/mp4') !== '';
      if (!supported || sourceFailed || video.error) {
        placeholder.hidden = false;
      } else if (video.readyState >= 1) { // HAVE_METADATA
        placeholder.hidden = true;
      }
    }

    // El error de un archivo inexistente se dispara en <source>, no en <video>
    video.querySelectorAll('source').forEach((source) => {
      source.addEventListener('error', () => { sourceFailed = true; evaluate(); });
    });

    ['loadedmetadata', 'loadeddata', 'canplay', 'durationchange', 'play'].forEach((type) => {
      video.addEventListener(type, () => {
        sourceFailed = false;
        placeholder.hidden = true;
      });
    });
    video.addEventListener('error', evaluate);

    // Comprobación inicial y de seguridad cuando la página termina de cargar
    evaluate();
    window.addEventListener('load', () => {
      if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) sourceFailed = true;
      evaluate();
    });

    // Música y video no suenan a la vez
    video.addEventListener('play', () => music.pauseForVideo());
    video.addEventListener('pause', () => music.resumeAfterVideo());
    video.addEventListener('ended', () => music.resumeAfterVideo());

    // Al salir de la escena del video, se pausa
    const videoScene = sceneIndexOf(video);
    document.addEventListener('scenechange', (e) => {
      if (e.detail.previous === videoScene && !video.paused) video.pause();
    });
  }

  /* ==========================================================================
     COFRE Y VENTANA SORPRESA
     Primer "Seguir": la tarjeta se voltea y muestra el QR de la playlist.
     Segundo "Seguir": cierra y pasa a la escena final.
     ========================================================================== */
  function initChest() {
    const chest = $('chestBtn');
    const modal = $('surpriseModal');
    const closeBtn = $('closeSurprise');
    const continueBtn = $('modalContinue');
    const finishBtn = $('modalFinish');
    const flip = $('modalFlip');
    const playlistLink = $('playlistLink');
    if (!chest || !modal || !closeBtn || !continueBtn || !finishBtn || !flip || !playlistLink) return;

    const front = modal.querySelector('.modal-front');
    const back = modal.querySelector('.modal-back');
    const qrBox = $('qrBox');
    const qrImg = $('playlistQr');

    const chestScene = sceneIndexOf(chest);
    const sceneEl = chest.closest('.scene');
    const originalLabel = chest.getAttribute('aria-label') || 'Abrir el cofre';

    let state = 'closed';     // 'closed' | 'opening' | 'open'
    let chestTimer = null;
    let faceTimer = null;
    let lastFocus = null;
    let pressStartedOnBackdrop = false;

    chest.setAttribute('aria-expanded', 'false');

    /* ---- QR: si la imagen no existe, se muestra un aviso en su lugar ---- */
    if (qrBox && qrImg) {
      qrImg.addEventListener('error', () => qrBox.classList.add('missing'));
      qrImg.addEventListener('load', () => qrBox.classList.remove('missing'));
      if (qrImg.complete && qrImg.naturalWidth === 0) qrBox.classList.add('missing');
    }

    /* ---- Caras de la tarjeta ---- */
    function setFace(side) {
      const showBack = side === 'back';
      flip.classList.toggle('flipped', showBack);
      if (front) {
        front.toggleAttribute('inert', showBack);
        front.setAttribute('aria-hidden', String(showBack));
      }
      if (back) {
        back.toggleAttribute('inert', !showBack);
        back.setAttribute('aria-hidden', String(!showBack));
      }
    }

    /* ---- Cofre ---- */
    function resetChest() {
      clearTimeout(chestTimer);
      state = 'closed';
      chest.classList.remove('active');
      chest.setAttribute('aria-expanded', 'false');
      chest.setAttribute('aria-label', originalLabel);
      setFace('front');
    }

    function onChestClick() {
      if (state === 'opening') return;

      // Ya abierto: vuelve a mostrar la sorpresa
      if (state === 'open') {
        openModal();
        return;
      }

      state = 'opening';
      chest.classList.add('active');                 // el CSS ejecuta la apertura
      chest.setAttribute('aria-expanded', 'true');
      chest.setAttribute('aria-label', 'Ver la sorpresa del cofre');

      const delay = prefersReducedMotion() ? 150 : CHEST_OPEN_DELAY_MS;
      chestTimer = setTimeout(() => {
        state = 'open';
        if (sceneEl && sceneEl.classList.contains('active')) openModal();
      }, delay);
    }

    chest.addEventListener('click', onChestClick);

    /* ---- Ventana ---- */
    function openModal() {
      if (modal.classList.contains('active')) return;
      clearTimeout(faceTimer);
      setFace('front');
      lastFocus = document.activeElement;
      modal.classList.add('active');
      modal.scrollTop = 0;
      closeBtn.focus({ preventScroll: true });
    }

    function closeModal(returnFocus) {
      if (!modal.classList.contains('active')) return;
      modal.classList.remove('active');

      // Cuando el modal ya se desvaneció, la tarjeta vuelve a su cara frontal
      clearTimeout(faceTimer);
      faceTimer = setTimeout(() => setFace('front'), MODAL_RESET_MS);

      if (returnFocus && lastFocus && document.contains(lastFocus) && typeof lastFocus.focus === 'function') {
        lastFocus.focus({ preventScroll: true });
      }
    }

    closeBtn.addEventListener('click', () => closeModal(true));

    // Primer "Seguir →": voltea la tarjeta y muestra el QR
    continueBtn.addEventListener('click', () => {
      setFace('back');
      finishBtn.focus({ preventScroll: true });
    });

    // Segundo "Seguir →": cierra y avanza a la escena final
    finishBtn.addEventListener('click', () => {
      closeModal(false);
      const api = scenesApi();
      if (api) api.next();
    });

    // Los clics dentro de la tarjeta nunca cierran la ventana.
    // Solo el fondo oscuro, y únicamente si el clic empezó y terminó allí.
    modal.addEventListener('pointerdown', (e) => {
      pressStartedOnBackdrop = e.target === modal;
    });
    modal.addEventListener('click', (e) => {
      if (CLOSE_MODAL_ON_BACKDROP && e.target === modal && pressStartedOnBackdrop) {
        closeModal(true);
      }
      pressStartedOnBackdrop = false;
    });

    // Escape cierra; Tab queda atrapado en los controles de la cara visible
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal(true);
        return;
      }

      if (e.key === 'Tab') {
        const items = flip.classList.contains('flipped')
          ? [closeBtn, playlistLink, finishBtn]
          : [closeBtn, continueBtn];
        const index = items.indexOf(document.activeElement);

        if (index === -1) {
          e.preventDefault();
          items[e.shiftKey ? items.length - 1 : 0].focus();
        } else if (e.shiftKey && index === 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && index === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
    });

    /* ---- Coordinación con las escenas ---- */
    document.addEventListener('scenechange', (e) => {
      if (e.detail.previous === chestScene) clearTimeout(chestTimer);
      // Al volver a la escena, el cofre aparece cerrado otra vez
      if (e.detail.index === chestScene) resetChest();
    });
  }

  /* ==========================================================================
     Arranque
     La música se crea primero porque la entrada y el video la necesitan.
     ========================================================================== */
  function init() {
    const music = initMusic();
    initEntry(music);
    initAlbum();
    initVideo(music);
    initChest();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();