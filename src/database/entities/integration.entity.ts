import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { IntegrationAppTypeEnum } from "../../enums/integration.enum";
import { IntegrationProviderEnum } from "../../enums/integration.enum";
import { IntegrationCategoryEnum } from "../../enums/integration.enum";


interface GoogleMeetAndCalendarMetadata {
  scope: string;
  token_type: string;
}

interface ZoomMetadata { }

type IntegrationMetadata = GoogleMeetAndCalendarMetadata | ZoomMetadata;

@Entity({ name: "integrations" })
export class Integration {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: IntegrationProviderEnum })
  provider: IntegrationProviderEnum;

  @Column({ type: "enum", enum: IntegrationCategoryEnum })
  category: IntegrationCategoryEnum;

  @Column({ type: "enum", enum: IntegrationAppTypeEnum })
  app_type: IntegrationAppTypeEnum;

  @Column()
  access_token: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ type: "bigint", nullable: true })
  expiry_date: number | null;

  @Column({ type: "json" })
  metadata: IntegrationMetadata;

  @Column({ default: true })
  isConnected: boolean;

  // *** NUEVOS CAMPOS PARA CALENDARIO POR DEFECTO ***
  @Column({
    name: 'calendar_id',
    type: 'varchar',
    default: 'primary', // Valor por defecto para calendar_id
    nullable: true  // ← Era false, ahora true
  })
  calendar_id?: string;

  // AGREGAR campos de Zoom:
  @Column({ name: 'zoom_user_id', type: 'varchar', nullable: true })
  zoom_user_id?: string;

  @Column({ name: 'zoom_account_id', type: 'varchar', nullable: true })
  zoom_account_id?: string;

  @Column({
    name: 'calendar_name',
    type: 'varchar',
    nullable: true
  })
  calendar_name?: string;
  // *** FIN NUEVOS CAMPOS ***

  // Agregar campos nuevos
  @Column({ nullable: true })
  outlook_calendar_id?: string;

  @Column({ nullable: true })
  outlook_calendar_name?: string;


  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => User, (user) => user.integrations)
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
