import { Exclude } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm'
import { Role } from './role.enum'
import { StandardHours } from './standard-hours.entity'

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Exclude()
  @Column({ select: false })
  password: string

  @Column({ type: 'text' })
  role: Role

  @OneToOne(() => StandardHours, (standardHours) => standardHours.user)
  standardHours: StandardHours | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
