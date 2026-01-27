import { Exclude } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Role } from './role.enum'
import { Profile } from '../../profiles/entities/profile.entity'

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

  @Column({ name: 'profile_id', type: 'uuid', nullable: true })
  profileId: string | null

  @ManyToOne(() => Profile, { nullable: true })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
