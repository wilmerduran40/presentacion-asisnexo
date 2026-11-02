document.querySelectorAll('[data-anio]').forEach((el) => {
    el.textContent = new Date().getFullYear();
});

// Portada: el hero rota entre productos; se detiene mientras se usa o si se pausa
const carrusel = document.querySelector('[data-carrusel]');

if (carrusel) {
    const ESPERA_ROTACION = 10000;
    const diapositivas = [...carrusel.querySelectorAll('[data-diapositiva]')];
    const puntos = [...carrusel.querySelectorAll('[data-ir]')];
    const botonPausa = carrusel.querySelector('[data-pausa]');
    const ICONO_PAUSA = 'M7 4h4v16H7zM13 4h4v16h-4z';
    const ICONO_SEGUIR = 'M6 3v18l15-9z';
    let actual = 0;
    let pausado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let enUso = false;
    let temporizador;

    function mostrar(indice) {
        actual = (indice + diapositivas.length) % diapositivas.length;
        diapositivas.forEach((diapositiva, i) => {
            diapositiva.classList.toggle('activa', i === actual);
            diapositiva.inert = i !== actual;
        });
        puntos.forEach((punto, i) => punto.setAttribute('aria-current', String(i === actual)));
    }

    function programar() {
        clearTimeout(temporizador);
        if (pausado || enUso) return;
        temporizador = setTimeout(() => {
            if (!document.hidden) mostrar(actual + 1);
            programar();
        }, ESPERA_ROTACION);
    }

    function pintarPausa() {
        botonPausa.setAttribute('aria-label', pausado ? 'Reanudar la rotación' : 'Pausar la rotación');
        botonPausa.querySelector('path').setAttribute('d', pausado ? ICONO_SEGUIR : ICONO_PAUSA);
    }

    carrusel.querySelectorAll('[data-mover]').forEach((flecha) => {
        flecha.addEventListener('click', () => {
            mostrar(actual + Number(flecha.dataset.mover));
            programar();
        });
    });

    puntos.forEach((punto) => {
        punto.addEventListener('click', () => {
            mostrar(Number(punto.dataset.ir));
            programar();
        });
    });

    botonPausa.addEventListener('click', () => {
        pausado = !pausado;
        pintarPausa();
        programar();
    });

    const cambiarUso = (valor) => {
        enUso = valor;
        programar();
    };
    carrusel.addEventListener('mouseenter', () => cambiarUso(true));
    carrusel.addEventListener('mouseleave', () => cambiarUso(false));
    carrusel.addEventListener('focusin', () => cambiarUso(true));
    carrusel.addEventListener('focusout', () => cambiarUso(false));

    pintarPausa();
    programar();
}

// Portada: las secciones aparecen al llegar a ellas
if (document.querySelector('[data-carrusel]') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const aparecer = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visible');
                aparecer.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('main > .bloque > .envoltura').forEach((bloque) => {
        bloque.classList.add('revelar');
        aparecer.observe(bloque);
    });
}

// Videos en el celular: suenan solo si se pide y se pausan fuera de pantalla
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-telefono]').forEach((telefono) => {
    const video = telefono.querySelector('video');
    const sonido = telefono.querySelector('.video-sonido');
    let pausadoAMano = sinMovimiento;

    video.addEventListener('play', () => telefono.classList.remove('pausado'));
    video.addEventListener('pause', () => telefono.classList.add('pausado'));

    telefono.querySelector('.video-play').addEventListener('click', () => {
        pausadoAMano = !video.paused;
        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    });

    if (sonido) {
        sonido.addEventListener('click', () => {
            video.muted = !video.muted;
            sonido.setAttribute('aria-pressed', String(!video.muted));
            sonido.textContent = video.muted ? 'Activar sonido' : 'Quitar sonido';
            if (video.paused) {
                pausadoAMano = false;
                video.play().catch(() => {});
            }
        });
    }

    new IntersectionObserver(([entrada]) => {
        if (!entrada.isIntersecting) {
            video.pause();
        } else if (!pausadoAMano) {
            video.play().catch(() => {});
        }
    }, { threshold: 0.5 }).observe(video);
});

// Formulario de cotización: arma el mensaje y lo abre en WhatsApp
const WHATSAPP_NUMBER = '584125284595';
const formulario = document.getElementById('cotizacion');

if (formulario) {
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const datos = new FormData(formulario);
        const textoOpcion = (nombre) => formulario.elements[nombre].selectedOptions[0].text;

        const lineas = [
            'Nueva solicitud de cotización — AsisNexo Control',
            'Empresa: ' + datos.get('empresa').trim(),
            'Contacto: ' + datos.get('persona').trim(),
            'WhatsApp / Teléfono: ' + datos.get('telefono').trim(),
            'Empleados: ' + textoOpcion('empleados')
        ];

        const mensaje = datos.get('mensaje').trim();
        if (mensaje) {
            lineas.push('Mensaje: ' + mensaje);
        }

        const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lineas.join('\n'));
        window.open(url, '_blank', 'noopener,noreferrer');

        // La solicitud solo llega si la persona pulsa enviar dentro de WhatsApp
        const enviado = document.getElementById('enviado');
        enviado.querySelector('a').href = url;
        formulario.hidden = true;
        enviado.hidden = false;
        enviado.focus();
    });
}
