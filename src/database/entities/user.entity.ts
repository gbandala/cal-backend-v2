import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { compareValue, hashValue } from "../../utils/bcrypt";
// import { Integration } from "./integration.entity";
// import { Event } from "./event.entity";
import { Availability } from "./availability.entity";
// import { Meeting } from "./meeting.entity";
// import { UserCalendar } from './user-calendar.entity';

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  timezone: string;

  // @OneToMany(() => Event, (event) => event.user, {
  //   cascade: true,
  // })
  // events: Event[];
  @OneToMany('Event', 'user', {
    cascade: true,
  })
  events: any[];

  // @OneToMany(() => Integration, (integration) => integration.user, {
  //   cascade: true,
  // })
  // integrations: Integration[];
  @OneToMany('Integration', 'user', {
    cascade: true,
  })
  integrations: any[];

  @OneToOne(() => Availability, (availability) => availability.user, {
    cascade: true,
  })
  @JoinColumn()
  availability: Availability;

  // @OneToMany(() => Meeting, (meeting) => meeting.user, {
  //   cascade: true,
  // })
  // meetings: Meeting[];

  @OneToMany('Meeting', 'user', {
    cascade: true,
  })
  meetings: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @OneToMany(() => UserCalendar, calendar => calendar.user)
  // calendars: UserCalendar[];
  @OneToMany('UserCalendar', 'user')
  calendars: any[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await hashValue(this.password);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return compareValue(candidatePassword, this.password);
  }

  omitPassword(): Omit<User, "password"> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword as Omit<User, "password">;
  }

}
