/* ==========================================================================
   Asilo — network data
   Edit builders and projects here. The carousel, map and showcase all read
   from these two arrays, so this is the only file you touch to add people.

   Adding a builder:
     - lat / lng place their pin on the map (look up the city once, reuse it).
     - avatar is optional; leave it out and an initials badge is generated.
   ========================================================================== */

const MEMBERS = [
  { id: "ana",       name: "Ana Rodríguez",     role_es: "Frontend Engineer",   role_en: "Frontend Engineer",  city: "Caracas",        lat: 10.49, lng: -66.90, tags: ["React", "TypeScript"] },
  { id: "luis",      name: "Luis Fernández",    role_es: "Backend Engineer",    role_en: "Backend Engineer",   city: "Maracaibo",      lat: 10.65, lng: -71.64, tags: ["Go", "Postgres"] },
  { id: "maria",     name: "María González",    role_es: "Product Designer",    role_en: "Product Designer",   city: "Valencia",       lat: 10.16, lng: -67.99, tags: ["Figma", "UX"] },
  { id: "carlos",    name: "Carlos Pérez",      role_es: "Full-stack Engineer", role_en: "Full-stack Engineer",city: "Barquisimeto",   lat: 10.07, lng: -69.32, tags: ["Node", "Next.js"] },
  { id: "valentina", name: "Valentina Díaz",    role_es: "Data Engineer",       role_en: "Data Engineer",      city: "Mérida",         lat: 8.59,  lng: -71.14, tags: ["Python", "Airflow"] },
  { id: "jose",      name: "José Martínez",     role_es: "Mobile Engineer",     role_en: "Mobile Engineer",    city: "Maracay",        lat: 10.25, lng: -67.60, tags: ["Swift", "Kotlin"] },
  { id: "gabriela",  name: "Gabriela Suárez",   role_es: "Product Manager",     role_en: "Product Manager",    city: "Puerto Ordaz",   lat: 8.30,  lng: -62.72, tags: ["Discovery", "Roadmap"] },
  { id: "daniel",    name: "Daniel Torres",     role_es: "DevOps Engineer",     role_en: "DevOps Engineer",    city: "San Cristóbal",  lat: 7.77,  lng: -72.22, tags: ["AWS", "Terraform"] },
  { id: "camila",    name: "Camila Rojas",      role_es: "UX Designer",         role_en: "UX Designer",        city: "Barcelona",      lat: 10.13, lng: -64.68, tags: ["Research", "UI"] },
  { id: "andres",    name: "Andrés Blanco",     role_es: "ML Engineer",         role_en: "ML Engineer",        city: "Maturín",        lat: 9.75,  lng: -63.18, tags: ["PyTorch", "LLMs"] },
];

const PROJECTS = [
  { id: "panapay",  title: "Pana Pay",  builder: "Luis Fernández",   city: "Maracaibo",    tag: "Fintech",     blurb_es: "Pagos y cobros para comercios locales, en bolívares y dólares.", blurb_en: "Payments and collections for local shops, in bolívares and dollars.", url: "#" },
  { id: "mercarto", title: "Mercarto",  builder: "Ana Rodríguez",    city: "Caracas",      tag: "Marketplace", blurb_es: "Un marketplace para makers y emprendedores venezolanos.",         blurb_en: "A marketplace for Venezuelan makers and entrepreneurs.",           url: "#" },
  { id: "aulaviva", title: "Aula Viva", builder: "María González",   city: "Valencia",     tag: "Edtech",      blurb_es: "Plataforma de cursos en vivo para estudiantes de todo el país.",  blurb_en: "Live-course platform for students across the country.",             url: "#" },
  { id: "rutas",    title: "Rutas",     builder: "Carlos Pérez",     city: "Barquisimeto", tag: "Logística",   blurb_es: "Optimización de entregas para negocios de última milla.",         blurb_en: "Delivery optimization for last-mile businesses.",                   url: "#" },
  { id: "saludmas", title: "Salud+",    builder: "Valentina Díaz",   city: "Mérida",       tag: "Healthtech",  blurb_es: "Telemedicina que conecta pacientes con médicos venezolanos.",     blurb_en: "Telemedicine connecting patients with Venezuelan doctors.",         url: "#" },
  { id: "cultiva",  title: "Cultiva",   builder: "Gabriela Suárez",  city: "Puerto Ordaz", tag: "Agritech",    blurb_es: "Dashboard para productores agrícolas del interior del país.",     blurb_en: "Dashboard for agricultural producers in the country's interior.",   url: "#" },
];
