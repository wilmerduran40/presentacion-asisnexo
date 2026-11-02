document.querySelectorAll('[data-anio]').forEach((el) => {
    el.textContent = new Date().getFullYear();
});

// Portada: cada placa muestra un resultado de ejemplo al tocarla
const EJEMPLOS = {
    control: [
        () => `<b>Entrada registrada</b><br>Ana R., ${horaActual()} (ejemplo)`,
        () => `<b>Entrada registrada</b><br>Luis M., ${horaActual()} (ejemplo)`,
        () => `<b>Salida registrada</b><br>Ana R., ${horaActual()} (ejemplo)`
    ],
    tap: [
        () => '<b>★★★★★</b><br>Se abre Google y tu cliente deja su reseña (ejemplo)',
        () => '<b>★★★★★</b><br>Otra reseña más, sin apps ni enlaces (ejemplo)'
    ]
};

function horaActual() {
    return new Date().toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' });
}

document.querySelectorAll('[data-sensor]').forEach((sensor) => {
    const tipo = sensor.dataset.sensor;
    const registro = document.querySelector(`[data-registro="${tipo}"]`);
    let turno = 0;

    sensor.addEventListener('click', () => {
        sensor.classList.remove('toque');
        void sensor.offsetWidth; // reinicia la animación si se toca seguido
        sensor.classList.add('toque');
        registro.innerHTML = EJEMPLOS[tipo][turno % EJEMPLOS[tipo].length]();
        turno += 1;
    });
});

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
