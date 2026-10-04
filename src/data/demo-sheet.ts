/**
 * Fictional sheet for `DEMO_DATA=1` (local development and e2e tests only).
 * It goes through the real parser, so it also exercises approval filtering
 * and revisions: "Pana Pay" has two approved revisions (the second wins) and
 * "Borrador" is still pending, so it never shows.
 */
const HEADER = [
  "Fecha", "Nombre del proyecto", "Sitio web", "Descripción corta", "Fundadores",
  "Categorías", "Aprobado", "ID del logo", "ID de revisión", "Notas adicionales",
];

type Row = [title: string, site: string, description: string, founders: string, categories: string, approved?: string];

const ROWS: Row[] = [
  ["Pana Pay", "https://panapay.example", "Pagos entre amigos en bolívares y dólares.", "Ana Rivas", "Fintech"],
  ["Arepa Stack", "https://arepastack.example", "Plantillas para lanzar tu SaaS en un fin de semana.", "Luis Pérez", "SaaS, DevTools & APIs"],
  ["Cola Rápida", "https://colarapida.example", "Turnos digitales para farmacias y bancos.", "María Gil, José Díaz", "Logística"],
  ["Ávila Data", "https://aviladata.example", "Tableros de datos abiertos sobre Caracas.", "Carla Mora", "Data Science, Business Analytics"],
  ["Bodega OS", "https://bodegaos.example", "Inventario y fiado para bodegas de barrio.", "Pedro León", "E-commerce, SaaS"],
  ["Chamo Learn", "https://chamolearn.example", "Clases cortas de programación por WhatsApp.", "Valentina Ruiz", "Edtech"],
  ["Doc en Casa", "https://docencasa.example", "Consultas médicas a domicilio con historial digital.", "Andrés Silva", "Healthtech"],
  ["Finca Viva", "https://fincaviva.example", "Sensores de humedad accesibles para pequeños productores.", "Rosa Camacho", "Agritech, Hardware & IoT"],
  ["Ley Clara", "https://leyclara.example", "Contratos simples revisados por abogados.", "Daniel Ortega", "Legaltech"],
  ["Casa Llave", "https://casallave.example", "Alquileres verificados sin intermediarios.", "Gabriela Nieto", "PropTech"],
  ["Ruta Segura", "https://rutasegura.example", "Reportes colaborativos del estado de las vías.", "Miguel Rojas", "Movilidad, Social & Comunidad"],
  ["Zeta Games", "https://zetagames.example", "Juegos pixel art hechos en Maracaibo.", "Sofía Urdaneta", "Gaming, Diseño & Creatividad"],
  ["Pana Pay", "https://panapay.example", "Pagos entre amigos en bolívares, dólares y USDT.", "Ana Rivas", "Fintech, Blockchain & Crypto"],
  ["Borrador", "https://borrador.example", "Todavía en revisión: no debe aparecer.", "Nadie", "SaaS", "PENDIENTE"],
];

export const DEMO_SHEET: string[][] = [
  HEADER,
  ...ROWS.map(([title, site, description, founders, categories, approved = "SI"], i) => [
    `10:00 ${String(i + 1).padStart(2, "0")}-09-2026`, title, site, description, founders,
    categories, approved, "", `demo-rev-${i + 1}`, "",
  ]),
];

/** Approved demo comments, keyed by project website. */
export const DEMO_COMMENTS = [
  { site: "https://panapay.example", author: "María González", body: "La usé para dividir la cuenta de una cena. Muy fácil.", createdAt: "2026-09-20T15:00:00Z" },
  { site: "https://panapay.example", author: "Luis", body: "¿Tienen planes de soportar pago móvil?", createdAt: "2026-09-22T10:00:00Z" },
];
