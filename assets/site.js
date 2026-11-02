document.querySelectorAll('[data-anio]').forEach((el) => {
    el.textContent = new Date().getFullYear();
});

// Portada: cada producto muestra un resultado de ejemplo al tocarlo
const EJEMPLOS = {
    control: [
        () => ['Ana R.', `Entrada ${horaActual()}`],
        () => ['Luis M.', `Entrada ${horaActual()}`],
        () => ['Ana R.', `Salida ${horaActual()}`]
    ],
    tap: [
        () => 'Se abre Google y tu cliente deja su reseña (ejemplo)',
        () => 'Otra reseña más, sin apps ni enlaces (ejemplo)'
    ]
};

function horaActual() {
    return new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mostrarLcd(lcd, lineas) {
    lcd.replaceChildren(...lineas.map((linea) => {
        const span = document.createElement('span');
        span.textContent = linea;
        return span;
    }));
}

document.querySelectorAll('[data-sensor]').forEach((sensor) => {
    const tipo = sensor.dataset.sensor;
    const registro = document.querySelector(`[data-registro="${tipo}"]`);
    const estrellas = document.querySelector('[data-estrellas]');
    let turno = 0;
    let espera;

    sensor.addEventListener('click', () => {
        sensor.classList.remove('toque');
        if (tipo === 'tap') estrellas.classList.remove('llenas');
        void sensor.offsetWidth; // reinicia la animación si se toca seguido
        sensor.classList.add('toque');

        const ejemplo = EJEMPLOS[tipo][turno % EJEMPLOS[tipo].length]();
        turno += 1;

        if (tipo === 'control') {
            mostrarLcd(registro, ejemplo);
            clearTimeout(espera);
            espera = setTimeout(() => mostrarLcd(registro, ['Coloca tu', 'huella']), 3500);
        } else {
            estrellas.classList.add('llenas');
            registro.textContent = ejemplo;
        }
    });
});

// Portada: las secciones aparecen al llegar a ellas
if (document.querySelector('.mitades') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
            'Empleados: ' + textoOpcion('empleados'),
            'Plan de interés: ' + textoOpcion('plan')
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
