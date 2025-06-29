import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { EventLocationEnumType } from "../../enums/EventLocationEnum";
import { User } from "./user.entity";
import { Meeting } from "./meeting.entity";


@Entity({ name: "events" })
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 30 })
  duration: number;

  @Column({ nullable: false })
  slug: string;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ type: "enum", enum: EventLocationEnumType })
  locationType: EventLocationEnumType;

  // ✅ CAMPO CALENDAR_ID CORREGIDO
  @Column({
    name: 'calendar_id',
    type: 'varchar',
    nullable: false,        // ✅ No nullable
    default: 'primary'      // ✅ Default value 
  })
  calendar_id: string;

  // ✅ CAMPO CALENDAR_NAME CORREGIDO  
  @Column({
    name: 'calendar_name',
    type: 'varchar',
    nullable: true          // ✅ Puede ser null
  })
  calendar_name?: string | null;
  // *** FIN NUEVOS CAMPOS ***



  @ManyToOne(() => User, (user) => user.events)
  user: User;

  @OneToMany(() => Meeting, (meeting) => meeting.event)
  meetings: Meeting[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
