// import "reflect-metadata";
// import "dotenv/config";
// import { DataSource } from "typeorm";
// import { config } from "./app.config";
// import * as path from "path";

// const isProduction = config.NODE_ENV === "production";
// console.log('🚀 Configurando base de datos...');
// console.log('📍 isProduction:', isProduction);

// // 🔧 SOLUCIÓN SIMPLE CON RUTAS ABSOLUTAS
// const getEntities = () => {
//   if (isProduction) {
//     console.log('📦 Usando rutas absolutas para entidades en producción...');
    
//     // Rutas absolutas específicas - esto SIEMPRE funciona
//     const basePath = path.join(process.cwd(), "dist", "database", "entities");
    
//     return [
//       path.join(basePath, "availability.entity.js"),
//       path.join(basePath, "day-availability.js"),
//       path.join(basePath, "event.entity.js"),
//       path.join(basePath, "integration.entity.js"),
//       path.join(basePath, "meeting.entity.js"),
//       path.join(basePath, "user-calendar.entity.js"),
//       path.join(basePath, "user.entity.js")
//     ];
//   } else {
//     return ["src/database/entities/*.ts"];
//   }
// };

// // 🔒 CONFIGURACIÓN CON SSL OBLIGATORIO PARA RDS
// export const AppDataSource = new DataSource({
//   type: "postgres",
//   host: "3.143.70.38",
//   port: 5432,
//   username: "cal_app_user",
//   password: "Ontr4p0rtFunn3l!",
//   database: "ontraportcals",
  
//   ssl: {
//     rejectUnauthorized: false,
//   },
  
//   logging: isProduction ? ["error", "warn"] : true,
//   synchronize: false,
//   connectTimeoutMS: 30000,

//   // 🔧 ENTIDADES CON RUTAS ABSOLUTAS
//   entities: getEntities(),

//   extra: {
//     max: 5,
//     min: 1,
//   }
// });

// console.log('🎯 Configuración completada');
import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { config } from "./app.config";
import * as path from "path";

const isProduction = config.NODE_ENV === "production";
console.log('🚀 Configurando base de datos...');
console.log('📍 isProduction:', isProduction);

// 🔧 SOLUCIÓN SIMPLE CON RUTAS ABSOLUTAS
const getEntities = () => {
  if (isProduction) {
    console.log('📦 Usando rutas absolutas para entidades en producción...');
    
    // Rutas absolutas específicas - esto SIEMPRE funciona
    const basePath = path.join(process.cwd(), "dist", "database", "entities");
    
    return [
      path.join(basePath, "availability.entity.js"),
      path.join(basePath, "day-availability.js"),
      path.join(basePath, "event.entity.js"),
      path.join(basePath, "integration.entity.js"),
      path.join(basePath, "meeting.entity.js"),
      path.join(basePath, "user-calendar.entity.js"),
      path.join(basePath, "user.entity.js")
    ];
  } else {
    return ["src/database/entities/*.ts"];
  }
};

// 🔒 CONFIGURACIÓN CON VARIABLES DE ENTORNO
export const AppDataSource = new DataSource({
  type: "postgres",
  
  // 🔧 USAR VARIABLES DE ENTORNO EN LUGAR DE HARDCODED
  host: process.env.DB_HOST || "3.143.70.38",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "cal_app_user",
  password: process.env.DB_PASSWORD || "Ontr4p0rtFunn3l!",
  database: process.env.DB_NAME || "ontraportcals",
  
  // 🔒 SSL OBLIGATORIO - RDS lo requiere
  ssl: {
    rejectUnauthorized: false,
  },
  
  logging: isProduction ? ["error", "warn"] : true,
  synchronize: false,
  connectTimeoutMS: 30000,

  // 🔧 ENTIDADES CON RUTAS ABSOLUTAS
  entities: getEntities(),

  extra: {
    max: 5,
    min: 1,
  }
});

console.log('🎯 Configuración completada');
console.log('📋 DB Host:', process.env.DB_HOST || "3.143.70.38");
console.log('📋 DB Name:', process.env.DB_NAME || "ontraportcals");