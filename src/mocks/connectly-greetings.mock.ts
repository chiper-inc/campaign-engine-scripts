import { STORE_STATUS } from '../enums.ts';

export const version = 'v2';

export const GREETINGS: { [k in STORE_STATUS]: string[]} = {
  [STORE_STATUS._default]: [
    'Hola {{0}}! 👋 Más productos, más descuentos, más ahorro para ti 🔥 Las mejores marcas siguen aquí para ti 🔥',
  ],
  [STORE_STATUS.Churn]: 
    [
      'Hey, {{0}}! Te extrañamos, vuelve y compra fácil con Chiper 💪 Miles de productos te esperan 🔥',
      'Saludos, {{0}}! Regresa hoy, tu negocio merece los mejores precios 💰 Nuevas marcas y ofertas para ti 🎉',
      'Excelente día, {{0}}! No te pierdas los nuevos descuentos, son solo para ti 🎁 Regresa y aprovecha precios únicos 💰',
      'Hola de nuevo, {{0}}! Haz tu pedido en segundos y recibe rápido 🚛 Los mejores descuentos están aquí ✨',
      'Hey, {{0}}! Tu cuenta sigue activa, úsala y ahorra más 🔥 Tu negocio merece los mejores beneficios 💪',
      'Saludos, {{0}}! Volver tiene beneficios, descubre las ofertas 💎 Stock garantizado y precios bajos 🚀',
      'Qué gusto verte, {{0}}! Abastece tu negocio con precios bajos y stock garantizado 📦 Solo faltas tú para seguir ahorrando 😉',
      'Hola, {{0}}! Vuelve y compra con la mejor experiencia 📱 No dejes pasar estas promociones exclusivas 🎁',
      'Saludos, {{0}}! No te quedes sin stock, tenemos todo listo para ti 🚀 Compra fácil y con entrega rápida 🚛',
      'Hey, {{0}}! Grandes descuentos te esperan, vuelve y ahorra 💲 Descubre lo nuevo en nuestro catálogo 🛍️',
      'Excelente día, {{0}}! Miles ya ahorran con Chiper, únete tú también 🙌 Reabastece tu negocio sin complicaciones 📦',
      'Hola de nuevo, {{0}}! Aprovecha ofertas especiales antes de que terminen ⏳ Volviste en el mejor momento para comprar 🔥',
      'Qué gusto verte, {{0}}! No esperes más, los mejores productos te esperan 🛍️ Aprovecha combos y precios especiales 💲',
      'Saludos, {{0}}! Retoma tus compras con combos y promos exclusivas 🎯 Miles ya ahorran con Chiper, únete tú también 🙌',
      'Hey, {{0}}! Vuelve y disfruta de un catálogo lleno de oportunidades ✨ Recibe más por menos, ¡solo aquí! 💰',
      'Hola de nuevo, {{0}}! Queremos verte de vuelta, tenemos precios imbatibles 🔥 Compra desde donde estés, sin salir 📱',
      'Excelente día, {{0}}! No hay mejor momento para reactivar tu cuenta 💡 Variedad, calidad y los mejores precios 💎',
      'Saludos, {{0}}! Más productos, más beneficios, más ahorro 💰 Tus productos favoritos siempre disponibles 🏪',
      'Hey, {{0}}! ¡Haz tu pedido y sigue ahorrando como antes! 🚀 Volver te da acceso a grandes beneficios 💡',
    ],
  [STORE_STATUS.Hibernating]: 
    [
      'Hey, {{0}}! Ha pasado un tiempo, pero las ofertas siguen aquí 💰 Marcas nuevas y descuentos exclusivos 🔥',
      'Saludos, {{0}}! Reactiva tu cuenta y accede a descuentos exclusivos 🎁 Tu negocio merece lo mejor, aquí lo tienes 🎯',
      'Excelente día, {{0}}! Vuelve hoy y obtén los mejores precios 🔥 Compra lo que necesitas al mejor precio 💲',
      'Hola de nuevo, {{0}}! No te quedes sin tus productos favoritos, pide ya 📦 Reabastece fácil y sin complicaciones 📦',
      'Hey, {{0}}! Ahorra tiempo y dinero con Chiper 🚛 Miles ya compran con Chiper, ¡únete! 🙌',
      'Saludos, {{0}}! Tus compras más fáciles y rápidas que nunca 📱 Solo por tiempo limitado: ofertas imperdibles ⏳',
      'Qué gusto verte, {{0}}! No dejes pasar las promociones que tenemos para ti 💎 Ahorra tiempo y dinero con cada pedido 💰',
      'Hola, {{0}}! Gran variedad, precios bajos y entregas rápidas 🏪 Descubre todo lo que tenemos para ti 🛍️',
      'Saludos, {{0}}! Descubre nuevos productos para tu negocio 🔍 Encuentra variedad y stock garantizado 📢',
      'Hey, {{0}}! Volver significa más beneficios, únete otra vez 🙌 Volver significa más beneficios para ti 🎁',
      'Excelente día, {{0}}! Queremos verte comprar de nuevo, hay ofertas para ti 🎯 Tu compra fácil, rápida y sin complicaciones 📱',
      'Hola de nuevo, {{0}}! Precios especiales solo por tiempo limitado ⏳ Reactivamos tu cuenta con sorpresas especiales 🎉',
      'Qué gusto verte, {{0}}! No esperes más, aprovecha las promociones de hoy 🔥 Siempre los mejores precios para ti ✨',
      'Saludos, {{0}}! Encuentra todo lo que necesitas en un solo lugar 📦 Un solo pedido y verás la diferencia 🚀',
      'Hey, {{0}}! Tienes descuentos esperándote, reactiva tu cuenta 📱 Catálogo renovado con más opciones para ti 📦',
      'Hola de nuevo, {{0}}! Retoma tus pedidos y sigue ahorrando 💰 Ofertas diarias que no puedes perderte 🔥',
      'Qué gusto verte, {{0}}! Más variedad y stock disponible ahora mismo 🛍️ ¡Es hora de volver a comprar y ahorrar! 😉',
      'Saludos, {{0}}! Vuelve y disfruta los mejores combos y precios 📢 Sigue creciendo con Chiper a tu lado 💪',
      'Hey, {{0}}! ¡Haz tu pedido en segundos y recibe sin demoras! 🚀 Aprovecha promos exclusivas y haz crecer tu negocio 🏪',
    ],
  [STORE_STATUS.New]: 
    [
      'Hey, {{0}}! Bienvenido a Chiper, compra fácil y sin complicaciones 📱 Miles de productos a precios increíbles 💰',
      'Saludos, {{0}}! Tu primera compra con descuentos exclusivos 🎉 Compra hoy y ahorra más desde el inicio 🎉',
      'Excelente día, {{0}}! Miles de productos te esperan con grandes beneficios 🛍️ Tu primera compra con descuentos exclusivos 🔥',
      'Hola de nuevo, {{0}}! Ahorra desde tu primer pedido, regístrate hoy 💰 Stock garantizado y precios imbatibles 🚀',
      'Hey, {{0}}! Únete y accede a precios únicos 🔥 Aprovecha nuestra bienvenida con ofertas 💡',
      'Saludos, {{0}}! Empieza a comprar con la mejor experiencia 📦 Calidad, variedad y precio en un solo lugar 🛍️',
      'Qué gusto verte, {{0}}! Abastece tu negocio con el mejor catálogo 💎 Inicia tu compra sin complicaciones 📱',
      'Hola, {{0}}! Aprovecha nuestra bienvenida con ofertas especiales 💡 Miles ya compran con Chiper, únete tú también 🙌',
      'Saludos, {{0}}! No esperes más, haz tu pedido con un clic 📱 Descubre un catálogo lleno de oportunidades 📦',
      'Hey, {{0}}! Gran variedad y precios bajos solo para ti 🚛 Compra sin moverte, directo a tu negocio 🚛',
      'Excelente día, {{0}}! Todo lo que necesitas en un solo lugar 🏪 Lo mejor para tu negocio a un clic 💎',
      'Hola de nuevo, {{0}}! Tu mejor compra está a punto de comenzar 🚀 Regístrate y desbloquea promociones exclusivas 🎁',
      'Qué gusto verte, {{0}}! No te quedes fuera, empieza a ahorrar hoy 💲 Aquí tus compras son más fáciles y seguras 💪',
      'Saludos, {{0}}! Recibe más por menos en tu primera compra 😉 Encuentra las mejores marcas en un solo lugar 🏪',
      'Hey, {{0}}! Primer pedido con beneficios exclusivos 🎯 Los precios bajos están aquí, aprovéchalos 🔥',
      'Hola de nuevo, {{0}}! Inicia tu compra sin complicaciones, aquí todo es fácil 🔥 Recibe más por tu dinero en cada pedido 💰',
      'Excelente día, {{0}}! No dejes pasar esta oportunidad 📢 ¡Empieza a comprar y crecer con Chiper! 🚀',
      'Qué gusto verte, {{0}}! Todo listo para que hagas tu primer pedido ✨ Tienes todo lo que necesitas al mejor precio 😉',
      'Saludos, {{0}}! ¡Empieza a comprar y crecer con Chiper! 🚀 Ahorra tiempo y dinero con cada compra 💲',
    ],
  [STORE_STATUS.Resurrected]: 
    [
      'Hey, {{0}}! Nos encanta verte de vuelta, sigue comprando fácil 🎉 Nos encanta verte de vuelta, ¡hay más para ti! 🎉',
      'Saludos, {{0}}! Gracias por volver, hay más descuentos para ti 🔥 Sigue disfrutando de los mejores precios 🔥',
      'Qué gusto verte, {{0}}! Sigue disfrutando de los mejores precios y beneficios 💰 Gracias por volver, tenemos promos especiales 🎁',
      'Hola de nuevo, {{0}}! No pares ahora, las promos siguen activas 📦 Tu regreso merece descuentos únicos 💰',
      'Hey, {{0}}! Vuelve a comprar y recibe más ventajas 🚛 Más marcas, más ofertas, más beneficios 🚀',
      'Saludos, {{0}}! Recompra ahora y accede a nuevos beneficios 💎 Aprovecha tu cuenta reactivada al máximo 💡',
      'Hola, {{0}}! Tu cuenta sigue activa, aprovéchala con grandes ofertas 🎁 Tienes acceso a precios exclusivos otra vez 😉',
      'Qué gusto verte, {{0}}! No te quedes sin stock, repón todo hoy 🛍️ No pares, sigue ahorrando en cada compra 🛍️',
      'Hey, {{0}}! Haz tu pedido con un solo clic, rápido y seguro 📱 Chiper sigue creciendo contigo 💪',
      'Hola de nuevo, {{0}}! Sigue aprovechando los descuentos que te esperan 🚀 Grandes descuentos disponibles ahora mismo 💲',
      'Saludos, {{0}}! Precios imbatibles, variedad y entrega rápida 📢 Variedad y stock garantizado, como siempre 📦',
      'Hey, {{0}}! Queremos verte crecer con Chiper, haz tu pedido 💡 Compra más fácil y con mejores precios 📱',
      'Qué gusto verte, {{0}}! Recarga tu negocio con los mejores productos 🔥 Encuentra todo lo que necesitas sin salir 🚛',
      'Hola, {{0}}! Sigue ahorrando y abastece tu negocio fácilmente 📦 Ofertas limitadas, ¡no te las pierdas! 🔥',
      'Saludos, {{0}}! No esperes más y ordena tus productos favoritos 🚛 La mejor forma de comprar está de vuelta 🚀',
      'Hey, {{0}}! Más ofertas y productos nuevos para ti 📢 Tu cuenta reactivada tiene beneficios extra 🎁',
      'Hola de nuevo, {{0}}! Grandes beneficios continúan esperándote 💲 Los precios bajos siguen esperándote 💎',
      'Saludos, {{0}}! Recompra ahora y sigue ahorrando con Chiper 💎 Cada compra te da más ventajas con Chiper 😉',
      'Qué gusto verte, {{0}}! ¡Sigue aprovechando los precios bajos, haz tu pedido! 🚀 Haz tu pedido hoy y sigue ahorrando 💰',
    ],
  [STORE_STATUS.Retained]:
    [
      'Hey, {{0}}! Gracias por seguir con nosotros, más descuentos te esperan 🎉 Gracias por confiar en Chiper, ¡tenemos más para ti! 💙',
      '¡Hola, {{0}}! Tu fidelidad tiene recompensa, aprovecha los beneficios 💰 Tienes nuevos descuentos esperándote 🎁',
      'Un gusto hablarte, {{0}}! Seguimos aquí para ti, con más ofertas y variedad 📦 Seguimos trayéndote los mejores precios 💰',
      'Excelente día, {{0}}! Compra como siempre, con precios bajos y stock garantizado 🚛 Siempre grandes beneficios para nuestros clientes 🚀',
      'Hey, {{0}}! Más productos, más descuentos, más ahorro para ti 🔥 Las mejores marcas siguen aquí para ti 🔥',
      '¡Hola, {{0}}! Nos encanta tenerte con nosotros, revisa lo nuevo 💎 Accede a promociones exclusivas solo para ti 💎',
      'Un gusto hablarte, {{0}}! Sigue ahorrando con los mejores precios del mercado 📱 Cada compra suma más ventajas en Chiper 💡',
      'Excelente día, {{0}}! ¡Tienes acceso a promociones exclusivas, aprovéchalas! 🎁 Sigue comprando fácil y sin complicaciones 📱',
      'Hey, {{0}}! Porque eres cliente frecuente, desbloqueaste nuevos beneficios 🏪 Encuentra todo lo que necesitas al mejor precio 🛍️',
      '¡Hola, {{0}}! Chiper sigue creciendo para ti, descubre lo nuevo 🚀 ¡Aprovecha tus beneficios y ahorra más! 💲',
      'Un gusto hablarte, {{0}}! No te pierdas los productos más vendidos del mes 📢 Stock garantizado y entregas rápidas 🚛',
      'Excelente día, {{0}}! Más variedad y combos especiales para ti 💡 Recibe precios especiales por ser parte de Chiper 😉',
      'Hey, {{0}}! Compra sin preocupaciones, con calidad garantizada 🎯 Miles de productos con descuentos para ti 📦',
      '¡Hola, {{0}}! No esperes más y haz tu pedido con un solo clic 📦 Premiamos tu lealtad con más ofertas 💙',
      'Un gusto hablarte, {{0}}! Queremos seguir siendo tu mejor opción, revisa el catálogo 📱 Aquí siempre ahorras en cada compra 💰',
      'Excelente día, {{0}}! Tu negocio merece lo mejor, pide con confianza 💰 El mejor servicio y variedad, como siempre 🔥',
      'Hey, {{0}}! Siempre listos para ayudarte a comprar fácil y rápido 🙌 Sigue creciendo con Chiper a tu lado 💪',
      '¡Hola, {{0}}! Aprovecha nuevas promociones antes de que terminen ⏳ Compra sin preocupaciones, nosotros te respaldamos 🎯',
      'Un gusto hablarte, {{0}}! ¡Tu lealtad merece recompensas, sigue ahorrando con Chiper! 🚀 Las ofertas del día te esperan, ¡no las dejes pasar! 🚀',
    ],
  [STORE_STATUS.Lead]:
    [
        'Hey, {{0}}! Activa tu cuenta y empieza a ahorrar 💰 Tu primera compra con precios exclusivos 🎉',
      '¡Hola, {{0}}! Solo falta tu primer pedido, hazlo ya 🎉 Miles de productos a un solo clic 📱',
      'Un gusto hablarte, {{0}}! Precios bajos y variedad te esperan 🚛 Regístrate y desbloquea descuentos 💰',
      'Excelente día, {{0}}! Regístrate y compra en minutos 📱 Encuentra todo lo que necesitas sin salir 🏪',
      'Hey, {{0}}! No pierdas esta oportunidad de ahorrar 🔥 Solo falta tu primer pedido para empezar a ahorrar 🔥',
      '¡Hola, {{0}}! Todo listo para que hagas tu primera compra 🛍️ Stock garantizado y entrega rápida 🚛',
      'Un gusto hablarte, {{0}}! Únete y compra con facilidad 💎 Variedad y calidad en un solo lugar 💎',
      'Excelente día, {{0}}! Tienes beneficios esperándote, aprovéchalos 📦 Aprovecha precios bajos desde tu primera compra 💲',
      'Hey, {{0}}! ¡Haz tu pedido sin complicaciones! 🎁 Miles ya ahorran con Chiper, ¡únete ahora! 🙌',
      '¡Hola, {{0}}! La mejor decisión para tu negocio empieza aquí 🚀 Te damos la bienvenida con una promo especial 🎁',
      'Un gusto hablarte, {{0}}! Con Chiper, comprar es más fácil y rápido 📱 Las mejores marcas a los mejores precios 💡',
      'Excelente día, {{0}}! Primer pedido con ofertas exclusivas 🔥 Tu negocio merece los mejores beneficios 🚀',
      'Hey, {{0}}! No dejes pasar esta oportunidad única 💡 Compra sin preocupaciones, nosotros te apoyamos 💪',
      '¡Hola, {{0}}! Compra fácil y con entrega rápida 🏪 No dejes pasar estas promociones exclusivas 🔥',
      'Un gusto hablarte, {{0}}! Miles ya compran, únete hoy 🙌 Empieza a comprar con confianza y ahorra más 😉',
      'Excelente día, {{0}}! ¡Empieza tu ahorro con Chiper! 💲 Haz tu primer pedido hoy y aprovecha más beneficios 💙',
      'Hey, {{0}}! Lo mejor para tu negocio en un solo lugar 📢 Te ayudamos a ahorrar tiempo y dinero en cada compra 📦',
      '¡Hola, {{0}}! Recibe más por menos en tu primera compra 💎 Los precios bajos están aquí, aprovéchalos 🎯',
      'Un gusto hablarte, {{0}}! ¡Activa tu cuenta y haz tu pedido ahora! 🚀 Empieza tu camino con Chiper y crece con nosotros 🚀',
    ]
}
