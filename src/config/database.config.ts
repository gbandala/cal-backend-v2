import "dotenv/config";
import { DataSource } from "typeorm";
import { config } from "./app.config";

export const getDatabaseConfig = () => {
  const isProduction = config.NODE_ENV ? config.NODE_ENV === "production" : false;
  const databaseUrl = config.DATABASE_URL;

  return new DataSource({
    type: "postgres",
    url: databaseUrl,
    logging: false, // ← Desactivar logs de SQL
    ssl: databaseUrl.includes('supabase')
      ? { rejectUnauthorized: false }  // Supabase con SSL
      : false,  // Docker sin SSL
    entities: ["src/database/entities/*.ts"], // ← Patrón de archivos
    synchronize: false, // ← IMPORTANTE: false porque las tablas ya existen
  });
};

export const AppDataSource = getDatabaseConfig();
