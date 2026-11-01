/* ==========================================================================
   SCENES.JS · Un jardín entre recuerdos · Alma
   Sistema de escenas: navegación, puntos, progreso, teclado y reinicio.

   Contrato con el CSS:
   - La escena visible lleva la clase `.active` (el CSS hace el fundido).
   - Los puntos de #sceneDots son <button> hijos directos; el actual lleva
     `.active` y aria-current="true".
   - #progressBar recibe su ancho en porcentaje.
   - #prevScene / #nextScene usan el atributo `disabled` en los extremos.

   Contrato con main.js:
   - Emite el evento `scenechange` en `document` con
     detail = { index, previous, total, scene }.
   - Expone `window.GardenScenes` con goTo(), next(), prev(), getIndex()
     y getTotal().
   ========================================================================== */
(function () {
  'use strict';

  function init() {
    /* ------------------------------------------------------------------
       Referencias al DOM (todas existen en index.html)
       ------------------------------------------------------------------ */
    const scenes = Array.from(document.querySelectorAll('#experience .scene[data-scene]'))
      .sort((a, b) => Number(a.dataset.scene) - Number(b.dataset.scene));
    const total = scenes.length;
    if (total === 0) return;

    const entry = document.getElementById('entry');
    const modal = document.getElementById('surpriseModal');
    const prevBtn = document.getElementById('prevScene');
    const nextBtn = document.getElementById('nextScene');
    const dotsWrap = document.getElementById('sceneDots');
    const progressBar = document.getElementById('progressBar');
    const restartBtn = document.getElementById('restartBtn');

    /* ------------------------------------------------------------------
       Estado inicial: exactamente una escena activa
       ------------------------------------------------------------------ */
    let current = scenes.findIndex((scene) => scene.classList.contains('active'));
    if (current < 0) current = 0;
    scenes.forEach((scene, i) => scene.classList.toggle('active', i === current));

    /* ------------------------------------------------------------------
       Puntos de navegación (se generan dentro de #sceneDots)
       ------------------------------------------------------------------ */
    const dots = [];
    if (dotsWrap) {
      dotsWrap.textContent = '';
      scenes.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ir a la escena ${i + 1} de ${total}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    /* ------------------------------------------------------------------
       Interfaz: puntos, progreso y flechas
       ------------------------------------------------------------------ */
    function updateUI() {
      // Puntos
      dots.forEach((dot, i) => {
        const isCurrent = i === current;
        dot.classList.toggle('active', isCurrent);
        if (isCurrent) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });

      // Barra de progreso
      if (progressBar) {
        progressBar.style.width = `${(((current + 1) / total) * 100).toFixed(2)}%`;
      }

      // Flechas: primero se habilita, después se deshabilita
      const atStart = current === 0;
      const atEnd = current === total - 1;

      if (prevBtn && !atStart) prevBtn.disabled = false;
      if (nextBtn && !atEnd) nextBtn.disabled = false;

      // Un botón deshabilitado pierde el foco: lo pasamos a su pareja
      if (prevBtn && atStart) {
        if (document.activeElement === prevBtn && nextBtn && !nextBtn.disabled) {
          nextBtn.focus({ preventScroll: true });
        }
        prevBtn.disabled = true;
      }
      if (nextBtn && atEnd) {
        if (document.activeElement === nextBtn && prevBtn && !prevBtn.disabled) {
          prevBtn.focus({ preventScroll: true });
        }
        nextBtn.disabled = true;
      }
    }

    /* ------------------------------------------------------------------
       Cambio de escena
       ------------------------------------------------------------------ */
    function goTo(target) {
      const requested = Math.round(Number(target));
      if (Number.isNaN(requested)) return false;

      // Nunca se sale del rango 0 … total - 1
      const next = Math.min(Math.max(requested, 0), total - 1);
      if (next === current) return false;

      const previous = current;
      scenes[previous].classList.remove('active');
      scenes[next].classList.add('active');
      scenes[next].scrollTop = 0; // si la escena se desbordó, vuelve arriba
      current = next;

      updateUI();

      document.dispatchEvent(new CustomEvent('scenechange', {
        detail: { index: current, previous, total, scene: scenes[current] }
      }));
      return true;
    }

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    /* ------------------------------------------------------------------
       Botones
       ------------------------------------------------------------------ */
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    // Botones "Descubrir lo que hay aquí →"
    document.querySelectorAll('.next-btn').forEach((btn) => {
      btn.addEventListener('click', next);
    });

    // Volver a recorrer el jardín
    if (restartBtn) restartBtn.addEventListener('click', () => goTo(0));

    /* ------------------------------------------------------------------
       Teclado
       ↓ → AvPág  →  escena siguiente
       ↑ ← RePág  →  escena anterior
       Inicio / Fin → primera / última escena
       (En el álbum, main.js se queda con ← y →: cambian de foto.)
       ------------------------------------------------------------------ */
    function isInteractiveTarget(el) {
      if (!el || !el.tagName) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
             tag === 'VIDEO' || tag === 'AUDIO' || el.isContentEditable;
    }

    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.repeat) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      // Sin navegación mientras la entrada o la ventana sorpresa están abiertas
      if (entry && !entry.hidden) return;
      if (modal && modal.classList.contains('active')) return;
      if (isInteractiveTarget(e.target)) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(total - 1);
          break;
        default:
          break;
      }
    });

    /* ------------------------------------------------------------------
       API pública para main.js
       ------------------------------------------------------------------ */
    window.GardenScenes = Object.freeze({
      goTo,
      next,
      prev,
      getIndex: () => current,
      getTotal: () => total
    });

    updateUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();